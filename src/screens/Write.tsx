import { Link } from "react-router-dom";
import { Icon, type IconName } from "../design-system/Icon";
import { FACT_KEYS, factsOf } from "../messages/facts";
import { useBack } from "../lib/useBack";
import { useProfile } from "../profile/store";
import { useRecords } from "../records/store";

function Row({ to, icon, title, sub }: { to: string; icon: IconName; title: string; sub: string }) {
  return (
    <Link to={to} className="row">
      <span className="tile">
        <Icon name={icon} size={20} />
      </span>
      <span className="row__main">
        <span className="row__title">{title}</span>
        <span className="row__sub">{sub}</span>
      </span>
      <span className="row__end">
        <Icon name="chevron-right" size={18} />
      </span>
    </Link>
  );
}

/** Things SPAL writes for you. You read them, change the words, and send or post them yourself. */
export function Write() {
  const back = useBack("/app/money");
  const { stored } = useProfile();
  const { products } = useRecords();
  const known = FACT_KEYS.filter((k) => factsOf(stored.answers)[k]).length;
  const say = (t: string) => `/assistant?say=${encodeURIComponent(t)}`;

  return (
    <div className="screen">
      <header className="screen__header">
        <button type="button" className="icon-btn" aria-label="Back" onClick={back}>
          <Icon name="chevron-left" size={20} />
        </button>
      </header>
      <main className="screen__body">
        <h1 className="title title--page enter">Write for me</h1>
        <p className="lede enter" style={{ ["--i" as string]: 1 }}>
          Ready to use, in your own words. Change anything, then send or post it yourself.
        </p>

        <Link to="/business" className="card enter" style={{ display: "block", marginTop: "var(--space-5)", ["--i" as string]: 2 }}>
          <b>{known >= 3 ? "Your business details" : "Tell SPAL about your business"}</b>
          <span className="row__sub" style={{ display: "block", marginTop: 2 }}>
            {known >= 3 ? "Used in everything below. Tap to change." : "What you sell, where you are, your hours. SPAL writes better when it knows."}
          </span>
        </Link>

        <h2 className="section-title">For WhatsApp</h2>
        <div className="list">
          <Row to="/write/prices" icon="tag" title="Price list" sub={products.length ? `Your ${products.length} ${products.length === 1 ? "product" : "products"} and prices, ready to share` : "Add your products first, then share the list"} />
          <Row to="/write/greeting" icon="message-circle" title="Greeting message" sub="Welcomes someone who messages you first" />
          <Row to="/write/away" icon="clock" title="Away message" sub="Tells people you're closed and when you're back" />
        </div>

        <h2 className="section-title">With the assistant</h2>
        <div className="list">
          <Row to={say("Write my Instagram bio")} icon="sparkles" title="Instagram bio" sub="Short, clear, with how to order" />
          <Row to={say("Write three post captions for my business")} icon="sparkles" title="Post captions" sub="Three ideas you can post this week" />
          <Row to={say("Write my WhatsApp business description")} icon="sparkles" title="WhatsApp business description" sub="For your WhatsApp Business profile" />
        </div>
        <p className="caption" style={{ textAlign: "left", marginTop: "var(--space-3)" }}>The assistant only uses what you've told it and your own product prices. It never makes up prices or facts.</p>
      </main>
    </div>
  );
}
