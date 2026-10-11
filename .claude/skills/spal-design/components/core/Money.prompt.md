Money figure — the signature SPAL number treatment (loud figure, quiet raised ₦, tabular digits); use for every amount.

```jsx
<Money value={48200} size={48} />              {/* hero */}
<Money value={4500} direction="in" />          {/* +₦4,500 in green */}
<Money value={3000} direction="out" />         {/* −₦3,000 in ink */}
<Money value={6500} direction="owed" />
```

- Hero figures: `size` 48, weight 500. Never bold/black.
- `direction="in"` tints green; `out` stays ink with a true minus (−); `owed` is ochre.
- `decimals` shows kobo as a small raised tertiary suffix — off by default (informal traders rarely use kobo).
