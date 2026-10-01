#!/bin/bash
# Records the gameplay clip and trailer shots, then builds both videos into output/media/out.
# Needs a running game server: python3 scripts/serve.py 5173 (or set GAME_URL).
set -e
cd "$(dirname "$0")"
node gameplay.cjs 7 230 1200
for shot in title capture party merge boss horde; do node trailer.cjs "$shot"; done
python3 build.py both
