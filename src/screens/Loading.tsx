import { Button } from "../design-system/Button";
import { SpalSymbol } from "../design-system/SpalSymbol";

export function Loading() {
  return (
    <div className="screen" role="status" aria-live="polite">
      <div className="building">
        <SpalSymbol symbol="focus" size="100%" />
        <p>Loading your business</p>
      </div>
    </div>
  );
}

/** Shown when we can't load someone's data and can't safely start them from scratch. */
export function LoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="screen">
      <main className="screen__body" style={{ display: "grid", placeItems: "center" }}>
        <div className="empty enter">
          <SpalSymbol symbol="focus" size={72} />
          <h2>We couldn't load your data</h2>
          <p>Check your connection and try again. Nothing has been lost.</p>
        </div>
      </main>
      <footer className="screen__footer">
        <Button fullWidth onClick={onRetry}>
          Try again
        </Button>
      </footer>
    </div>
  );
}
