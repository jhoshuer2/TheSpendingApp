-- SPAL learning from use: a small amount of activity data, stored with the person's own rows.
-- Existing rows and the existing app keep working: every new column has a default or allows null.
-- No raw event log: only the dates a person was active, when they last opened the app, and per-step
-- timestamps and "not now / not for me" choices. Everything shown in the app is worked out from these.

alter table public.profiles
  add column learning    boolean     not null default true,
  add column active_days date[]      not null default '{}' check (cardinality(active_days) <= 90),
  add column last_seen   timestamptz;

alter table public.step_progress
  add column opened_at     timestamptz,
  add column snoozed_until timestamptz,
  add column dismissed     boolean not null default false;

-- Row-level security already covers whole rows, so the new columns are protected by the existing policies.
