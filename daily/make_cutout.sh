#!/bin/zsh
# Cut the presenter out of their recording (Apple Vision, local, no cost) -> WebM VP9 with alpha.
# Used by the cutout and depth layouts. The matte runs at half size and is scaled back up with a soft edge.
# Usage: make_cutout.sh <presenter.mp4> <out.webm>
set -e
IN=$1; OUT=$2; HERE=${0:A:h}
WH=$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "$IN"); W=${WH%%,*}; H=${WH##*,}
FPS=$(ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate -of csv=p=0 "$IN")
MW=$(( (W / 2) / 2 * 2 )); MH=$(( (H / 2) / 2 * 2 ))
TMP=$(mktemp -d)
[ -x "$HERE/matte" ] || swiftc -O "$HERE/matte.swift" -o "$HERE/matte"
ffmpeg -loglevel error -i "$IN" -vf "scale=${MW}:${MH}" -f rawvideo -pix_fmt bgra - | "$HERE/matte" $MW $MH > "$TMP/m.raw"
ffmpeg -loglevel error -y -i "$IN" -f rawvideo -pix_fmt gray -s ${MW}x${MH} -r "$FPS" -i "$TMP/m.raw" \
  -filter_complex "[1:v]scale=${W}:${H}:flags=bicubic,gblur=sigma=1.5,format=gray[a];[0:v]format=yuva420p[v];[v][a]alphamerge" \
  -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 0 -crf 28 -row-mt 1 -deadline good -cpu-used 4 -an "$OUT"
rm -rf "$TMP"
echo "cutout: $OUT"
