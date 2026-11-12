#!/bin/zsh
# Cut one moment out of a long video (YouTube clips -> Shorts/Reels). Frame-accurate re-encode.
# Find the moments first: transcribe the long video (OpenMontage transcriber), pick 30-60 s stories
# with a hook in the first 2 s, then cut each one and run new_day.py <name> <clip.mp4> on it.
# Usage: cut_clip.sh <long-video> <start s> <end s> <out.mp4>
set -e
ffmpeg -loglevel error -y -ss "$2" -to "$3" -i "$1" -c:v libx264 -crf 18 -preset fast -pix_fmt yuv420p -c:a aac -b:a 192k "$4"
echo "clip: $4 ($2-$3 s)"
