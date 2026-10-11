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

select 'ALL DATABASE CHECKS PASSED' as result;
