#!/usr/bin/env bash
# Tag + push a release. Refuses every common footgun:
#   - wrong branch (beta must come from dev, stable from main)
#   - dirty working tree
#   - version/mode mismatch (beta tag w/o -, stable tag with -)
#   - duplicate tag (local or remote)
#   - lightweight tag (always uses -a, annotated)
#   - forgotten --follow-tags
#
# Usage:
#   scripts/release.sh beta     # for v*-beta.N tags from dev
#   scripts/release.sh stable   # for v* tags from main
set -euo pipefail

MODE="${1:?usage: $0 beta|stable}"

case "$MODE" in
  beta)   EXPECTED_BRANCH=dev ;;
  stable) EXPECTED_BRANCH=main ;;
  *) echo "mode must be 'beta' or 'stable' (got '$MODE')" >&2; exit 1 ;;
esac

# 1. branch check
BRANCH=$(git symbolic-ref --short HEAD 2>/dev/null || echo '<detached>')
if [[ "$BRANCH" != "$EXPECTED_BRANCH" ]]; then
  echo "ERR: $MODE release must be cut from '$EXPECTED_BRANCH' (currently on '$BRANCH')" >&2
  exit 1
fi

# 2. working tree must be clean
if [[ -n "$(git status --porcelain)" ]]; then
  echo "ERR: working tree dirty. Commit or discard changes before tagging." >&2
  git status --short >&2
  exit 1
fi

# 3. branch must be in sync w/ origin (no unpushed commits, no commits behind)
git fetch --quiet origin "$BRANCH" 2>/dev/null || true
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse "origin/$BRANCH" 2>/dev/null || echo '')
if [[ -n "$REMOTE" && "$LOCAL" != "$REMOTE" ]]; then
  AHEAD=$(git rev-list --count "origin/$BRANCH..HEAD")
  BEHIND=$(git rev-list --count "HEAD..origin/$BRANCH")
  if (( BEHIND > 0 )); then
    echo "ERR: local '$BRANCH' is $BEHIND commit(s) behind origin/$BRANCH. Pull first." >&2
    exit 1
  fi
  if (( AHEAD > 0 )); then
    echo "Note: local '$BRANCH' is $AHEAD commit(s) ahead of origin/$BRANCH — git push --follow-tags will push them with the tag."
  fi
fi

# 4. read package.json version + validate shape matches mode
VERSION=$(node -p "require('./package.json').version")
case "$MODE" in
  beta)
    if [[ "$VERSION" != *-* ]]; then
      echo "ERR: package.json version '$VERSION' has no '-' suffix — must be a pre-release semver (e.g. 0.4.0-beta.1) for beta mode" >&2
      exit 1
    fi
    ;;
  stable)
    if [[ "$VERSION" == *-* ]]; then
      echo "ERR: package.json version '$VERSION' contains '-' — strip the pre-release suffix for stable mode" >&2
      exit 1
    fi
    ;;
esac

TAG="v$VERSION"

# 5. tag must not already exist locally or on remote
if git rev-parse "$TAG" >/dev/null 2>&1; then
  echo "ERR: tag '$TAG' already exists locally. Bump package.json version or delete the tag." >&2
  exit 1
fi
if git ls-remote --exit-code --tags origin "$TAG" >/dev/null 2>&1; then
  echo "ERR: tag '$TAG' already on remote. Bump package.json version." >&2
  exit 1
fi

# 6. annotated tag + push branch + tag in one shot
echo "Tagging $TAG (annotated) on '$BRANCH'…"
git tag -a "$TAG" -m "release $VERSION"

echo "Pushing branch + tag…"
git push --follow-tags

echo
echo "✓ pushed $TAG"
echo "  watch CI:  gh run watch"
echo "  release:   https://github.com/antonio-orionus/Arroxy/releases/tag/$TAG"
