-- SPAL records engine: products, sales and expenses. Each is locked to its owner with row-level security.
-- Money is stored as whole kobo (integer) so sums are exact. Run once, after the earlier migrations.
--
-- Rows are created on the person's device with their own id (a uuid), so saving the same row twice is harmless
-- (an upsert). Deleting is a "tombstone" (deleted_at) so other devices learn about it.

create table public.products (
  user_id     uuid not null references auth.users (id) on delete cascade,
  id          uuid not null,
  name        text not null check (char_length(name) between 1 and 80),
  price       bigint not null check (price between 0 and 100000000000),
  cost        bigint check (cost between 0 and 100000000000),
  archived    boolean not null default false,
  updated_at  timestamptz not null default now(),
  primary key (user_id, id)
);

create table public.sales (
  user_id     uuid not null references auth.users (id) on delete cascade,
  id          uuid not null,
  at          timestamptz not null check (at between now() - interval '10 years' and now() + interval '1 day'),
  amount      bigint not null check (amount between 1 and 100000000000),
  items       jsonb not null default '[]'::jsonb check (jsonb_typeof(items) = 'array' and pg_column_size(items) <= 4096),
  note        text check (char_length(note) <= 200),
  customer    text check (char_length(customer) <= 80),
  paid        boolean not null default true,
  paid_at     timestamptz,
  deleted_at  timestamptz,
  updated_at  timestamptz not null default now(),
  primary key (user_id, id)
);

create table public.expenses (
  user_id     uuid not null references auth.users (id) on delete cascade,
  id          uuid not null,
  at          timestamptz not null check (at between now() - interval '10 years' and now() + interval '1 day'),
  amount      bigint not null check (amount between 1 and 100000000000),
  category    text not null check (category in ('stock', 'transport', 'rent', 'staff', 'data', 'packaging', 'utilities', 'other')),
  note        text check (char_length(note) <= 200),
  deleted_at  timestamptz,
  updated_at  timestamptz not null default now(),
  primary key (user_id, id)
);

-- Used to fetch only what changed since the last sync, and to list a period quickly.
create index products_changed on public.products (user_id, updated_at);
create index sales_changed    on public.sales    (user_id, updated_at);
create index sales_when       on public.sales    (user_id, at desc);
create index expenses_changed on public.expenses (user_id, updated_at);
create index expenses_when    on public.expenses (user_id, at desc);

-- The server decides updated_at (reuses the function from the first migration).
create trigger products_touch before insert or update on public.products for each row execute function public.touch_updated_at();
create trigger sales_touch    before insert or update on public.sales    for each row execute function public.touch_updated_at();
create trigger expenses_touch before insert or update on public.expenses for each row execute function public.touch_updated_at();

alter table public.products enable row level security;
alter table public.sales    enable row level security;
alter table public.expenses enable row level security;

create policy "own products: read"   on public.products for select to authenticated using (auth.uid() = user_id);
create policy "own products: insert" on public.products for insert to authenticated with check (auth.uid() = user_id);
create policy "own products: update" on public.products for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own products: delete" on public.products for delete to authenticated using (auth.uid() = user_id);

create policy "own sales: read"   on public.sales for select to authenticated using (auth.uid() = user_id);
create policy "own sales: insert" on public.sales for insert to authenticated with check (auth.uid() = user_id);
create policy "own sales: update" on public.sales for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own sales: delete" on public.sales for delete to authenticated using (auth.uid() = user_id);

create policy "own expenses: read"   on public.expenses for select to authenticated using (auth.uid() = user_id);
create policy "own expenses: insert" on public.expenses for insert to authenticated with check (auth.uid() = user_id);
create policy "own expenses: update" on public.expenses for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own expenses: delete" on public.expenses for delete to authenticated using (auth.uid() = user_id);

revoke all on public.products, public.sales, public.expenses from anon;
grant select, insert, update, delete on public.products, public.sales, public.expenses to authenticated;
