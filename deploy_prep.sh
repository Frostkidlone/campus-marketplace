#!/usr/bin/env bash
# Prepares the local Git repository for deployment on Render + Vercel.
# Does NOT create the GitHub repository or push anything; those steps are
# performed by the user (see docs/DEPLOYMENT.md).
#
# Usage:
#   bash deploy_prep.sh

set -u
cd "$(dirname "$0")" || exit 1

if [ ! -d .git ]; then
  git init -b main || exit 1
  printf 'Initialised a new Git repository on branch main.\n'
else
  printf 'Git repository already exists.\n'
fi

git add . || exit 1
if git diff --cached --quiet; then
  printf 'Nothing new to commit.\n'
else
  git commit -m "FUPRE Campus Marketplace: final-year project submission

Co-Authored-By: Claude Code <noreply@anthropic.com>" || exit 1
fi

printf '\nLatest commit:\n'
git log --oneline -1
printf '\nNext: create an empty repository on github.com, then run:\n'
printf '  git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git\n'
printf '  git push -u origin main\n'
