/** Why a call to the assistant failed, in terms the screen can explain. */
export type ChatErrorKind = "offline" | "signin" | "quota" | "busy" | "too_long" | "failed" | "unavailable";
export class ChatError extends Error {
  constructor(public kind: ChatErrorKind, message: string = kind, public scope?: "user" | "global") {
    super(message);
  }
}
