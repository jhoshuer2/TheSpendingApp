import { useNavigate } from "react-router-dom";
import { Button } from "../design-system/Button";
import { Icon } from "../design-system/Icon";
import { useAuth } from "../lib/auth";
import { BAND_LABEL, NEED_LABEL } from "../profile/scoring";
import { useProfile } from "../profile/store";
import { NEED_ICON } from "../profile/ui";

export function Profile() {
  const navigate = useNavigate();
  const { session, signOut } = useAuth();
  const { profile } = useProfile();

  return (
    <>
      <div className="page-head">
        <h1 className="title title--page">Profile</h1>
      </div>

      <div className="card stack" style={{ marginTop: "var(--space-6)" }}>
        <p className="hero__title" style={{ fontSize: "var(--text-title-2)" }}>
          {session?.name}
        </p>
        <p className="row__sub">{session?.email}</p>
      </div>

      <h2 className="section-title">Your business</h2>
      <div className="card stack">
        <p className="row__sub">Where you are</p>
        <p className="row__title">{BAND_LABEL[profile.band]}</p>
      </div>

      <h2 className="section-title">What we're focusing on</h2>
      <div className="list">
        {profile.needs.slice(0, 3).map((n) => (
          <div className="row" key={n.id}>
            <span className="tile">
              <Icon name={NEED_ICON[n.id]} size={20} />
            </span>
            <span className="row__main">
              <span className="row__title">{NEED_LABEL[n.id]}</span>
              <span className="row__sub">{n.reasons[0]}</span>
            </span>
          </div>
        ))}
      </div>

      <div className="stack" style={{ marginTop: "var(--space-section-gap)", alignItems: "flex-start" }}>
        <Button variant="secondary" size="md" onClick={() => navigate("/onboarding")}>
          Change my answers
        </Button>
        <Button variant="ghost" size="md" onClick={signOut}>
          Log out
        </Button>
      </div>
    </>
  );
}
