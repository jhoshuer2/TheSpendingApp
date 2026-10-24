import { Link } from "react-router-dom";
import { Icon } from "../design-system/Icon";
import { IconTile, StatusLine, tintFor } from "../design-system/Identity";
import { Orb } from "../design-system/Orb";
import { fitsPerson, MODULES } from "../profile/modules";
import { NEED_LABEL } from "../profile/scoring";
import { useProfile } from "../profile/store";
import { NEED_ICON } from "../profile/ui";

/** Everything that fits this business. Nothing is pushed; start whatever you like. */
export function Library() {
  const { profile, stored, done } = useProfile();
  const fits = MODULES.filter((m) => fitsPerson(m, profile.band, stored.answers));
  const groups = profile.needs
    .map((n) => ({ need: n.id, items: fits.filter((m) => m.need === n.id) }))
    .filter((g) => g.items.length > 0);

  return (
    <>
      <div className="page-head page-head--row">
        <div>
          <h1 className="title title--page">Library</h1>
          <p>Start anything, any time.</p>
        </div>
        <Link to="/assistant" className="orb-link" aria-label="Talk to SPAL Assistant">
          <Orb size={44} />
        </Link>
      </div>
      {groups.map((g, gi) => (
        <section key={g.need} className="enter" style={{ ["--i" as string]: gi }}>
          <h2 className="section-title section-title--split">
            {NEED_LABEL[g.need]}
            <span className="group-progress" aria-label={`${g.items.filter((m) => done.has(m.id)).length} of ${g.items.length} finished`}>
              {g.items.map((m) => (
                <i key={m.id} className={done.has(m.id) ? "on" : ""} />
              ))}
            </span>
          </h2>
          <div className="list">
            {g.items.map((m) => (
              <Link key={m.id} to={`/module/${m.id}`} className="row">
                <IconTile icon={done.has(m.id) ? "check" : NEED_ICON[m.need]} tint={done.has(m.id) ? "mint" : tintFor(NEED_LABEL[m.need])} />
                <span className="row__main">
                  <span className="row__title">{m.title}</span>
                  <StatusLine tone={done.has(m.id) ? "good" : "neutral"}>
                    {done.has(m.id)
                      ? "Finished"
                      : stored.progress[m.id]?.dismissed
                        ? `${m.minutes} min · Hidden from suggestions`
                        : stored.progress[m.id]?.snoozedUntil && Date.parse(stored.progress[m.id].snoozedUntil!) > Date.now()
                          ? `${m.minutes} min · Back in your suggestions later`
                          : `${m.minutes} min`}
                  </StatusLine>
                </span>
                <span className="row__end">
                  <Icon name="chevron-right" size={18} />
                </span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
