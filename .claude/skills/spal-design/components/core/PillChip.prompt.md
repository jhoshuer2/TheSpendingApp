Pill toggle for filters and single choices — selection is shown in ink, never in color.

```jsx
<PillChip label="Food" size="sm" selected={cat==="Food"} onClick={…} />
<PillChip label="Paid now" icon={<Icon name="check" size={16}/>} color="green" />
```

- Unselected: white with hairline ring. Selected: ink-900 fill, white text.
- `color` only tints a leading icon.