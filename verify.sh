#!/usr/bin/env bash
# Runs every verification step for the FUPRE Campus Marketplace and records
# the real output in docs/verification-log.txt.
#
# Usage (Git Bash, from the project root):
#   bash verify.sh
#
# Nothing here is destructive: migrations and the seeder are non-destructive.

set -u
cd "$(dirname "$0")" || exit 1

ROOT="$(pwd)"
LOG="$ROOT/docs/verification-log.txt"
mkdir -p "$ROOT/docs"
: > "$LOG"

FAILURES=0

section() {
  printf '\n\n===== %s =====\n' "$1" | tee -a "$LOG"
}

run() {
  printf '\n$ %s\n' "$*" | tee -a "$LOG"
  "$@" 2>&1 | tee -a "$LOG"
  local status=${PIPESTATUS[0]}
  printf '[exit %s]\n' "$status" | tee -a "$LOG"
  if [ "$status" -ne 0 ]; then
    FAILURES=$((FAILURES + 1))
  fi
  return 0
}

section "Environment"
printf 'date: %s\n' "$(date)" | tee -a "$LOG"
printf 'pwd:  %s\n' "$ROOT" | tee -a "$LOG"
# Avoid a parent-level PYTHONPATH making api importable twice (as `api` and `backend.api`).
unset PYTHONPATH

PYTHON312="C:/Users/ALIVA-TECH/AppData/Local/Programs/Python/Python312/python.exe"
if [ ! -x "$PYTHON312" ]; then
  PYTHON312="$(command -v python3.12 || true)"
fi
printf 'python312: %s\n' "${PYTHON312:-not found}" | tee -a "$LOG"

section "Backend virtual environment"
cd "$ROOT/backend" || exit 1
if [ ! -x "venv/Scripts/python.exe" ]; then
  if [ -z "${PYTHON312:-}" ]; then
    printf 'Python 3.12 was not found. Install it or edit PYTHON312 in this script.\n' | tee -a "$LOG"
    FAILURES=$((FAILURES + 1))
  else
    run "$PYTHON312" -m venv venv
  fi
fi

if [ -x "venv/Scripts/python.exe" ]; then
  run ./venv/Scripts/python.exe --version
  run ./venv/Scripts/python.exe -m pip install --upgrade pip
  run ./venv/Scripts/python.exe -m pip install -r requirements.txt
else
  printf 'Virtual environment missing; skipping Python checks.\n' | tee -a "$LOG"
  FAILURES=$((FAILURES + 1))
fi

section "Django checks"
if [ -x "venv/Scripts/python.exe" ]; then
  run ./venv/Scripts/python.exe manage.py check
  run ./venv/Scripts/python.exe manage.py makemigrations --check --dry-run
  run ./venv/Scripts/python.exe manage.py migrate
  run ./venv/Scripts/python.exe manage.py seed_marketplace
  run ./venv/Scripts/python.exe manage.py shell -c "from api.models import User, Product, Message; print('users:', User.objects.count(), 'products:', Product.objects.count(), 'messages:', Message.objects.count())"
  run ./venv/Scripts/python.exe manage.py shell -c "from django.test import Client; response = Client().get('/api/health/'); print(response.status_code, response.json())"
  run ./venv/Scripts/python.exe manage.py test api.tests -v 2
fi

cd "$ROOT" || exit 1

section "Frontend"
if command -v npm >/dev/null 2>&1; then
  run npm --version
  cd "$ROOT/frontend" || exit 1
  run npm install
  run npm run build
  cd "$ROOT" || exit 1
else
  printf 'npm was not found on PATH.\n' | tee -a "$LOG"
  FAILURES=$((FAILURES + 1))
fi

section "Result"
if [ "$FAILURES" -eq 0 ]; then
  printf 'ALL COMMANDS EXITED 0\n' | tee -a "$LOG"
else
  printf '%s COMMAND(S) FAILED - read the log above.\n' "$FAILURES" | tee -a "$LOG"
fi
printf 'Log: %s\n' "$LOG" | tee -a "$LOG"
