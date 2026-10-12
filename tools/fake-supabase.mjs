// A fake Supabase (GoTrue auth + PostgREST) for testing the app's real Supabase client without a project.
// It mimics the HTTP API and row-level security (each user sees only their own rows). It is a test double:
// it proves the app handles the API's behaviour, not that a real project is configured correctly.
//   node tools/fake-supabase.mjs [port]     admin: /__fake/{offline,confirm-mode,confirm,outbox,state,reset}
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";

const PORT = Number(process.argv[2] ?? process.env.PORT ?? 54321);
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");

let users, sessions, rows, outbox, offline, confirmMode, log, rejectAmount;
const reset = () => { users = new Map(); sessions = new Map(); rows = { profiles: new Map(), step_progress: new Map(), products: new Map(), sales: new Map(), expenses: new Map() }; outbox = []; offline = false; confirmMode = false; log = []; rejectAmount = null; };
reset();

const jwt = (u) => `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: u.id, email: u.email, role: "authenticated", aud: "authenticated", exp: Math.floor(Date.now() / 1000) + 3600 })}.fake`;
const subOf = (req) => { try { return JSON.parse(Buffer.from((req.headers.authorization ?? "").replace("Bearer ", "").split(".")[1], "base64url").toString()).sub ?? null; } catch { return null; } };
const userJson = (u) => ({ id: u.id, aud: "authenticated", role: "authenticated", email: u.email, email_confirmed_at: u.confirmed ? new Date().toISOString() : null, phone: "", app_metadata: { provider: "email", providers: ["email"] }, user_metadata: u.meta, identities: [{ id: u.id, user_id: u.id, identity_data: { email: u.email }, provider: "email" }], created_at: u.created, updated_at: new Date().toISOString() });
const sessionJson = (u) => { const refresh = randomUUID(); sessions.set(refresh, u.id); return { access_token: jwt(u), token_type: "bearer", expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: refresh, user: userJson(u) }; };
const gotrueErr = (res, status, code, msg) => send(res, status, { code: status, error_code: code, msg });

function send(res, status, body, headers = {}) {
  if (res.__range) headers = { ...headers, "content-range": res.__range };
  res.writeHead(status, { "content-type": "application/json", ...headers });
  res.end(body === undefined ? "" : JSON.stringify(body));
}

const readBody = (req) => new Promise((ok) => { let d = ""; req.on("data", (c) => (d += c)); req.on("end", () => { try { ok(d ? JSON.parse(d) : {}); } catch { ok({}); } }); });

const TABLES = {
  profiles: { key: (r) => r.id, owner: "id", defaults: { name: "", answers: {}, completed: false, learning: true, active_days: [], last_seen: null } },
  step_progress: { key: (r) => `${r.user_id}:${r.module_id}`, owner: "user_id", defaults: { steps: [], done_at: null, opened_at: null, snoozed_until: null, dismissed: false } },
  products: { key: (r) => `${r.user_id}:${r.id}`, owner: "user_id", defaults: { cost: null, archived: false } },
  sales: { key: (r) => `${r.user_id}:${r.id}`, owner: "user_id", defaults: { items: [], note: null, customer: null, paid: true, paid_at: null, deleted_at: null } },
  expenses: { key: (r) => `${r.user_id}:${r.id}`, owner: "user_id", defaults: { note: null, deleted_at: null } },
};

async function rest(req, res, url) {
  const name = url.pathname.split("/").pop();
  const t = TABLES[name];
  const sub = subOf(req);
  if (!t) return send(res, 404, { code: "42P01", message: "relation does not exist" });
  if (!sub) return send(res, 401, { code: "42501", message: "permission denied for table " + name });
  const mine = [...rows[name].values()].filter((r) => r[t.owner] === sub);

  if (req.method === "GET") {
    let out = mine;
    for (const [k, v] of url.searchParams) {
      if (v.startsWith("eq.")) out = out.filter((r) => String(r[k]) === v.slice(3));
      if (v.startsWith("gte.")) out = out.filter((r) => String(r[k]) >= v.slice(4));
    }
    // order=updated_at.asc,id.asc (PostgREST joins repeated order() calls into one parameter)
    const order = url.searchParams.get("order");
    if (order) {
      const keys = order.split(",").map((x) => x.split("."));
      out = [...out].sort((a, b) => { for (const [col, dir] of keys) { const c = String(a[col]).localeCompare(String(b[col])); if (c) return dir === "desc" ? -c : c; } return 0; });
    }
    // postgrest-js pages with limit & offset query parameters
    const off = Number(url.searchParams.get("offset") ?? 0), lim = url.searchParams.get("limit");
    if (lim !== null) out = out.slice(off, off + Number(lim));
    let range;
    const rh = req.headers.range ?? req.headers["range"];
    if (rh && /^\d+-\d+$/.test(rh)) { const [a, b] = rh.split("-").map(Number); range = [a, b]; const total = out.length; out = out.slice(a, b + 1); res.__range = `${a}-${a + Math.max(out.length - 1, 0)}/${total}`; }
    const cols = (url.searchParams.get("select") ?? "*").split(",").map((c) => c.trim());
    out = out.map((r) => (cols.includes("*") ? r : Object.fromEntries(cols.map((c) => [c, r[c]]))));
    if ((req.headers.accept ?? "").includes("vnd.pgrst.object")) return out.length === 1 ? send(res, 200, out[0]) : send(res, 406, { code: "PGRST116", message: "JSON object requested, multiple (or no) rows returned" });
    return send(res, 200, out);
  }
  if (req.method === "POST") {
    const body = await readBody(req);
    for (const r of Array.isArray(body) ? body : [body]) {
      // Test switch: refuse any row with this amount, like a database rule it breaks (nothing is saved from the batch).
      if (rejectAmount !== null && r.amount === rejectAmount) return send(res, 400, { code: "23514", message: 'new row violates check constraint "sales_at_check"' });
      if (r[t.owner] !== sub) return send(res, 403, { code: "42501", message: `new row violates row-level security policy for table "${name}"` });
      const k = t.key(r), prev = rows[name].get(k);
      rows[name].set(k, { ...t.defaults, ...(prev ?? {}), ...r, updated_at: new Date().toISOString() });
    }
    return send(res, 201, undefined);
  }
  return send(res, 405, { message: "method not allowed" });
}

async function auth(req, res, url) {
  const path = url.pathname.replace("/auth/v1", "");
  const body = req.method === "GET" ? {} : await readBody(req);
  if (path === "/signup") {
    if ([...users.values()].some((u) => u.email === body.email)) return gotrueErr(res, 422, "user_already_exists", "User already registered");
    if (!body.password || body.password.length < 6) return gotrueErr(res, 422, "weak_password", "Password should be at least 6 characters.");
    const u = { id: randomUUID(), email: body.email, password: body.password, meta: body.data ?? {}, confirmed: !confirmMode, created: new Date().toISOString() };
    users.set(u.id, u);
    rows.profiles.set(u.id, { id: u.id, name: String(u.meta.name ?? "").slice(0, 100), answers: {}, completed: false, updated_at: new Date().toISOString() }); // the signup trigger
    return send(res, 200, confirmMode ? userJson(u) : sessionJson(u));
  }
  if (path === "/token") {
    const grant = url.searchParams.get("grant_type");
    if (grant === "password") {
      const u = [...users.values()].find((x) => x.email === body.email && x.password === body.password);
      if (!u) return gotrueErr(res, 400, "invalid_credentials", "Invalid login credentials");
      if (!u.confirmed) return gotrueErr(res, 400, "email_not_confirmed", "Email not confirmed");
      return send(res, 200, sessionJson(u));
    }
    if (grant === "refresh_token") {
      const id = sessions.get(body.refresh_token);
      const u = id && users.get(id);
      return u ? send(res, 200, sessionJson(u)) : gotrueErr(res, 400, "refresh_token_not_found", "Invalid Refresh Token");
    }
  }
  if (path === "/logout") return send(res, 204, undefined);
  if (path === "/user") {
    const u = users.get(subOf(req));
    if (!u) return gotrueErr(res, 401, "bad_jwt", "invalid JWT");
    if (req.method === "PUT") {
      if (body.password) { if (body.password === u.password) return gotrueErr(res, 422, "same_password", "New password should be different from the old password."); u.password = body.password; }
      return send(res, 200, userJson(u));
    }
    return send(res, 200, userJson(u));
  }
  if (path === "/recover") {
    const u = [...users.values()].find((x) => x.email === body.email);
    if (u) { const s = sessionJson(u); outbox.push({ email: u.email, link: `#access_token=${s.access_token}&refresh_token=${s.refresh_token}&expires_in=3600&token_type=bearer&type=recovery`, redirectTo: url.searchParams.get("redirect_to") }); }
    return send(res, 200, {});
  }
  return send(res, 404, { msg: "not implemented in fake: " + path });
}

createServer(async (req, res) => {
  // Like the real gateway, allow whatever headers the client asks for (supabase-js adds e.g. x-retry-count when retrying).
  const cors = { "access-control-allow-origin": "*", "access-control-allow-headers": req.headers["access-control-request-headers"] ?? "*", "access-control-allow-methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS" };
  const origWrite = res.writeHead.bind(res);
  res.writeHead = (s, h) => origWrite(s, { ...cors, ...(h ?? {}) });
  if (req.method === "OPTIONS") return send(res, 204, undefined);
  const url = new URL(req.url, "http://x");
  if (url.pathname.startsWith("/__fake/")) {
    const q = url.searchParams, a = url.pathname.slice(8);
    if (a === "offline") { offline = q.get("on") === "1"; return send(res, 200, { offline }); }
    if (a === "confirm-mode") { confirmMode = q.get("on") === "1"; return send(res, 200, { confirmMode }); }
    if (a === "confirm") { for (const u of users.values()) if (u.email === q.get("email")) u.confirmed = true; return send(res, 200, {}); }
    if (a === "reject-amount") { rejectAmount = q.get("amount") ? Number(q.get("amount")) : null; return send(res, 200, { rejectAmount }); }
    if (a === "seed-sales") {
      const u = [...users.values()].find((x) => x.email === q.get("email"));
      const n = Number(q.get("n") ?? 0);
      if (!u) return send(res, 404, { msg: "no such user" });
      for (let i = 0; i < n; i++) {
        const id = `5eed0000-0000-4000-8000-${String(i).padStart(12, "0")}`;
        const at = new Date(Date.now() - (i % 50) * 86_400_000).toISOString();
        rows.sales.set(`${u.id}:${id}`, { user_id: u.id, id, at, amount: 100_000 + i, items: [], note: null, customer: null, paid: true, paid_at: null, deleted_at: null, updated_at: new Date(Date.now() - 3_600_000).toISOString() });
      }
      return send(res, 200, { seeded: n });
    }
    if (a === "outbox") return send(res, 200, outbox);
    if (a === "state") return send(res, 200, { users: [...users.values()].map(({ password, ...u }) => u), profiles: [...rows.profiles.values()], step_progress: [...rows.step_progress.values()], products: [...rows.products.values()], sales: [...rows.sales.values()], expenses: [...rows.expenses.values()], log });
    if (a === "reset") { reset(); return send(res, 200, {}); }
    return send(res, 404, {});
  }
  if (offline) return send(res, 503, { message: "service unavailable (fake offline)" });
  log.push(`${req.method} ${url.pathname}${url.search}`);
  if (url.pathname.startsWith("/auth/v1/")) return auth(req, res, url);
  if (url.pathname.startsWith("/rest/v1/")) return rest(req, res, url);
  send(res, 404, { message: "not found" });
}).listen(PORT, () => console.log(`fake supabase on :${PORT}`));
