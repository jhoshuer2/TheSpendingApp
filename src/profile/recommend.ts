import { fitsPerson, MODULES } from "./modules";
import type { Progress } from "./state";
import { NEED_LABEL } from "./scoring";
import type { Answers, Module, NeedId, Profile } from "./types";

export interface Recommendation {
  module: Module;
  /** Why this one, in plain words (from what the person told us). */
  reason: string;
  /** Set when how the person uses SPAL changed this suggestion. Shown separately so it's never hidden. */
  learned?: string;
}

export interface RecommendOptions {
  progress?: Record<string, Progress>;
  now?: Date;
  /** Adapt to how the person uses SPAL. Steps they hid are always respected, either way. */
  learning?: boolean;
  upNextCount?: number;
}

const TYPE_BONUS = 1.5;
const REPEAT_PENALTY = 3.5;
/** Each finished step in an area lowers that area's priority, so people get variety. Capped so it never buries an area. */
const WORKED_PENALTY = 0.8;
const WORKED_CAP = 3;
const DISMISS_PENALTY = 1;
const DISMISS_CAP = 2;
const SHORT_BONUS = 0.7;
const SHORT_MINUTES = 15;
/** Finishing what you started beats starting something new. Not learning: it applies with learning off too. */
const STARTED_BONUS = 1;

/** True when someone finishes short steps but lets long ones stall: then we lean towards short ones. */
export function prefersShort(progress: Record<string, Progress>, now: Date): boolean {
  const byId = new Map(MODULES.map((m) => [m.id, m]));
  const finished = Object.entries(progress).filter(([, p]) => p.doneAt).map(([id]) => byId.get(id)).filter((m): m is Module => !!m);
  if (finished.length < 2) return false;
  const avg = finished.reduce((n, m) => n + m.minutes, 0) / finished.length;
  const weekAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const stalledLong = Object.entries(progress).filter(([id, p]) => {
    const m = byId.get(id);
    return m && m.minutes > SHORT_MINUTES && !p.doneAt && !p.dismissed && p.openedAt && Date.parse(p.openedAt) < weekAgo;
  }).length;
  return avg <= SHORT_MINUTES && stalledLong >= 1;
}

/**
 * Pick the next step and a short "up next" queue. Finished and hidden steps are skipped; steps are limited
 * to the person's band and business type; the queue avoids repeating one need back to back.
 * With learning on, areas they've worked on step back, areas they've turned down step back, and short steps
 * are favoured when that's what they actually finish.
 */
export function recommend(profile: Profile, answers: Answers, done: ReadonlySet<string>, opts: RecommendOptions = {}) {
  const { progress = {}, now = new Date(), learning = true, upNextCount = 3 } = opts;
  const need = new Map(profile.needs.map((n) => [n.id, n]));

  const eligible = MODULES.filter((m) => {
    if (done.has(m.id)) return false;
    const p = progress[m.id];
    if (p?.dismissed) return false;
    if (p?.snoozedUntil && Date.parse(p.snoozedUntil) > now.getTime()) return false;
    return fitsPerson(m, profile.band, answers);
  });

  const worked = new Map<NeedId, number>();
  const turnedDown = new Map<NeedId, number>();
  const byId = new Map(MODULES.map((m) => [m.id, m]));
  for (const [id, p] of Object.entries(progress)) {
    const m = byId.get(id);
    if (!m) continue;
    if (p.doneAt) worked.set(m.need, (worked.get(m.need) ?? 0) + 1);
    if (p.dismissed) turnedDown.set(m.need, (turnedDown.get(m.need) ?? 0) + 1);
  }
  const short = learning && prefersShort(progress, now);

  const adjust = (m: Module): number => {
    if (!learning) return 0;
    return (
      -WORKED_PENALTY * Math.min(worked.get(m.need) ?? 0, WORKED_CAP) -
      DISMISS_PENALTY * Math.min(turnedDown.get(m.need) ?? 0, DISMISS_CAP) +
      (short && m.minutes <= SHORT_MINUTES ? SHORT_BONUS : 0)
    );
  };

  const picked: Recommendation[] = [];
  const used = new Map<NeedId, number>();
  const pool = [...eligible];

  while (picked.length < upNextCount + 1 && pool.length) {
    let best = -1;
    let bestScore = -Infinity;
    pool.forEach((m, i) => {
      const base = need.get(m.need)?.score ?? 0;
      const started = (progress[m.id]?.steps.length ?? 0) > 0 ? STARTED_BONUS : 0;
      const score = Math.max(0, base + adjust(m)) + started + (m.types ? TYPE_BONUS : 0) - REPEAT_PENALTY * (used.get(m.need) ?? 0);
      if (score > bestScore) {
        bestScore = score;
        best = i;
      }
    });
    const [m] = pool.splice(best, 1);
    used.set(m.need, (used.get(m.need) ?? 0) + 1);

    const reason = m.types ? `Made for your kind of business. ${need.get(m.need)?.reasons[0] ?? m.why}` : (need.get(m.need)?.reasons[0] ?? m.why);

    let learned: string | undefined;
    if (learning) {
      // The area they'd otherwise be pointed at first, if they've already worked on it.
      const top = profile.needs.find((n) => n.id !== m.need && (worked.get(n.id) ?? 0) > 0 && n.score > (need.get(m.need)?.score ?? 0));
      if (short && m.minutes <= SHORT_MINUTES) learned = "It's a quick one. Short steps seem to suit you.";
      else if (top) learned = `You've already finished ${worked.get(top.id)} ${worked.get(top.id) === 1 ? "step" : "steps"} on ${NEED_LABEL[top.id].toLowerCase()}, so here's something different.`;
    }
    picked.push({ module: m, reason, ...(learned ? { learned } : {}) });
  }

  const [next, ...upNext] = picked;
  return { next, upNext };
}
