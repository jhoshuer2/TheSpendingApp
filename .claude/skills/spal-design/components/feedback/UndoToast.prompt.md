Undo toast — the only feedback for destructive actions; an ink capsule whose bottom horizon line drains over `duration`.

```jsx
<UndoToast message="Sale deleted" onUndo={restore} onExpire={commit} duration={8000} />
```

- Rises 8px over 320ms. Never stack more than one.