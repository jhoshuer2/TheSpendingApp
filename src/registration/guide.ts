/** Business name registration with the Corporate Affairs Commission (CAC): what SPAL tells you, and the checks it can do itself.
 *  SPAL never registers anything and cannot look up CAC's records. Rules and fees change, so nothing here states a fee. */

/** When the steps below were last checked against CAC's own site. Shown to the person; update it whenever the content is re-checked. */
export const CHECKED_ON = "13 October 2026";

export const CAC_PORTAL = "https://icrp.cac.gov.ng";
export const CAC_SEARCH = "https://search.cac.gov.ng";

export const READY_ITEMS = [
  "A valid ID you can take a clear photo of",
  "A passport photo of yourself",
  "A photo of your signature on white paper",
  "An email you check often",
  "An address: your home or your business",
  "The date you started (or will start)",
  "A line on what the business does",
] as const;

export const PORTAL_STEPS = [
  "Open the CAC website and choose business name registration.",
  "Search your name. If it's free, reserve it. You'll pay a small fee and get an approval code.",
  "Fill in your details and upload your ID photo, passport photo and signature.",
  "Pay the filing fee. Your certificate is then ready to download on the site.",
] as const;

/** Words CAC may want its consent for. Not a complete list, so it only ever nudges: the portal has the final say. */
export const SENSITIVE_WORDS = ["federal", "national", "regional", "state", "government", "chartered", "cooperative", "municipal"] as const;

export function sensitiveWords(name: string): string[] {
  const words = name.toLowerCase().split(/[^a-z]+/);
  return SENSITIVE_WORDS.filter((w) => words.includes(w));
}

export type RegNumber = { ok: true; value: string } | { ok: false; error: string };

/** A loose check on a registration number someone typed: an optional letters prefix (BN, RC, IT) and 5 to 8 digits.
 *  It catches typos, nothing more. It does not prove the number is real: CAC's search does that. */
export function checkRegNumber(input: string): RegNumber {
  const t = input.trim().toUpperCase().replace(/\s+/g, " ");
  if (!t) return { ok: false, error: "Type the number from your certificate." };
  const m = /^(BN|RC|IT|LP|LLP)?[\s-]*(\d{5,8})$/.exec(t);
  if (!m) return { ok: false, error: "That doesn't look like a CAC number. It's usually BN and some digits, like BN 1234567." };
  return { ok: true, value: m[1] ? `${m[1]} ${m[2]}` : m[2] };
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;
export const cleanDay = (v: unknown): string | undefined => (typeof v === "string" && DAY.test(v) && !Number.isNaN(Date.parse(v)) ? v : undefined);
