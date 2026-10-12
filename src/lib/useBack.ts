import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * Go back to wherever the person came from. If there's nowhere to go back to (they opened this page directly),
 * go to `fallback` instead of leaving the app. Replacing the screen instead would leave two copies of the
 * same page in the history, so Back would appear to do nothing.
 */
export function useBack(fallback: string): () => void {
  const navigate = useNavigate();
  const { key } = useLocation();
  return useCallback(() => (key !== "default" ? navigate(-1) : navigate(fallback, { replace: true })), [key, navigate, fallback]);
}
