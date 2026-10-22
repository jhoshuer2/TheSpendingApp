import { useEffect } from "react";
import { naira } from "../records/money";
import { Aura } from "./Aura";
import { Confetti } from "./Confetti";
import { MoneyCountUp } from "./CountUp";
import { Orb } from "./Orb";

export interface RewardProps {
  /** Whole kobo that just came in. Leave out for a reward that is not about money. */
  kobo?: number;
  /** The first of its kind ever (the first sale, the first finished step). */
  first?: boolean;
  /** Days in a row including this one; shown from 2. */
  streak?: number;
  /** Replaces the default headline and line, for rewards that are not a sale. */
  title?: string;
  line?: string;
  onUndo?: () => void;
  onClose: () => void;
  ms?: number;
}

/** A sale landing: the amount counts up on a soft dawn, the mascot cheers, a short burst of confetti, and Undo stays within reach. */
export function Reward({ kobo, first = false, streak = 0, title, line, onUndo, onClose, ms = 7000 }: RewardProps) {
  useEffect(() => {
    const t = window.setTimeout(onClose, ms);
    return () => window.clearTimeout(t);
  }, [kobo, title, ms, onClose]);
  return (
    <div className="reward" role="status">
      <Aura variant="dawn" />
      <Confetti />
      <Orb size={48} />
      <div className="reward__main">
        <span className="reward__title">{title ?? (first ? "Your first sale!" : "Sale in!")}</span>
        {kobo !== undefined && <MoneyCountUp kobo={kobo} size={34} />}
        <span className="reward__line">{line ?? (kobo !== undefined ? `Recorded ${naira(kobo)}.${first ? " This is how it starts." : streak >= 2 ? ` Day ${streak} in a row.` : ""}` : "")}</span>
      </div>
      {onUndo && (
        <button
          type="button"
          className="reward__undo"
          onClick={() => {
            onUndo();
            onClose();
          }}
        >
          Undo
        </button>
      )}
    </div>
  );
}
