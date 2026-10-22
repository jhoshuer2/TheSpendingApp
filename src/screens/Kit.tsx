import { useState } from "react";
import { BarRow, Delta, Donut, HatchBar, HatchDefs, Spark, StackBar, StatCard } from "../design-system/Charts";
import { Button } from "../design-system/Button";
import { Icon, type IconName } from "../design-system/Icon";
import { Avatar, IconTile, Pill, ProductCard, SectionLabel, StatusLine, type Tint } from "../design-system/Identity";
import { MoneyCountUp } from "../design-system/CountUp";
import { Money } from "../design-system/Money";
import { Segmented } from "../design-system/Segmented";

const SPARK = [4, 6, 5, 8, 7, 9, 12, 11, 15];
const ICONS: IconName[] = ["home-smile", "sale", "expense", "owed", "kept", "customer", "box", "chart", "bell", "spark", "flag", "target"];
const TINTS: Tint[] = ["mint", "sky", "sand", "blush", "lilac", "peach"];
const CUSTOMERS = [
  { name: "Mrs Adebayo", note: "Catering", owes: 1_850_000, tone: "warn" as const, status: "Owes", pct: 80 },
  { name: "Chinedu Okonkwo", note: "Bought today", owes: 0, tone: "good" as const, status: "Paid", pct: 100 },
  { name: "Tolu Bakare", note: "3 sales this week", owes: 450_000, tone: "warn" as const, status: "Owes", pct: 35 },
  { name: "Mama Tosin", note: "Last bought 12 Oct", owes: 0, tone: "neutral" as const, status: "Quiet", pct: 18 },
];

/** The new building blocks on one page, in light and dark, so the look can be judged before it goes on every screen. */
export function Kit() {
  const [theme, setTheme] = useState<"light" | "night">("light");
  const [range, setRange] = useState("1W");
  return (
    <div className="screen" data-theme={theme === "night" ? "night" : undefined} style={{ background: "var(--surface-app)", color: "var(--text-primary)" }}>
      <HatchDefs />
      <main className="screen__body kit">
        <div className="page-head page-head--row">
          <div>
            <h1 className="title title--page">UI kit</h1>
            <p>Charts, identity and status. Not part of the app.</p>
          </div>
        </div>
        <Segmented label="Theme" value={theme} options={[{ value: "light", label: "Light" }, { value: "night", label: "Dark" }]} onChange={setTheme} />

        <h2 className="kit__h">Numbers that say it</h2>
        <StatCard label="Kept this week" delta={<Delta pct={18.4} />} chart={<Spark values={SPARK} />} footer="₦64,300 sold, ₦32,200 spent">
          <MoneyCountUp kobo={1_360_000} size={44} />
        </StatCard>
        <div style={{ marginTop: "var(--space-3)" }}>
          <Segmented label="Range" value={range} options={["1D", "1W", "1M", "3M"].map((v) => ({ value: v, label: v }))} onChange={setRange} />
        </div>

        <h2 className="kit__h">Where your sales stand</h2>
        <div className="card">
          <StackBar
            segments={[
              { label: "Paid", value: 71, tone: "in", solid: true, detail: "1,312" },
              { label: "Waiting to pay", value: 17, tone: "owed", detail: "314" },
              { label: "Overdue", value: 12, tone: "out", detail: "220" },
            ]}
          />
        </div>

        <h2 className="kit__h">What sells best</h2>
        <div className="card stack" style={{ gap: "var(--space-5)" }}>
          <BarRow label="Jollof rice (plate)" display="48" value={48} max={48} tone="in" />
          <BarRow label="Zobo (bottle)" display="31" value={31} max={48} tone="info" delay={80} />
          <BarRow label="Fried rice (plate)" display="19" value={19} max={48} tone="owed" delay={160} />
          <BarRow label="Chicken piece" display="6" value={6} max={48} tone="out" delay={240} />
        </div>

        <h2 className="kit__h">Where the money went</h2>
        <div className="card">
          <Donut
            segments={[
              { label: "Stock", value: 47, tone: "in" },
              { label: "Staff", value: 33, tone: "info" },
              { label: "Transport", value: 20, tone: "owed" },
            ]}
            center={<Money kobo={3_220_000} size={26} />}
            caption="spent this week"
          />
        </div>

        <SectionLabel count={4}>Customers</SectionLabel>
        <div className="list">
          {CUSTOMERS.map((c) => (
            <div className="kitrow" key={c.name}>
              <Avatar name={c.name} />
              <span className="kitrow__main">
                <span className="kitrow__title">{c.name}</span>
                <StatusLine tone={c.tone}>{c.note}</StatusLine>
              </span>
              <span className="kitrow__end">
                {c.owes > 0 ? <Money kobo={c.owes} size={16} className="money--owed" /> : <Pill tone={c.tone}>{c.status}</Pill>}
                <HatchBar value={c.pct} tone={c.tone === "warn" ? "owed" : c.tone === "good" ? "in" : "ink"} />
              </span>
            </div>
          ))}
        </div>

        <SectionLabel count={3}>Open items</SectionLabel>
        <div className="list">
          {[
            { icon: "owed" as IconName, tint: "sand" as Tint, title: "Remind Mrs Adebayo", line: <StatusLine tone="warn">Owes 18 days</StatusLine> },
            { icon: "box" as IconName, tint: "sky" as Tint, title: "Count your stock", line: <StatusLine tone="info">Last counted 20 days ago</StatusLine> },
            { icon: "spark" as IconName, tint: "lilac" as Tint, title: "Write your price list", line: <StatusLine tone="good">Drafted by SPAL</StatusLine> },
          ].map((r) => (
            <div className="kitrow" key={r.title}>
              <IconTile icon={r.icon} tint={r.tint} />
              <span className="kitrow__main">
                <span className="kitrow__title">{r.title}</span>
                {r.line}
              </span>
              <Icon name="chevron-right" size={18} />
            </div>
          ))}
        </div>

        <h2 className="kit__h">Status</h2>
        <div className="chips">
          <Pill tone="good">Paid</Pill>
          <Pill tone="warn">Owes</Pill>
          <Pill tone="bad">Overdue</Pill>
          <Pill tone="info">Drafted</Pill>
          <Pill tone="neutral">Quiet</Pill>
        </div>
        <div className="stack" style={{ marginTop: "var(--space-4)" }}>
          <StatusLine tone="good">Complete</StatusLine>
          <StatusLine tone="warn">Review needed</StatusLine>
          <StatusLine tone="neutral">Pending · 2 left</StatusLine>
        </div>

        <h2 className="kit__h">Identity</h2>
        <div className="chips" style={{ gap: "var(--space-3)" }}>
          {["Ada", "Bayo", "Chioma", "Dayo", "Efe", "Funmi"].map((n) => (
            <Avatar key={n} name={n} size={48} />
          ))}
        </div>
        <div className="chips" style={{ gap: "var(--space-3)", marginTop: "var(--space-4)" }}>
          {TINTS.map((t, i) => (
            <IconTile key={t} icon={ICONS[i]} tint={t} size={48} />
          ))}
        </div>

        <h2 className="kit__h">Products</h2>
        <div className="kit__grid2">
          <ProductCard name="Jollof rice" price="₦2,500" tint="mint" action={<button type="button" className="rbtn rbtn--ink" aria-label="Sell Jollof rice"><Icon name="plus" size={18} /></button>} />
          <ProductCard name="Zobo" price="₦600" tint="blush" action={<button type="button" className="rbtn rbtn--ink" aria-label="Sell Zobo"><Icon name="plus" size={18} /></button>} />
        </div>

        <h2 className="kit__h">Our icons</h2>
        <div className="kit__icons">
          {ICONS.map((n) => (
            <div className="kit__icon" key={n}>
              <Icon name={n} size={26} />
              {n}
            </div>
          ))}
        </div>

        <h2 className="kit__h">Buttons and chips</h2>
        <div className="stack">
          <Button variant="ink" fullWidth>Record a sale</Button>
          <Button variant="outline" fullWidth>Add an expense</Button>
          <div className="chips">
            <span className="chip">All 7</span>
            <span className="chip">Customers</span>
            <span className="chip">Owing 3</span>
            <button type="button" className="rbtn" aria-label="Notifications"><Icon name="bell" size={20} /></button>
          </div>
        </div>
      </main>
    </div>
  );
}
