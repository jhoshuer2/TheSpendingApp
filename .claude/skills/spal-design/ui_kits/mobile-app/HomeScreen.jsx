const RECENT = [
  { id: 1, type: "sale", desc: "Suya, drinks", cat: "Food", time: "2:45 PM", amount: 4500 },
  { id: 2, type: "expense", desc: "Fuel", cat: "Transport", time: "1:10 PM", amount: 3000 },
  { id: 3, type: "sale", desc: "Rice & stew", cat: "Lunch", time: "12:30 PM", amount: 8200 },
];

/** Home — profit hero on the night horizon, sale/expense split, owed row, recent activity. */
function HomeScreen({ onNavigate, onOpenSheet }) {
  const { TopNavPills, Money, Icon, Aura } = window.SpalDesignSystem_6a1cb4;
  const { ScreenHeader, SectionTitle, Ledger, useCountUp } = window;
  const profit = useCountUp(48200);

  return (
    <div style={{ height: "100%", overflowY: "auto", overflowX: "hidden", scrollbarWidth: "none", background: "var(--surface-app)" }}>
      <ScreenHeader />
      <div className="enter" style={{ padding: "20px 20px 0", animationDelay: "30ms" }}><TopNavPills active="home" onChange={onNavigate} /></div>

      <div className="enter" style={{ padding: "24px 20px 0", animationDelay: "60ms" }}>
        <div data-theme="night" style={{ position: "relative", overflow: "hidden", borderRadius: "var(--radius-lg)", background: "#0B100E", boxShadow: "var(--highlight-top-dark)", padding: "20px 20px 0", color: "var(--text-primary)" }}>
          <Aura variant="night" />
          <div style={{ position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13.5, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>Profit today</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12.5, fontWeight: 500, color: "var(--money-in)", whiteSpace: "nowrap" }}><Icon name="trending-up" size={15} />18% vs last Tue</span>
          </div>
          <div style={{ marginTop: 18 }}><Money value={profit} size={48} /></div>
          <div style={{ marginTop: 28, height: 1, background: "var(--horizon-line)" }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1px 1fr" }}>
            {[["sale", "Sales", 62000], null, ["expense", "Expenses", 13800]].map((c, i) => c ? (
              <button key={c[0]} className="press" onClick={() => onOpenSheet(c[0])} style={{ textAlign: "left", background: "none", border: "none", cursor: "pointer", padding: i === 0 ? "16px 12px 18px 0" : "16px 0 18px 16px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", color: "var(--text-primary)" }}>
                <span>
                  <span style={{ display: "block", fontSize: 13, color: "var(--text-secondary)", marginBottom: 6 }}>{c[1]}</span>
                  <Money value={c[2]} size={20} />
                </span>
                <span style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.09)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)" }}><Icon name="plus" size={16} /></span>
              </button>
            ) : <span key="d" style={{ background: "var(--line)", margin: "14px 0" }} />)}
          </div>
          </div>
        </div>
      </div>

      <div className="enter" style={{ padding: "12px 20px 0", animationDelay: "90ms" }}>
        <button className="press" onClick={() => onNavigate("records")} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, height: 64, padding: "0 14px 0 12px", borderRadius: "var(--radius-md)", border: "none", background: "var(--surface-card)", boxShadow: "var(--shadow-1), var(--highlight-top)", cursor: "pointer", textAlign: "left" }}>
          <span style={{ width: 40, height: 40, borderRadius: 10, background: "var(--ochre-50)", color: "var(--ochre-600)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="wallet" size={18} /></span>
          <span style={{ flex: 1 }}>
            <span style={{ display: "block", fontSize: 15, fontWeight: 500, color: "var(--text-primary)" }}>Owed to you</span>
            <span style={{ display: "block", fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>2 customers haven't paid</span>
          </span>
          <Money value={6500} direction="owed" size={15} />
          <span style={{ color: "var(--text-tertiary)" }}><Icon name="chevron-right" size={18} /></span>
        </button>
      </div>

      <div className="enter" style={{ padding: "36px 20px 132px", animationDelay: "120ms" }}>
        <SectionTitle action="View all" onAction={() => onNavigate("records")}>Recent activity</SectionTitle>
        <Ledger rows={RECENT} />
      </div>
    </div>
  );
}
window.HomeScreen = HomeScreen;
