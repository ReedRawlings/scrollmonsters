# ScrollMonsters code and game review — September 29, 2026

## Scope and verification

Reviewed the current Survivors game, the linked legacy campaign, UI, supporting systems, tests, comments, and design documents. No gameplay code was changed. The working tree was clean before this report.

- `npm run test:survivors`: **24/24 passed**, including ten-minute expedition, capture, relic contracts, storage recovery, UI, and upgrade packs.
- All root `.js` and `scripts/*.cjs` files passed `node --check`; `check-greens-map.cjs` passed 200 seeds.
- Chromium/Metal gameplay capture had no page errors. The prescribed web-game client returned valid gameplay state, but its SwiftShader screenshot was black; the Metal capture rendered normally. See `output/review-2026-09-29/`.
- Both advertised legacy browser scripts failed at an old title click (`'combat' !== 'map'`) even when pointed directly at `/legacy.html`. `node scripts/check-game.cjs` failed because its VM sandbox omits `URLSearchParams`.

The September 28 review is now partly obsolete. The hidden pause-button issue, telemetry quota recovery, Echo/Resonance/Thunderhead contracts, deliberate capture choice, and current-game test fixtures have been addressed and passed current checks. Findings below concern the current tree.

## Defects and behavior mismatches

### High — supported legacy combat still loads deleted assets

`game.js:33-37` registers 21 placeholder SVGs under `assets/placeholder/`, a directory that no longer exists. A browser visit to `/legacy.html` recorded all 21 as 404s. `game.js:2368` draws hostile projectiles with missing `enemyShot`; `game.js:1684-1687` returns without drawing when its texture is absent. Crosshair and generic impact/heal art have the same problem. The current title no longer links to Legacy, but `README.md`, `index.html`, and `/legacy.html` still support it. Restore or replace every consumed texture and verify stage-six ranged combat visually.

### Medium — selecting a field resets the starter

The title field button reloads the page (`survivor-screens.js:39`), while scene initialization sets `starter='cat'` (`survivors.js:55`). Chromium reproduction: unlock and select Owl, click Woodland, arrive in Desert with Cat selected. Preserve the chosen starter through field changes or change fields without reloading.

### Medium — title navigation is missing documented routes

The title contains only Begin, field, and History (`survivor-screens.js:21-41`). `README.md:11` promises a Legacy link, and `SURVIVORS.md:3` describes a two-minute trial choice. Trial is only reachable with `?trial` (`survivors.js:4`); History's Play link also drops trial mode (`survivor-runs.html:4`). Add the routes or correct the documentation and provide another visible entry point.

### Medium — keyboard-only players cannot choose a starter or field

Starter portraits and title controls are pointer hit areas (`survivor-screens.js:32-40`). Keyboard bindings (`survivors.js:81-87`) can start the default run but cannot select an unlocked starter, change fields, or open History. The canvas has no semantic control equivalents. Add focusable controls or a clear keyboard selection model and test it without a mouse.

### Medium — Hunter stacks can persist longer than the stated window

`survivor-relics.js:29-37` resets Hunter's creature-hit stack using `relicHitAt`, which every player or creature hit refreshes. Reproduced with the actual module: Cat hits at 0s, player hits at 1s, 2s, and 4s, and Cat hits at 4.5s; the Cat attack receives stack two despite 4.5 seconds between creature hits. Track the last creature hit separately.

### Medium — the documented Bestiary has no Survivors screen

`SURVIVORS.md:108` says captured roles appear in a Bestiary. The current screen dispatcher (`survivor-screens.js:8-17`) has no Bestiary state or title button. `survivor-expansion.js:4` retains an unused `bestiaryPage`. Restore an accessible creature reference or remove the current-game claim and dead state.

### Low — Ricochet can spend a bounce without creating it

`survivor-relics.js:53` increments `shot.bounces` before finding a nearby target. With a piercing shot, a hit on an isolated enemy consumes the bounce; a later hit beside another enemy cannot bounce. Reproduced through the module in a Node VM. Increment only when a target exists.

### Low — invalid field placement removes a valid patch

`survivor-elements.js:23-26` evicts the oldest friendly field before checking whether the new location is blocked or out of bounds. Reproduced: six active fire patches become five after a rejected placement. Validate the new location first.

### Low — corrupt unlock JSON skips valid run-history recovery

`survivor-expedition.js:5-8` parses the separate unlock key and run history inside one `try`. A malformed unlock key skips the history scan and writes `['cat']` back, even if history contains captured starters. Separate the parses and recover each source independently. This was confirmed from control flow, without a browser reproduction.

### Low — pause options change after acquiring a relic

The relic inventory branch returns after Resume and damage-number controls (`survivor-screens.js:42-54`). Run history/export is present only in the no-relic branch (`survivor-screens.js:55-59`). Keep the same navigation available in both pause layouts.

### Low — run metadata and trial result text are stale

New run records still stamp `build:'reliability-v26'` (`survivors.js:134`) although `survivors.html:14` loads v31 modules and `survivors.js?v=32`. This weakens comparisons across versions. The result screen says “Expedition complete/failed” for two-minute trial runs too (`survivor-screens.js:67`).

## Design and usability gaps

- **Shrine discovery:** the shrine becomes active at 90 seconds (`survivor-expedition.js:70`) without an instruction explaining that standing near it for six seconds starts a challenge. A progress ring *does* render in `survivor-juice.js:165-166`; the gap is discovering the action and its purpose. A short cue or contextual prompt would help.
- **Run results:** the end screen always reports `Cat: 0 · Ally: total` (`survivor-screens.js:64-68`) even for non-Cat starters. Show the actual party members and their contributions to help players understand builds.
- **Wildfire wording:** its offer promises a “small fire patch” (`survivor-elements.js:13`), but spread patches use the full normal radius and lifetime (`survivor-elements.js:23-28`). Decide which behavior is intended, then align code and text.
- **Onboarding:** the title does not show movement/dash controls or run duration. The field button shows the current field but does not say it switches fields. These are recommendations based on portrait and landscape browser captures, not crash defects.
- **Current specification:** `SURVIVORS.md` starts with obsolete five-minute, seven-starter, two-relic-slot, 480-HP Guardian, and 1920-square-map descriptions before later append-only corrections. `SURVIVORS-ROADMAP.md:14-22` retains seven-species and individual upgrade proposals that no longer match the game. Consolidate current rules near the top; label historical sections. `GDD.md` describes the legacy campaign and should be marked accordingly.

## Outdated code and comments

Comments are sparse and mostly explain useful rendering, pooling, timing, and determinism constraints. Broad comment removal would reduce clarity. The specific stale comment at `survivor-hud.js:56` says creature charge timers “arrive with Phase 2,” but `chargeOf()` already implements them. `survivor-juice.js:6-7` says the module never changes simulation state and that dens/chests use `Math.random`; its `realtime()` opens an unlock mode and current placement uses seeded randomness.

Cleanup candidates, after targeted regression tests: `summonOwl()` and its wild-Owl path (`survivors.js:217`) have no production caller; individual damage/speed upgrade offers are constructed then filtered out (`survivors.js:233-241`); `SurvivorRelics.selected` is write-only; `SurvivorCreatures.ui()` and the expedition/encounter `drawUI()` hooks are empty and unused. Preserve save/debug identifiers and active allied Owl behavior during cleanup.

## Test maintenance and suggested order

`test:phaser` and `test:ui` still use legacy title coordinates and fail at the first navigation assertion (`scripts/check-phaser.cjs:24`, `scripts/check-native-ui.cjs:39`). Ten of fourteen VM-based legacy checks do not provide `URLSearchParams`; `check-game.cjs` aborts before its assertions. Current Survivors coverage is healthy, but the legacy test status should not be represented as green.

1. Restore the legacy combat assets and repair its browser/VM test entry points.
2. Preserve starter selection on field changes; restore visible routes and keyboard title controls.
3. Correct Hunter, Ricochet, and field-placement edge cases with focused regressions.
4. Reconcile the current design documents and remove proven dead code in small changes.
5. Add shrine onboarding and useful party-level run results, then validate balance and discoverability with human playtests. Automated checks verify mechanics but cannot establish difficulty or clarity for new players.
