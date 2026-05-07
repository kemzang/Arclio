#!/usr/bin/env bash
# Shared helpers for fetch-embedded.sh (build) and smoke-all.sh (CI smoke).
# Source from another script:  source "$(dirname "$0")/path/to/_lib.sh"

PASS=0
FAIL=0
WARN=0
declare -a ISSUES=()

note()  { echo "[ .. ] $*"; }
ok()    { echo "[ OK ] $*"; PASS=$((PASS+1)); }
fail()  { echo "[FAIL] $*"; FAIL=$((FAIL+1)); ISSUES+=("FAIL: $*"); }
warn()  { echo "[WARN] $*"; WARN=$((WARN+1)); ISSUES+=("WARN: $*"); }

# fetch URL into FILE. Follow redirects. Print failure on non-200.
# usage: fetch URL FILE
fetch() {
  local url="$1" file="$2"
  if [[ -f "$file" && -s "$file" ]]; then return 0; fi
  mkdir -p "$(dirname "$file")"
  local code
  code=$(curl -fsSL --retry 3 --retry-delay 2 -o "$file" -w '%{http_code}' "$url" 2>/dev/null) || {
    fail "fetch $url (http=$code)"
    rm -f "$file"
    return 1
  }
  return 0
}

# verify file SHA matches expected hex
# usage: verify_sha FILE EXPECTED LABEL
verify_sha() {
  local file="$1" expected="$2" label="$3"
  local actual
  actual=$(sha256sum "$file" | awk '{print $1}')
  if [[ "$actual" == "$expected" ]]; then
    ok "sha256 match: $label"
  else
    fail "sha256 mismatch: $label (expected ${expected:0:8}.., got ${actual:0:8}..)"
    return 1
  fi
}

# parse "<sha>  <name>" SHA2-256SUMS for a given asset
# usage: sha_for_asset SUMS_FILE ASSET_NAME
sha_for_asset() {
  local sums="$1" asset="$2"
  awk -v a="$asset" '$2==a {print $1; exit}' "$sums"
}

# extract zip into dir
# usage: extract_zip ZIP DIR
extract_zip() {
  local zip="$1" dir="$2"
  mkdir -p "$dir"
  unzip -q -o "$zip" -d "$dir" || return 1
}

# extract tar.xz into dir
# usage: extract_tarxz ARCHIVE DIR
extract_tarxz() {
  local arc="$1" dir="$2"
  mkdir -p "$dir"
  tar -xJf "$arc" -C "$dir" || return 1
}

# check inner-binary magic bytes match expected target
# usage: check_magic FILE EXPECTED_PATTERN LABEL
check_magic() {
  local file="$1" pattern="$2" label="$3"
  if [[ ! -f "$file" ]]; then fail "missing inner binary: $label ($file)"; return; fi
  local desc
  desc=$(file -b "$file")
  if [[ "$desc" =~ $pattern ]]; then
    ok "magic: $label — $desc"
  else
    fail "magic mismatch: $label — got '$desc', wanted /$pattern/"
  fi
}
