#!/usr/bin/env bash
# Builds the app against the fake Supabase, runs the backend browser test, and cleans up after itself.
set -euo pipefail
cd "$(dirname "$0")/.."
FAKE_PORT=${FAKE_PORT:-54321}; APP_PORT=${APP_PORT:-4174}
pids=()
cleanup() { for p in "${pids[@]}"; do kill "$p" 2>/dev/null || true; done; }
trap cleanup EXIT

node tools/fake-supabase.mjs "$FAKE_PORT" >/dev/null 2>&1 & pids+=($!)
VITE_SUPABASE_URL="http://localhost:$FAKE_PORT" VITE_SUPABASE_ANON_KEY=fake node node_modules/vite/bin/vite.js build --outDir dist-fake >/dev/null
# Run vite directly (not via npx) so $! is the server itself and cleanup really stops it.
node node_modules/vite/bin/vite.js preview --outDir dist-fake --port "$APP_PORT" >/dev/null 2>&1 & pids+=($!)
for _ in $(seq 1 50); do curl -sf "http://localhost:$APP_PORT" >/dev/null && break; sleep 0.2; done
APP_URL="http://localhost:$APP_PORT" FAKE_URL="http://localhost:$FAKE_PORT" node tools/check-backend.mjs
