# Product photos

Screens show a small coded plate wherever a product photo will go (Products, Record a sale, and the `ProductCard` in the kit). When a photo exists for a product, it replaces the plate. Nothing else needs to change.

## Add a photo

1. Save it as `public/products/<slug>.webp`.
2. Add the slug to `PHOTOS` in `src/records/productImages.ts`.
3. If the product needs new words to match, add them to `KEYWORDS` in the same file.

A product's photo is picked by what its name says (for example "Party JOLLOF tray" matches `jollof-rice`). A slug listed in `PHOTOS` without a file in `public/products/` will show a broken image, so add the file first.

## The spec

- Square, 800 x 800, WebP, under 80 KB.
- A single subject, on a **pure white background** (`#FFFFFF`). The tile multiplies the photo onto a pale tint, so white disappears and the food sits on the colour.
- Soft top-down or 3/4 light. No hands, no text, no brand logos, no props.
- Real Nigerian food and goods as they are actually sold, not stock-photo versions.

## First set (slugs, then a prompt)

Use the same style line on every one: *"Product photo on a pure white background, soft natural light, top-down, single subject centred with space around it, no text, no hands, no shadows beyond a faint contact shadow, realistic."*

| Slug | Subject |
|---|---|
| `jollof-rice` | A plate of Nigerian party jollof rice with a little fried plantain |
| `fried-rice` | A plate of Nigerian fried rice with mixed vegetables and a piece of chicken |
| `zobo` | A clear bottle of deep red zobo (hibiscus drink) with a few dried petals beside it |
| `chicken` | One golden fried chicken piece on a small white plate |
| `meat-pie` | A Nigerian meat pie with a slice cut to show the filling |
| `puff-puff` | A small bowl of puff puff |
| `suya` | A few skewers of suya with sliced onion and yaji spice |
| `bread` | A loaf of sliced Nigerian bread |
| `cake` | A single slice of cake on a plate |
| `water` | A sealed bottle of water |
| `soft-drink` | A cold glass bottle of soft drink |
| `ankara-fabric` | A folded piece of colourful Ankara fabric |

Twelve images at the first-batch size cost roughly the same as the earlier estimate (about 6 images for around $1, about 20 for $3 to $4).

## Why a placeholder first

The image generator was out of credits when the Products and Money screens were restyled. The placeholder keeps every layout the same size as the final photo, so adding photos later does not move anything.
