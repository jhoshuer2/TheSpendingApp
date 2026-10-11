import { describe, expect, it } from "vitest";
import { validateEmail, validateName, validatePassword } from "./validate";

describe("validate", () => {
  it("accepts a normal email and rejects malformed ones", () => {
    expect(validateEmail("ada@example.com")).toBeUndefined();
    expect(validateEmail("  ada@example.com ")).toBeUndefined();
    expect(validateEmail("")).toBe("Enter your email");
    expect(validateEmail("ada@")).toBeDefined();
    expect(validateEmail("ada@example")).toBeDefined();
    expect(validateEmail("a da@example.com")).toBeDefined();
  });
  it("requires a name of at least 2 characters", () => {
    expect(validateName("A")).toBeDefined();
    expect(validateName("  ")).toBeDefined();
    expect(validateName("Ada")).toBeUndefined();
  });
  it("requires 8+ character passwords", () => {
    expect(validatePassword("1234567")).toBeDefined();
    expect(validatePassword("12345678")).toBeUndefined();
  });
});
