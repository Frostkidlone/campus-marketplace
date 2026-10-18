#!/usr/bin/env bash
# Stops the portable PostgreSQL server started by setup_postgres.sh.
# The database files in tools/pgdata are kept; start it again with:
#   tools/pgsql/bin/pg_ctl -D tools/pgdata -o "-p 5433" start

set -u
ROOT="$(cd "$(dirname "$0")" && pwd)"
DATA_DIR="$ROOT/tools/pgdata"
PG_CTL="$ROOT/tools/pgsql/bin/pg_ctl.exe"

if [ ! -x "$PG_CTL" ] || [ ! -f "$DATA_DIR/PG_VERSION" ]; then
  printf 'No portable PostgreSQL cluster found under tools/.\n'
  exit 0
fi

if "$PG_CTL" -D "$DATA_DIR" status >/dev/null 2>&1; then
  "$PG_CTL" -D "$DATA_DIR" stop -m fast
  printf 'PostgreSQL stopped.\n'
else
  printf 'PostgreSQL is not running.\n'
fi
