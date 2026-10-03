# ScrollMonsters legacy campaign

A portrait browser rail shooter built on Phaser 4.2.1, with a southbound route, monster companions, and permanent upgrades.

See [legacy ability notes](docs/legacy/ABILITIES.md) for shared attack radii, creature ability assignments, and pending ability decisions.

## Survivor game

Open `/survivors.html` on the local server for **Woodland Expedition**, the current survivor game with collectible starters, up to three companions, nest choices, a support Frog, and a boss finale. The ten-minute demo opens from `demo.html`; the two-minute trial uses `survivors.html?trial`. Use WASD/arrows or touch drag; attacks fire automatically. See [SURVIVORS.md](SURVIVORS.md) for scope and the party-first creature design direction.

## Play locally or on a phone

From this folder, start the server:

```sh
python3 scripts/serve.py 5173
```

Open http://localhost:5173/legacy.html on the Mac. The automatic music preview server is localhost-only. For phone testing, first run `npm run build`, then explicitly start `python3 -m http.server 5173 --bind 0.0.0.0`, connect to the same Wi-Fi and open `http://<Mac-Wi-Fi-IP>:5173`. Find the Mac’s Wi-Fi IP with `ipconfig getifaddr en0` (or in macOS Wi-Fi settings). Keep the Mac awake and the server running. Saves are stored separately in each browser and site address.

Touch and drag to aim, or move the mouse. Firing and travel are automatic. After buying Hunter’s Eye in the Shared upgrade branch, tap the book icon in the top banner or press Space to toggle auto-targeting. Portrait orientation gives the largest playfield.

## Checks

```sh
node scripts/check-game.cjs
node scripts/check-opening.cjs
node scripts/check-mobile.cjs
node scripts/check-opening-browser.cjs
```

The browser check requires Playwright and Chromium installed, plus a running server on port 5173. Set `GAME_URL` to test a different server address.

Design: [GDD](docs/legacy/GDD.md). Tuning: [Balance](docs/legacy/BALANCE.md). Menu styling and future-model guidance: [UI style guide](UI_STYLE_GUIDE.md). Work log: [progress](progress.md).

## Reset for testing

Refresh to return to the title screen, then choose **RESET PROGRESS** and confirm. This removes only this game's save in the current browser on the current site address, then reloads into a fresh game. Cancel keeps your progress. Saves on other browsers or deployment URLs are separate.

## Progression estimates

The calculator runs the current `game.js` combat and economy at 60 Hz in a seeded headless runtime. It uses actual rosters, summons, prices, damage, shields/healing, range, rewards, and boss counts. It no longer uses the old Fangle/Buttermant capture model or independent boss approximation.

```sh
node scripts/calculate-dps.cjs                       # 5 seeds per strategy
SIM_SEEDS=20 node scripts/calculate-dps.cjs           # 60 campaign runs
node scripts/calculate-dps.cjs 8                     # full campaigns; print stage 8
node scripts/calculate-dps.cjs 10 /path/to/save.json  # current-save static DPS audit
node scripts/diagnose-spikes.cjs                     # matched-loadout stage-8 diagnostics
SIM_SEEDS=20 node scripts/simulate-stage8-health.cjs  # what-if: stage 8 Beast/Owl -4 HP
node scripts/check-balance-calculator.cjs            # calculator regression checks
```

Results go to `output/balance-current/report.json` and `campaign.csv`. `diagnose-spikes.cjs` adds `diagnostics.json`. Set `SIM_OUTPUT` to preserve another scenario. `SIM_POLICIES=balanced,offense,range`, `SIM_MAX_ATTEMPTS=30`, and `SIM_MAX_SECONDS=180` control the scenarios. The range strategy emphasizes range upgrades, while the others emphasize balanced survival or offense. Results depend on these heuristics; they are not optimal builds or forecasts of human clear rates.

Runs start with the real tutorial and mandatory upgrade, spend earned currency through real purchase/summon handlers, and select up to three owned companions. The scenarios use Tier 1 summons only, paid duplicates, automatic nearest-target cursor aim, no replay farming after a clear, and no menu time. Optional save files use the current `ownedCreatures`, `activeParty`, and `upgrades` fields. Legacy `recruits` saves are rejected rather than silently misread.

## Phaser runtime

The main game and upgrade prototype load the pinned Phaser 4.2.1 browser bundle
from `vendor/`, so the existing Python server and static deployment still work
without a CDN or a bundler. `package.json` and `package-lock.json` pin the matching
npm package; the vendored distribution includes Phaser's MIT license.

`ScrollMonstersScene` in `game.js` loads textures, the pixel font, and audio through
Phaser and runs the unchanged combat simulation. The browser uses **Phaser's
WebGL renderer**. `phaser-ui.js` provides reusable `WoodPanel` and `WoodButton`
containers, native nine-slice backgrounds, Text, Graphics, images, and masked
containers. The former Canvas drawing adapter has been removed.

Screens retain their objects between updates. Buttons use Phaser hit areas and
pointer events with hover/press feedback, disabled states, and drag cancellation.
Grouped cards can animate as a unit; summon reveals and results use native tweens.
The progress-reset confirmation is also a native modal. Reduced-motion preferences
skip decorative tweens. Phaser's Scale Manager handles portrait fit and fullscreen;
CSS supplies the outer safe-area layout. The Sound Manager owns music and effects.

Save storage and gameplay rules are unchanged. The Node simulation entry has no
renderer and remains available for logic tests.

With the local server running and Playwright installed:

```sh
GAME_URL=http://localhost:5173 npm run test:phaser
GAME_URL=http://localhost:5173 npm run test:ui
GAME_URL=http://localhost:5173 node scripts/check-collection-ui.cjs
```

These check gameplay, all ten stages, upgrades, summoning/collection, mouse/touch
input, saves, native component lifecycle, tweens, disabled/canceled controls,
reset confirmation, reduced motion, and fullscreen. Screenshots are written to
`output/phaser/`, `output/native-ui/`, and `output/collection-ui/`. The browser
checks select Chromium's Metal backend on macOS because the default headless
backend can report WebGL as unsupported.
