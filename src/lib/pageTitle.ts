import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** First match wins, so the more specific path comes first. */
const TITLES: [RegExp, string][] = [
  [/^\/$/, ""],
  [/^\/welcome$/, "Welcome"],
  [/^\/kit$/, "UI kit"],
  [/^\/signup$/, "Create account"],
  [/^\/login$/, "Log in"],
  [/^\/forgot-password$/, "Forgot password"],
  [/^\/reset-password$/, "New password"],
  [/^\/onboarding\/building$/, "Building your plan"],
  [/^\/onboarding\/summary$/, "Your plan"],
  [/^\/onboarding$/, "A few questions"],
  [/^\/module\//, "Step"],
  [/^\/app\/today$/, "Today"],
  [/^\/app\/money$/, "Money"],
  [/^\/app\/library$/, "Library"],
  [/^\/app\/journey$/, "Journey"],
  [/^\/app\/profile$/, "Profile"],
  [/^\/money\/sale$/, "Record a sale"],
  [/^\/money\/expense$/, "Add an expense"],
  [/^\/money\/customers$/, "Customers"],
  [/^\/money\/customer\/[^/]+\/edit$/, "Edit customer"],
  [/^\/money\/customer\//, "Customer"],
  [/^\/money\/message\/reminder\//, "Payment reminder"],
  [/^\/money\/message\/receipt\//, "Receipt"],
  [/^\/money\/stock$/, "Stock count"],
  [/^\/money\/products$/, "Products"],
  [/^\/money\/product\//, "Product"],
  [/^\/money\/record\//, "Record"],
  [/^\/business\/register$/, "Register your business"],
  [/^\/business$/, "Business details"],
  [/^\/write$/, "Write for me"],
  [/^\/write\//, "Draft"],
  [/^\/assistant\/settings$/, "Assistant settings"],
  [/^\/assistant$/, "SPAL Assistant"],
];

export function titleFor(pathname: string): string {
  const hit = TITLES.find(([re]) => re.test(pathname));
  if (!hit) return "Page not found · SPAL";
  return hit[1] ? `${hit[1]} · SPAL` : "SPAL";
}

/** Keeps the tab, history and bookmarks naming the screen instead of every page being "SPAL". */
export function RouteTitle(): null {
  const { pathname } = useLocation();
  useEffect(() => {
    document.title = titleFor(pathname);
  }, [pathname]);
  return null;
}
