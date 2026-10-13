-- SPAL stock counts: an optional count per product, and a level to warn at.
-- "Left now" is worked out in the app (the count, minus what was sold since it was taken), so undoing or deleting a sale
-- puts the stock back and nothing here has to be kept in step. Run once, after the earlier migrations.
--
-- A product is tracked when it has a count. A count always comes with the moment it was taken.

alter table public.products
  add column stock      integer     check (stock between 0 and 1000000),
  add column counted_at timestamptz,
  add column low_at     integer     check (low_at between 0 and 1000000);

alter table public.products
  add constraint products_count_has_a_time check ((stock is null) = (counted_at is null));
