import { Navigate, useNavigate, useParams } from "react-router-dom";
import { Button } from "../../design-system/Button";
import { Icon } from "../../design-system/Icon";
import { Money } from "../../design-system/Money";
import { categoryName, saleTitle } from "../../records/calc";
import { useBack } from "../../lib/useBack";
import { useToast } from "../../lib/toast";
import { buildCustomers, normName } from "../../records/customers";
import { naira } from "../../records/money";
import { useRecords } from "../../records/store";
import type { RecordKind } from "../../records/types";

const when = (iso: string) => new Date(iso).toLocaleString("en-NG", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

/** One sale or expense: what it was, and the few things you can do with it. */
export function RecordDetail() {
  const { kind, id = "" } = useParams<{ kind: RecordKind; id: string }>();
  const back = useBack("/app/money");
  const { show } = useToast();
  const navigate = useNavigate();
  const { state, markPaid, removeRecord, restoreRecord } = useRecords();

  const sale = kind === "sale" ? state.sales[id] : undefined;
  const expense = kind === "expense" ? state.expenses[id] : undefined;
  const rec = sale ?? expense;
  if (!rec || rec.deletedAt) return <Navigate to="/app/money" replace />;
  const owingKey = sale && !sale.paid && sale.customer ? buildCustomers(state).find((c) => normName(c.name) === normName(sale.customer))?.key : undefined;

  const del = () => {
    removeRecord(kind as RecordKind, id);
    show(sale ? `Deleted the ${naira(sale.amount)} sale.` : "Deleted that expense.", () => restoreRecord(kind as RecordKind, id));
    back();
  };

  return (
    <div className="screen">
      <header className="screen__header">
        <button type="button" className="icon-btn" aria-label="Back" onClick={back}>
          <Icon name="chevron-left" size={20} />
        </button>
      </header>

      <main className="screen__body">
        <div className="chips enter">
          <span className="chip">{sale ? (sale.paid ? "Sale" : "Sale · not paid yet") : "Expense"}</span>
        </div>
        <div className="enter" style={{ marginTop: "var(--space-4)", ["--i" as string]: 1 }}>
          <Money kobo={sale ? rec.amount : -rec.amount} size={48} />
        </div>
        <p className="lede enter" style={{ ["--i" as string]: 2 }}>
          {sale ? saleTitle(sale) : categoryName(expense!.category)}
        </p>

        <div className="list enter" style={{ marginTop: "var(--space-6)", ["--i" as string]: 3 }}>
          <div className="detail-row">
            <span>When</span>
            <span>{when(rec.at)}</span>
          </div>
          {sale?.customer && (
            <div className="detail-row">
              <span>Customer</span>
              <span>{sale.customer}</span>
            </div>
          )}
          {sale && (
            <div className="detail-row">
              <span>Payment</span>
              <span>{sale.paid ? (sale.paidAt && sale.paidAt !== sale.at ? `Paid ${when(sale.paidAt)}` : "Paid") : "Not paid yet"}</span>
            </div>
          )}
          {expense && (
            <div className="detail-row">
              <span>Category</span>
              <span>{categoryName(expense.category)}</span>
            </div>
          )}
          {(sale?.note || expense?.note) && (
            <div className="detail-row">
              <span>Note</span>
              <span>{sale?.note ?? expense?.note}</span>
            </div>
          )}
        </div>

        {sale && sale.items.length > 0 && (
          <>
            <h2 className="section-title">What was sold</h2>
            <div className="list">
              {sale.items.map((it, i) => (
                <div className="detail-row" key={i}>
                  <span>
                    {it.qty} × {it.name}
                  </span>
                  <span>{naira(it.qty * it.unitPrice)}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {sale && (
          <div className="stack" style={{ marginTop: "var(--space-6)", alignItems: "flex-start" }}>
            <Button variant="secondary" size="md" iconRight={<Icon name="receipt" size={18} />} onClick={() => navigate(`/money/message/receipt/${sale.id}`)}>
              Send a receipt
            </Button>
            {!sale.paid && owingKey && (
              <Button variant="secondary" size="md" iconRight={<Icon name="message-circle" size={18} />} onClick={() => navigate(`/money/message/reminder/${owingKey}`)}>
                Remind {sale.customer}
              </Button>
            )}
          </div>
        )}

        <div style={{ marginTop: "var(--space-section-gap)" }}>
          <Button variant="ghost" size="md" onClick={del}>
            Delete this {sale ? "sale" : "expense"}
          </Button>
        </div>
      </main>

      {sale && !sale.paid && (
        <footer className="screen__footer">
          <Button
            fullWidth
            onClick={() => {
              markPaid(sale.id);
              show("Marked as paid.");
              back();
            }}
          >
            Mark as paid
          </Button>
        </footer>
      )}
    </div>
  );
}
