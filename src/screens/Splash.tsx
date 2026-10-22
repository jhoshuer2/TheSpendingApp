import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Aura } from "../design-system/Aura";
import { Orb } from "../design-system/Orb";
import { useAuth } from "../lib/auth";

const SPLASH_MS = 1200;

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
    <div className="splash" data-theme="night" role="status" aria-label="SPAL is loading">
      <Aura variant="night" />
      <div className="splash__mark">
        <img className="enter" src="/brand/spal-wordmark.webp" alt="SPAL" width={1110} height={390} />
        <span className="enter" style={{ ["--i" as string]: 3 }}>
          <Orb size={56} />
        </span>
      </div>
    </div>
  );
}
