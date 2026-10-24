import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Aura } from "../design-system/Aura";
import { Button } from "../design-system/Button";
import { Icon } from "../design-system/Icon";
import { Illustration, type IllustrationProps } from "../design-system/Illustration";
import { PageDots } from "../design-system/PageDots";

/** One idea per slide: a picture, a bold line, one quiet sentence. */
const SLIDES: { title: string; line: string; art: IllustrationProps }[] = [
  {
    title: "Record a sale in seconds",
    line: "Type the amount, tap done. That's all it takes.",
    art: { name: "welcome-sale", label: "A sale being recorded", icons: ["sale", "check", "customer"], tints: ["mint", "sky", "sand"] },
  },
  {
    title: "Know what you keep, not just what you sold",
    line: "Your week at a glance, with no sums to do.",
    art: { name: "welcome-kept", label: "A week of sales as bars", icons: ["chart", "kept", "target"], tints: ["sky", "mint", "peach"] },
  },
  {
    title: "A guide that cheers you on",
    line: "One small step a day, picked for your business.",
    art: { name: "welcome-guide", label: "A friendly guide with a streak", icons: ["spark", "flame", "flag"], tints: ["lilac", "peach", "mint"] },
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
      className="screen welcome-soft"
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 50) go(i + (dx < 0 ? 1 : -1));
      }}
    >
      <Aura variant="soft" />
      <header className="screen__header" style={{ justifyContent: "flex-end" }}>
        {!last && (
          <button className="link-btn" onClick={() => navigate("/signup")}>
            Skip
          </button>
        )}
      </header>

      <main className="screen__body welcome-soft__body">
        <div className="welcome-soft__stage" key={`v${i}`}>
          <div className="enter">
            <Illustration {...slide.art} />
          </div>
        </div>
        <div className="welcome-soft__copy" key={`c${i}`} aria-live="polite">
          <div className="welcome-soft__dots">
            <PageDots count={SLIDES.length} index={i} />
          </div>
          <h1 className="welcome-soft__title enter" style={{ ["--i" as string]: 1 }}>
            {slide.title}
          </h1>
          <p className="welcome-soft__line enter" style={{ ["--i" as string]: 2 }}>
            {slide.line}
          </p>
        </div>
      </main>

      <footer className="screen__footer">
        {last ? (
          <>
            <Button variant="ink" fullWidth onClick={() => navigate("/signup")}>
              Get started
            </Button>
            <Button variant="outline" fullWidth onClick={() => navigate("/login")}>
              Log in
            </Button>
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
