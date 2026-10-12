import { Link, useNavigate } from "react-router-dom";
import { useBack } from "../../lib/useBack";
import { Button } from "../../design-system/Button";
import { Icon } from "../../design-system/Icon";
import { Money } from "../../design-system/Money";
import { SpalSymbol } from "../../design-system/SpalSymbol";
import { naira } from "../../records/money";
import { useRecords } from "../../records/store";

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
                <span className="row__main">
                  <span className="row__title">{p.name}</span>
                  <span className="row__sub">{p.cost !== undefined ? (p.price > p.cost ? `Costs ${naira(p.cost)} · you keep ${naira(p.price - p.cost)}` : `Costs ${naira(p.cost)}. Check the price`) : "Add what it costs you"}</span>
                </span>
                <Money kobo={p.price} size={16} />
                <span className="row__end">
                  <Icon name="chevron-right" size={18} />
                </span>
              </Link>
            ))}
          </div>
        )}

        {products.length > 0 && (
          <div style={{ marginTop: "var(--space-5)" }}>
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
