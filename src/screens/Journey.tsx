import { Link } from "react-router-dom";
import { Icon } from "../design-system/Icon";
import { SpalSymbol } from "../design-system/SpalSymbol";
import { shortDate } from "../lib/format";
import { moduleById } from "../profile/modules";
import { NEED_LABEL } from "../profile/scoring";
import { useProfile } from "../profile/store";
import { NEED_ICON } from "../profile/ui";

/** How far you've come: finished steps and the ones you've started. */
export function Journey() {
  const { stored } = useProfile();
  const entries = Object.entries(stored.progress).flatMap(([id, p]) => {
    const m = moduleById(id);
    return m ? [{ m, p }] : [];
  });
  const finished = entries.filter((e) => e.p.doneAt).sort((a, b) => b.p.doneAt!.localeCompare(a.p.doneAt!));
  const started = entries.filter((e) => !e.p.doneAt && e.p.steps.length > 0);

  return (
    <>
      <div className="page-head">
        <h1 className="title title--page">Journey</h1>
        <p>{finished.length === 0 ? "Your progress builds up here." : `${finished.length} ${finished.length === 1 ? "step" : "steps"} finished so far.`}</p>
      </div>

      {entries.length === 0 && (
        <div className="empty enter">
          <SpalSymbol symbol="growth" size={72} />
          <h2>Nothing finished yet</h2>
          <p>Finish a step from Today and you'll start to see how far you've come.</p>
        </div>
      )}

      {started.length > 0 && (
        <>
          <h2 className="section-title">In progress</h2>
          <div className="list">
            {started.map(({ m, p }) => (
              <Link key={m.id} to={`/module/${m.id}`} className="row">
                <span className="tile">
                  <Icon name={NEED_ICON[m.need]} size={20} />
                </span>
                <span className="row__main">
                  <span className="row__title">{m.title}</span>
                  <span className="row__sub">{p.steps.length} of {m.steps.length} steps done</span>
                </span>
                <span className="row__end">
                  <Icon name="chevron-right" size={18} />
                </span>
              </Link>
            ))}
          </div>
        </>
      )}

      {finished.length > 0 && (
        <>
          <h2 className="section-title">Finished</h2>
          <div className="list">
            {finished.map(({ m, p }) => (
              <Link key={m.id} to={`/module/${m.id}`} className="row">
                <span className="tile">
                  <Icon name="check" size={20} />
                </span>
                <span className="row__main">
                  <span className="row__title">{m.title}</span>
                  <span className="row__sub">
                    {NEED_LABEL[m.need]} · {shortDate(p.doneAt!)}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  );
}
