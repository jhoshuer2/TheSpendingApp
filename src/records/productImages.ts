/**
 * Product photos. Until a photo exists for a product, screens show a quiet coded placeholder.
 *
 * To add one: put `<slug>.webp` in `public/products/` (square, white background, see docs/PRODUCT-IMAGES.md),
 * add the slug to `PHOTOS`, and make sure a keyword for it is in `KEYWORDS`. Nothing else changes.
 */
const KEYWORDS: [slug: string, words: string[]][] = [
  ["jollof-rice", ["jollof"]],
  ["fried-rice", ["fried rice"]],
  ["zobo", ["zobo", "hibiscus"]],
  ["chicken", ["chicken"]],
  ["meat-pie", ["meat pie", "pie"]],
  ["puff-puff", ["puff puff", "puff-puff"]],
  ["suya", ["suya"]],
  ["bread", ["bread", "loaf"]],
  ["cake", ["cake"]],
  ["water", ["water"]],
  ["soft-drink", ["soda", "coke", "fanta", "soft drink", "malt"]],
  ["ankara-fabric", ["ankara", "fabric", "cloth"]],
];

/** Slugs that have a photo in `public/products/`. Empty until the photos are generated. */
const PHOTOS = new Set<string>([]);

/** The photo for a product, matched by what its name says, or undefined to show the placeholder. */
export function productPhoto(name: string, have: ReadonlySet<string> = PHOTOS): string | undefined {
  const n = name.toLowerCase();
  const hit = KEYWORDS.find(([slug, words]) => have.has(slug) && words.some((w) => n.includes(w)));
  return hit ? `/products/${hit[0]}.webp` : undefined;
}
