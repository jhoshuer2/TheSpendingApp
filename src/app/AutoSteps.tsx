import { useEffect } from "react";
import { MODULES } from "../profile/modules";
import { useProfile } from "../profile/store";
import { evaluateAuto } from "../records/calc";
import { useRecords } from "../records/store";

/**
 * Some steps tick themselves when the person does the thing ("record your first sale"). This watches the books and
 * ticks them, so Today and Journey agree with what the person actually did. It only ever ticks; it never un-ticks.
 */
export function AutoSteps() {
  const { state, status } = useRecords();
  const { applyAuto, status: profileStatus } = useProfile();

  useEffect(() => {
    if (status !== "ready" || profileStatus !== "ready") return;
    const now = new Date();
    for (const m of MODULES) {
      if (!m.auto) continue;
      const done = Object.entries(m.auto).filter(([, check]) => evaluateAuto(check, state, now)).map(([i]) => Number(i));
      if (done.length) applyAuto(m.id, done);
    }
  }, [state, status, profileStatus, applyAuto]);

  return null;
}
