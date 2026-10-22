import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../design-system/Button";
import { Field } from "../../design-system/Field";
import { HatchBar } from "../../design-system/Charts";
import { Icon } from "../../design-system/Icon";
import { Avatar, StatusLine } from "../../design-system/Identity";
import { Money } from "../../design-system/Money";
import { SpalSymbol } from "../../design-system/SpalSymbol";
import { useBack } from "../../lib/useBack";
import { calendarDaysAgo } from "../../records/calc";
import { buildCustomers, normName, sortCustomers, type CustomerEntry } from "../../records/customers";
import { useRecords } from "../../records/store";

const ago = (iso: string | undefined, now: Date): string => {
  if (!iso) return "No sales yet";
  const days = calendarDaysAgo(iso, now);
  if (days <= 0) return "Bought today";
  if (days === 1) return "Bought yesterday";
  if (days < 14) return `Bought ${days} days ago`;
  return `Last bought ${new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}`;
};

function Row({ c, now, owing, biggest }: { c: CustomerEntry; now: Date; owing?: boolean; biggest?: number }) {
  return (
    <Link to={`/money/customer/${c.key}`} className="row">
      <Avatar name={c.name} />
      <span className="row__main">
        <span className="row__title">{c.name}</span>
        <StatusLine tone={owing ? "warn" : c.lastAt ? "good" : "neutral"}>
          {owing ? `Owes since ${new Date(c.owedSales[0].at).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}` : ago(c.lastAt, now)}
        </StatusLine>
        {owing && biggest ? <HatchBar value={c.owed} max={biggest} tone="owed" height={6} label={`Owes ${Math.round((c.owed / biggest) * 100)}% of the largest debt`} /> : null}
      </span>
      {owing ? <span className="row__amount row__amount--fixed"><Money kobo={c.owed} size={16} className="money--owed" /></span> : <span className="row__end"><Icon name="chevron-right" size={18} /></span>}
    </Link>
  );
}

/** Everyone you sell to. People show up here as soon as you put their name on a sale. */
export function Customers() {
  const navigate = useNavigate();
  const back = useBack("/app/money");
  const { state } = useRecords();
  const [q, setQ] = useState("");
  const now = new Date();
  const all = useMemo(() => buildCustomers(state), [state]);
  const query = normName(q);
  const shown = query ? all.filter((c) => normName(c.name).includes(query) || (c.phone ?? "").replace(/\D/g, "").includes(query.replace(/\D/g, "") || "no match")) : all;
  const { owing, everyone } = sortCustomers(shown);
  const rest = everyone.filter((c) => c.owed <= 0); // each person appears once: those who owe are listed above
  const totalOwed = all.reduce((n, c) => n + c.owed, 0);

  return (
    <div className="screen">
      <header className="screen__header">
        <button type="button" className="icon-btn" aria-label="Back" onClick={back}>
          <Icon name="chevron-left" size={20} />
        </button>
      </header>

      <main className="screen__body">
        <h1 className="title title--page enter">Your customers</h1>
        <p className="lede enter" style={{ ["--i" as string]: 1 }}>
          {all.length === 0 ? "The people you sell to, in one place." : totalOwed > 0 ? "Who you sell to, and who still owes you." : "Who you sell to."}
        </p>

        {all.length === 0 ? (
          <div className="empty enter">
            <SpalSymbol symbol="growth" size={72} />
            <h2>No customers yet</h2>
            <p>Add a name when you record a sale and they'll show up here. Or add someone now.</p>
          </div>
        ) : (
          <>
            {all.length > 8 && (
              <div style={{ marginTop: "var(--space-5)" }}>
                <Field label="Search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="A name or phone number" autoComplete="off" />
              </div>
            )}
            {shown.length === 0 && <p className="lede">Nobody matches "{q.trim()}".</p>}
            {owing.length > 0 && (
              <>
                <h2 className="section-title">Owe you</h2>
                <div className="list">
                  {owing.map((c) => (
                    <Row key={c.key} c={c} now={now} owing biggest={owing[0].owed} />
                  ))}
                </div>
              </>
            )}
            {rest.length > 0 && (
              <>
                <h2 className="section-title">{owing.length > 0 ? "Everyone else" : "Everyone"}</h2>
                <div className="list">
                  {rest.map((c) => (
                    <Row key={c.key} c={c} now={now} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </main>

      <footer className="screen__footer">
        <Button fullWidth onClick={() => navigate("/money/customer/new/edit")} iconRight={<Icon name="plus" size={18} />}>
          Add a customer
        </Button>
      </footer>
    </div>
  );
}
