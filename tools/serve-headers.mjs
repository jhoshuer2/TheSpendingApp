// Serves a built folder the way Vercel will: the headers and rewrites from vercel.json, so a Content-Security-Policy is really enforced.
// `vite preview` ignores vercel.json, so the policy would never be tested without this.
//   node tools/serve-headers.mjs --dir dist --port 4173 [--extra-connect http://localhost:54321]
// --extra-connect adds a host to connect-src for tests that talk to a fake Supabase. The shipped policy never gets it.
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".webmanifest": "application/manifest+json", ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp", ".ttf": "font/ttf", ".ico": "image/x-icon" };

export function startServer({ dir, port, extraConnect }) {
  const config = JSON.parse(readFileSync(fileURLToPath(new URL("../vercel.json", import.meta.url)), "utf8"));
  const rules = (config.headers ?? []).map((h) => ({ re: new RegExp(`^${h.source}$`), headers: h.headers }));
  const rewrites = (config.rewrites ?? []).map((r) => ({ re: new RegExp(`^${r.source}$`), to: r.destination }));
  const server = createServer((req, res) => {
    const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
    let file = join(dir, normalize(path));
    if (!file.startsWith(normalize(dir)) || !existsSync(file) || statSync(file).isDirectory()) {
      const rw = rewrites.find((r) => r.re.test(path));
      file = rw ? join(dir, rw.to) : "";
    }
    if (!file || !existsSync(file)) {
      res.writeHead(404).end("not found");
      return;
    }
    const headers = { "content-type": TYPES[extname(file)] ?? "application/octet-stream" };
    for (const r of rules) if (r.re.test(path)) for (const { key, value } of r.headers) headers[key.toLowerCase()] = key.toLowerCase() === "content-security-policy" && extraConnect ? value.replace("connect-src ", `connect-src ${extraConnect} `) : value;
    res.writeHead(200, headers).end(readFileSync(file));
  });
  return new Promise((resolve) => server.listen(port, () => resolve(server)));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const arg = (n, d) => (process.argv.includes(`--${n}`) ? process.argv[process.argv.indexOf(`--${n}`) + 1] : d);
  await startServer({ dir: arg("dir", "dist"), port: Number(arg("port", 4173)), extraConnect: arg("extra-connect", "") });
}
