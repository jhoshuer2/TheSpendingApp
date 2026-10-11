import { Navigate, NavLink, Outlet } from "react-router-dom";
import { BottomNav, type NavTab } from "../design-system/BottomNav";
import { Button } from "../design-system/Button";
import { SpalSymbol, type SymbolName } from "../design-system/SpalSymbol";
import { useAuth } from "../lib/auth";

const TABS: NavTab[] = [
  { to: "/app/today", label: "Today", icon: "home" },
  { to: "/app/library", label: "Library", icon: "book-open" },
  { to: "/app/journey", label: "Journey", icon: "trending-up" },
  { to: "/app/profile", label: "Profile", icon: "user" },
];

export function Shell() {
  const { session } = useAuth();
  if (!session) return <Navigate to="/welcome" replace />;
  return (
    <div className="screen has-nav">
      <main className="screen__body">
        <Outlet />
      </main>
      <BottomNav tabs={TABS} />
    </div>
  );
}

function Empty({ symbol, title, body }: { symbol: SymbolName; title: string; body: string }) {
  return (
    <div className="empty enter">
      <SpalSymbol symbol={symbol} size={72} />
      <h2>{title}</h2>
      <p>{body}</p>
    </div>
  );
}

const Heading = ({ children }: { children: string }) => (
  <h1 className="title title--page" style={{ paddingTop: "var(--space-4)" }}>
    {children}
  </h1>
);

export function Today() {
  const { session } = useAuth();
  return (
    <>
      <Heading>{`Hi, ${session?.name.split(" ")[0] ?? "there"}`}</Heading>
      <Empty symbol="focus" title="Your first step will show here" body="Once SPAL knows your business, your next step appears on this screen." />
    </>
  );
}

export const Library = () => (
  <>
    <Heading>Library</Heading>
    <Empty symbol="insight" title="Guides and tools live here" body="Ask for more whenever you're ready. Nothing is pushed on you." />
  </>
);

export const Journey = () => (
  <>
    <Heading>Journey</Heading>
    <Empty symbol="growth" title="Your progress will build up here" body="Finish a step and you'll start to see how far you've come." />
  </>
);

export function Profile() {
  const { session, signOut } = useAuth();
  return (
    <>
      <Heading>Profile</Heading>
      <div style={{ marginTop: "var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
        <p style={{ fontSize: "var(--text-title-3)", fontWeight: 500 }}>{session?.name}</p>
        <p style={{ color: "var(--text-secondary)" }}>{session?.email}</p>
      </div>
      <div style={{ marginTop: "var(--space-8)" }}>
        <Button variant="secondary" size="md" onClick={signOut}>
          Log out
        </Button>
      </div>
    </>
  );
}

export function NotFound() {
  return (
    <div className="screen">
      <main className="screen__body" style={{ display: "grid", placeItems: "center" }}>
        <Empty symbol="focus" title="We can't find that page" body="It may have moved. Head back and pick up from the start." />
      </main>
      <footer className="screen__footer">
        <NavLink to="/" className="btn btn--primary btn--lg btn--full">
          Go home
        </NavLink>
      </footer>
    </div>
  );
}
