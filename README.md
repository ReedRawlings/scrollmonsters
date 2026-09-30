# ScrollMonsters

The main game is now the survivor expedition: movement, collectible creature starters, three-member parties, relics, dash, bosses, and woodland/desert fields.

## Play

Run `python3 scripts/serve.py 5173`, then open http://localhost:5173. The root page opens the current game; `/survivors.html` remains supported. Move with WASD/arrows or touch drag. Dash with Space on PC or a quick directional swipe and release on phones. Recruiting a creature automatically selects its dash. The 4,500 × 4,500 world loops in every direction. The player fires automatically toward the mouse or touch-drag direction; companions auto-target.

## Legacy version

The older rail-shooter campaign is preserved at `/legacy.html`, also accessible through **Legacy** on the current title screen. Its game code, assets, upgrades, and save key are unchanged. Existing saves remain available on the same browser and server origin. See [LEGACY.md](LEGACY.md) for its documentation.

## Current game details

See [SURVIVORS.md](SURVIVORS.md) for mechanics and browser checks, and [progress.md](progress.md) for the development log. Both versions share asset files but maintain separate progression. No save conversion is performed.
