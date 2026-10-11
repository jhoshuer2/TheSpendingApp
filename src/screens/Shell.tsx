import type { ReactNode } from "react";
import { Navigate, NavLink, Outlet } from "react-router-dom";
import { BottomNav, type NavTab } from "../design-system/BottomNav";
import { SpalSymbol } from "../design-system/SpalSymbol";
import { useAuth } from "../lib/auth";
import { useProfile } from "../profile/store";

const TABS: NavTab[] = [
  { to: "/app/today", label: "Today", icon: "home" },
  { to: "/app/library", label: "Library", icon: "book-open" },
  { to: "/app/journey", label: "Journey", icon: "trending-up" },
  { to: "/app/profile", label: "Profile", icon: "user" },
];

/** Signed in AND onboarded. Anyone else is sent where they need to go. */
export function RequireReady({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const { stored } = useProfile();
  if (!session) return <Navigate to="/welcome" replace />;
  if (!stored.completed) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

export function Shell() {
  return (
    <RequireReady>
      <div className="screen has-nav">
        <main className="screen__body">
          <Outlet />
        </main>
        <BottomNav tabs={TABS} />
      </div>
    </RequireReady>
  );
}

export function NotFound() {
  return (
    <div className="screen">
      <main className="screen__body" style={{ display: "grid", placeItems: "center" }}>
        <div className="empty enter">
          <SpalSymbol symbol="focus" size={72} />
          <h2>We can't find that page</h2>
          <p>It may have moved. Head back and pick up from the start.</p>
        </div>
      </main>
      <footer className="screen__footer">
        <NavLink to="/" className="btn btn--primary btn--lg btn--full">
          Go home
        </NavLink>
      </footer>
    </div>
  );
}

