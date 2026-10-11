Signature atmosphere — soft, analogous color fields that settle low and drift slowly; place inside any positioned surface (hero cards, onboarding, empty states, celebrations).

```jsx
<div style={{ position: "relative", borderRadius: 20, overflow: "hidden" }}>
  <Aura variant="night" />
  <div style={{ position: "relative" }}>…content…</div>
</div>
```

- `night` forest/teal/mint/ember on #0B100E · `dawn` mint/lime/sand/sky on paper · `mist` white-to-mint for tips and wells.
- Blur scales with the container, so the field reads equally soft on a 120px card and a full screen.
- One aura per screen. Never behind dense lists or body copy longer than two lines.
- Static fallback: `background: var(--texture-grain), var(--atmos-night)`.
