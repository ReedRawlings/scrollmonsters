# ScollMonsters prototype

A portrait browser rail shooter built on Phaser 4.2.1, with a southbound route, monster companions, and permanent upgrades.

See [ABILITIES.md](ABILITIES.md) for shared attack radii, creature ability assignments, and pending ability decisions.

## Play locally or on a phone

From this folder, start the server:

```sh
python3 scripts/serve.py 5173
```

Open http://localhost:5173 on the Mac. The automatic music preview server is localhost-only. For phone testing, first run `npm run build`, then explicitly start `python3 -m http.server 5173 --bind 0.0.0.0`, connect to the same Wi-Fi and open `http://<Mac-Wi-Fi-IP>:5173`. Find the Mac’s Wi-Fi IP with `ipconfig getifaddr en0` (or in macOS Wi-Fi settings). Keep the Mac awake and the server running. Saves are stored separately in each browser and site address.

Touch and drag to aim, or move the mouse. Firing and travel are automatic. After buying Hunter’s Eye in the Shared upgrade branch, tap the book icon in the top banner or press Space to toggle auto-targeting. Portrait orientation gives the largest playfield.

## Checks

```sh
node scripts/check-game.cjs
node scripts/check-opening.cjs
node scripts/check-mobile.cjs
node scripts/check-opening-browser.cjs
```

The browser check requires Playwright and Chromium installed, plus a running server on port 5173. Set `GAME_URL` to test a different server address.

Design: [GDD](GDD.md). Tuning: [Balance](BALANCE.md). Menu styling and future-model guidance: [UI style guide](UI_STYLE_GUIDE.md). Work log: [progress](progress.md).

## Reset for testing

Refresh to return to the title screen, then choose **RESET PROGRESS** and confirm. This removes only this game's save in the current browser on the current site address, then reloads into a fresh game. Cancel keeps your progress. Saves on other browsers or deployment URLs are separate.

## Progression estimates

Run `node scripts/calculate-dps.cjs` to simulate spending all affordable gold using the 90% regular-kill / independent-boss model. It prints stage estimates and first-purchase/capture timing across ten seeds. Availability and purchases are recorded separately; gold totals are cumulative earnings, not individual upgrade prices. Times exclude menu and shopping time.

Generated reports, screenshots and temporary browser harnesses live in `output/`, which is ignored by Git. Reusable scripts in `scripts/` remain tracked. Detailed unlock summaries are in `output/unlock-timing-hybrid.json`.

Current calculator what-if: Party Bond is a 50G node unlocked by Buttermant capture, granting +5 damage to attacking members only. It is implemented in the live game for player and Fangle damage. Run `BUTTERMANT_PARTY_BONUS=0 node scripts/calculate-dps.cjs` for the no-node baseline. Scenario report filenames end in `-buttermant5-cost50.json`.

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
