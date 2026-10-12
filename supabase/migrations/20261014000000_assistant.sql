-- SPAL Assistant: daily usage limits and cost tracking.
-- Only the assistant Edge Function (service role) may touch these. No app user can read or change them.

create table public.assistant_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  messages int not null default 0,
  input_tokens bigint not null default 0,
  output_tokens bigint not null default 0,
  cache_read_tokens bigint not null default 0,
  primary key (user_id, day)
);

create table public.assistant_usage_global (
  day date primary key,
  messages int not null default 0
);

alter table public.assistant_usage enable row level security;
alter table public.assistant_usage_global enable row level security;
revoke all on public.assistant_usage, public.assistant_usage_global from anon, authenticated;
grant select, insert, update on public.assistant_usage, public.assistant_usage_global to service_role;

-- Takes one message from today's allowance. Returns 'ok', 'user_limit' or 'global_limit'.
-- One statement per counter with row locks, so two requests at once cannot both slip under the limit.
create function public.assistant_take_quota(p_user uuid, p_user_limit int, p_global_limit int)
returns text language plpgsql security definer set search_path = public as $$
declare
  d date := (now() at time zone 'Africa/Lagos')::date;
  g int;
  u int;
begin
  insert into assistant_usage_global (day, messages) values (d, 1)
    on conflict (day) do update set messages = assistant_usage_global.messages + 1
    returning messages into g;
  if g > p_global_limit then
    update assistant_usage_global set messages = messages - 1 where day = d;
    return 'global_limit';
  end if;

  insert into assistant_usage (user_id, day, messages) values (p_user, d, 1)
    on conflict (user_id, day) do update set messages = assistant_usage.messages + 1
    returning messages into u;
  if u > p_user_limit then
    update assistant_usage set messages = messages - 1 where user_id = p_user and day = d;
    update assistant_usage_global set messages = messages - 1 where day = d;
    return 'user_limit';
  end if;
  return 'ok';
end $$;

create function public.assistant_record_usage(p_user uuid, p_input bigint, p_output bigint, p_cache_read bigint)
returns void language sql security definer set search_path = public as $$
  update assistant_usage
     set input_tokens = input_tokens + greatest(coalesce(p_input, 0), 0),
         output_tokens = output_tokens + greatest(coalesce(p_output, 0), 0),
         cache_read_tokens = cache_read_tokens + greatest(coalesce(p_cache_read, 0), 0)
   where user_id = p_user and day = (now() at time zone 'Africa/Lagos')::date;
$$;

revoke all on function public.assistant_take_quota(uuid, int, int) from public, anon, authenticated;
revoke all on function public.assistant_record_usage(uuid, bigint, bigint, bigint) from public, anon, authenticated;
grant execute on function public.assistant_take_quota(uuid, int, int) to service_role;
grant execute on function public.assistant_record_usage(uuid, bigint, bigint, bigint) to service_role;
