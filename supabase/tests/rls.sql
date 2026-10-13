-- Proves the security rules. Run after stub-auth.sql and the migration, on a disposable Postgres:
--   psql -v ON_ERROR_STOP=1 -f supabase/tests/stub-auth.sql -f supabase/migrations/*.sql -f supabase/tests/rls.sql
-- Every check raises an exception on failure; reaching the last line means all passed.

create temp table _ids as select gen_random_uuid() as ada, gen_random_uuid() as kemi;
grant select on _ids to authenticated, anon, service_role;

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

-- Assistant limits: only the server (service role) can use them, and they hold.
insert into auth.users (id, email) values (gen_random_uuid(), 'quota@example.com');
create temp table _quota_user as select id from auth.users where email = 'quota@example.com';
grant select on _quota_user to service_role;
select pg_temp.as_user((select kemi from _ids));
do $$ begin
  begin perform public.assistant_take_quota(auth.uid(), 5, 100); raise exception 'FAILED: a signed-in user called assistant_take_quota';
  exception when insufficient_privilege then raise notice 'ok - signed-in users cannot touch the assistant quota'; end;
  begin perform 1 from public.assistant_usage; raise exception 'FAILED: a user read assistant_usage';
  exception when insufficient_privilege then raise notice 'ok - signed-in users cannot read assistant usage'; end;
end $$;
reset role;
set role service_role;
select pg_temp.assert(public.assistant_take_quota((select id from _quota_user), 2, 100) = 'ok', 'first message is allowed');
select pg_temp.assert(public.assistant_take_quota((select id from _quota_user), 2, 100) = 'ok', 'second message is allowed');
select pg_temp.assert(public.assistant_take_quota((select id from _quota_user), 2, 100) = 'user_limit', 'third message is refused at the personal limit');
select pg_temp.assert(public.assistant_take_quota((select id from _quota_user), 2, 100) = 'user_limit', 'refused messages do not count up');
select pg_temp.assert((select messages from public.assistant_usage_global) = 2, 'refused messages give the shared slot back');
select pg_temp.assert(public.assistant_take_quota((select kemi from _ids), 5, 2) = 'global_limit', 'the shared daily limit stops everyone');
select pg_temp.assert((select count(*) from public.assistant_usage where user_id = (select kemi from _ids)) = 0, 'a global refusal does not count against the person');
select public.assistant_record_usage((select id from _quota_user), 1000, 200, 800);
select public.assistant_record_usage((select id from _quota_user), 500, 100, -5);
select pg_temp.assert((select input_tokens from public.assistant_usage where user_id = (select id from _quota_user)) = 1500 and (select cache_read_tokens from public.assistant_usage where user_id = (select id from _quota_user)) = 800, 'token usage adds up and ignores negatives');
update public.assistant_usage set day = day - 1;
update public.assistant_usage_global set day = day - 1;
select pg_temp.assert(public.assistant_take_quota((select id from _quota_user), 2, 100) = 'ok', 'a new day starts a fresh allowance');
reset role;

-- 9. Customers: private, bounded, idempotent.
create temp table _cust as select gen_random_uuid() as owner_a, gen_random_uuid() as owner_b, gen_random_uuid() as cid;
grant select on _cust to authenticated, anon, service_role;
insert into auth.users (id, email) select owner_a, 'cust-a@example.com' from _cust;
insert into auth.users (id, email) select owner_b, 'cust-b@example.com' from _cust;
select pg_temp.as_user((select owner_a from _cust));
insert into public.customers (user_id, id, name, phone, note) values (auth.uid(), (select cid from _cust), 'Chidi Okeke', '0803 123 4567', 'Pays on Fridays');
insert into public.customers (user_id, id, name, phone) values (auth.uid(), (select cid from _cust), 'Chidi Okeke', '+234 803 123 4567')
  on conflict (user_id, id) do update set phone = excluded.phone;
select pg_temp.assert((select count(*) from public.customers) = 1 and (select phone from public.customers) = '+234 803 123 4567', 'a customer can be saved twice without duplicating (retries are safe)');
do $$ begin
  begin insert into public.customers (user_id, id, name) values (auth.uid(), gen_random_uuid(), '');
    raise exception 'FAILED: accepted a customer with no name';
  exception when check_violation then raise notice 'ok - rejects a customer with no name'; end;
  begin insert into public.customers (user_id, id, name, phone) values (auth.uid(), gen_random_uuid(), 'X', 'call me maybe');
    raise exception 'FAILED: accepted letters in a phone number';
  exception when check_violation then raise notice 'ok - rejects letters in a phone number'; end;
  begin insert into public.customers (user_id, id, name, phone) values (auth.uid(), gen_random_uuid(), 'X', repeat('1', 21));
    raise exception 'FAILED: accepted a 21-digit phone number';
  exception when check_violation then raise notice 'ok - rejects an over-long phone number'; end;
  begin insert into public.customers (user_id, id, name, note) values (auth.uid(), gen_random_uuid(), 'X', repeat('n', 201));
    raise exception 'FAILED: accepted a 201-character note';
  exception when check_violation then raise notice 'ok - rejects an over-long note'; end;
  begin insert into public.customers (user_id, id, name) values ((select owner_b from _cust), gen_random_uuid(), 'Forged');
    raise exception 'FAILED: added a customer to someone else''s book';
  exception when insufficient_privilege then raise notice 'ok - cannot add a customer to someone else''s book'; end;
end $$;
reset role;
select pg_temp.as_user((select owner_b from _cust));
select pg_temp.assert((select count(*) from public.customers) = 0, 'customers are invisible to other users');
update public.customers set name = 'hacked' where true;
delete from public.customers where true;
reset role;
select pg_temp.assert((select name from public.customers where id = (select cid from _cust)) = 'Chidi Okeke', 'other users'' update and delete attempts on customers changed nothing');
set role anon;
do $$ begin
  begin perform 1 from public.customers; raise exception 'FAILED: anon could read customers';
  exception when insufficient_privilege then raise notice 'ok - anonymous visitors cannot read customers'; end;
end $$;
reset role;
select pg_temp.assert((select updated_at from public.customers where id = (select cid from _cust)) <= now(), 'the server sets updated_at on customers');
delete from auth.users where id = (select owner_a from _cust);
select pg_temp.assert((select count(*) from public.customers) = 0, 'deleting an account deletes its customers');

-- 10. Business facts live in the profile's answers: they fit, and the size limit still holds.
insert into auth.users (id, email) values (gen_random_uuid(), 'facts@example.com');
create temp table _facts_user as select id from auth.users where email = 'facts@example.com';
grant select on _facts_user to authenticated;
select pg_temp.as_user((select id from _facts_user));
update public.profiles set answers = jsonb_build_object('stage', 'y1to3', 'businessName', repeat('b', 60), 'about', repeat('a', 200), 'place', repeat('p', 100), 'hours', repeat('h', 100), 'instagram', repeat('i', 30)) where id = (select id from _facts_user);
select pg_temp.assert((select answers->>'instagram' from public.profiles where id = (select id from _facts_user)) = repeat('i', 30), 'business facts fit in the profile answers');
do $$ begin
  begin update public.profiles set answers = jsonb_build_object('about', repeat('x', 5000)) where id = (select id from _facts_user);
    raise exception 'FAILED: accepted 5000 characters of answers';
  exception when check_violation then raise notice 'ok - the size limit on answers still holds'; end;
end $$;
reset role;

-- 11. Stock counts on products: optional, bounded, and a count always has its time.
insert into auth.users (id, email) values (gen_random_uuid(), 'stock@example.com');
create temp table _stock_user as select id from auth.users where email = 'stock@example.com';
grant select on _stock_user to authenticated;
select pg_temp.as_user((select id from _stock_user));
insert into public.products (user_id, id, name, price) values (auth.uid(), 'cccccccc-0000-0000-0000-000000000001', 'Rice (bag)', 5000000);
select pg_temp.assert((select stock is null and counted_at is null and low_at is null from public.products where id = 'cccccccc-0000-0000-0000-000000000001'), 'products need no stock count (existing products are unchanged)');
update public.products set stock = 20, counted_at = now(), low_at = 5 where id = 'cccccccc-0000-0000-0000-000000000001';
select pg_temp.assert((select stock = 20 and low_at = 5 from public.products where id = 'cccccccc-0000-0000-0000-000000000001'), 'a product can have a stock count and a low level');
update public.products set stock = 0, counted_at = now() where id = 'cccccccc-0000-0000-0000-000000000001';
select pg_temp.assert((select stock = 0 from public.products where id = 'cccccccc-0000-0000-0000-000000000001'), 'a count of zero is allowed (out of stock)');
do $$ begin
  begin update public.products set stock = -1, counted_at = now() where id = 'cccccccc-0000-0000-0000-000000000001';
    raise exception 'FAILED: accepted a negative count';
  exception when check_violation then raise notice 'ok - rejects a negative count'; end;
  begin update public.products set stock = 1000001, counted_at = now() where id = 'cccccccc-0000-0000-0000-000000000001';
    raise exception 'FAILED: accepted a count over a million';
  exception when check_violation then raise notice 'ok - rejects a count over a million'; end;
  begin update public.products set low_at = -2 where id = 'cccccccc-0000-0000-0000-000000000001';
    raise exception 'FAILED: accepted a negative low level';
  exception when check_violation then raise notice 'ok - rejects a negative low level'; end;
  begin update public.products set stock = 5, counted_at = null where id = 'cccccccc-0000-0000-0000-000000000001';
    raise exception 'FAILED: accepted a count with no time';
  exception when check_violation then raise notice 'ok - rejects a count without the time it was taken'; end;
  begin update public.products set stock = null where id = 'cccccccc-0000-0000-0000-000000000001';
    raise exception 'FAILED: accepted a time with no count';
  exception when check_violation then raise notice 'ok - rejects a time without a count'; end;
end $$;
update public.products set stock = null, counted_at = null where id = 'cccccccc-0000-0000-0000-000000000001';
select pg_temp.assert((select stock is null from public.products where id = 'cccccccc-0000-0000-0000-000000000001'), 'stopping tracking clears the count');
reset role;
delete from auth.users where id = (select id from _stock_user);

-- Deleting an account deletes its books.
delete from auth.users where email = 'bola@example.com';
select pg_temp.assert((select count(*) from public.sales) = 0 and (select count(*) from public.products) = 0 and (select count(*) from public.expenses) = 0, 'deleting an account deletes its records');

select 'ALL DATABASE CHECKS PASSED' as result;
