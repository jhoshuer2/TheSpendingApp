const LOCALE = "en-NG";

export const todayLabel = (now = new Date()) =>
  now.toLocaleDateString(LOCALE, { weekday: "long", day: "numeric", month: "long" });

export const shortDate = (iso: string) => new Date(iso).toLocaleDateString(LOCALE, { day: "numeric", month: "short" });

export const firstName = (full: string | undefined) => full?.trim().split(/\s+/)[0] || "there";
