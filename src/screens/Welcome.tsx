import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../design-system/Button";
import { Icon } from "../design-system/Icon";
import { PageDots } from "../design-system/PageDots";
import { SpalSymbol, type SymbolName } from "../design-system/SpalSymbol";

const SLIDES: { symbol: SymbolName; title: string; body: string }[] = [
  {
    symbol: "focus",
    title: "Your business, one step at a time",
    body: "SPAL shows you what to do next, based on where your business is today.",
  },
  {
    symbol: "insight",
    title: "It learns how you work",
    body: "The more you use it, the better it fits you. No clutter, no features you'll never touch.",
  },
  {
    symbol: "growth",
    title: "Grow with a little encouragement",
    body: "See how far you've come, and get a nudge when it counts.",
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
      className="screen"
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 50) go(i + (dx < 0 ? 1 : -1));
      }}
    >
      <header className="screen__header" style={{ justifyContent: "flex-end" }}>
        {!last && (
          <button className="link-btn" onClick={() => navigate("/signup")}>
            Skip
          </button>
        )}
      </header>

      <main className="screen__body welcome__body">
        <div className="welcome__visual" key={`v${i}`}>
          <div className="enter">
            <SpalSymbol symbol={slide.symbol} size="100%" />
          </div>
        </div>
        <div className="welcome__copy" key={`c${i}`} aria-live="polite">
          <h1 className="title enter" style={{ ["--i" as string]: 1 }}>
            {slide.title}
          </h1>
          <p className="lede enter" style={{ ["--i" as string]: 2 }}>
            {slide.body}
          </p>
        </div>
      </main>

      <footer className="screen__footer">
        <div className="welcome__dots">
          <PageDots count={SLIDES.length} index={i} />
        </div>
        {last ? (
          <>
            <Button fullWidth onClick={() => navigate("/signup")}>
              Get started
            </Button>
            <button className="link-btn" onClick={() => navigate("/login")}>
              Already have an account? <strong>Log in</strong>
            </button>
          </>
        ) : (
          <Button fullWidth iconRight={<Icon name="arrow-right" size={18} />} onClick={() => go(i + 1)}>
            Next
          </Button>
        )}
      </footer>
    </div>
  );
}
