import type { MsgLang, Tone } from "./templates";

const KEY = "spal.msgprefs.v1";
export interface MessagePrefs {
  lang: MsgLang;
  tone: Tone;
}

/** How the person likes their messages to sound. Remembered on this phone. */
export function readMessagePrefs(): MessagePrefs {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) ?? "{}") as Partial<MessagePrefs>;
    return { lang: p.lang === "pcm" ? "pcm" : "en", tone: p.tone === "short" || p.tone === "firm" ? p.tone : "friendly" };
  } catch {
    return { lang: "en", tone: "friendly" };
  }
}
export function writeMessagePrefs(p: MessagePrefs): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* the choice just won't be remembered */
  }
}
