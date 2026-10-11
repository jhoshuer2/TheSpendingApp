const { useState: useStateApp } = React;

/** Composes the click-through: onboarding → home ⇄ records, Add sheet, quick menu, Ask SPAL orb, paper/night theme. */
function AppShell() {
  const { QuickMenuFab, SparkAvatar } = window.SpalDesignSystem_6a1cb4;
  const [screen, setScreen] = useStateApp("welcome");
  const [sheet, setSheet] = useStateApp(null);
  const [theme, setTheme] = useStateApp(() => localStorage.getItem("spal-kit-theme") || "paper");
  const Welcome = window.WelcomeScreen, Home = window.HomeScreen, Records = window.RecordsScreen, Sheet = window.AddRecordSheet;
  const pickTheme = (t) => { setTheme(t); localStorage.setItem("spal-kit-theme", t); };

  return (
    <div style={{ minHeight: "100vh", background: "var(--surface-canvas-dark)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, position: "relative" }}>
      <div style={{ position: "absolute", top: 16, right: 16, display: "flex", gap: 2, padding: 3, borderRadius: 999, background: "rgba(255,255,255,0.06)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)" }}>
        {[["paper", "Paper"], ["night", "Night"]].map(([k, l]) => (
          <button key={k} onClick={() => pickTheme(k)} style={{ height: 30, padding: "0 14px", borderRadius: 999, border: "none", cursor: "pointer", fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 500, background: theme === k ? "rgba(255,255,255,0.12)" : "transparent", color: theme === k ? "#EEF1ED" : "rgba(238,241,237,0.5)" }}>{l}</button>
        ))}
      </div>
      <div data-theme={theme === "night" ? "night" : undefined} style={{ position: "relative", width: 390, height: 800, maxHeight: "94vh", borderRadius: 44, overflow: "hidden", boxShadow: "var(--shadow-shell)", background: "var(--surface-app)" }}>
        {screen === "welcome" && <Welcome onGetStarted={() => setScreen("home")} onLogin={() => setScreen("home")} />}
        {screen === "home" && <Home key="home" onNavigate={setScreen} onOpenSheet={setSheet} />}
        {screen === "records" && <Records key="records" onNavigate={setScreen} onOpenSheet={setSheet} />}
        {screen !== "welcome" && (
          <>
            <div aria-hidden="true" style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 112, zIndex: 39, pointerEvents: "none", background: "linear-gradient(180deg, color-mix(in srgb, var(--surface-app) 0%, transparent) 0%, var(--surface-app) 70%)" }} />
            <div style={{ position: "absolute", left: 16, bottom: 24, zIndex: 40 }}><SparkAvatar size={52} /></div>
            <QuickMenuFab onSelect={(k) => { if (k === "sale" || k === "expense") setSheet(k); }} />
          </>
        )}
        <Sheet type={sheet} open={!!sheet} onClose={() => setSheet(null)} />
      </div>
    </div>
  );
}
ReactDOM.createRoot(document.getElementById("root")).render(<AppShell />);
