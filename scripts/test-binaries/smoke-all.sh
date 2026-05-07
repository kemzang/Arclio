#!/usr/bin/env bash
# Smoke test: download every asset BinaryManager.ts can fetch, across all
# (platform, arch). Verify checksum where one is published. Run `file` on
# the inner executable to confirm magic bytes match the target platform.
#
# Asset matrix mirrors src/main/services/BinaryManager.ts. If you change
# URLs or asset names there, mirror the change here.
set -u
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OUT="$ROOT/test-binaries"
mkdir -p "$OUT"

source "$(dirname "$0")/_lib.sh"

##########################################################################
# yt-dlp — nightly + stable, 5 unique assets each
##########################################################################
echo
echo '########## yt-dlp ##########'

declare -A YTDLP_ASSETS=(
  [win32-x64]=yt-dlp.exe
  [win32-arm64]=yt-dlp.exe
  [darwin-x64]=yt-dlp_macos
  [darwin-arm64]=yt-dlp_macos
  [linux-x64]=yt-dlp_linux
  [linux-arm64]=yt-dlp_linux_aarch64
)

for channel in nightly stable; do
  if [[ "$channel" == nightly ]]; then
    base=https://github.com/yt-dlp/yt-dlp-nightly-builds/releases/latest/download
  else
    base=https://github.com/yt-dlp/yt-dlp/releases/latest/download
  fi
  sums="$OUT/yt-dlp/$channel/SHA2-256SUMS"
  fetch "$base/SHA2-256SUMS" "$sums" || continue
  ok "fetched $channel SHA2-256SUMS"

  declare -A seen_assets=()
  for combo in "${!YTDLP_ASSETS[@]}"; do
    asset="${YTDLP_ASSETS[$combo]}"
    [[ -n "${seen_assets[$asset]:-}" ]] && continue
    seen_assets[$asset]=1
    target="$OUT/yt-dlp/$channel/$asset"
    note "fetching $channel/$asset"
    fetch "$base/$asset" "$target" || continue
    expected=$(sha_for_asset "$sums" "$asset")
    if [[ -z "$expected" ]]; then
      warn "no SHA listed for $channel/$asset"
    else
      verify_sha "$target" "$expected" "$channel/$asset"
    fi
    case "$asset" in
      yt-dlp.exe)               check_magic "$target" 'PE32(\+)? executable.*Windows' "$channel/$asset" ;;
      yt-dlp_macos|yt-dlp_macos_legacy) check_magic "$target" 'Mach-O' "$channel/$asset" ;;
      yt-dlp_linux*)            check_magic "$target" 'ELF.*executable' "$channel/$asset" ;;
    esac
  done
done

##########################################################################
# ffmpeg — eugeneware/ffmpeg-static b6.0 (linux + darwin, x64 + arm64)
##########################################################################
echo
echo '########## ffmpeg-static (eugeneware b6.0) ##########'

EUGENE_BASE=https://github.com/eugeneware/ffmpeg-static/releases/download/b6.0
for combo in linux-x64 linux-arm64 darwin-x64 darwin-arm64; do
  asset="ffmpeg-$combo"
  target="$OUT/ffmpeg-static/$combo/ffmpeg"
  note "fetching $asset"
  fetch "$EUGENE_BASE/$asset" "$target" || continue
  shafile="$target.sha256"
  if curl -fsSL "$EUGENE_BASE/$asset.sha256" -o "$shafile" 2>/dev/null; then
    expected=$(awk '{print $1; exit}' "$shafile")
    verify_sha "$target" "$expected" "$asset"
  else
    warn "no .sha256 sibling for $asset (eugeneware drops these for some assets)"
  fi
  case "$combo" in
    linux-*)  check_magic "$target" 'ELF.*executable' "$asset" ;;
    darwin-*) check_magic "$target" 'Mach-O' "$asset" ;;
  esac
done

##########################################################################
# BtbN — Linux ffprobe tar.xz (x64 + arm64)
##########################################################################
echo
echo '########## BtbN Linux ffprobe (tar.xz) ##########'

BTBN_BASE=https://github.com/BtbN/FFmpeg-Builds/releases/download/latest
btbn_sums="$OUT/btbn/checksums.sha256"
fetch "$BTBN_BASE/checksums.sha256" "$btbn_sums" || true

for combo in linux64-gpl linuxarm64-gpl; do
  asset="ffmpeg-master-latest-$combo.tar.xz"
  target="$OUT/btbn-linux/$combo/$asset"
  note "fetching $asset"
  fetch "$BTBN_BASE/$asset" "$target" || continue
  expected=$(sha_for_asset "$btbn_sums" "$asset")
  if [[ -z "$expected" ]]; then
    warn "no SHA for $asset in BtbN checksums.sha256"
  else
    verify_sha "$target" "$expected" "$asset"
  fi
  extract_dir="$OUT/btbn-linux/$combo/extracted"
  rm -rf "$extract_dir"
  if extract_tarxz "$target" "$extract_dir"; then
    ok "extracted $asset"
    inner=$(find "$extract_dir" -type f -name ffprobe | head -1)
    if [[ -n "$inner" ]]; then
      check_magic "$inner" 'ELF.*executable' "$asset/ffprobe"
    else
      fail "no ffprobe inside $asset"
    fi
  else
    fail "extract failed: $asset"
  fi
done

##########################################################################
# BtbN — Windows shared zip (x64 + arm64) — fallback Windows ffmpeg pair
##########################################################################
echo
echo '########## BtbN Windows shared (zip) ##########'

for combo in win64-lgpl-shared winarm64-lgpl-shared; do
  asset="ffmpeg-master-latest-$combo.zip"
  target="$OUT/btbn-windows/$combo/$asset"
  note "fetching $asset"
  fetch "$BTBN_BASE/$asset" "$target" || continue
  expected=$(sha_for_asset "$btbn_sums" "$asset")
  if [[ -z "$expected" ]]; then
    warn "no SHA for $asset in BtbN checksums.sha256"
  else
    verify_sha "$target" "$expected" "$asset"
  fi
  extract_dir="$OUT/btbn-windows/$combo/extracted"
  rm -rf "$extract_dir"
  if extract_zip "$target" "$extract_dir"; then
    ok "extracted $asset"
    for exe in ffmpeg.exe ffprobe.exe; do
      inner=$(find "$extract_dir" -type f -name "$exe" | head -1)
      if [[ -n "$inner" ]]; then
        check_magic "$inner" 'PE32(\+)? executable.*Windows' "$asset/$exe"
      else
        fail "no $exe inside $asset"
      fi
    done
  else
    fail "extract failed: $asset"
  fi
done

##########################################################################
# Gyan — Windows essentials zip (direct + GitHub mirror)
##########################################################################
echo
echo '########## Gyan Windows essentials ##########'

GYAN_DIRECT=https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip
note "fetching gyan-direct .sha256"
gyan_direct_sha_text="$OUT/gyan-direct/release-essentials.sha256"
mkdir -p "$(dirname "$gyan_direct_sha_text")"
if curl -fsSL "$GYAN_DIRECT.sha256" -o "$gyan_direct_sha_text" 2>/dev/null; then
  ok "fetched gyan-direct .sha256"
  expected=$(awk '{print $1; exit}' "$gyan_direct_sha_text")
  target="$OUT/gyan-direct/ffmpeg-release-essentials.zip"
  note "fetching gyan-direct zip"
  fetch "$GYAN_DIRECT" "$target" || true
  if [[ -f "$target" ]]; then
    verify_sha "$target" "$expected" "gyan-direct/essentials.zip"
    extract_dir="$OUT/gyan-direct/extracted"
    rm -rf "$extract_dir"
    if extract_zip "$target" "$extract_dir"; then
      ok "extracted gyan-direct"
      for exe in ffmpeg.exe ffprobe.exe; do
        inner=$(find "$extract_dir" -type f -name "$exe" | head -1)
        if [[ -n "$inner" ]]; then
          check_magic "$inner" 'PE32(\+)? executable.*Windows' "gyan-direct/$exe"
        else
          fail "no $exe in gyan-direct"
        fi
      done
    else
      fail "extract failed: gyan-direct"
    fi
  fi
else
  fail "gyan-direct .sha256 unavailable"
fi

note "fetching gyan-github mirror release JSON"
GYAN_GH_API=https://api.github.com/repos/GyanD/codexffmpeg/releases/latest
gyan_gh_json="$OUT/gyan-github/release.json"
mkdir -p "$(dirname "$gyan_gh_json")"
if curl -fsSL "$GYAN_GH_API" -o "$gyan_gh_json" 2>/dev/null; then
  ok "fetched gyan-github release json"
  asset_url=$(jq -r '.assets[] | select(.name | endswith("essentials_build.zip")) | .browser_download_url' "$gyan_gh_json" | head -1)
  asset_digest=$(jq -r '.assets[] | select(.name | endswith("essentials_build.zip")) | .digest // empty' "$gyan_gh_json" | head -1)
  asset_name=$(jq -r '.assets[] | select(.name | endswith("essentials_build.zip")) | .name' "$gyan_gh_json" | head -1)
  if [[ -z "$asset_url" ]]; then
    fail "gyan-github: essentials_build.zip not in latest release"
  else
    ok "gyan-github asset: $asset_name"
    target="$OUT/gyan-github/$asset_name"
    note "fetching gyan-github $asset_name"
    fetch "$asset_url" "$target" || true
    if [[ -f "$target" ]]; then
      if [[ "$asset_digest" =~ ^sha256:([a-f0-9]{64})$ ]]; then
        verify_sha "$target" "${BASH_REMATCH[1]}" "gyan-github/$asset_name"
      else
        warn "gyan-github asset has no sha256 digest in API"
      fi
    fi
  fi
else
  fail "gyan-github release JSON fetch failed"
fi

##########################################################################
# evermeet.cx — macOS ffprobe zip (primary, redirects)
##########################################################################
echo
echo '########## evermeet macOS ffprobe (primary) ##########'

EVERMEET=https://evermeet.cx/ffmpeg/getrelease/ffprobe/zip
target="$OUT/evermeet/ffprobe.zip"
note "fetching evermeet ffprobe"
if fetch "$EVERMEET" "$target"; then
  warn "evermeet has no published checksum (skipped sha verify)"
  extract_dir="$OUT/evermeet/extracted"
  rm -rf "$extract_dir"
  if extract_zip "$target" "$extract_dir"; then
    ok "extracted evermeet ffprobe.zip"
    inner=$(find "$extract_dir" -type f -name ffprobe | head -1)
    if [[ -n "$inner" ]]; then
      check_magic "$inner" 'Mach-O' "evermeet/ffprobe"
    else
      fail "no ffprobe in evermeet zip"
    fi
  else
    fail "extract failed: evermeet"
  fi
fi

##########################################################################
# osxexperts.net — macOS ffprobe fallback (pinned 7.1, both archs)
##########################################################################
echo
echo '########## osxexperts macOS ffprobe (fallback) ##########'

for combo in arm intel; do
  asset="ffprobe71$combo.zip"
  target="$OUT/osxexperts/$combo/$asset"
  note "fetching $asset"
  if fetch "https://www.osxexperts.net/$asset" "$target"; then
    warn "osxexperts has no published checksum (skipped sha verify)"
    extract_dir="$OUT/osxexperts/$combo/extracted"
    rm -rf "$extract_dir"
    if extract_zip "$target" "$extract_dir"; then
      ok "extracted $asset"
      inner=$(find "$extract_dir" -type f -name ffprobe -not -path '*/__MACOSX/*' | head -1)
      if [[ -n "$inner" ]]; then
        check_magic "$inner" 'Mach-O' "osxexperts/$combo"
      else
        fail "no ffprobe in $asset"
      fi
    else
      fail "extract failed: $asset"
    fi
  fi
done

##########################################################################
# deno — 5 targets (zip), .sha256sum sibling
##########################################################################
echo
echo '########## deno ##########'

DENO_BASE=https://github.com/denoland/deno/releases/latest/download
for target_triple in \
  x86_64-pc-windows-msvc \
  x86_64-apple-darwin \
  aarch64-apple-darwin \
  x86_64-unknown-linux-gnu \
  aarch64-unknown-linux-gnu
do
  asset="deno-$target_triple.zip"
  target="$OUT/deno/$target_triple/$asset"
  note "fetching $asset"
  fetch "$DENO_BASE/$asset" "$target" || continue
  shafile="$target.sha256sum"
  if curl -fsSL "$DENO_BASE/$asset.sha256sum" -o "$shafile" 2>/dev/null; then
    # Linux/macOS .sha256sum is POSIX "<sha>  <name>"; Windows is PowerShell
    # Get-FileHash with "Hash      : <sha>" lines.
    expected=$(grep -oE '^Hash[[:space:]]*:[[:space:]]*[a-fA-F0-9]{64}' "$shafile" | awk '{print tolower($NF)}' | head -1)
    if [[ -z "$expected" ]]; then
      expected=$(awk 'NF>0 && $1 ~ /^[a-fA-F0-9]{64}$/ {print tolower($1); exit}' "$shafile")
    fi
    if [[ -z "$expected" ]]; then
      warn "could not parse $asset.sha256sum"
    else
      verify_sha "$target" "$expected" "deno/$target_triple"
    fi
  else
    warn "no .sha256sum for $asset"
  fi
  extract_dir="$OUT/deno/$target_triple/extracted"
  rm -rf "$extract_dir"
  if extract_zip "$target" "$extract_dir"; then
    ok "extracted $asset"
    case "$target_triple" in
      *-windows-*) inner_name=deno.exe; pattern='PE32(\+)? executable.*Windows' ;;
      *-apple-*)   inner_name=deno;     pattern='Mach-O' ;;
      *-linux-*)   inner_name=deno;     pattern='ELF.*executable' ;;
    esac
    inner=$(find "$extract_dir" -type f -name "$inner_name" | head -1)
    if [[ -n "$inner" ]]; then
      check_magic "$inner" "$pattern" "deno/$target_triple"
    else
      fail "no $inner_name inside $asset"
    fi
  else
    fail "extract failed: $asset"
  fi
done

echo
echo '########## SUMMARY ##########'
echo "PASS: $PASS"
echo "WARN: $WARN"
echo "FAIL: $FAIL"
if (( ${#ISSUES[@]} > 0 )); then
  echo
  echo 'Issues:'
  printf '  %s\n' "${ISSUES[@]}"
fi
exit $(( FAIL > 0 ? 1 : 0 ))
