import { MODULES } from "./modules";
import type { Answers, Module, NeedId, Profile } from "./types";

export interface Recommendation {
  module: Module;
  /** Why this one, in plain words. */
  reason: string;
}

const TYPE_BONUS = 1.5;
const REPEAT_PENALTY = 3.5;

/**
 * Pick the next step and a short "up next" queue. Finished modules are skipped, modules are limited to
 * the person's band and business type, and the queue avoids repeating one need back to back.
 */
export function recommend(profile: Profile, answers: Answers, done: ReadonlySet<string>, upNextCount = 3) {
  const need = new Map(profile.needs.map((n) => [n.id, n]));
  const eligible = MODULES.filter(
    (m) => !done.has(m.id) && m.bands.includes(profile.band) && (!m.types || (answers.type && m.types.includes(answers.type))),
  );

  const picked: Recommendation[] = [];
  const used = new Map<NeedId, number>();
  const pool = [...eligible];

  while (picked.length < upNextCount + 1 && pool.length) {
    let best = -1;
    let bestScore = -Infinity;
    pool.forEach((m, i) => {
      const base = need.get(m.need)?.score ?? 0;
      const score = base + (m.types ? TYPE_BONUS : 0) - REPEAT_PENALTY * (used.get(m.need) ?? 0);
      if (score > bestScore) {
        bestScore = score;
        best = i;
      }
    });
    const [m] = pool.splice(best, 1);
    used.set(m.need, (used.get(m.need) ?? 0) + 1);
    const reason = m.types
      ? `Made for your kind of business. ${need.get(m.need)?.reasons[0] ?? m.why}`
      : (need.get(m.need)?.reasons[0] ?? m.why);
    picked.push({ module: m, reason });
  }

  const [next, ...upNext] = picked;
  return { next, upNext };
}
