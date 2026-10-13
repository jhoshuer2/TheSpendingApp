import { describe, expect, it } from "vitest";
import { checkRegNumber, cleanDay, sensitiveWords } from "./guide";

describe("registration guide", () => {
  it("nudges on words CAC may want consent for, whole words only", () => {
    expect(sensitiveWords("Ada National Foods")).toEqual(["national"]);
    expect(sensitiveWords("Federal and State Cakes")).toEqual(["federal", "state"]);
    expect(sensitiveWords("Nationalist Bakery")).toEqual([]);
    expect(sensitiveWords("Ada's Kitchen")).toEqual([]);
  });

  it("accepts a registration number with or without a prefix and tidies it", () => {
    expect(checkRegNumber("bn 1234567")).toEqual({ ok: true, value: "BN 1234567" });
    expect(checkRegNumber("BN-1234567")).toEqual({ ok: true, value: "BN 1234567" });
    expect(checkRegNumber(" rc123456 ")).toEqual({ ok: true, value: "RC 123456" });
    expect(checkRegNumber("1234567")).toEqual({ ok: true, value: "1234567" });
  });

  it("rejects things that cannot be a registration number", () => {
    for (const bad of ["", "   ", "BN", "BN 12", "ABC 1234567", "BN 123456789", "12 34 56 78 901"]) expect(checkRegNumber(bad).ok).toBe(false);
  });

  it("only keeps real calendar days", () => {
    expect(cleanDay("2026-10-13")).toBe("2026-10-13");
    expect(cleanDay("2026-13-45")).toBeUndefined();
    expect(cleanDay("13/10/2026")).toBeUndefined();
    expect(cleanDay(5)).toBeUndefined();
  });
});
