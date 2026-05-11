#!/usr/bin/env bash
# Resume the development branch after a stable release.
#
# Usage:
#   scripts/release-resume-dev.sh
#   scripts/release-resume-dev.sh 0.4.0-beta.1
#   scripts/release-resume-dev.sh --verify-only
#   scripts/release-resume-dev.sh 0.4.0-beta.1 --verify-only
#
# What it does:
#   - requires a clean worktree
#   - fetches origin/main + origin/dev
#   - requires origin/dev to be contained in origin/main
#   - fast-forwards local dev to origin/main
#   - sets package.json to the next beta version (patch+1 beta.1 by default)
#   - commits and pushes dev
set -euo pipefail

NEXT_VERSION=""
VERIFY_ONLY=false
for arg in "$@"; do
  case "$arg" in
    --verify-only)
      VERIFY_ONLY=true
      ;;
    -*)
      echo "usage: $0 [next-beta-version, e.g. 0.4.0-beta.1] [--verify-only]" >&2
      exit 1
      ;;
    *)
      if [[ -n "$NEXT_VERSION" ]]; then
        echo "usage: $0 [next-beta-version, e.g. 0.4.0-beta.1] [--verify-only]" >&2
        exit 1
      fi
      NEXT_VERSION="$arg"
      ;;
  esac
done

ROOT=$(git rev-parse --show-toplevel)
cd "$ROOT"

git fetch --quiet origin \
  "+refs/heads/main:refs/remotes/origin/main" \
  "+refs/heads/dev:refs/remotes/origin/dev"

if ! git rev-parse --verify origin/main >/dev/null 2>&1; then
  echo "ERR: could not resolve origin/main." >&2
  exit 1
fi
if ! git rev-parse --verify origin/dev >/dev/null 2>&1; then
  echo "ERR: could not resolve origin/dev." >&2
  exit 1
fi

if ! git merge-base --is-ancestor origin/dev origin/main; then
  echo "ERR: origin/dev contains commits that are not in origin/main." >&2
  echo "     Promote dev to main before starting the next beta line." >&2
  exit 1
fi

MAIN_VERSION=$(git show origin/main:package.json | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).version))")
if [[ "$MAIN_VERSION" == *-* ]]; then
  echo "ERR: origin/main package.json version is not stable ($MAIN_VERSION)." >&2
  exit 1
fi
if ! [[ "$MAIN_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "ERR: origin/main package.json version must look like 0.3.2 (got '$MAIN_VERSION')." >&2
  exit 1
fi

if [[ -z "$NEXT_VERSION" ]]; then
  IFS=. read -r MAJOR MINOR PATCH <<<"$MAIN_VERSION"
  NEXT_VERSION="$MAJOR.$MINOR.$((PATCH + 1))-beta.1"
else
  if ! [[ "$NEXT_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+-beta\.[0-9]+$ ]]; then
    echo "ERR: next version must look like 0.3.3-beta.1 (got '$NEXT_VERSION')" >&2
    exit 1
  fi
fi

if [[ "$NEXT_VERSION" == "$MAIN_VERSION" ]]; then
  echo "ERR: next beta version must differ from current stable version ($MAIN_VERSION)." >&2
  exit 1
fi

if [[ "$VERIFY_ONLY" == true ]]; then
  echo "✓ release:resume-dev would start $NEXT_VERSION from stable $MAIN_VERSION"
  exit 0
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "ERR: working tree dirty. Commit or discard changes before resuming dev." >&2
  git status --short >&2
  exit 1
fi

if git show-ref --verify --quiet refs/heads/dev; then
  git switch dev
else
  git switch -c dev --track origin/dev
fi
git merge --ff-only origin/dev

LOCAL_DEV=$(git rev-parse HEAD)
REMOTE_DEV=$(git rev-parse origin/dev)
if [[ "$LOCAL_DEV" != "$REMOTE_DEV" ]]; then
  echo "ERR: local dev differs from origin/dev after update." >&2
  echo "     Push or remove local-only dev commits before resuming dev." >&2
  exit 1
fi

git merge --ff-only origin/main

node -e "
  const fs = require('fs');
  const path = 'package.json';
  const pkg = JSON.parse(fs.readFileSync(path, 'utf8'));
  pkg.version = process.argv[1];
  fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n');
" "$NEXT_VERSION"

git add package.json
git commit -m "release: start $NEXT_VERSION"
git push origin dev

echo
echo "✓ dev resumed at $NEXT_VERSION"
