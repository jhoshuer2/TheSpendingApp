#!/usr/bin/env bash
# Runs the database migration and its security tests against a DISPOSABLE Postgres.
#   PGURL=postgres://user@localhost:5432/spal_test npm run test:db
# Never point this at your real Supabase database: the test stubs refuse to run there, but don't rely on that.
set -euo pipefail
cd "$(dirname "$0")/.."
: "${PGURL:?Set PGURL to a throwaway Postgres database, e.g. postgres://me@localhost:5432/spal_test}"
files=(-f supabase/tests/stub-auth.sql)
for m in supabase/migrations/*.sql; do files+=(-f "$m"); done
files+=(-f supabase/tests/rls.sql)
psql "$PGURL" -v ON_ERROR_STOP=1 -qtA "${files[@]}" 2>&1 | grep -E "NOTICE|ERROR|PASSED|FAILED" | sed 's/psql:[^ ]* NOTICE:  //'
