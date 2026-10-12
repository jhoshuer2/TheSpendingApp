import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { backend } from "../backend";
import { useAuth } from "../lib/auth";
import { useToast } from "../lib/toast";
import { useProfile } from "../profile/store";
import { FACT_KEYS, factsOf, type FactKey } from "../messages/facts";
import { readMessagePrefs } from "../messages/prefs";
import { newId, useRecords } from "../records/store";
import { ChatError, emptyChat, freshChat, MAX_INPUT_CHARS, needsFresh, runTurn, type Chat, type IO, type Saved, type Settings } from "./engine";
import { clearStored, readStored, writeStored } from "./state";
import type { Proposal } from "./tools";

interface AssistantApi {
  /** false in demo mode: the assistant needs an account. */
  available: boolean;
  chat: Chat;
  settings: Settings;
  consented: boolean;
  busy: boolean;
  error: ChatError | null;
  consent: () => void;
  setSettings: (s: Partial<Settings>) => void;
  send: (text: string) => void;
  retry: () => void;
  save: (itemId: string) => void;
  dismiss: (itemId: string) => void;
  undo: (itemId: string) => void;
  clear: () => void;
  /** Remove this person's chat from this phone. Called only when they choose to log out. */
  prepareSignOut: () => void;
}

const Ctx = createContext<AssistantApi | null>(null);
const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function AssistantProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const { stored: profile, saveAnswers } = useProfile();
  const records = useRecords();
  const { show } = useToast();
  const userId = session?.id ?? null;
  const remote = useMemo(() => (userId ? backend.assistant() : null), [userId]);

  const [chat, setChat] = useState<Chat>(() => emptyChat(dayKey(new Date())));
  const [settings, setSettingsState] = useState<Settings>({ replyLanguage: "en", autonomy: "ask" });
  const [consented, setConsented] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ChatError | null>(null);

  const chatRef = useRef(chat);
  const settingsRef = useRef(settings);
  const consentRef = useRef(consented);
  const idRef = useRef<string | null>(null);
  const seq = useRef(0);
  const busyRef = useRef(false);
  const recordsRef = useRef(records);
  recordsRef.current = records;
  const profileRef = useRef(profile);
  profileRef.current = profile;
  const saveAnswersRef = useRef(saveAnswers);
  saveAnswersRef.current = saveAnswers;
  const sessionRef = useRef(session);
  sessionRef.current = session;

  const commit = useCallback((c: Chat, s: Settings = settingsRef.current, ok: boolean = consentRef.current) => {
    chatRef.current = c;
    settingsRef.current = s;
    consentRef.current = ok;
    setChat(c);
    setSettingsState(s);
    setConsented(ok);
    if (idRef.current) writeStored(idRef.current, { chat: c, settings: s, consented: ok });
  }, []);

  // Load this person's chat when they sign in; forget it when they sign out.
  useEffect(() => {
    seq.current++;
    idRef.current = userId;
    busyRef.current = false;
    setBusy(false);
    setError(null);
    if (!userId) {
      // Not signed in right now. Don't delete anything here: sign-in can blink to "signed out" for a moment on reload.
      chatRef.current = emptyChat(dayKey(new Date()));
      settingsRef.current = { replyLanguage: "en", autonomy: "ask" };
      consentRef.current = false;
      setChat(chatRef.current);
      setSettingsState(settingsRef.current);
      setConsented(false);
      return;
    }
    const s = readStored(userId, dayKey(new Date()));
    chatRef.current = s.chat;
    settingsRef.current = s.settings;
    consentRef.current = s.consented;
    setChat(s.chat);
    setSettingsState(s.settings);
    setConsented(s.consented);
  }, [userId]);

  const apply = useCallback((p: Proposal): Saved => {
    const r = recordsRef.current;
    const saved: Saved = { sales: [], expenses: [], paid: [] };
    for (const s of p.sales) saved.sales.push(r.addSale({ amount: s.amount, items: s.items, note: s.note, customer: s.customer, paid: s.paid, at: s.at }).id);
    for (const e of p.expenses) saved.expenses.push(r.addExpense({ amount: e.amount, category: e.category, note: e.note, at: e.at }).id);
    if (p.markPaid) {
      for (const id of p.markPaid.saleIds) {
        const sale = r.state.sales[id];
        if (sale && !sale.deletedAt && !sale.paid) {
          r.markPaid(id);
          saved.paid.push(id);
        }
      }
    }
    if (p.facts) {
      // Remember what each fact was, so Undo can put it back exactly.
      const before = factsOf(profileRef.current.answers);
      const next = { ...profileRef.current.answers };
      saved.facts = {};
      for (const k of FACT_KEYS) {
        const v = p.facts[k];
        if (!v) continue;
        saved.facts[k] = before[k] ?? null;
        next[k] = v;
      }
      saveAnswersRef.current(next);
    }
    return saved;
  }, []);

  const run = useCallback(
    async (input: { text: string | null; retry?: boolean }) => {
      if (!remote || busyRef.current || !idRef.current) return;
      busyRef.current = true;
      setBusy(true);
      setError(null);
      const mine = ++seq.current;
      const now = new Date();
      let start = chatRef.current;
      if (needsFresh(start, now)) start = freshChat(start, now, newId());
      const io: IO = {
        call: async (messages) => {
          if (typeof navigator !== "undefined" && navigator.onLine === false) throw new ChatError("offline");
          return remote.send(messages);
        },
        records: () => recordsRef.current.state,
        apply,
        facts: () => factsOf(profileRef.current.answers),
        messageContext: () => ({ from: profileRef.current.answers.businessName, ...readMessagePrefs() }),
        now: () => new Date(),
        id: newId,
        update: (c) => {
          if (mine === seq.current) commit({ ...c, items: [...c.items], pending: [...c.pending] });
        },
      };
      const who = { name: sessionRef.current?.name, businessType: profileRef.current.answers.type };
      // Show the person's message and any cards straight away, not only when the model answers.
      const { chat: next, error: err } = await runTurn(start, input, settingsRef.current, who, io);
      if (mine !== seq.current) return; // the chat was cleared or the person signed out meanwhile
      busyRef.current = false;
      setBusy(false);
      commit(next);
      setError(err ?? null);
    },
    [remote, apply, commit],
  );

  const api = useMemo<AssistantApi>(() => {
    const patchItem = (id: string, fn: (i: Chat["items"][number]) => Chat["items"][number]) =>
      commit({ ...chatRef.current, items: chatRef.current.items.map((i) => (i.id === id ? fn(i) : i)) });
    return {
      available: remote !== null,
      chat,
      settings,
      consented,
      busy,
      error,
      consent: () => commit(chatRef.current, settingsRef.current, true),
      setSettings: (p) => commit(chatRef.current, { ...settingsRef.current, ...p }),
      send: (text) => {
        const t = text.trim().slice(0, MAX_INPUT_CHARS);
        if (t) void run({ text: t });
      },
      retry: () => {
        const f = chatRef.current.failed;
        if (f) void run({ text: f.text, retry: true });
      },
      save: (id) => {
        const item = chatRef.current.items.find((i) => i.id === id);
        if (!item || item.kind !== "proposal" || item.status !== "pending") return;
        const saved = apply(item.proposal);
        patchItem(id, (i) => (i.kind === "proposal" ? { ...i, status: "saved", saved } : i));
      },
      dismiss: (id) => patchItem(id, (i) => (i.kind === "proposal" && i.status === "pending" ? { ...i, status: "dismissed" } : i)),
      undo: (id) => {
        const item = chatRef.current.items.find((i) => i.id === id);
        if (!item || item.kind !== "proposal" || item.status !== "saved" || !item.saved) return;
        const r = recordsRef.current;
        for (const sid of item.saved.sales) r.removeRecord("sale", sid);
        for (const eid of item.saved.expenses) r.removeRecord("expense", eid);
        for (const pid of item.saved.paid) r.markUnpaid(pid);
        if (item.saved.facts) {
          const next = { ...profileRef.current.answers };
          for (const k of Object.keys(item.saved.facts) as FactKey[]) {
            const was = item.saved.facts[k];
            if (was) next[k] = was;
            else delete next[k];
          }
          saveAnswersRef.current(next);
        }
        patchItem(id, (i) => (i.kind === "proposal" ? { ...i, status: "undone" } : i));
      },
      prepareSignOut: () => {
        if (idRef.current) clearStored(idRef.current);
      },
      clear: () => {
        seq.current++;
        busyRef.current = false;
        setBusy(false);
        setError(null);
        commit(emptyChat(dayKey(new Date())));
      },
    };
  }, [remote, chat, settings, consented, busy, error, run, apply, commit, show]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useAssistant(): AssistantApi {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAssistant must be used inside AssistantProvider");
  return v;
}
