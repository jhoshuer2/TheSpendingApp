const COLOURS = ["#1E7A4C", "#8CD3A8", "#E1EDB9", "#F4D4B6", "#CFE2EA"];

/** One short burst, once, from the middle. Pure decoration: transform and opacity only, and none at all when motion is off. */
export function Confetti({ pieces = 22 }: { pieces?: number }) {
  return (
    <span className="confetti" aria-hidden="true">
      {Array.from({ length: pieces }, (_, i) => {
        const a = (i / pieces) * Math.PI * 2 + (i % 3) * 0.4;
        const r = 70 + ((i * 37) % 70);
        return (
          <i
            key={i}
            style={{
              background: COLOURS[i % COLOURS.length],
              ["--x" as string]: `${Math.round(Math.cos(a) * r)}px`,
              ["--y" as string]: `${Math.round(Math.sin(a) * r * 0.8 - 40)}px`,
              ["--r" as string]: `${(i * 67) % 360}deg`,
              animationDelay: `${(i % 5) * 30}ms`,
            }}
          />
        );
      })}
    </span>
  );
}
