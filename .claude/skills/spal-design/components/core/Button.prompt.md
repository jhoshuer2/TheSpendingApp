Tactile pill button — use for every primary/secondary action; one primary per screen.

```jsx
<Button variant="primary" size="lg" fullWidth>Save sale</Button>
<Button variant="secondary" icon={<Icon name="plus" size={18}/>}>Add item</Button>
```

- `primary` = Spal green with a lit top edge + weighted bottom edge (no glow). `secondary` = white with a hairline ring. `ghost` = text only. `danger` = red text on white (destructive actions are never a big red slab).
- Sizes 36 / 48 / 56. Weight 500, sentence case, verb-first ("Save sale", not "SAVE").
- Press scales to 0.98 in 120ms. `loading` shows three rising dots.