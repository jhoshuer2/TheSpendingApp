import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Aura } from "../design-system/Aura";
import { Orb } from "../design-system/Orb";
import { useAuth } from "../lib/auth";

const SPLASH_MS = 1200;
/** Fine specks around the mark, like dust in light. Fixed positions so it never reshuffles. */
const DUST: [number, number][] = [[12, 22], [78, 16], [24, 66], [86, 58], [44, 12], [64, 82], [8, 48], [92, 36], [36, 86], [58, 28], [18, 80], [72, 70]];

export function Splash() {
  const navigate = useNavigate();
  const { session, status } = useAuth();
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setShown(true), SPLASH_MS);
    return () => window.clearTimeout(t);
  }, []);

  // Wait for both the minimum splash time and for us to know whether someone is signed in.
  useEffect(() => {
    if (shown && status === "ready") navigate(session ? "/app" : "/welcome", { replace: true });
  }, [shown, status, session, navigate]);

  return (
    <div className="splash splash--pro" role="status" aria-label="SPAL is loading">
      <Aura variant="dawn" />
      <span className="splash__dust" aria-hidden="true">
        {DUST.map(([x, y], i) => (
          <i key={i} style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${300 + i * 45}ms` }} />
        ))}
      </span>
      <div className="splash__mark">
        <span className="splash__orb">
          <span className="splash__glow" aria-hidden="true" />
          <Orb size={104} />
        </span>
        <img className="enter" style={{ ["--i" as string]: 4 }} src="/brand/spal-wordmark.webp" alt="SPAL" width={1110} height={390} />
      </div>
    </div>
  );
}
