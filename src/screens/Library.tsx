import { Link } from "react-router-dom";
import { Icon } from "../design-system/Icon";
import { MODULES } from "../profile/modules";
import { NEED_LABEL } from "../profile/scoring";
import { useProfile } from "../profile/store";
import { NEED_ICON } from "../profile/ui";

/** Everything that fits this business. Nothing is pushed; start whatever you like. */
export function Library() {
  const { profile, stored, done } = useProfile();
  const fits = MODULES.filter((m) => m.bands.includes(profile.band) && (!m.types || (stored.answers.type && m.types.includes(stored.answers.type))));
  const groups = profile.needs
    .map((n) => ({ need: n.id, items: fits.filter((m) => m.need === n.id) }))
    .filter((g) => g.items.length > 0);

  return (
    <>
      <div className="page-head">
        <h1 className="title title--page">Library</h1>
        <p>Start anything, any time. Your most useful areas come first.</p>
      </div>
      {groups.map((g) => (
        <section key={g.need}>
          <h2 className="section-title">{NEED_LABEL[g.need]}</h2>
          <div className="list">
            {g.items.map((m) => (
              <Link key={m.id} to={`/module/${m.id}`} className="row">
                <span className="tile">
                  <Icon name={done.has(m.id) ? "check" : NEED_ICON[m.need]} size={20} />
                </span>
                <span className="row__main">
                  <span className="row__title">{m.title}</span>
                  <span className="row__sub">{done.has(m.id) ? "Finished" : `${m.minutes} min`}</span>
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
