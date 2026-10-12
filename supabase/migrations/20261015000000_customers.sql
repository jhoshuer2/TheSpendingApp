-- SPAL customers: the people you sell to, with an optional phone number and a note.
-- Locked to the owner with row-level security, like the rest of the books. Run once, after the earlier migrations.
--
-- Sales keep the customer's name as text (as before); this table only holds the extra details (phone, note).
-- Rows are created on the person's device with their own uuid, so saving twice is harmless (an upsert).
-- Phone numbers belong to the owner's customers: they are never sent to the AI assistant.

create table public.customers (
  user_id     uuid not null references auth.users (id) on delete cascade,
  id          uuid not null,
  name        text not null check (char_length(name) between 1 and 80),
  phone       text check (char_length(phone) <= 20 and phone ~ '^[0-9+() -]*$'),
  note        text check (char_length(note) <= 200),
  archived    boolean not null default false,
  updated_at  timestamptz not null default now(),
  primary key (user_id, id)
);

create index customers_changed on public.customers (user_id, updated_at);

create trigger customers_touch before insert or update on public.customers for each row execute function public.touch_updated_at();

alter table public.customers enable row level security;

create policy "own customers: read"   on public.customers for select to authenticated using (auth.uid() = user_id);
create policy "own customers: insert" on public.customers for insert to authenticated with check (auth.uid() = user_id);
create policy "own customers: update" on public.customers for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own customers: delete" on public.customers for delete to authenticated using (auth.uid() = user_id);

revoke all on public.customers from anon;
grant select, insert, update, delete on public.customers to authenticated;
