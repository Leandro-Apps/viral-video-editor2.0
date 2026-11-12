#!/bin/zsh
# Copy the shared Motion Kit (both skins) into a video project.
# Usage: projects/motion-kit/sync-kit.sh projects/<video-project> [brand-pack-dir]
# Without a brand pack (or VIDEO_BRAND env) the project keeps the WiseFunnel defaults.
set -e
KIT="$(cd "$(dirname "$0")" && pwd)"
DST="$1"
[ -z "$DST" ] && { echo "usage: sync-kit.sh <project-dir>"; exit 1; }
mkdir -p "$DST/public"
rm -rf "$DST/kit" && cp -R "$KIT/kit" "$DST/kit"
cp -R "$KIT/public/fonts" "$KIT/public/logo.png" "$DST/public/"
# sound effects and music are not shipped (see README, "Audio"); copy them if you added your own
for D in sfx music; do [ -d "$KIT/public/$D" ] && cp -R "$KIT/public/$D" "$DST/public/"; done
mkdir -p "$DST/public/brands"
cp -R "$KIT/public/brands/." "$DST/public/brands/" 2>/dev/null || true
echo "kit synced into $DST"
BRAND="${2:-$VIDEO_BRAND}"
[ -n "$BRAND" ] && python3 "$KIT/apply_brand.py" "$BRAND" "$DST"
exit 0
