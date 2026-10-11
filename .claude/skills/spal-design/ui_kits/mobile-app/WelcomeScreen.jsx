const { useEffect: useEffectWS, useState: useStateWS } = React;

/** Onboarding — splash wordmark on the night horizon, then the welcome: one symbol, one promise, one action. */
function WelcomeScreen({ onGetStarted, onLogin }) {
  const { SpalSymbol, Button, Aura } = window.SpalDesignSystem_6a1cb4;
  const [splash, setSplash] = useStateWS(true);
  useEffectWS(() => { const t = setTimeout(() => setSplash(false), 1300); return () => clearTimeout(t); }, []);
  const mark = (window.__resources && window.__resources.wordmark) || "../../assets/logo/spal-wordmark.webp";

  return (
    <div data-theme="night" style={{ height: "100%", position: "relative", overflow: "hidden", background: "#0B100E", color: "var(--text-primary)" }}>
      <Aura variant="night" intensity={splash ? 0.6 : 1} />
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: splash ? 1 : 0, transition: "opacity 560ms var(--ease-out)", pointerEvents: "none" }}>
        <img src={mark} alt="SPAL" style={{ width: 132, filter: "brightness(0) invert(1)", opacity: 0.94 }} />
      </div>

      {!splash && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", padding: "0 24px" }}>
          <div className="enter" style={{ paddingTop: 64, display: "flex", justifyContent: "center" }}>
            <img src={mark} alt="SPAL" style={{ width: 72, filter: "brightness(0) invert(1)", opacity: 0.9 }} />
          </div>

          <div className="enter" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", animationDelay: "60ms" }}>
            <div style={{ position: "relative", width: 220, height: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <SpalSymbol symbol="profit" size={200} color="#EEF1ED" accent="#6CC796" />
            </div>
          </div>

          <div style={{ paddingBottom: 40 }}>
            <h1 className="enter" style={{ margin: 0, textAlign: "center", fontSize: 34, fontWeight: 500, letterSpacing: "-0.028em", lineHeight: 1.08, animationDelay: "120ms" }}>
              Your business finance made easy
            </h1>
            <p className="enter" style={{ margin: "14px auto 32px", maxWidth: 300, textAlign: "center", color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.5, animationDelay: "150ms" }}>
              Track your sales, know your profit and grow. No accounting knowledge needed.
            </p>
            <div className="enter" style={{ animationDelay: "180ms" }}>
              <Button size="lg" fullWidth onClick={onGetStarted}>Get started</Button>
              <button onClick={onLogin} style={{ width: "100%", marginTop: 14, height: 44, background: "none", border: "none", fontSize: 14, color: "var(--text-secondary)", cursor: "pointer", fontFamily: "var(--font-display)" }}>
                Already have an account? <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>Log in</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
window.WelcomeScreen = WelcomeScreen;
