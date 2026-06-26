#!/usr/bin/env bash
set -euo pipefail

# One-time migration helper for the stable release asset naming change.
# It uploads versionless aliases to the current latest release without
# modifying existing versioned assets or latest*.yml updater metadata.

repo="${REPO:-antonio-orionus/Arclio}"
tag="${1:-}"

if [[ -z "$tag" ]]; then
  tag="$(gh release view --repo "$repo" --json tagName --jq .tagName)"
fi

version="${tag#v}"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

assets="$(gh release view "$tag" --repo "$repo" --json assets --jq '.assets[].name')"

pairs=(
  "Arclio-Setup-${version}.exe|Arclio-win-x64-Setup.exe"
  "Arclio-Setup-${version}.exe.blockmap|Arclio-win-x64-Setup.exe.blockmap"
  "Arclio-Portable-${version}.exe|Arclio-win-x64-Portable.exe"
  "Arclio-${version}-arm64.dmg|Arclio-mac-arm64.dmg"
  "Arclio-${version}-arm64.dmg.blockmap|Arclio-mac-arm64.dmg.blockmap"
  "Arclio-${version}-x64.dmg|Arclio-mac-x64.dmg"
  "Arclio-${version}-x64.dmg.blockmap|Arclio-mac-x64.dmg.blockmap"
  "Arclio-${version}.AppImage|Arclio-linux-x64.AppImage"
  "Arclio-${version}.tar.gz|Arclio-linux-x64.tar.gz"
  "Arclio-${version}.flatpak|Arclio-linux-x64.flatpak"
)

uploaded=0

for pair in "${pairs[@]}"; do
  source_name="${pair%%|*}"
  alias_name="${pair##*|}"
  source_path="$tmp/$source_name"
  alias_path="$tmp/$alias_name"

  if grep -Fxq "$alias_name" <<<"$assets"; then
    echo "skip existing alias: $alias_name"
    continue
  fi

  if ! grep -Fxq "$source_name" <<<"$assets"; then
    echo "missing source asset: $source_name" >&2
    exit 1
  fi

  gh release download "$tag" \
    --repo "$repo" \
    --pattern "$source_name" \
    --dir "$tmp"

  mv "$source_path" "$alias_path"
  gh release upload "$tag" \
    --repo "$repo" \
    "$alias_path"
  rm -f "$alias_path"

  uploaded=$((uploaded + 1))
done

if (( uploaded == 0 )); then
  echo "all aliases already exist on $tag"
  exit 0
fi

echo "uploaded $uploaded alias asset(s) to $repo@$tag"
