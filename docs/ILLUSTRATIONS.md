# Illustrations

The three welcome slides each have a picture slot. Until artwork exists, a soft glass-card placeholder fills it (a big tinted icon with two small ones), at the same size and position as the final picture.

## Add artwork

1. Save each picture as `public/illustrations/<name>.webp`.
2. Add the name to `ARTWORK` in `src/design-system/Illustration.tsx`.

Add the file first. A name listed in `ARTWORK` without a file shows a broken image. When a name is listed, the placeholder is replaced by the picture automatically.

## The slots

| Name | Slide | What it should show |
|---|---|---|
| `welcome-sale` | Record a sale in seconds | A sale being recorded: a phone or a receipt, a naira note or coins, a green check |
| `welcome-kept` | Know what you keep, not just what you sold | A small week of bars, a wallet or a purse with money in it |
| `welcome-guide` | A guide that cheers you on | The SPAL guide (the orb) with a small flame or star for the streak |

## The spec

- Square, 1200 x 1200, transparent WebP, under 150 KB. It is shown at about 300 px wide, so keep detail large and simple.
- Soft 3D or glossy-clay style with rounded forms, gentle light from the top left and a faint contact shadow. The first welcome reference (the yellow wallet with coins) is the target.
- Colour comes from the object. Keep the background transparent: the screen already has a soft pastel wash behind it. Do not draw your own gradient or background.
- No text and no logos inside the picture. Headlines are real text on the screen.
- Leave about 10% empty space around the subject so it can float without clipping.

## Where else a picture could go

The sign-up, login and password screens currently show the SPAL orb in a white disc. A custom mark can replace it in `account__mark` in `src/screens/Auth.tsx`.
