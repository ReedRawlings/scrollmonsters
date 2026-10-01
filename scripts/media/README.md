# Gameplay clip and trailer

These scripts record ScrollMonsters frame by frame and build two videos:

- `scrollmonsters-gameplay-20s.mp4`: 20 seconds of a mid-run expedition, 1440×960, 60 fps.
- `scrollmonsters-trailer-30s.mp4`: a 30-second trailer, 1920×1080, 60 fps, with captions.

## How it works

1. `rec.cjs` opens the game in headless Chromium with Playwright's fake clock. The clock is paused, so each recorded frame advances the game by exactly 1/60 s. Slow screenshots do not change game speed.
2. `bot.js` plays the game. It moves away from enemies, collects XP, dashes out of crowds and answers menus after a short delay.
3. `gameplay.cjs` and `trailer.cjs <shot>` set up each scene and save PNG frames to `output/media/` (git-ignored).
4. `build.py` uses ffmpeg to join the frames, add captions (game font), crossfades and music.

Shots: `title`, `capture`, `party`, `merge`, `boss`, `horde`. Change which frames go into the trailer, and the captions, in `segments.json`.

Music: the gameplay clip uses `10 - Dark Castle.ogg` and the trailer uses `17 - Fight.ogg`. Both are from the Ninja Adventure pack (CC0).

## Run

```
python3 scripts/serve.py 5173 &
scripts/media/record-all.sh
```

Needs Node with Playwright, Python 3 and ffmpeg (with libx264 and drawtext). Set `GAME_URL` to use another server. Recording takes about 10 minutes.

The bot changes game state only inside the recording browser (for example, it keeps player health at 55% or more, and turns off level-ups during the boss shot). Game files do not change.
