import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BarRow, Delta, Donut, HatchDefs, StackBar, type Tone } from "../../design-system/Charts";
import { Button } from "../../design-system/Button";
import { MoneyCountUp } from "../../design-system/CountUp";
import { DayBars } from "../../design-system/DayBars";
import { Icon } from "../../design-system/Icon";
import { Avatar, IconTile, SectionLabel, StatusLine } from "../../design-system/Identity";
import { Money } from "../../design-system/Money";
import { Segmented } from "../../design-system/Segmented";
import { Orb } from "../../design-system/Orb";
import { dailySales, dayLabel, groupByDay, ledger, localDay, owed, periodRanges, salesStand, spendingByCategory, summarize, topSellers, type LedgerEntry, type Period } from "../../records/calc";
import { recordInsights } from "../../records/insights";
import { useToast } from "../../lib/toast";
import { useProfile } from "../../profile/store";
import { useRecords } from "../../records/store";
import { leftLabel, runningLow, stockLines } from "../../records/stock";

const PERIODS: { value: Period; label: string }[] = [
  { value: "day", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
];
const WORDS: Record<Period, string> = { day: "today", week: "this week", month: "this month" };
const PREV: Record<Period, string> = { day: "yesterday", week: "last week", month: "last month" };
const TONES: Tone[] = ["in", "info", "owed", "out", "ink"];
const PAGE = 30;
const FIRST_PAGE = 10; // the rest is one tap away, not a wall

const time = (iso: string) => new Date(iso).toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit" });

function EntryRow({ e }: { e: LedgerEntry }) {
  const tone = e.kind === "expense" ? "out" : e.owing ? "owed" : "in";
  return (
    <Link to={`/money/record/${e.kind}/${e.id}`} className="row">
      <IconTile icon={e.kind === "sale" ? "sale" : "expense"} tint={e.kind === "sale" ? (e.owing ? "sand" : "mint") : "blush"} />
      <span className="row__main">
        <span className="row__title">{e.title}</span>
        <StatusLine tone={e.owing ? "warn" : e.kind === "sale" ? "good" : "neutral"}>{[time(e.at), e.sub].filter(Boolean).join(" · ")}</StatusLine>
      </span>
      <span className="row__amount">
        <Money kobo={e.kind === "expense" ? -e.amount : e.amount} size={16} sign={e.kind === "sale" ? "plus" : "none"} className={`money--${tone}`} />
      </span>
    </Link>
  );
}

/** Where the books live: what you kept, who owes you, what's happened lately. */
export function MoneyHome() {
  const navigate = useNavigate();
  const { state, markPaid, sync } = useRecords();
  const { show } = useToast();
  const { stored } = useProfile();
  const [period, setPeriod] = useState<Period>("week");
  const [limit, setLimit] = useState(FIRST_PAGE);
  const now = new Date();
  const sum = summarize(state, periodRanges(period, now).current);
  const owing = owed(state);
  const entries = ledger(state);
  const groups = groupByDay(entries.slice(0, limit));
  const insight = recordInsights(state, now)[0]; // one thing said well, not three
  const ranges = periodRanges(period, now);
  const prevKept = summarize(state, ranges.previous).kept;
  const pct = prevKept > 0 ? ((sum.kept - prevKept) / prevKept) * 100 : null;
  const stand = salesStand(state, ranges.current);
  const sellers = topSellers(state, ranges.current, 4);
  const spending = spendingByCategory(state, ranges.current);
  const week = dailySales(state, now);
  const empty = entries.length === 0;
  const planning = empty && stored.answers.stage === "idea"; // nothing to sell yet: start with the costs, not a sale
  const low = runningLow(state);
  const trackedCount = stockLines(state).length;
  const hasProducts = Object.values(state.products).some((p) => !p.archived);

  const shortcuts = (
    <nav className="shortcuts enter" style={{ ["--i" as string]: 2, ...(planning ? { gridTemplateColumns: "repeat(3, 1fr)" } : {}) }} aria-label="Shortcuts">
      <Link to="/write" className="shortcut" aria-label="Write for me">
        <span className="tile"><Icon name="pencil" size={20} /></span>
        Write
      </Link>
      {!planning && (
        <Link to="/money/customers" className="shortcut" aria-label="Your customers">
          <span className="tile"><Icon name="users" size={20} /></span>
          Customers
        </Link>
      )}
      <Link to="/money/products" className="shortcut" aria-label={hasProducts ? "Manage your products" : "Add your products"}>
        <span className="tile"><Icon name="tag" size={20} /></span>
        Products
      </Link>
      {hasProducts && !planning ? (
        <Link to="/money/stock" className="shortcut" aria-label="Your stock">
          <span className="tile"><Icon name="package" size={20} /></span>
          {trackedCount ? `Stock (${trackedCount})` : "Stock"}
        </Link>
      ) : (
        <Link to="/money/expense" className="shortcut" aria-label="Add an expense">
          <span className="tile"><Icon name="arrow-up-right" size={20} /></span>
          Expense
        </Link>
      )}
    </nav>
  );

  return (
    <>
      <div className="page-head page-head--row">
        <div>
          <h1 className="title title--page">Money</h1>
          {sync === "offline" && <p>Saved on this phone. It'll sync when you're back online.</p>}
        </div>
        {!empty && (
          <Link to="/assistant" className="orb-link" aria-label="Talk to SPAL Assistant">
            <Orb size={44} />
          </Link>
        )}
      </div>

      {empty ? (
        <>
        <div className="empty enter">
          <Link to="/assistant" className="orb-link orb-link--big" aria-label="Talk to SPAL Assistant">
            <Orb size={88} />
          </Link>
          {planning ? (
            <>
              <h2>Your books start here</h2>
              <p>Write down what it costs to start. Record your first sale when you make it.</p>
              <Button onClick={() => navigate("/money/expense")} iconRight={<Icon name="plus" size={18} />}>
                Add a start-up cost
              </Button>
              <button type="button" className="link-btn" onClick={() => navigate("/money/sale")}>
                Record a sale instead
              </button>
            </>
          ) : (
            <>
              <h2>Record your first sale</h2>
              <p>It takes a few seconds.</p>
              <Button onClick={() => navigate("/money/sale")} iconRight={<Icon name="plus" size={18} />}>
                Record a sale
              </Button>
              <button type="button" className="link-btn" onClick={() => navigate("/money/expense")}>
                Add an expense instead
              </button>
            </>
          )}
        </div>
        {shortcuts}
        </>
      ) : (
        <>
          <HatchDefs />
          {insight && (
            <div className="voice voice--optional enter">
              <b>{insight.title}</b>
              <span>{insight.body}</span>
            </div>
          )}
          <div style={{ marginTop: "var(--space-6)" }}>
            <Segmented label="Time period" value={period} options={PERIODS} onChange={setPeriod} />
          </div>

          <section className="kept enter" data-theme="night" style={{ marginTop: "var(--space-4)" }} aria-label={`What you kept ${WORDS[period]}`}>
            <div className="kept__head">
              <span className="kept__label">{sum.kept >= 0 ? `You kept ${WORDS[period]}` : `You spent more than you received ${WORDS[period]}`}</span>
              {pct !== null && (
                <span className="kept__delta">
                  <Delta pct={pct} />
                  <span>{PREV[period]}</span>
                </span>
              )}
            </div>
            <MoneyCountUp kobo={sum.kept} size={48} />
            <div className="kept__split">
              <div>
                <span>Sold</span>
                <Money kobo={sum.sold} size={18} />
              </div>
              <div>
                <span>Spent</span>
                <Money kobo={sum.spent} size={18} />
              </div>
            </div>
            <DayBars days={week} what="Sold each day this week" />
          </section>

          <div className="actions" style={{ marginTop: "var(--space-4)" }}>
            <Button onClick={() => navigate("/money/sale")} iconRight={<Icon name="plus" size={18} />}>
              Record a sale
            </Button>
            <Button variant="secondary" onClick={() => navigate("/money/expense")}>
              Add an expense
            </Button>
          </div>
          {shortcuts}

          {stand.owed.count > 0 && (
            <>
              <h2 className="section-title">Where your sales stand</h2>
              <div className="card enter">
                <StackBar
                  segments={[
                    { label: "Paid", value: stand.paid.amount, tone: "in", solid: true, detail: stand.paid.count },
                    { label: "Still owed", value: stand.owed.amount, tone: "owed", detail: stand.owed.count },
                  ]}
                />
              </div>
            </>
          )}

          {owing.list.length > 0 && (
            <>
              <SectionLabel count={owing.list.length}>Owed to you</SectionLabel>
              <div className="list">
                {owing.list.map((x) => (
                  <div className="row" key={x.id} style={{ cursor: "default" }}>
                    <Link to={`/money/record/sale/${x.id}`} className="row__link">
                      <Avatar name={x.customer || "?"} />
                      <span className="row__main">
                        <span className="row__title">{x.customer || "Not paid yet"}</span>
                        <StatusLine tone="warn">{localDay(x.at) === localDay(now.toISOString()) ? "Today" : `Since ${new Date(x.at).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}`}</StatusLine>
                      </span>
                      <Money kobo={x.amount} size={16} className="money--owed" />
                    </Link>
                    <Button variant="secondary" size="md" onClick={() => { markPaid(x.id); show("Marked as paid."); }}>
                      Paid
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}

          {low.length > 0 && (
            <>
              <SectionLabel count={low.length}>Running low</SectionLabel>
              <div className="list">
                {low.slice(0, 4).map((l) => (
                  <Link key={l.product.id} to="/money/stock" className="row">
                    <IconTile icon="box" tint="sand" />
                    <span className="row__main">
                      <span className="row__title">{l.product.name}</span>
                      <StatusLine tone="bad">{leftLabel(l.left)}</StatusLine>
                    </span>
                    <span className="row__end">
                      <Icon name="chevron-right" size={18} />
                    </span>
                  </Link>
                ))}
              </div>
            </>
          )}

          {sellers.length >= 2 && (
            <>
              <h2 className="section-title">What sells best</h2>
              <div className="card stack enter" style={{ gap: "var(--space-5)" }}>
                {sellers.map((x, i) => (
                  <BarRow key={x.name} label={x.name} display={x.qty} value={x.qty} max={sellers[0].qty} tone={TONES[i % TONES.length]} delay={i * 80} />
                ))}
              </div>
            </>
          )}

          {spending.length >= 2 && (
            <>
              <h2 className="section-title">Where the money went</h2>
              <div className="card enter">
                <Donut
                  segments={spending.slice(0, 4).map((x, i) => ({ label: x.label.split(" or ")[0], value: x.amount, tone: TONES[i % TONES.length] }))}
                  center={<Money kobo={sum.spent} size={24} />}
                  caption={`spent ${WORDS[period]}`}
                />
              </div>
            </>
          )}

          <h2 className="section-title">Recent</h2>
          {groups.map((g) => (
            <section key={g.key} aria-label={dayLabel(g.key, now)}>
              <p className="group-label">{dayLabel(g.key, now)}</p>
              <div className="list">
                {g.entries.map((e) => (
                  <EntryRow key={`${e.kind}-${e.id}`} e={e} />
                ))}
              </div>
            </section>
          ))}
          {entries.length > limit && (
            <div style={{ marginTop: "var(--space-4)" }}>
              <Button variant="secondary" size="md" onClick={() => setLimit(limit + PAGE)}>
                Show earlier
              </Button>
            </div>
          )}
        </>
      )}
    </>
  );
}


