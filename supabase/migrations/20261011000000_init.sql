-- SPAL backend, part 1: profiles and step progress, each locked to its owner with row-level security.
-- Run in the Supabase SQL editor, or with the Supabase CLI (`supabase db push`).

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  name        text not null default '' check (char_length(name) <= 100),
  answers     jsonb not null default '{}'::jsonb
              check (jsonb_typeof(answers) = 'object' and pg_column_size(answers) <= 4096),
  completed   boolean not null default false,
  updated_at  timestamptz not null default now()
);

create table public.step_progress (
  user_id     uuid not null references auth.users (id) on delete cascade,
  module_id   text not null check (char_length(module_id) between 1 and 64),
  steps       smallint[] not null default '{}'
              check (cardinality(steps) <= 20 and steps <@ array[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19]::smallint[]),
  done_at     timestamptz,
  updated_at  timestamptz not null default now(),
  primary key (user_id, module_id)
);

-- The server decides updated_at, so a client can't backdate or forge it.
create function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger profiles_touch before insert or update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger step_progress_touch before insert or update on public.step_progress
  for each row execute function public.touch_updated_at();

-- Every new account gets its profile row, carrying the name they signed up with.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, name)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'name', ''), 100))
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row-level security: you can only ever see and change your own rows.
alter table public.profiles       enable row level security;
alter table public.step_progress  enable row level security;

create policy "own profile: read"   on public.profiles for select to authenticated using (auth.uid() = id);
create policy "own profile: insert" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "own profile: update" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "own profile: delete" on public.profiles for delete to authenticated using (auth.uid() = id);

create policy "own progress: read"   on public.step_progress for select to authenticated using (auth.uid() = user_id);
create policy "own progress: insert" on public.step_progress for insert to authenticated with check (auth.uid() = user_id);
create policy "own progress: update" on public.step_progress for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own progress: delete" on public.step_progress for delete to authenticated using (auth.uid() = user_id);

-- Anonymous visitors get nothing. Signed-in users get only what the policies above allow.
revoke all on public.profiles, public.step_progress from anon;
grant select, insert, update, delete on public.profiles, public.step_progress to authenticated;
