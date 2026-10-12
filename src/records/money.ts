/** Largest amount the app accepts, in naira. Matches the database limit (₦1 billion in kobo). */
export const MAX_NAIRA = 999_999_999;
export const MAX_DIGITS = 9;

export const toKobo = (naira: number): number => Math.round(naira * 100);

/** 450000 -> "4,500". Kobo only shows when there is some (4,500.50). */
export function formatNaira(kobo: number): string {
  const sign = kobo < 0 ? "-" : "";
  const abs = Math.abs(Math.round(kobo));
  const whole = Math.floor(abs / 100).toLocaleString("en-NG");
  const frac = abs % 100;
  return `${sign}${whole}${frac ? `.${String(frac).padStart(2, "0")}` : ""}`;
}

/** 450000 -> "₦4,500" for sentences. In layouts, use the Money component, which sets the ₦ small. */
export const naira = (kobo: number): string => `${kobo < 0 ? "-" : ""}₦${formatNaira(Math.abs(kobo))}`;

/** Keypad entry: append a key to the digits typed so far, ignoring anything that would break the limits. */
export function pressKey(digits: string, key: string): string {
  if (key === "back") return digits.slice(0, -1);
  if (!/^\d{1,3}$/.test(key)) return digits;
  const next = (digits + key).replace(/^0+/, "");
  return next.length > MAX_DIGITS ? digits : next;
}

/** Digits typed on the keypad -> kobo. "" -> 0. */
export const digitsToKobo = (digits: string): number => toKobo(Number(digits || "0"));
