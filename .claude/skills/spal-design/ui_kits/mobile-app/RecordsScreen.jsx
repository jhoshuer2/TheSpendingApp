const { useState: useStateRS } = React;

const DAYS = [
  ["Today", [
    { id: 1, type: "sale", desc: "Suya, drinks", cat: "Food", time: "2:45 PM", amount: 4500 },
    { id: 2, type: "expense", desc: "Fuel", cat: "Transport", time: "1:10 PM", amount: 3000 },
    { id: 3, type: "sale", desc: "Rice & stew", cat: "Lunch", time: "12:30 PM", amount: 8200, owing: true, customer: "Mama Ngozi" },
  ]],
  ["Yesterday", [
    { id: 4, type: "sale", desc: "Drinks", cat: "Drinks", time: "6:20 PM", amount: 2200 },
    { id: 5, type: "expense", desc: "Stock", cat: "Groceries", time: "9:00 AM", amount: 12000 },
  ]],
];
const FILTERS = [["all", "All"], ["sale", "Sales"], ["expense", "Expenses"], ["owing", "Owing"]];

/** Records — filterable, date-grouped ledger with day totals and an owed summary. */
function RecordsScreen({ onNavigate }) {
  const { TopNavPills, PillChip, Money, Icon, SpalSymbol } = window.SpalDesignSystem_6a1cb4;
  const { ScreenHeader, Ledger } = window;
  const [filter, setFilter] = useStateRS("all");
  const match = (r) => filter === "all" || (filter === "owing" ? r.owing : r.type === filter);
  const groups = DAYS.map(([d, rows]) => [d, rows.filter(match)]).filter(([, rows]) => rows.length);
  const net = (rows) => rows.reduce((s, r) => s + (r.type === "sale" ? r.amount : -r.amount), 0);

  return (
    <div style={{ height: "100%", overflowY: "auto", overflowX: "hidden", scrollbarWidth: "none", background: "var(--surface-app)" }}>
      <ScreenHeader />
      <div className="enter" style={{ padding: "20px 20px 0", animationDelay: "30ms" }}><TopNavPills active="records" onChange={onNavigate} /></div>

      <div className="enter" style={{ padding: "20px 20px 0", display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none", animationDelay: "60ms" }}>
        {FILTERS.map(([k, l]) => <PillChip key={k} size="sm" label={l} selected={filter === k} onClick={() => setFilter(k)} />)}
      </div>

      {filter !== "owing" && (
        <div className="enter" style={{ padding: "16px 20px 0", animationDelay: "90ms" }}>
          <button className="press" onClick={() => setFilter("owing")} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: "var(--radius-md)", border: "none", background: "var(--ochre-50)", boxShadow: "0 0 0 1px var(--ochre-100)", cursor: "pointer", textAlign: "left" }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--ochre-600)", flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 13.5, color: "var(--ochre-700)" }}><b style={{ fontWeight: 500 }}>₦8,200 owed</b> · Mama Ngozi hasn't paid yet</span>
            <span style={{ color: "var(--ochre-600)" }}><Icon name="chevron-right" size={16} /></span>
          </button>
        </div>
      )}

      <div style={{ padding: "28px 20px 132px", display: "flex", flexDirection: "column", gap: 28 }}>
        {groups.length === 0 && (
          <div className="enter" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "40px 0", textAlign: "center" }}>
            <SpalSymbol symbol="consistency" size={64} />
            <p style={{ margin: 0, fontSize: 17, fontWeight: 500 }}>Nothing here</p>
            <p style={{ margin: 0, fontSize: 13.5, color: "var(--text-secondary)" }}>Try another filter.</p>
          </div>
        )}
        {groups.map(([day, rows], gi) => (
          <div key={day + filter} className="enter" style={{ animationDelay: `${120 + gi * 30}ms` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10, padding: "0 2px" }}>
              <span style={{ fontSize: 13.5, fontWeight: 500, color: "var(--text-secondary)" }}>{day}</span>
              <span style={{ fontSize: 13, color: "var(--text-tertiary)", display: "inline-flex", gap: 4 }}>Net <Money value={net(rows)} size={13} color="var(--text-secondary)" /></span>
            </div>
            <Ledger rows={rows} />
          </div>
        ))}
      </div>
    </div>
  );
}
window.RecordsScreen = RecordsScreen;
