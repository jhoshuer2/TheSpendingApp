import { Link, useNavigate } from "react-router-dom";
import { useBack } from "../../lib/useBack";
import { Button } from "../../design-system/Button";
import { HatchBar } from "../../design-system/Charts";
import { Icon } from "../../design-system/Icon";
import { ProductThumb, Avatar, StatusLine } from "../../design-system/Identity";
import { Money } from "../../design-system/Money";
import { SpalSymbol } from "../../design-system/SpalSymbol";
import { naira } from "../../records/money";
import { productPhoto } from "../../records/productImages";
import { useRecords } from "../../records/store";
import { leftLabel, stockLeft, stockStatus } from "../../records/stock";

/** What you sell, with prices, and what each one costs you. Add them once, then record sales in a tap. */
export function Products() {
  const navigate = useNavigate();
  const back = useBack("/app/money");
  const { products, state, archiveProduct } = useRecords();
  const removed = Object.values(state.products).filter((p) => p.archived).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="screen">
      <header className="screen__header">
        <button type="button" className="icon-btn" aria-label="Back" onClick={back}>
          <Icon name="chevron-left" size={20} />
        </button>
      </header>

      <main className="screen__body">
        <h1 className="title title--page enter">Your products</h1>
        <p className="lede enter" style={{ ["--i" as string]: 1 }}>
          Add what you sell, with its price. Add what it costs you too, and SPAL can show how much you keep on each one.
        </p>

        {products.length === 0 ? (
          <div className="empty enter">
            <SpalSymbol symbol="growth" size={72} />
            <h2>No products yet</h2>
            <p>Add your first one. It takes a minute.</p>
          </div>
        ) : (
          <div className="list enter" style={{ marginTop: "var(--space-6)" }}>
            {products.map((p) => (
              <Link key={p.id} to={`/money/product/${p.id}`} className="row">
                <ProductThumb name={p.name} photo={productPhoto(p.name)} />
                <span className="row__main">
                  <span className="row__title">{p.name}</span>
                  {(() => {
                    const left = stockLeft(state, p);
                    const status = stockStatus(left, p.lowAt);
                    return left !== null ? <StatusLine tone={status === "ok" ? "good" : status === "low" ? "warn" : "bad"}>{status === "low" ? `Running low: ${leftLabel(left)}` : leftLabel(left)}</StatusLine> : null;
                  })()}
                  <span className="row__sub">{p.cost !== undefined ? (p.price > p.cost ? `Costs ${naira(p.cost)} · you keep ${naira(p.price - p.cost)}` : `Costs ${naira(p.cost)}. Check the price`) : "Add what it costs you"}</span>
                  {p.cost !== undefined && p.price > p.cost && <HatchBar value={p.price - p.cost} max={p.price} height={6} label={`You keep ${Math.round(((p.price - p.cost) / p.price) * 100)}% of the price`} />}
                </span>
                <span className="row__amount row__amount--fixed"><Money kobo={p.price} size={16} /></span>
                <span className="row__end">
                  <Icon name="chevron-right" size={18} />
                </span>
              </Link>
            ))}
          </div>
        )}

        {products.length > 0 && (
          <div className="inline-row" style={{ marginTop: "var(--space-5)", flexWrap: "wrap" }}>
            <Button variant="secondary" size="md" onClick={() => navigate("/money/stock")}>
              Count your stock
            </Button>
            <Button variant="secondary" size="md" iconRight={<Icon name="share" size={18} />} onClick={() => navigate("/write/prices")}>
              Share your price list
            </Button>
          </div>
        )}

        {removed.length > 0 && (
          <>
            <h2 className="section-title">Removed</h2>
            <div className="list">
              {removed.map((p) => (
                <div className="row row--static" key={p.id}>
                  <Avatar name={p.name} />
                  <span className="row__main">
                    <span className="row__title">{p.name}</span>
                    <span className="row__sub">Past sales keep their record</span>
                  </span>
                  <Button variant="secondary" size="md" onClick={() => archiveProduct(p.id, false)}>
                    Bring back
                  </Button>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      <footer className="screen__footer">
        <Button fullWidth iconRight={<Icon name="plus" size={18} />} onClick={() => navigate("/money/product/new")}>
          Add a product
        </Button>
      </footer>
    </div>
  );
}
