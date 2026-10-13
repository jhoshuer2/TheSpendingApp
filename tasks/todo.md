# Stock counts

Decisions (from the person who owns the product):
- Stock goes down only when sales are recorded by **picking products**, never from a typed amount.
- The assistant can save stock changes through a Save card; Undo (and the stock screen) can always change them back.
- Registration guidance comes in a second PR, after this one.

## Plan
- [ ] Data: products get `stock`, `counted_at`, `low_at` (all optional). Left now = count minus what was sold since the count.
- [ ] Migration `20261016000000_stock.sql` + database tests
- [ ] Pure logic `src/records/stock.ts` + unit tests (left, low, out, backdated sales, deleted sales, add stock)
- [ ] Sync (supabase client, fake server, cleaning of server rows)
- [ ] Store: setStock, addStock, stop tracking, restore
- [ ] Screens: track toggle in the product form, "Count your stock", left/low shown on Products, Money home "Running low", sale screen shows left and warns (never blocks)
- [ ] Assistant: `get_stock` (read), `propose_stock` (Save card with Undo), instructions, eval cases
- [ ] Browser checks (demo mode, backend sync, assistant), layout screens, docs (`docs/STOCK.md`)
- [ ] Full sweep, PR

## Review
(to fill in)
