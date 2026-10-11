Small status label — 6px radius, sentence case; use for states ("Owing", "Paid"), not for categories in lists.

```jsx
<Badge label="Owing" color="ochre" dot />
<Badge label="Paid" color="green" />
```

- `orange` = money out (clay), `ochre` = owed/pending, `blue`/`purple` = SPAL AI (iris), `gray` default.
- In ledger rows, categories are plain secondary text ("Food · 2:45 PM"), not badges.