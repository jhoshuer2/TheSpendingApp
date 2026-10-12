-- Proves the security rules. Run after stub-auth.sql and the migration, on a disposable Postgres:
--   psql -v ON_ERROR_STOP=1 -f supabase/tests/stub-auth.sql -f supabase/migrations/*.sql -f supabase/tests/rls.sql
-- Every check raises an exception on failure; reaching the last line means all passed.

create temp table _ids as select gen_random_uuid() as ada, gen_random_uuid() as kemi;
grant select on _ids to authenticated, anon;

insert into auth.users (id, email, raw_user_meta_data)
  select ada, 'ada@example.com', '{"name":"Ada Okafor"}' from _ids;
insert into auth.users (id, email, raw_user_meta_data)
  select kemi, 'kemi@example.com', '{}' from _ids;

create function pg_temp.as_user(uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', uid::text, false);
  execute 'set role authenticated';
end $$;
create function pg_temp.assert(ok boolean, msg text) returns void language plpgsql as $$
begin if not ok then raise exception 'FAILED: %', msg; end if; raise notice 'ok - %', msg; end $$;

-- 1. The signup trigger created a profile with the name from signup metadata.
select pg_temp.assert((select name from public.profiles where id = (select ada from _ids)) = 'Ada Okafor', 'signup trigger creates the profile with the name');
select pg_temp.assert((select count(*) from public.profiles) = 2, 'every account gets exactly one profile');

-- 2. Ada can write her own data.
select pg_temp.as_user((select ada from _ids));
update public.profiles set answers = '{"stage":"idea"}', completed = true where id = (select ada from _ids);
insert into public.step_progress (user_id, module_id, steps) values ((select ada from _ids), 'setup-name', '{0,1}');
select pg_temp.assert((select completed from public.profiles where id = (select ada from _ids)), 'a user can update their own profile');
select pg_temp.assert((select count(*) from public.step_progress) = 1, 'a user can add their own progress');

-- 3. Kemi cannot see or change Ada's data.
select pg_temp.as_user((select kemi from _ids));
select pg_temp.assert((select count(*) from public.profiles) = 1, 'another user sees only their own profile, not Ada''s');
select pg_temp.assert((select count(*) from public.step_progress) = 0, 'another user cannot read Ada''s progress');
update public.step_progress set steps = '{}' where module_id = 'setup-name';
update public.profiles set name = 'hacked' where id = (select ada from _ids);
do $$ begin
  begin
    insert into public.step_progress (user_id, module_id) values ((select ada from _ids), 'forged');
    raise exception 'FAILED: inserted a row as someone else';
  exception when insufficient_privilege then raise notice 'ok - cannot insert progress for someone else';
  end;
end $$;
do $$ begin
  begin
    update public.profiles set id = (select ada from _ids) where id = (select kemi from _ids);
    raise exception 'FAILED: took over another user''s profile id';
  exception when unique_violation or insufficient_privilege then raise notice 'ok - cannot take over another id';
  end;
end $$;
delete from public.step_progress where module_id = 'setup-name';

-- 4. Anonymous visitors get nothing at all.
reset role;
select pg_temp.assert((select count(*) from public.step_progress) = 1 and (select name from public.profiles where id = (select ada from _ids)) = 'Ada Okafor',
  'other users'' update, delete and rename attempts changed nothing');
set role anon;
do $$ begin
  begin
    perform 1 from public.profiles;
    raise exception 'FAILED: anon could read profiles';
  exception when insufficient_privilege then raise notice 'ok - anonymous visitors cannot read profiles';
  end;
end $$;
reset role;

-- 5. The server controls updated_at; bad data is rejected.
select pg_temp.as_user((select ada from _ids));
update public.profiles set updated_at = '2001-01-01' where id = (select ada from _ids);
select pg_temp.assert((select updated_at from public.profiles where id = (select ada from _ids)) > now() - interval '1 minute', 'clients cannot forge updated_at');
do $$ begin
  begin insert into public.step_progress (user_id, module_id, steps) values ((select ada from _ids), 'x', '{99}');
    raise exception 'FAILED: accepted an out-of-range step';
  exception when check_violation then raise notice 'ok - rejects out-of-range steps'; end;
  begin update public.profiles set answers = '[]' where id = (select ada from _ids);
    raise exception 'FAILED: accepted non-object answers';
  exception when check_violation then raise notice 'ok - rejects non-object answers'; end;
  begin update public.profiles set answers = jsonb_build_object('x', repeat('a', 5000)) where id = (select ada from _ids);
    raise exception 'FAILED: accepted an oversized answers blob';
  exception when check_violation then raise notice 'ok - rejects oversized answers'; end;
end $$;
reset role;

-- 6. Deleting an account removes its data.
delete from auth.users where id = (select ada from _ids);
select pg_temp.assert((select count(*) from public.profiles where id = (select ada from _ids)) = 0 and (select count(*) from public.step_progress) = 0, 'deleting an account deletes its profile and progress');

-- 7. Learning columns: sensible defaults, still private, still bounded.
insert into auth.users (id, email, raw_user_meta_data) select gen_random_uuid(), 'tunde@example.com', '{}' from _ids;
select pg_temp.assert((select learning from public.profiles where id = (select id from auth.users where email = 'tunde@example.com')), 'learning is on by default and can be turned off');
select pg_temp.assert((select active_days from public.profiles where id = (select id from auth.users where email = 'tunde@example.com')) = '{}', 'a new profile starts with no active days');
select pg_temp.as_user((select id from auth.users where email = 'tunde@example.com'));
update public.profiles set learning = false, active_days = '{2026-10-10,2026-10-11}', last_seen = now() where id = auth.uid();
insert into public.step_progress (user_id, module_id, steps, opened_at, snoozed_until, dismissed)
  values (auth.uid(), 'setup-name', '{0}', now(), now() + interval '7 days', false), (auth.uid(), 'setup-plan', '{}', null, null, true);
select pg_temp.assert((select count(*) from public.step_progress where dismissed) = 1, 'a user can hide and snooze their own steps');
select pg_temp.assert(not (select learning from public.profiles where id = auth.uid()), 'a user can turn learning off');
do $$ begin
  begin
    update public.profiles set active_days = array(select (date '2026-01-01' + g) from generate_series(0, 90) g) where id = auth.uid();
    raise exception 'FAILED: accepted more than 90 active days';
  exception when check_violation then raise notice 'ok - rejects an unbounded list of active days'; end;
end $$;
reset role;
-- Ada's learning data is invisible to Tunde, and the old rows were untouched by the migration.
select pg_temp.as_user((select kemi from _ids));
select pg_temp.assert((select count(*) from public.step_progress) = 0 and (select count(*) from public.profiles where active_days <> '{}') = 0, 'learning data is as private as everything else');
reset role;
delete from auth.users where email = 'tunde@example.com';

-- 8. Records engine: products, sales, expenses.
insert into auth.users (id, email, raw_user_meta_data) select gen_random_uuid(), 'bola@example.com', '{}' from _ids;
create temp table _bola as select id from auth.users where email = 'bola@example.com';
grant select on _bola to authenticated;
select pg_temp.as_user((select id from _bola));
insert into public.products (user_id, id, name, price, cost) values (auth.uid(), gen_random_uuid(), 'Jollof rice (plate)', 250000, 140000);
insert into public.sales (user_id, id, at, amount, items, paid, customer) values
  (auth.uid(), 'aaaaaaaa-0000-0000-0000-000000000001', now(), 450000, '[{"name":"Jollof","qty":2,"unitPrice":225000}]', true, null),
  (auth.uid(), 'aaaaaaaa-0000-0000-0000-000000000002', now() - interval '2 days', 100000, '[]', false, 'Mama Tosin');
insert into public.expenses (user_id, id, at, amount, category, note) values (auth.uid(), gen_random_uuid(), now(), 80000, 'stock', 'Rice and oil');
select pg_temp.assert((select count(*) from public.sales) = 2 and (select count(*) from public.products) = 1 and (select count(*) from public.expenses) = 1, 'a user can add their own products, sales and expenses');
-- Saving the same sale twice (a retry after a weak connection) must not duplicate it.
insert into public.sales (user_id, id, at, amount) values (auth.uid(), 'aaaaaaaa-0000-0000-0000-000000000001', now(), 450000)
  on conflict (user_id, id) do update set amount = excluded.amount;
select pg_temp.assert((select count(*) from public.sales) = 2, 'saving the same sale twice does not duplicate it (retries are safe)');
update public.sales set paid = true, paid_at = now() where id = 'aaaaaaaa-0000-0000-0000-000000000002';
update public.sales set deleted_at = now() where id = 'aaaaaaaa-0000-0000-0000-000000000001';
select pg_temp.assert((select count(*) from public.sales where deleted_at is not null) = 1, 'a sale can be marked paid and soft-deleted');
select pg_temp.assert((select updated_at from public.sales where id = 'aaaaaaaa-0000-0000-0000-000000000002') > now() - interval '1 minute', 'the server sets updated_at on records');
reset role;

-- Bounds and shape.
select pg_temp.as_user((select id from _bola));
do $$ begin
  begin insert into public.sales (user_id, id, at, amount) values (auth.uid(), gen_random_uuid(), now(), 0);
    raise exception 'FAILED: accepted a zero-value sale';
  exception when check_violation then raise notice 'ok - rejects a sale of zero or less'; end;
  begin insert into public.sales (user_id, id, at, amount) values (auth.uid(), gen_random_uuid(), now(), -500);
    raise exception 'FAILED: accepted a negative sale';
  exception when check_violation then raise notice 'ok - rejects a negative amount'; end;
  begin insert into public.sales (user_id, id, at, amount) values (auth.uid(), gen_random_uuid(), now() + interval '30 days', 100);
    raise exception 'FAILED: accepted a sale dated far in the future';
  exception when check_violation then raise notice 'ok - rejects a sale dated far in the future'; end;
  begin insert into public.sales (user_id, id, at, amount) values (auth.uid(), gen_random_uuid(), now() - interval '20 years', 100);
    raise exception 'FAILED: accepted a sale dated 20 years ago';
  exception when check_violation then raise notice 'ok - rejects a sale dated absurdly long ago'; end;
  begin insert into public.expenses (user_id, id, at, amount, category) values (auth.uid(), gen_random_uuid(), now(), 100, 'yachts');
    raise exception 'FAILED: accepted an unknown expense category';
  exception when check_violation then raise notice 'ok - rejects an unknown expense category'; end;
  begin insert into public.sales (user_id, id, at, amount, items) values (auth.uid(), gen_random_uuid(), now(), 100, '{"a":1}');
    raise exception 'FAILED: accepted non-array items';
  exception when check_violation then raise notice 'ok - rejects malformed sale items'; end;
  begin insert into public.products (user_id, id, name, price) values (auth.uid(), gen_random_uuid(), '', 100);
    raise exception 'FAILED: accepted an empty product name';
  exception when check_violation then raise notice 'ok - rejects an empty product name'; end;
  begin insert into public.products (user_id, id, name, price) values (auth.uid(), gen_random_uuid(), 'Free', -1);
    raise exception 'FAILED: accepted a negative price';
  exception when check_violation then raise notice 'ok - rejects a negative price'; end;
end $$;
reset role;

-- Privacy: nobody else sees or touches them, and anonymous visitors get nothing.
select pg_temp.as_user((select kemi from _ids));
select pg_temp.assert((select count(*) from public.sales) = 0 and (select count(*) from public.products) = 0 and (select count(*) from public.expenses) = 0, 'records are invisible to other users');
update public.sales set amount = 1 where true;
delete from public.expenses where true;
do $$ begin
  begin insert into public.sales (user_id, id, at, amount) values ((select id from _bola), gen_random_uuid(), now(), 100);
    raise exception 'FAILED: inserted a sale into someone else''s books';
  exception when insufficient_privilege then raise notice 'ok - cannot add a sale to someone else''s books'; end;
end $$;
reset role;
select pg_temp.assert((select amount from public.sales where id = 'aaaaaaaa-0000-0000-0000-000000000002') = 100000 and (select count(*) from public.expenses) = 1, 'other users'' update and delete attempts on records changed nothing');
set role anon;
do $$ begin
  begin perform 1 from public.sales; raise exception 'FAILED: anon could read sales';
  exception when insufficient_privilege then raise notice 'ok - anonymous visitors cannot read sales'; end;
end $$;
reset role;

-- Deleting an account deletes its books.
delete from auth.users where email = 'bola@example.com';
select pg_temp.assert((select count(*) from public.sales) = 0 and (select count(*) from public.products) = 0 and (select count(*) from public.expenses) = 0, 'deleting an account deletes its records');

select 'ALL DATABASE CHECKS PASSED' as result;
