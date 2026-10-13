# Stock counts

Optional per product. A person who sells things can tell SPAL how many they have; SPAL then keeps count as sales are recorded.

## The model

Each product may carry three optional fields: `stock` (the count), `countedAt` (when it was counted) and `lowAt` (warn at or below this many). `stock` and `countedAt` always come together.

**Left now = stock − the quantity of live sale items for that product, on sales at or after `countedAt`.**

Nothing is stored for "left now". That means:

- Recording a sale by picking products takes the count down. A typed amount never does (no product, nothing to subtract).
- Deleting a sale puts the stock back.
- Recounting (or "bought more") sets a new `stock` and `countedAt`, so older sales stop counting.
- Selling more than is left shows a warning ("You only have N left. You can still record it.") and never blocks. The count can go below zero internally and shows as "Out of stock".
- Status: out at 0 or less; low at or below `lowAt`; otherwise fine. See `src/records/stock.ts`.

No new tables and no sync coupling: stock rides along with the product row (`products.stock`, `counted_at`, `low_at`; migration `20261016000000_stock.sql`, with a check that a count has a time).

## Where it shows

- Product form: "Track how many I have", the count, and "Tell me when it gets low".
- Products list: how many are left; "Running low: N left".
- Count your stock (`/money/stock`): set every count in one place.
- Money home: a "Running low" section and a "Your stock" row.
- Record a sale: the count beside each product and the warning above.

## The assistant

- `get_stock` (read): runs on the phone against local books.
- `propose_stock` (write): `updates[{product, set? | add?, low_at?}]`. Shown as a Save card with Undo, like sales and expenses. `add` only works on a tracked product; `set` and `add` are exclusive; a product must match exactly one item; no duplicates. Auto-save mode applies as for other proposals. Undo restores the before-state.

Users can always change or delete counts themselves.

## Checks

`npm run check:stock` (browser flow), unit tests in `src/records/stock.test.ts` and `src/assistant/assistant.test.ts`, section 11 of `supabase/tests/rls.sql`, the stock steps in `check:backend` and `check:assistant`, stock cases in the eval.
