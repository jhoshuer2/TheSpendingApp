import { naira } from "../records/money";
import type { Sale } from "../records/types";

export type Tone = "friendly" | "short" | "firm";
export type MsgLang = "en" | "pcm";

export const TONES: { value: Tone; label: string }[] = [
  { value: "friendly", label: "Friendly" },
  { value: "short", label: "Short" },
  { value: "firm", label: "Firm" },
];
export const LANGS: { value: MsgLang; label: string }[] = [
  { value: "en", label: "English" },
  { value: "pcm", label: "Pidgin" },
];

// Titles people use for each other. "Mrs Bello" should be greeted as "Mrs Bello", not "Mrs".
const TITLES = new Set(["mr", "mrs", "ms", "miss", "madam", "mama", "mummy", "papa", "baba", "oga", "chief", "dr", "pastor", "alhaji", "alhaja", "aunty", "auntie", "uncle", "sir", "engr", "barr", "prof", "bro", "sis", "brother", "sister", "iya", "mallam"]);

export function greetingName(full: string): string {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "there";
  const first = parts[0].replace(/[^\p{L}\p{N}]/gu, "").toLowerCase();
  return TITLES.has(first) && parts.length > 1 ? `${parts[0]} ${parts[1]}` : parts[0];
}

const day = (iso: string, withYear = false) => new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", ...(withYear ? { year: "numeric" } : {}) });

/** What a sale was, in a few plain words for a message. */
export function whatOf(s: Sale): string {
  if (s.items.length) {
    const parts = s.items.slice(0, 3).map((i) => (i.qty > 1 ? `${i.qty} ${i.name}` : i.name));
    return parts.join(", ") + (s.items.length > 3 ? " and more" : "");
  }
  // A bare "Sale" says nothing to a customer.
  return s.note && s.note.trim().toLowerCase() !== "sale" ? s.note : "your order";
}

export interface ReminderInput {
  customerName: string;
  /** The unpaid sales to remind about. */
  sales: Pick<Sale, "amount" | "at" | "items" | "note">[];
  /** The business name, or the owner's own name when there isn't one. Used to sign the message. */
  from?: string;
  tone: Tone;
  lang: MsgLang;
}

/** A payment reminder, ready to send. The amounts come straight from the books; nothing is invented. */
export function reminderMessage(i: ReminderInput): string {
  const first = greetingName(i.customerName);
  const total = i.sales.reduce((n, s) => n + s.amount, 0);
  const sig = i.from ? `\n— ${i.from}` : "";
  const one = i.sales.length === 1;
  const s0 = i.sales[0];
  const lines = i.sales.slice(0, 8).map((s) => `• ${whatOf(s as Sale)}: ${naira(s.amount)} (${day(s.at)})`).join("\n") + (i.sales.length > 8 ? `\n• …and ${i.sales.length - 8} more` : "");
  const amt = naira(one ? s0.amount : total);
  const what = one ? whatOf(s0 as Sale) : "";
  const when = one ? day(s0.at) : "";

  if (i.lang === "pcm") {
    if (i.tone === "short") return one ? `Hi ${first}, abeg no forget the ${amt} for ${what}. Thanks!${sig}` : `Hi ${first}, abeg no forget the ${amt} wey you still owe me. Thanks!${sig}`;
    if (i.tone === "firm") return one ? `Hello ${first}, the ${amt} for ${what} (${when}) never enter yet. Abeg pay am today, or tell me when you go pay. Thank you.${sig}` : `Hello ${first}, ${amt} never enter yet:\n${lines}\nAbeg pay am today, or tell me when you go pay. Thank you.${sig}`;
    return one ? `Hello ${first}, how you dey? Small reminder about the ${amt} for ${what} wey you collect on ${when}. Abeg send am when you fit. Thank you!${sig}` : `Hello ${first}, how you dey? Small reminder say ${amt} still dey:\n${lines}\nAbeg send am when you fit. Thank you!${sig}`;
  }
  if (i.tone === "short") return one ? `Hi ${first}, please remember the ${amt} for ${what}. Thanks!${sig}` : `Hi ${first}, please remember the ${amt} you still owe me. Thanks!${sig}`;
  if (i.tone === "firm") return one ? `Hello ${first}, your payment of ${amt} for ${what} (${when}) is still outstanding. Please pay today, or tell me when you will. Thank you.${sig}` : `Hello ${first}, ${amt} is still outstanding:\n${lines}\nPlease pay today, or tell me when you will. Thank you.${sig}`;
  return one ? `Hello ${first}, I hope you're well. A quick reminder about the ${amt} for ${what} (${when}). Please send it when you can. Thank you!${sig}` : `Hello ${first}, I hope you're well. A quick reminder that ${amt} is still outstanding:\n${lines}\nPlease send it when you can. Thank you!${sig}`;
}

export interface ReceiptInput {
  sale: Pick<Sale, "amount" | "at" | "items" | "note" | "paid" | "customer">;
  from?: string;
  lang: MsgLang;
}

/** A simple receipt as text, for WhatsApp or SMS. Structure labels stay plain English in both languages so it is always clear. */
export function receiptMessage(i: ReceiptInput): string {
  const s = i.sale;
  const lines = s.items.length
    ? s.items.slice(0, 20).map((it) => `${it.qty > 1 ? `${it.qty} × ` : ""}${it.name} — ${naira(it.qty * it.unitPrice)}`)
    : [`${s.note || "Sale"} — ${naira(s.amount)}`];
  const out = [
    ...(i.from ? [i.from] : []),
    `Receipt · ${day(s.at, true)}`,
    ...(s.customer ? [`For: ${s.customer}`] : []),
    "",
    ...lines,
    "",
    `Total: ${naira(s.amount)}`,
    s.paid ? "Paid ✔" : `Still to pay: ${naira(s.amount)}`,
    "",
    i.lang === "pcm" ? "Thank you, we dey appreciate you!" : "Thank you for your business!",
  ];
  return out.join("\n");
}
