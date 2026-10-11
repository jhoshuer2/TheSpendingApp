import { NavLink } from "react-router-dom";
import { Icon, type IconName } from "./Icon";

export interface NavTab {
  to: string;
  label: string;
  icon: IconName;
}

/** Floating glass pill nav. Active tab is ink, not colour. Content below it must reserve space (.has-nav). */
export function BottomNav({ tabs }: { tabs: NavTab[] }) {
  return (
    <nav className="nav" aria-label="Main">
      <div className="nav__bar">
        {tabs.map((t) => (
          <NavLink key={t.to} to={t.to} className="nav__item">
            {({ isActive }) => (
              <>
                <Icon name={t.icon} size={22} stroke={isActive ? 2 : 1.6} />
                {t.label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
