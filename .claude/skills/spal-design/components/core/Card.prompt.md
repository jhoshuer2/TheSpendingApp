Surface container — use sparingly; lists should be ledger rows, not stacked cards.

```jsx
<Card>…</Card>
<Card surface="night" padding="lg">hero</Card>
<Card surface="mist" accent="green">tip</Card>
```

- `surface`: raised (white + hairline ring) · sunken (recessed well) · mist (soft atmospheric light) · night (dark horizon hero; sets data-theme="night" inside).
- `accent` draws a 1px horizon line across the top edge — never a colored left/top border.
- `elevated` only for things that truly float.