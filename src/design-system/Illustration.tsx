import { Icon, type IconName } from "./Icon";
import { IconTile, type Tint } from "./Identity";

/** Names that have artwork in `public/illustrations/<name>.webp`. Empty until the illustrations arrive; see docs/ILLUSTRATIONS.md. */
const ARTWORK = new Set<string>([]);

export interface IllustrationProps {
  /** The artwork's file name, without the extension. */
  name: string;
  /** What the picture shows, for people who can't see it. */
  label: string;
  /** What the placeholder shows until the artwork exists: one big icon and two small ones. */
  icons: [IconName, IconName, IconName];
  tints?: [Tint, Tint, Tint];
}

/** The picture on a welcome slide: the artwork when it exists, a soft glass-card placeholder until then. */
export function Illustration({ name, label, icons, tints = ["mint", "sky", "peach"] }: IllustrationProps) {
  if (ARTWORK.has(name)) return <img className="illo illo--art" src={`/illustrations/${name}.webp`} alt={label} />;
  return (
    <div className="illo illo--ph" role="img" aria-label={label}>
      <span className="illo__card illo__card--main">
        <IconTile icon={icons[0]} tint={tints[0]} size={76} />
      </span>
      <span className="illo__card illo__card--a">
        <Icon name={icons[1]} size={28} />
      </span>
      <span className="illo__card illo__card--b">
        <Icon name={icons[2]} size={24} />
      </span>
    </div>
  );
}
