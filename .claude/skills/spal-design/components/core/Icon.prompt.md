Line icon — Lucide geometry at SPAL's 1.6 stroke; use for every functional glyph (never emoji or unicode arrows).

```jsx
<Icon name="arrow-down-left" size={18} color="var(--money-in)" />
<Icon name="bell" />
```

- `size` 16 in dense rows, 20 default, 24 in nav. Keep `stroke` at 1.6 (2 only for the active nav tab).
- Money in = `arrow-down-left`, money out = `arrow-up-right`.
- Sit icons in a 36–40px `--surface-sunken` tile (radius `--radius-sm`) when they lead a row.
