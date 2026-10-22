import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

/** Six soft tints. The text on them is always dark ink, in light and dark themes alike, so they read as little pieces of paper. */
export type Tint = "mint" | "sky" | "sand" | "blush" | "lilac" | "peach";
const TINTS: Tint[] = ["mint", "sky", "sand", "blush", "lilac", "peach"];

/** The same name always gets the same tint, so a person is recognisable at a glance. */
export function tintFor(name: string): Tint {
  let h = 0;
  for (const ch of name.trim().toLowerCase()) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return TINTS[h % TINTS.length];
}

const initial = (name: string) => (name.trim().match(/\p{L}/u)?.[0] ?? "?").toUpperCase();

/** A pastel squircle with an initial: for customers, products, anyone or anything with a name. */
export function Avatar({ name, size = 40, tint }: { name: string; size?: number; tint?: Tint }) {
  return (
    <span className={`avatar tint--${tint ?? tintFor(name)}`} style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }} aria-hidden="true">
      {initial(name)}
    </span>
  );
}

/** An icon on a tinted tile. Each kind of row gets its own tint, so rows are told apart by colour before they are read. */
export function IconTile({ icon, tint = "mint", size = 40 }: { icon: IconName; tint?: Tint; size?: number }) {
  return (
    <span className={`itile tint--${tint}`} style={{ width: size, height: size }} aria-hidden="true">
      <Icon name={icon} size={Math.round(size * 0.5)} />
    </span>
  );
}

export type Status = "good" | "warn" | "bad" | "info" | "neutral";

/** A tinted pill for a state: "Blocked", "Owes", "Paid". One or two words. */
export function Pill({ tone = "neutral", children }: { tone?: Status; children: ReactNode }) {
  return <span className={`pill pill--${tone}`}>{children}</span>;
}

/** A coloured dot and one word. This replaces a sentence about status. */
export function StatusLine({ tone = "neutral", children }: { tone?: Status; children: ReactNode }) {
  return (
    <span className="statusline">
      <i className={`sdot sdot--${tone}`} aria-hidden="true" />
      {children}
    </span>
  );
}

/** A small section label with the number of things in it. */
export function SectionLabel({ children, count }: { children: ReactNode; count?: number }) {
  return (
    <div className="seclabel">
      <span>{children}</span>
      {count !== undefined && <b className="seclabel__count">{count}</b>}
    </div>
  );
}

/** A coded plate used until a real photo arrives, so cards never look empty. */
export function Plate() {
  return (
    <svg className="plate" viewBox="0 0 120 120" aria-hidden="true">
      <circle cx="60" cy="64" r="46" fill="rgba(255,255,255,0.55)" />
      <circle cx="60" cy="60" r="42" fill="rgba(255,255,255,0.9)" />
      <circle cx="60" cy="60" r="30" fill="rgba(20,26,23,0.06)" />
      <circle cx="50" cy="55" r="11" fill="#e0a85a" />
      <circle cx="70" cy="58" r="9" fill="#c8452b" opacity="0.85" />
      <circle cx="60" cy="72" r="8" fill="#5aa469" />
    </svg>
  );
}

/** A product on a pastel card: name and price up top, the picture as the hero, an action in the corner. Photos blend into the tint. */
export function ProductCard({ name, price, tint = "mint", image, action }: { name: string; price: ReactNode; tint?: Tint; image?: string; action?: ReactNode }) {
  return (
    <article className={`pcard tint--${tint}`}>
      <div className="pcard__top">
        <span className="pcard__name">{name}</span>
        <span className="pcard__price">{price}</span>
      </div>
      <div className="pcard__image">{image ? <img src={image} alt="" /> : <Plate />}</div>
      {action && <div className="pcard__action">{action}</div>}
    </article>
  );
}
