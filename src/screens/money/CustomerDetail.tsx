import { useMemo } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { Button } from "../../design-system/Button";
import { Icon } from "../../design-system/Icon";
import { Money } from "../../design-system/Money";
import { greetingName } from "../../messages/templates";
import { saleTitle } from "../../records/calc";
import { buildCustomers, telLink, whatsappNumber } from "../../records/customers";
import { naira } from "../../records/money";
import { useRecords } from "../../records/store";
import { useBack } from "../../lib/useBack";

const when = (iso: string) => new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });

/** One customer: what they owe, how to reach them, and everything they bought. */
export function CustomerDetail() {
  const { key = "" } = useParams();
  const navigate = useNavigate();
  const back = useBack("/money/customers");
  const { state } = useRecords();
  const c = useMemo(() => buildCustomers(state).find((x) => x.key === key), [state, key]);
  if (!c) return <Navigate to="/money/customers" replace />;
  const tel = telLink(c.phone);
  const wa = whatsappNumber(c.phone);

  return (
    <div className="screen">
      <header className="screen__header">
        <button type="button" className="icon-btn" aria-label="Back" onClick={back}>
          <Icon name="chevron-left" size={20} />
        </button>
        <Link to={`/money/customer/${c.key}/edit`} className="icon-btn" aria-label="Edit details">
          <Icon name="pencil" size={20} />
        </Link>
      </header>

      <main className="screen__body">
        <h1 className="title title--page enter">{c.name}</h1>
        {c.note && <p className="lede enter" style={{ ["--i" as string]: 1 }}>{c.note}</p>}

        {c.owed > 0 && (
          <section className="card enter" style={{ marginTop: "var(--space-5)", ["--i" as string]: 2 }} aria-label="What they owe">
            <span className="kept__label">Owes you</span>
            <div style={{ marginTop: "var(--space-1)" }}>
              <Money kobo={c.owed} size={40} className="money--owed" />
            </div>
            <p className="row__sub" style={{ marginTop: "var(--space-1)" }}>
              {c.owedSales.length === 1 ? `Since ${when(c.owedSales[0].at)}` : `${c.owedSales.length} sales, the oldest from ${when(c.owedSales[0].at)}`}
            </p>
            <div style={{ marginTop: "var(--space-4)" }}>
              <Button fullWidth onClick={() => navigate(`/money/message/reminder/${c.key}`)} iconRight={<Icon name="message-circle" size={18} />}>
                Remind {greetingName(c.name)}
              </Button>
            </div>
          </section>
        )}

        <div className="actions" style={{ marginTop: "var(--space-5)" }}>
          {tel && wa ? (
            <>
              <a className="btn btn--secondary btn--md" href={tel}>
                Call
              </a>
              <a className="btn btn--secondary btn--md" href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer">
                WhatsApp
              </a>
            </>
          ) : (
            <Link className="btn btn--secondary btn--md" to={`/money/customer/${c.key}/edit`} style={{ gridColumn: "1 / -1" }}>
              {c.phone ? "Fix phone number" : "Add phone number"}
            </Link>
          )}
        </div>

        <div className="list enter" style={{ marginTop: "var(--space-6)", ["--i" as string]: 3 }}>
          <div className="detail-row"><span>Bought in total</span><span>{naira(c.total)}</span></div>
          <div className="detail-row"><span>Sales</span><span>{c.sales.length}</span></div>
          {c.lastAt && <div className="detail-row"><span>Last bought</span><span>{when(c.lastAt)}</span></div>}
          {c.phone && <div className="detail-row"><span>Phone</span><span>{c.phone}</span></div>}
        </div>

        {c.sales.length > 0 ? (
          <>
            <h2 className="section-title">Sales</h2>
            <div className="list">
              {c.sales.slice(0, 30).map((s) => (
                <Link key={s.id} to={`/money/record/sale/${s.id}`} className="row">
                  <span className="row__main">
                    <span className="row__title">{saleTitle(s)}</span>
                    <span className="row__sub">{when(s.at)}{s.paid ? "" : " · not paid yet"}</span>
                  </span>
                  <Money kobo={s.amount} size={16} className={s.paid ? "money--in" : "money--owed"} sign={s.paid ? "plus" : "none"} />
                </Link>
              ))}
            </div>
            {c.sales.length > 30 && <p className="caption" style={{ textAlign: "left" }}>Showing the latest 30 of {c.sales.length} sales.</p>}
          </>
        ) : (
          <p className="lede" style={{ marginTop: "var(--space-6)" }}>No sales yet. When you record one, add their name to see it here.</p>
        )}
      </main>
    </div>
  );
}
