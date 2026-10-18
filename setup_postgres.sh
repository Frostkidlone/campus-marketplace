#!/usr/bin/env bash
# Sets up a real, local PostgreSQL server for the FUPRE Campus Marketplace
# WITHOUT requiring administrator rights, then runs the full backend against it.
#
# It downloads the official EnterpriseDB portable Windows binaries into
# tools/ (excluded from the submission ZIP), initialises a database cluster in
# tools/pgdata, starts the server, creates the database, writes DATABASE_URL to
# backend/.env, and runs migrate + seed + health check + the test suite.
#
# Usage (Git Bash, from the project root):
#   bash setup_postgres.sh              # PostgreSQL on port 5433
#   PG_PORT=5544 bash setup_postgres.sh # custom port
#   bash stop_postgres.sh               # stop the server later
#
# Requirements: curl (bundled with Windows 10+), Python 3.x for unzip.

set -u

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT" || exit 1
unset PYTHONPATH

PG_PORT="${PG_PORT:-5433}"
DB_NAME="campus_marketplace"
DB_USER="postgres"
DB_PASS="postgres"
PG_DIR="$ROOT/tools/pgsql"
DATA_DIR="$ROOT/tools/pgdata"
ZIP="$ROOT/tools/pg-binaries.zip"

FAILURES=0
step() { printf '\n===== %s =====\n' "$1"; }
fail() { printf 'ERROR: %s\n' "$1"; exit 1; }

mkdir -p "$ROOT/tools"

# ---------------------------------------------------------------------------
# 1. Python for ZIP extraction (the Django venv lives at backend/venv).
# ---------------------------------------------------------------------------
PY=""
for candidate in \
  "$ROOT/backend/venv/Scripts/python.exe" \
  "C:/Users/ALIVA-TECH/AppData/Local/Programs/Python/Python312/python.exe" \
  "python"
do
  if [ -x "$candidate" ] || command -v "$candidate" >/dev/null 2>&1; then
    PY="$candidate"
    break
  fi
done
[ -n "$PY" ] || fail "Python was not found; install Python 3.10-3.12 first."

# ---------------------------------------------------------------------------
# 2. Download portable PostgreSQL binaries (only once).
# ---------------------------------------------------------------------------
if [ ! -x "$PG_DIR/bin/initdb.exe" ]; then
  step "Downloading PostgreSQL binaries"
  URLS=(
    "https://get.enterprisedb.com/postgresql/postgresql-16.4-1-windows-x64-binaries.zip"
    "https://get.enterprisedb.com/postgresql/postgresql-16.2-1-windows-x64-binaries.zip"
    "https://get.enterprisedb.com/postgresql/postgresql-15.6-1-windows-x64-binaries.zip"
  )
  DOWNLOADED=0
  for url in "${URLS[@]}"; do
    printf 'Trying %s\n' "$url"
    if curl -fL --retry 2 --connect-timeout 30 -o "$ZIP" "$url"; then
      DOWNLOADED=1
      break
    fi
    printf 'Not available: %s\n' "$url"
  done
  [ "$DOWNLOADED" -eq 1 ] || fail "Could not download PostgreSQL binaries. Check the internet connection."

  rm -rf "$PG_DIR"
  "$PY" -m zipfile -e "$ZIP" "$ROOT/tools" || fail "Could not extract $ZIP"
  rm -f "$ZIP"
  [ -x "$PG_DIR/bin/initdb.exe" ] || fail "Extraction did not produce tools/pgsql/bin/initdb.exe"
else
  printf 'PostgreSQL binaries already present at %s\n' "$PG_DIR"
fi

# ---------------------------------------------------------------------------
# 3. Initialise the database cluster (only once). Trust auth on loopback only;
#    the server listens on localhost, which is sufficient for local testing.
# ---------------------------------------------------------------------------
if [ ! -f "$DATA_DIR/PG_VERSION" ]; then
  step "Initialising database cluster"
  printf '%s\n' "$DB_PASS" > "$ROOT/tools/pgpass.txt"
  "$PG_DIR/bin/initdb.exe" -D "$DATA_DIR" -U "$DB_USER" \
    --pwfile="$ROOT/tools/pgpass.txt" --auth=md5 --encoding=UTF8 --locale=C \
    || fail "initdb failed."
  rm -f "$ROOT/tools/pgpass.txt"
else
  printf 'Database cluster already initialised at %s\n' "$DATA_DIR"
fi

# ---------------------------------------------------------------------------
# 4. Start the server (skip if already running).
# ---------------------------------------------------------------------------
step "Starting PostgreSQL on port $PG_PORT"
if "$PG_DIR/bin/pg_ctl.exe" -D "$DATA_DIR" status >/dev/null 2>&1; then
  printf 'Server already running.\n'
else
  "$PG_DIR/bin/pg_ctl.exe" -D "$DATA_DIR" -l "$ROOT/tools/postgres.log" \
    -o "-p $PG_PORT" start || fail "PostgreSQL failed to start. See tools/postgres.log"
  sleep 2
fi

# ---------------------------------------------------------------------------
# 5. Create the application database if it does not exist.
# ---------------------------------------------------------------------------
step "Creating database $DB_NAME"
export PGPASSWORD="$DB_PASS"
EXISTS="$("$PG_DIR/bin/psql.exe" -h 127.0.0.1 -p "$PG_PORT" -U "$DB_USER" \
  -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" 2>/dev/null | tr -d '[:space:]')"
if [ "$EXISTS" = "1" ]; then
  printf 'Database already exists.\n'
else
  "$PG_DIR/bin/createdb.exe" -h 127.0.0.1 -p "$PG_PORT" -U "$DB_USER" "$DB_NAME" \
    || fail "createdb failed."
fi

# ---------------------------------------------------------------------------
# 6. Point backend/.env at this server (preserving unrelated settings).
# ---------------------------------------------------------------------------
step "Writing DATABASE_URL to backend/.env"
ENV_FILE="$ROOT/backend/.env"
touch "$ENV_FILE"
grep -v -E '^(DATABASE_URL|DB_SSL)=' "$ENV_FILE" > "$ENV_FILE.tmp" || true
mv "$ENV_FILE.tmp" "$ENV_FILE"
{
  printf 'DATABASE_URL=postgres://%s:%s@127.0.0.1:%s/%s\n' "$DB_USER" "$DB_PASS" "$PG_PORT" "$DB_NAME"
  printf 'DB_SSL=False\n'
} >> "$ENV_FILE"
printf 'DATABASE_URL=postgres://%s:****@127.0.0.1:%s/%s\n' "$DB_USER" "$PG_PORT" "$DB_NAME"

# ---------------------------------------------------------------------------
# 7. Run the Django checks against PostgreSQL.
# ---------------------------------------------------------------------------
cd "$ROOT/backend" || exit 1
PYBIN="./venv/Scripts/python.exe"
[ -x "$PYBIN" ] || fail "backend/venv is missing. Run 'bash verify.sh' first to create it."

run() {
  printf '\n$ %s\n' "$*"
  "$@"
  local status=$?
  if [ "$status" -ne 0 ]; then
    FAILURES=$((FAILURES + 1))
    printf '[exit %s]\n' "$status"
  fi
  return 0
}

step "Django against PostgreSQL"
run "$PYBIN" manage.py migrate
run "$PYBIN" manage.py seed_marketplace
run "$PYBIN" manage.py shell -c "from django.test import Client; response = Client().get('/api/health/'); print(response.status_code, response.json())"
run "$PYBIN" manage.py shell -c "from api.models import User, Product, Message; print('users:', User.objects.count(), 'products:', Product.objects.count(), 'messages:', Message.objects.count())"
run "$PYBIN" manage.py test api.tests -v 2

step "Result"
if [ "$FAILURES" -eq 0 ]; then
  printf 'POSTGRESQL SETUP AND TESTS COMPLETED\n'
  printf 'Server: %s (port %s)\n' "$DATA_DIR" "$PG_PORT"
  printf 'Stop it with: bash stop_postgres.sh\n'
else
  printf '%s COMMAND(S) FAILED - read the output above.\n' "$FAILURES"
fi
