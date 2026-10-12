import { MODULES } from "../profile/modules";
import { prefersShort } from "../profile/recommend";
import { NEED_LABEL } from "../profile/scoring";
import type { StoredProfile } from "../profile/state";
import type { Answers, Module, NeedId, Profile } from "../profile/types";
import { dayKey, DAY_MS, daysAgo } from "./time";

export interface WeekDay {
  key: string;
  /** Short weekday letter for screens: M T W T F S S. */
  label: string;
  active: boolean;
}

export interface Area {
  need: NeedId;
  label: string;
  finished: number;
  total: number;
}

export interface Milestone {
  id: string;
  title: string;
  body: string;
  unlocked: boolean;
  /** When it was earned, as an ISO time or day. */
  at?: string;
}

export interface Gap {
  need: NeedId;
  text: string;
  /** A step in that area to offer. */
  module: Module;
}

export interface Insights {
  week: { days: WeekDay[]; activeDays: number; stepsFinished: number; prevStepsFinished: number };
  totals: { finished: number; started: number };
  areas: Area[];
  /** Typical days from opening a step to finishing it. null until there are two to compare. */
  paceDays: number | null;
  prefersShort: boolean;
  gap: Gap | null;
  milestones: Milestone[];
}

const fits = (m: Module, profile: Profile, answers: Answers) =>
  m.bands.includes(profile.band) && (!m.types || (answers.type !== undefined && m.types.includes(answers.type)));

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

/** Everything the Journey and Today screens say about how the person is doing, worked out from their saved state. */
export function computeInsights(stored: StoredProfile, profile: Profile, now: Date = new Date()): Insights {
  const { progress, activity, answers } = stored;
  const learning = activity.learning;
  const byId = new Map(MODULES.map((m) => [m.id, m]));
  const finishedEntries = Object.entries(progress)
    .filter(([id, p]) => p.doneAt && byId.has(id))
    .map(([id, p]) => ({ m: byId.get(id)!, at: p.doneAt! }))
    .sort((a, b) => a.at.localeCompare(b.at));

  // The last 7 local days, oldest first, ending today.
  const active = new Set(activity.days);
  const days: WeekDay[] = Array.from({ length: 7 }, (_, i) => {
    const d = daysAgo(now, 6 - i);
    return { key: dayKey(d), label: d.toLocaleDateString("en-NG", { weekday: "narrow" }), active: learning && active.has(dayKey(d)) };
  });
  const thisWeek = new Set(days.map((d) => d.key));
  const prevWeek = new Set(Array.from({ length: 7 }, (_, i) => dayKey(daysAgo(now, 13 - i))));
  const finishedOn = (set: Set<string>) => finishedEntries.filter((e) => set.has(dayKey(new Date(e.at)))).length;

  // Areas: how much of each relevant area is done, most important area first.
  const areas: Area[] = profile.needs
    .map((n) => {
      const all = MODULES.filter((m) => m.need === n.id && fits(m, profile, answers));
      return { need: n.id, label: NEED_LABEL[n.id], total: all.length, finished: all.filter((m) => progress[m.id]?.doneAt).length };
    })
    .filter((a) => a.total > 0);

  const paces = Object.values(progress)
    .filter((p) => p.doneAt && p.openedAt)
    .map((p) => Math.max(0, (Date.parse(p.doneAt!) - Date.parse(p.openedAt!)) / DAY_MS));
  const paceDays = learning && paces.length >= 2 ? Math.max(1, Math.round(median(paces))) : null;

  // A gap: one of their top areas that they haven't touched, once they've had time to settle in.
  const firstDay = activity.days[0] ? new Date(`${activity.days[0]}T12:00:00`) : undefined;
  const settled = finishedEntries.length >= 3 || (firstDay !== undefined && now.getTime() - firstDay.getTime() >= 10 * DAY_MS);
  let gap: Gap | null = null;
  if (learning && settled) {
    for (const n of profile.needs.slice(0, 3)) {
      const area = areas.find((a) => a.need === n.id);
      if (!area || area.finished > 0) continue;
      const open = MODULES.find((m) => m.need === n.id && fits(m, profile, answers) && !progress[m.id]?.doneAt && !progress[m.id]?.dismissed);
      const touched = Object.entries(progress).some(([id, p]) => byId.get(id)?.need === n.id && p.steps.length > 0);
      if (open && !touched) {
        gap = { need: n.id, module: open, text: `${n.reasons[0]}, and you haven't started a step on ${NEED_LABEL[n.id].toLowerCase()} yet.` };
        break;
      }
    }
  }

  const nth = (n: number) => finishedEntries[n - 1]?.at;
  const activeSorted = [...activity.days].sort();
  const threeDays = learning && activeSorted.length >= 3 ? findThreeInSevenDays(activeSorted) : undefined;
  const doneArea = areas.find((a) => a.total > 0 && a.finished === a.total);
  const milestones: Milestone[] = [
    { id: "first", title: "First step done", body: "You finished your first step.", unlocked: finishedEntries.length >= 1, at: nth(1) },
    { id: "three", title: "Three steps done", body: "Three steps finished.", unlocked: finishedEntries.length >= 3, at: nth(3) },
    { id: "ten", title: "Ten steps done", body: "Ten steps finished.", unlocked: finishedEntries.length >= 10, at: nth(10) },
    { id: "rhythm", title: "Finding your rhythm", body: "Active on three days within a week.", unlocked: threeDays !== undefined, at: threeDays },
    {
      id: "area",
      title: "A whole area done",
      body: doneArea ? `You've finished every step on ${doneArea.label.toLowerCase()}.` : "Finish every step in one area.",
      unlocked: doneArea !== undefined,
      at: doneArea ? finishedEntries.filter((e) => e.m.need === doneArea.need && fits(e.m, profile, answers)).at(-1)?.at : undefined,
    },
  ];

  return {
    week: { days, activeDays: days.filter((d) => d.active).length, stepsFinished: finishedOn(thisWeek), prevStepsFinished: finishedOn(prevWeek) },
    totals: {
      finished: finishedEntries.length,
      started: Object.values(progress).filter((p) => !p.doneAt && p.steps.length > 0).length,
    },
    areas,
    paceDays,
    prefersShort: learning && prefersShort(progress, now),
    gap,
    milestones,
  };
}

/** The date the person hit three active days inside a seven-day window, if they ever did. */
function findThreeInSevenDays(sorted: string[]): string | undefined {
  for (let i = 2; i < sorted.length; i++) {
    const span = (Date.parse(sorted[i]) - Date.parse(sorted[i - 2])) / DAY_MS;
    if (span <= 6) return sorted[i];
  }
  return undefined;
}

export interface WelcomeBack {
  daysAway: number;
  /** The step they were partway through, if any. */
  inProgress?: Module;
}

/** After a few days away: a warm welcome back. Never framed as something they lost. */
export function welcomeBack(previousSeen: string | undefined, stored: StoredProfile, now: Date = new Date()): WelcomeBack | null {
  if (!stored.activity.learning || !previousSeen) return null;
  const away = Math.floor((now.getTime() - Date.parse(previousSeen)) / DAY_MS);
  if (!(away >= 3)) return null;
  const partway = Object.entries(stored.progress)
    .filter(([id, p]) => !p.doneAt && !p.dismissed && p.steps.length > 0 && MODULES.some((m) => m.id === id))
    .sort((a, b) => (b[1].openedAt ?? "").localeCompare(a[1].openedAt ?? ""))[0];
  return { daysAway: away, inProgress: partway ? MODULES.find((m) => m.id === partway[0]) : undefined };
}
