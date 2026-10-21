import { describe, expect, it } from "vitest";
import { titleFor } from "./pageTitle";

describe("page titles", () => {
  it("names the screen, so a tab, a bookmark and a screen reader can tell them apart", () => {
    expect(titleFor("/app/today")).toBe("Today · SPAL");
    expect(titleFor("/app/money")).toBe("Money · SPAL");
    expect(titleFor("/money/sale")).toBe("Record a sale · SPAL");
    expect(titleFor("/money/customer/n_abc/edit")).toBe("Edit customer · SPAL");
    expect(titleFor("/money/customer/n_abc")).toBe("Customer · SPAL");
    expect(titleFor("/assistant/settings")).toBe("Assistant settings · SPAL");
    expect(titleFor("/login")).toBe("Log in · SPAL");
  });
  it("falls back to the plain name for the splash and for unknown pages", () => {
    expect(titleFor("/")).toBe("SPAL");
    expect(titleFor("/no/such/page")).toBe("Page not found · SPAL");
  });
});
