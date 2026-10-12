import { describe, expect, it } from "vitest";
import { EMPTY_RECORDS, type RecordsState } from "../records/state";
import type { Sale } from "../records/types";
import { buildCustomers, keyForName, normName, sortCustomers, telLink, whatsappLink, whatsappNumber } from "../records/customers";
import { greetingName, receiptMessage, reminderMessage, whatOf } from "./templates";

const at = (d: number) => new Date(2026, 9, d, 10).toISOString();
const sale = (id: string, o: Partial<Sale>): Sale => ({ id, at: at(5), amount: 450000, items: [], paid: true, ...o });

describe("greetingName", () => {
  it("keeps titles with the name, and uses the first name otherwise", () => {
    expect(greetingName("Mrs Bello")).toBe("Mrs Bello");
    expect(greetingName("Mama Tosin Adeyemi")).toBe("Mama Tosin");
    expect(greetingName("Chidi Okeke")).toBe("Chidi");
    expect(greetingName("Mr.")).toBe("Mr.");
    expect(greetingName("   ")).toBe("there");
  });
});

describe("reminderMessage", () => {
  const one = [{ amount: 2500000, at: at(8), items: [{ name: "Cake", qty: 2, unitPrice: 1250000 }], note: undefined }];
  it("states the exact amount, what it was and when, in every tone and language", () => {
    for (const lang of ["en", "pcm"] as const) for (const tone of ["friendly", "short", "firm"] as const) {
      const m = reminderMessage({ customerName: "Chidi Okeke", sales: one, from: "Ada's Kitchen", tone, lang });
      expect(m).toContain("₦25,000");
      expect(m).toContain("2 Cake");
      expect(m).toContain("Chidi");
      expect(m).toContain("— Ada's Kitchen");
      expect(m).not.toMatch(/undefined|NaN/);
    }
  });
  it("lists several unpaid sales with the right total", () => {
    const many = [one[0], { amount: 800000, at: at(9), items: [], note: "Zobo" }];
    const m = reminderMessage({ customerName: "Mrs Bello", sales: many, tone: "friendly", lang: "en" });
    expect(m).toContain("₦33,000");
    expect(m).toContain("• 2 Cake: ₦25,000");
    expect(m).toContain("• Zobo: ₦8,000");
    expect(m.startsWith("Hello Mrs Bello")).toBe(true);
    expect(m).not.toContain("—"); // no signature when there is no name to sign with
  });
  it("is Pidgin when asked and plain English by default style", () => {
    expect(reminderMessage({ customerName: "Chidi", sales: one, tone: "friendly", lang: "pcm" })).toMatch(/how you dey/);
    expect(reminderMessage({ customerName: "Chidi", sales: one, tone: "firm", lang: "pcm" })).toMatch(/never enter yet/);
    expect(reminderMessage({ customerName: "Chidi", sales: one, tone: "friendly", lang: "en" })).toMatch(/hope you're well/);
  });
  it("shortens a very long list", () => {
    const lots = Array.from({ length: 12 }, (_, i) => ({ amount: 100000, at: at(1 + i), items: [], note: `Item ${i}` }));
    const m = reminderMessage({ customerName: "Ada", sales: lots, tone: "friendly", lang: "en" });
    expect(m).toContain("₦12,000");
    expect(m).toContain("…and 4 more");
  });
  it("describes sales plainly", () => {
    expect(whatOf(sale("a", {}))).toBe("your order");
    expect(whatOf(sale("a", { note: "Cake order" }))).toBe("Cake order");
    expect(whatOf(sale("a", { items: [1, 2, 3, 4].map((n) => ({ name: `P${n}`, qty: n, unitPrice: 100 })) }))).toBe("P1, 2 P2, 3 P3 and more");
  });
});

describe("receiptMessage", () => {
  it("is a clear receipt, paid or not", () => {
    const s = sale("a", { amount: 450000, items: [{ name: "Jollof", qty: 3, unitPrice: 150000 }], customer: "Chidi", at: at(12) });
    const paid = receiptMessage({ sale: s, from: "Ada's Kitchen", lang: "en" });
    expect(paid).toBe(["Ada's Kitchen", "Receipt · 12 Oct 2026", "For: Chidi", "", "3 × Jollof — ₦4,500", "", "Total: ₦4,500", "Paid ✔", "", "Thank you for your business!"].join("\n"));
    const owing = receiptMessage({ sale: { ...s, paid: false }, lang: "pcm" });
    expect(owing).toContain("Still to pay: ₦4,500");
    expect(owing).toContain("we dey appreciate you");
    expect(owing.startsWith("Receipt\n")).toBe(true);
  });
  it("handles a sale with only a note", () => {
    expect(receiptMessage({ sale: sale("a", { note: "Cake order", amount: 1200000 }), lang: "en" })).toContain("Cake order — ₦12,000");
  });
});

describe("customers from the books", () => {
  const state: RecordsState = {
    ...EMPTY_RECORDS,
    customers: {
      "cust-chidi-1": { id: "cust-chidi-1", name: "Chidi Okeke", phone: "0803 123 4567" },
      "cust-empty-1": { id: "cust-empty-1", name: "Never Bought" },
      "cust-gone-01": { id: "cust-gone-01", name: "Archived Person", archived: true },
    },
    sales: {
      s1: sale("s1", { customer: "chidi okeke", amount: 100000, at: at(3) }),
      s2: sale("s2", { customer: "Chidi  Okeke.", amount: 200000, at: at(9), paid: false }),
      s3: sale("s3", { customer: "Mrs Bello", amount: 500000, at: at(7), paid: false }),
      s4: sale("s4", { customer: "mrs bello", amount: 300000, at: at(10), paid: false }),
      s5: sale("s5", { amount: 999, at: at(1) }),
      s6: sale("s6", { customer: "Deleted", amount: 100, deletedAt: at(2) }),
      s7: sale("s7", { customer: "Archived Person", amount: 700000, at: at(4) }),
    },
  };
  it("matches names however they were typed and adds up what is owed", () => {
    const list = buildCustomers(state);
    const chidi = list.find((c) => c.name === "Chidi Okeke")!;
    expect(chidi.saved?.id).toBe("cust-chidi-1");
    expect(chidi.key).toBe("cust-chidi-1");
    expect(chidi.sales.map((s) => s.id)).toEqual(["s2", "s1"]);
    expect(chidi.total).toBe(300000);
    expect(chidi.owed).toBe(200000);
    expect(chidi.phone).toBe("0803 123 4567");
    const bello = list.find((c) => c.name === "Mrs Bello")!;
    expect(bello.saved).toBeUndefined();
    expect(bello.owed).toBe(800000);
    expect(bello.owedSales.map((s) => s.id)).toEqual(["s3", "s4"]); // oldest first
    expect(bello.key).toBe(keyForName("MRS BELLO!"));
  });
  it("skips sales with no name or deleted, shows people with no sales, and keeps an archived person's sales", () => {
    const names = buildCustomers(state).map((c) => c.name).sort();
    expect(names).toEqual(["Archived Person", "Chidi Okeke", "Mrs Bello", "Never Bought"]);
    expect(buildCustomers(state).find((c) => c.name === "Archived Person")!.saved).toBeUndefined();
  });
  it("sorts who owes you by the size of the debt", () => {
    const { owing, everyone } = sortCustomers(buildCustomers(state));
    expect(owing.map((c) => c.name)).toEqual(["Mrs Bello", "Chidi Okeke"]);
    expect(everyone[0].name).toBe("Mrs Bello"); // bought most recently (day 10)
  });
  it("keys are safe for links, including accents", () => {
    expect(keyForName("Chinedu Ọkọ")).toMatch(/^n_[A-Za-z0-9_-]+$/);
    expect(keyForName("A  B")).toBe(keyForName("a b"));
    expect(normName("  Mrs.  Bello ")).toBe("mrs bello");
  });
});

describe("phone numbers", () => {
  it("turns Nigerian numbers into WhatsApp numbers", () => {
    expect(whatsappNumber("0803 123 4567")).toBe("2348031234567");
    expect(whatsappNumber("+234 803 123 4567")).toBe("2348031234567");
    expect(whatsappNumber("2348031234567")).toBe("2348031234567");
    expect(whatsappNumber("8031234567")).toBe("2348031234567");
    expect(whatsappNumber("00234 803 123 4567")).toBe("2348031234567");
    expect(whatsappNumber("+44 7700 900123")).toBe("447700900123");
  });
  it("refuses anything that doesn't look like a number, so a wrong chat is never opened", () => {
    for (const bad of [undefined, "", "abc", "0803", "080312345678", "+234 803 123 456", "123"]) expect(whatsappNumber(bad)).toBeNull();
    expect(whatsappLink("0803", "hi")).toBeNull();
    expect(telLink("nope")).toBeNull();
  });
  it("builds links with the message safely encoded", () => {
    expect(whatsappLink("08031234567", "Hello & thanks!\n₦1")).toBe("https://wa.me/2348031234567?text=Hello%20%26%20thanks!%0A%E2%82%A61");
    expect(telLink("08031234567")).toBe("tel:+2348031234567");
  });
});
