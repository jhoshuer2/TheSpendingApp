import { liveSales } from "./calc";
import type { RecordsState } from "./state";
import type { Customer, Sale } from "./types";

/** Names are matched without caring about capitals, punctuation or extra spaces: "mrs  Bello." is "Mrs Bello". */
export const normName = (s: string | undefined): string => (s ?? "").toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, "").replace(/\s+/g, " ").trim();

export interface CustomerEntry {
  /** Stable key for links: the saved customer's id, or "n_..." made from the name when they only appear on sales. */
  key: string;
  name: string;
  /** Set once they have saved details (phone, note). */
  saved?: Customer;
  phone?: string;
  note?: string;
  /** Everything they ever bought (not deleted), newest first. */
  sales: Sale[];
  /** What they bought, in kobo (all sales, paid or not). */
  total: number;
  /** What they still owe, in kobo, and the unpaid sales behind it (oldest first). */
  owed: number;
  owedSales: Sale[];
  lastAt?: string;
}

// base64url of the normalised name, so any name (including accents) is safe in a link.
const toKey = (norm: string): string => {
  const bytes = new TextEncoder().encode(norm);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return `n_${btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")}`;
};
export const keyForName = (name: string): string => toKey(normName(name));

/** Everyone you sell to: customers with saved details, plus anyone whose name appears on a sale. */
export function buildCustomers(state: RecordsState): CustomerEntry[] {
  const byNorm = new Map<string, CustomerEntry>();
  const saved = Object.values(state.customers).filter((c) => !c.archived).sort((a, b) => a.id.localeCompare(b.id));
  for (const c of saved) {
    const n = normName(c.name);
    if (!n || byNorm.has(n)) continue; // two saved customers with the same name: the first keeps the sales
    byNorm.set(n, { key: c.id, name: c.name, saved: c, ...(c.phone ? { phone: c.phone } : {}), ...(c.note ? { note: c.note } : {}), sales: [], total: 0, owed: 0, owedSales: [] });
  }
  for (const s of liveSales(state)) {
    const n = normName(s.customer);
    if (!n) continue;
    let e = byNorm.get(n);
    if (!e) {
      e = { key: toKey(n), name: (s.customer as string).trim(), sales: [], total: 0, owed: 0, owedSales: [] };
      byNorm.set(n, e);
    }
    e.sales.push(s);
  }
  for (const e of byNorm.values()) {
    e.sales.sort((a, b) => b.at.localeCompare(a.at));
    e.total = e.sales.reduce((n, s) => n + s.amount, 0);
    e.owedSales = e.sales.filter((s) => !s.paid).sort((a, b) => a.at.localeCompare(b.at));
    e.owed = e.owedSales.reduce((n, s) => n + s.amount, 0);
    e.lastAt = e.sales[0]?.at;
  }
  return [...byNorm.values()];
}

export const findCustomer = (state: RecordsState, key: string): CustomerEntry | undefined => buildCustomers(state).find((c) => c.key === key);

/** People who owe you, biggest debt first, then everyone by who bought most recently. */
export function sortCustomers(list: CustomerEntry[]): { owing: CustomerEntry[]; everyone: CustomerEntry[] } {
  const owing = list.filter((c) => c.owed > 0).sort((a, b) => b.owed - a.owed || a.name.localeCompare(b.name));
  const everyone = [...list].sort((a, b) => (b.lastAt ?? "").localeCompare(a.lastAt ?? "") || a.name.localeCompare(b.name));
  return { owing, everyone };
}

/**
 * A phone number as WhatsApp wants it: digits only, with the country code. Nigerian numbers written the usual way
 * ("0803 123 4567") get 234. Returns null when it doesn't look like a real number, so we never open a wrong chat.
 */
export function whatsappNumber(phone: string | undefined): string | null {
  if (!phone) return null;
  const t = phone.trim();
  let d = t.replace(/\D/g, "");
  let international = t.startsWith("+");
  if (!international && d.startsWith("00")) {
    d = d.slice(2);
    international = true;
  }
  if (!international) {
    // Written the Nigerian way: 0803 123 4567, 8031234567, or 2348031234567. Anything else is too uncertain to open a chat with.
    if (/^0\d{10}$/.test(d)) d = `234${d.slice(1)}`;
    else if (/^[789]\d{9}$/.test(d)) d = `234${d}`;
    else if (!/^234\d{10}$/.test(d)) return null;
  }
  if (d.startsWith("234")) return d.length === 13 ? d : null;
  return d.length >= 8 && d.length <= 15 ? d : null;
}

export const whatsappLink = (phone: string | undefined, text: string): string | null => {
  const n = whatsappNumber(phone);
  return n ? `https://wa.me/${n}?text=${encodeURIComponent(text)}` : null;
};

/** For a phone: tel: link only when the number is plausible. */
export const telLink = (phone: string | undefined): string | null => {
  const n = whatsappNumber(phone);
  return n ? `tel:+${n}` : null;
};
