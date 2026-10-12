import { buildContext, READ_TOOLS, type Block, type ChatMessage } from "../../supabase/functions/_shared/assistant-protocol.ts";
import type { RecordsState } from "../records/state";
import { AUTO_LIMIT_KOBO, buildMarkPaidProposal, buildRecordsProposal, describeProposal, proposalTotal, runReadTool, type Proposal } from "./tools";

export type ReplyLanguage = "en" | "pcm";
export type Autonomy = "ask" | "auto";
export interface Settings {
  replyLanguage: ReplyLanguage;
  autonomy: Autonomy;
}
export const DEFAULT_SETTINGS: Settings = { replyLanguage: "en", autonomy: "ask" };

/** Why a call to the assistant failed, in terms the screen can explain. */
export type ChatErrorKind = "offline" | "signin" | "quota" | "busy" | "too_long" | "failed" | "unavailable";
export class ChatError extends Error {
  constructor(public kind: ChatErrorKind, message = kind, public scope?: "user" | "global") {
    super(message);
  }
}

export interface ModelReply {
  content: Block[];
  stopReason: string | null;
}

export interface Saved {
  sales: string[];
  expenses: string[];
  paid: string[];
}
export type ProposalStatus = "pending" | "saved" | "dismissed" | "undone";

export type Item =
  | { kind: "user"; id: string; text: string }
  | { kind: "assistant"; id: string; text: string }
  | { kind: "proposal"; id: string; proposal: Proposal; status: ProposalStatus; auto?: boolean; stale?: boolean; saved?: Saved }
  | { kind: "note"; id: string; text: string };

/** A tool result still owed to the model: either ready now, or waiting for the person to answer a card. */
export type Pending = { toolUseId: string; content: string; isError?: boolean } | { toolUseId: string; itemId: string };

export interface Chat {
  /** Exactly what the model has seen. Only ever added to, so the model's earlier reasoning stays valid. */
  api: ChatMessage[];
  /** What the person sees. */
  items: Item[];
  pending: Pending[];
  /** Local date this conversation started (YYYY-MM-DD). */
  day: string;
  /** Set when the last send didn't get through; the screen offers "Try again". */
  failed?: { text: string | null };
}
export const emptyChat = (day: string): Chat => ({ api: [], items: [], pending: [], day });

export interface IO {
  call(messages: ChatMessage[]): Promise<ModelReply>;
  records(): RecordsState;
  /** Save a proposal. Returns what was saved so it can be undone. */
  apply(p: Proposal): Saved;
  now(): Date;
  id(): string;
}

export const MAX_CALLS = 4;
const MAX_MESSAGES = 30;
const MAX_API_CHARS = 80_000;
export const MAX_INPUT_CHARS = 1000;

const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function contextLine(now: Date, s: Settings, who: { name?: string; businessType?: string }): string {
  return buildContext({ today: dayKey(now), weekday: WEEKDAYS[now.getDay()], name: who.name, businessType: who.businessType, replyLanguage: s.replyLanguage });
}

const summary = (p: Proposal) => describeProposal(p).join("; ");

/** A conversation is restarted each day, or when it gets long, so it stays fast and cheap. Nothing the person recorded is lost. */
export function needsFresh(chat: Chat, now: Date): boolean {
  return chat.api.length > 0 && (chat.day !== dayKey(now) || chat.api.length >= MAX_MESSAGES || JSON.stringify(chat.api).length > MAX_API_CHARS);
}
export function freshChat(chat: Chat, now: Date, id: string): Chat {
  const items: Item[] = chat.items.map((i) => (i.kind === "proposal" && i.status === "pending" ? { ...i, status: "dismissed" as const, stale: true } : i));
  return { api: [], pending: [], day: dayKey(now), items: [...items.slice(-60), { kind: "note", id, text: "New chat. I still know your sales and expenses." }] };
}

/** Turn the owed tool results into message blocks. Cards the person never answered count as "not saved". */
function resolvePending(chat: Chat): { blocks: Block[]; items: Item[] } {
  const items = chat.items.map((i) => ({ ...i })) as Item[];
  const blocks: Block[] = chat.pending.map((p) => {
    if (!("itemId" in p)) return { type: "tool_result", tool_use_id: p.toolUseId, content: p.content, ...(p.isError ? { is_error: true } : {}) };
    const it = items.find((x) => x.id === p.itemId);
    let content = "The person did not answer and moved on. Nothing was saved.";
    if (it && it.kind === "proposal") {
      if (it.status === "pending") {
        it.status = "dismissed";
        it.stale = true;
      } else if (it.status === "saved") content = `Saved. ${summary(it.proposal)}.`;
      else if (it.status === "undone") content = "The person saved this and then undid it. Nothing is saved.";
      else if (!it.stale) content = "The person said this was not right. Nothing was saved. Ask what to change.";
    }
    return { type: "tool_result", tool_use_id: p.toolUseId, content };
  });
  return { blocks, items };
}

/**
 * One turn: the person says something (or we carry on after a hiccup), the model answers, we run any tools it asks for,
 * and go round again until it has said its piece. Never throws: failures come back in `error`, with the chat as far as it got.
 */
export async function runTurn(
  start: Chat,
  input: { text: string | null; retry?: boolean },
  settings: Settings,
  who: { name?: string; businessType?: string },
  io: IO,
): Promise<{ chat: Chat; error?: ChatError }> {
  let chat: Chat = { ...start, failed: undefined };
  let text = input.text;
  if (text !== null && !input.retry) chat = { ...chat, items: [...chat.items, { kind: "user", id: io.id(), text }] };

  for (let call = 0; call < MAX_CALLS; call++) {
    const resolved = resolvePending(chat);
    const blocks = [...resolved.blocks, ...(text !== null ? ([{ type: "text", text: `${contextLine(io.now(), settings, who)}\n${text}` }] as Block[]) : [])];
    if (blocks.length === 0) break;
    const userMsg: ChatMessage = { role: "user", content: blocks };

    let reply: ModelReply;
    try {
      reply = await io.call([...chat.api, userMsg]);
    } catch (e) {
      const error = e instanceof ChatError ? e : new ChatError("failed");
      return { chat: { ...chat, failed: { text } }, error };
    }
    text = null;

    const items: Item[] = [...resolved.items];
    const pending: Pending[] = [];
    chat = { ...chat, api: [...chat.api, userMsg, { role: "assistant", content: reply.content }], items, pending };

    const said = reply.content.filter((b) => b.type === "text" && typeof b.text === "string").map((b) => String(b.text).trim()).filter(Boolean).join("\n\n");
    if (said) items.push({ kind: "assistant", id: io.id(), text: said });

    const uses = reply.content.filter((b) => b.type === "tool_use") as { type: "tool_use"; id: string; name: string; input: unknown }[];
    if (reply.stopReason === "refusal") {
      items.push({ kind: "note", id: io.id(), text: "I can't help with that one." });
      for (const u of uses) pending.push({ toolUseId: u.id, content: "Not done.", isError: true });
      break;
    }
    if (reply.stopReason === "max_tokens") {
      if (!uses.length) {
        items.push({ kind: "note", id: io.id(), text: "That answer got cut off. Try asking in a shorter way." });
        break;
      }
      for (const u of uses) pending.push({ toolUseId: u.id, content: "Your reply was cut off before this was complete. Do it again, more briefly.", isError: true });
      continue;
    }
    if (!uses.length) break;

    let waiting = false;
    for (const u of uses) {
      if ((READ_TOOLS as readonly string[]).includes(u.name)) {
        pending.push({ toolUseId: u.id, content: runReadTool(u.name, u.input, io.records(), io.now()) });
        continue;
      }
      const built = u.name === "propose_records" ? buildRecordsProposal(u.input, io.records(), io.now()) : u.name === "propose_mark_paid" ? buildMarkPaidProposal(u.input, io.records()) : null;
      if (!built || !built.ok) {
        pending.push({ toolUseId: u.id, content: built ? built.error : `Unknown tool ${u.name.slice(0, 40)}.`, isError: true });
        continue;
      }
      const id = io.id();
      if (settings.autonomy === "auto" && proposalTotal(built.proposal) <= AUTO_LIMIT_KOBO) {
        const saved = io.apply(built.proposal);
        items.push({ kind: "proposal", id, proposal: built.proposal, status: "saved", auto: true, saved });
        pending.push({ toolUseId: u.id, itemId: id });
      } else {
        items.push({ kind: "proposal", id, proposal: built.proposal, status: "pending" });
        pending.push({ toolUseId: u.id, itemId: id });
        waiting = true;
      }
    }
    // When the person has a card to answer we stop and let them; their answer rides along with their next message.
    if (waiting) break;
  }
  return { chat };
}

/** Does this chat end with the model's turn unfinished (results owed that the person isn't being asked about)? */
export const canContinue = (chat: Chat): boolean => chat.pending.some((p) => "content" in p) && !chat.items.some((i) => i.kind === "proposal" && i.status === "pending");
