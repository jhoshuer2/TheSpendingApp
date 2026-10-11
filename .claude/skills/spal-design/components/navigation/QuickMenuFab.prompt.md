Quick menu — the app's primary entry point: an ink capsule bottom-right; the plus rotates 45° and the menu rises item by item (30ms stagger).

```jsx
<QuickMenuFab onSelect={(k) => k === "sale" && openSheet("sale")} />
```

- Positioned `absolute` to its nearest positioned ancestor (the phone shell / app root).
- Items: Record sale · Record expense · Ask SPAL · Set a goal · Inventory.