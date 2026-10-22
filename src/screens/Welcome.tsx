import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../design-system/Button";
import { Icon } from "../design-system/Icon";
import { PageDots } from "../design-system/PageDots";
import { Aura } from "../design-system/Aura";
import { MoneyCountUp } from "../design-system/CountUp";
import { DayBars } from "../design-system/DayBars";
import { Orb } from "../design-system/Orb";

const DEMO_WEEK = [3, 5, 4, 6, 9, 2, 7].map((n, i) => ({ key: `d${i}`, label: "FSSMTWT"[i], total: n * 100_000, today: i === 6 }));

/** One idea per slide: a two-tone headline and a single large hero, no boxes around it. */
const SLIDES: { a: string; b: string; art: () => JSX.Element }[] = [
  {
    a: "Record a sale.",
    b: "In seconds.",
    art: () => (
      <div className="art-pro">
        <MoneyCountUp kobo={450_000} size={88} />
        <span className="art-pro__pill">
          <Icon name="check" size={16} stroke={2.4} /> Sale in!
        </span>
      </div>
    ),
  },
  {
    a: "Know what you keep.",
    b: "Not just what you sold.",
    art: () => (
      <div className="art-pro">
        <span className="art-pro__label">You kept this week</span>
        <MoneyCountUp kobo={1_360_000} size={64} />
        <DayBars days={DEMO_WEEK} what="Sold each day this week (example)" tone="light" />
      </div>
    ),
  },
  {
    a: "A guide that talks.",
    b: "Cheering you on.",
    art: () => (
      <div className="art-pro">
        <Orb size={132} />
        <div className="voice">
          <b>Two minutes is all this takes.</b>
        </div>
        <div className="art-pro__streak" aria-hidden="true">
          <Icon name="flame" size={20} />
          {[0, 1, 2, 3, 4].map((i) => (
            <i key={i} style={{ ["--i" as string]: i }} />
          ))}
        </div>
      </div>
    ),
  },
];

export function Welcome() {
  const navigate = useNavigate();
  const [i, setI] = useState(0);
  const touchX = useRef<number | null>(null);
  const last = i === SLIDES.length - 1;
  const slide = SLIDES[i];

  const go = (next: number) => setI(Math.min(SLIDES.length - 1, Math.max(0, next)));

  return (
    <div
      className="screen welcome-pro"
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 50) go(i + (dx < 0 ? 1 : -1));
      }}
    >
      <Aura variant="dawn" />
      <header className="screen__header" style={{ justifyContent: "flex-end" }}>
        {!last && (
          <button className="link-btn" onClick={() => navigate("/signup")}>
            Skip
          </button>
        )}
      </header>

      <main className="screen__body welcome__body">
        <div className="welcome__copy" key={`c${i}`} aria-live="polite">
          <h1 className="hl">
            <span className="hl__a enter" style={{ ["--i" as string]: 1 }}>
              {slide.a}
            </span>
            <span className="hl__b enter" style={{ ["--i" as string]: 2 }}>
              {slide.b}
            </span>
          </h1>
        </div>
        <div className="welcome__visual" key={`v${i}`}>
          <div className="enter" style={{ ["--i" as string]: 3 }}>
            {slide.art()}
          </div>
        </div>
      </main>

      <footer className="screen__footer">
        <div className="welcome__dots">
          <PageDots count={SLIDES.length} index={i} />
        </div>
        {last ? (
          <>
            <Button variant="ink" fullWidth onClick={() => navigate("/signup")}>
              Get started
            </Button>
            <button className="link-btn" onClick={() => navigate("/login")}>
              Already have an account? <strong>Log in</strong>
            </button>
          </>
        ) : (
          <Button variant="ink" fullWidth iconRight={<Icon name="arrow-right" size={18} />} onClick={() => go(i + 1)}>
            Next
          </Button>
        )}
      </footer>
    </div>
  );
}
