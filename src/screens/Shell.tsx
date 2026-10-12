import type { ReactNode } from "react";
import { Navigate, NavLink, Outlet } from "react-router-dom";
import { BottomNav, type NavTab } from "../design-system/BottomNav";
import { SpalSymbol } from "../design-system/SpalSymbol";
import { useAuth } from "../lib/auth";
import { useProfile } from "../profile/store";
import { useRecords } from "../records/store";
import { LoadError, Loading } from "./Loading";

const TABS: NavTab[] = [
  { to: "/app/today", label: "Today", icon: "home" },
  { to: "/app/money", label: "Money", icon: "wallet" },
  { to: "/app/library", label: "Library", icon: "book-open" },
  { to: "/app/journey", label: "Journey", icon: "trending-up" },
  { to: "/app/profile", label: "Profile", icon: "user" },
];

/**
 * Guards a screen. Waits until we know who is signed in and have their data, then sends anyone who
 * shouldn't be here elsewhere. `onboarded={false}` is for the onboarding screens themselves.
 */
export function Gate({ children, onboarded = true }: { children: ReactNode; onboarded?: boolean }) {
  const { session, status: authStatus } = useAuth();
  const { stored, status, retry } = useProfile();
  const records = useRecords();
  if (authStatus === "loading") return <Loading />;
  if (!session) return <Navigate to="/welcome" replace />;
  if (status === "loading" || (onboarded && records.status === "loading")) return <Loading />;
  if (status === "error") return <LoadError onRetry={retry} />;
  if (onboarded && records.status === "error") return <LoadError onRetry={records.retry} />;
  if (onboarded && !stored.completed) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

export function Shell() {
  return (
    <Gate>
      <div className="screen has-nav">
        <main className="screen__body">
          <Outlet />
        </main>
        <BottomNav tabs={TABS} />
      </div>
    </Gate>
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

