import { useNavigate } from "react-router-dom";
import { Button } from "../design-system/Button";
import { SpalSymbol } from "../design-system/SpalSymbol";
import { useAuth } from "../lib/auth";

/** TODO(Stage 2): replace with the question-per-screen onboarding that builds the business profile. */
export function Onboarding() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const first = session?.name.split(" ")[0] ?? "there";

  return (
    <div className="screen">
      <main className="screen__body welcome__body">
        <div className="welcome__visual">
          <div className="enter">
            <SpalSymbol symbol="profit" size="100%" />
          </div>
        </div>
        <div className="welcome__copy">
          <h1 className="title enter" style={{ ["--i" as string]: 1 }}>
            Welcome, {first}
          </h1>
          <p className="lede enter" style={{ ["--i" as string]: 2 }}>
            Next, SPAL will ask a few questions about your business so it can show you the right first step.
          </p>
        </div>
      </main>
      <footer className="screen__footer">
        <Button fullWidth onClick={() => navigate("/app", { replace: true })}>
          Continue
        </Button>
      </footer>
    </div>
  );
}
