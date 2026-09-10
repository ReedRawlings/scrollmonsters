Original prompt: Read GDD.md and assets/README.md. Use the develop-web-game skill to build the first browser-playable version using the existing placeholder assets. Implement the overworld, stages 1–10, cursor-directed auto-fire, shared party health, battle gold, permanent branching upgrades, recruitment after stages 3/5/10, and unlockable auto-targeting toggled with Space. Use reasonable provisional balance values and document them. Test the complete gameplay loop and browser saving. Start by making one combat stage work, then expand to the full prototype.

## Progress

- Added the first vertical slice: one stage with cursor-directed auto-fire, three enemy types, shared health, magnetic gold collection, clear/defeat results, one permanent damage upgrade, local browser saving, fullscreen, and deterministic test hooks.
- Disabled the continuous RAF loop when the skill harness virtual clock is present so automated stepping remains deterministic.
- Expanded the slice into the full ten-stage prototype: linear replayable overworld, scaling encounters, bosses on stages 5/10, a twelve-node branching upgrade tree, milestone recruits, all companion abilities, auto-target unlock/toggle, and the complete save model.
- Documented combat, economy, upgrades, recruits, and test-mode pacing in `BALANCE.md`.
- Fixed end-of-stage gold loss by banking uncollected earned drops, increased collection pull, made the overworld static, changed stages 1–2 to visibly advance the party against charging-only enemies, and increased travel/enemy/projectile speeds from player feedback.

## TODO

- Playtest a fresh-save journey through all ten stages to tune the new miniboss difficulty and economy.
- Add terrain later, as requested.

## September 9 — opening movement and melee bosses

- Stages 1–2 now keep terrain fixed while the party advances south from y=180 toward y=480. Companions follow the moving formation.
- Opening basic and armored enemies use faster ground speeds of 92 and 70 px/s.
- Bosses in stages 1–5 now approach to melee range and attack there without projectiles. Stages 6–10 retain ranged stand-off attacks.
- Gold drops stay with the static ground in stages 1–2 and move with camera travel in later stages.

## September 9 — upgrade costs and gradual enemy scaling

- Confirmed every multi-rank skill-tree node has strictly ascending costs and added a regression assertion for that invariant.
- Replaced the steep regular-enemy HP curve with `1 + 0.22 × (stage − 1)`, increasing from ×1 at stage 1 to ×2.98 at stage 10.
- Kept the existing modest damage curve, boss scaling, and encounter-density progression.
- Browser verification was intentionally skipped at the user's request.

## September 9 — campaign economy and DPS model

- Added reusable projections connecting expected stage spawns, an 82% kill rate, earned gold, a 35% offense budget, purchased damage/speed/multishot ranks, and required stage DPS.
- Expected campaign gold assumes two stage-1 attempts and one attempt per later clear; projections can accept actual earned gold instead.
- Added regression checks requiring non-decreasing projected DPS, sub-3× coverage, an intentionally underpowered fresh stage 1, and sufficient expected coverage afterward.
- Documented the formulas, recommended offense path, and stage-by-stage projection table in `BALANCE.md`.

## September 9 — multidirectional encounters and automatic gold

- Reduced base firing rate by 20%, changing the interval from 0.34 to 0.425 seconds and updating the campaign DPS projection.
- Increased stage 1–2 party travel from 10 to 14 px/s, with a y=600 safety cap.
- Enemies and bosses now choose north, east, south, or west spawn edges and remain untargetable until fully inside the combat area.
- Defeated enemies add gold immediately. Repurposed Gather Song into Golden Echo, granting +10% battle gold per rank while preserving the existing `magnet` save identifier and Hunter's Eye prerequisite.
- Deterministic checks cover all four spawn directions, immediate gold, the opening retry economy, and the revised 0.67–1.71× player-only DPS coverage curve.

## September 9 — traversal, minibosses, drops, monster nodes

- Set all stages to 30 seconds of traversal, including test URLs. Stages 1–2 advance the party across the full duration; later-stage scrolling ends at 30 seconds. Combat can continue until remaining enemies are defeated.
- Added a required miniboss to every stage, preserving stronger stage 5/10 bosses. Bosses stop ahead of the party, cannot die by crossing its boundary, and must be killed through damage before victory.
- Removed drop expiration. Off-screen drops remain in the attempt and are banked on victory or defeat.
- Added Fanglet, Mossbud, and Novawisp capture root nodes and reorganized upgrades into five readable columns. Existing stage 3/5/10 captures unlock these nodes and their upgrade branches; no new capture costs.
- Updated BALANCE.md and GDD.md.
- Regression checks passed (`node scripts/check-game.cjs`): all ten boss gates, traversal duration, persistent off-screen drops, defeat banking, monster upgrade prerequisites, and replay recruitment deduplication.
- Browser checks passed: locked/captured nodes, upgrade clicks, Space toggle, browser save/reload, visible miniboss, and no page errors. Screenshots in `output/revision-*.png` were visually inspected.
- Ran the supplied Playwright client. Its SwiftShader launch flags stalled on this Mac; a temporary copy with those flags removed and a fixed viewport completed successfully. Inspected `output/revision-client/shot-0.png` and state; no error log was produced.
- Full natural progression/balance playtesting remains outstanding; automated progression tests use controlled states.

## September 9 — southbound view and mobile controls

- Changed the game to a 540 × 900 portrait playfield. Player is fixed at (270, 300); ground scrolls upward and enemies approach from the south. Companions, shots, boss stopping distance, damage boundary, and drop drift now follow the vertical route.
- Rebuilt title, map, results, combat HUD, and upgrades for portrait. Upgrade branches use five tabs and full-width connected nodes.
- Added primary-pointer touch/drag aiming with pointer capture, cancellation handling, and protection against an aim gesture clicking the target-mode button. Added a touch auto-target toggle; Space still works.
- Added viewport/safe-area CSS, preserved aspect ratio across rotation, and disabled touch scrolling on the game canvas. Art now repaints when loaded, including under deterministic test stepping.
- `node scripts/check-game.cjs` passed with vertical firing/spawn/camera and all previous boss/gold/capture assertions.
- `node scripts/check-mobile.cjs` passed in Chromium phone emulation: touch navigation/aim/toggle, real simulated stage-1 boss kill and victory, capture/upgrade interactions, reload saving, small-phone/Android/landscape/desktop fit, no page errors. Screenshots saved under `output/mobile/` and visually reviewed. Physical-device Safari testing remains for the user.
- Supplied skill harness (temporary copy without stalled SwiftShader graphics flags) passed; screenshot/state in `output/mobile-client/` reviewed.
- Local HTTP server responds on port 5173. LAN address at testing time: 192.168.88.11. Phone and Mac must share Wi-Fi. See README.md for restart instructions.

## September 9 — opening economy and upgrade loop

- Starting stats are now 1 damage / 10 shared HP. Stage-1 regular monsters have 1 HP; every killed monster (bosses included) drops exactly 1 gold without stage multipliers.
- Basic/ranged/armored enemies move at 32/28/24 px/s from entirely below the screen toward the player's actual position. Contact uses distance instead of crossing a horizontal line. Contact removals do not award gold. Off-screen enemies cannot be targeted or hit by player projectiles until they enter the combat area above the bottom controls.
- First player/shared roots are Damage +1 and Health +5, each 5G for rank 1, then 10G/20G. Node text shows the next total. Companion stats and later prices were reduced to suit the smaller numbers; capture prerequisites remain intact.
- First boss: 28 HP, base damage 5 (4 at stage 1), 2.4s shots, attack clock starts on entry, triple volley below 45% HP. Uses real combat difficulty, not an artificial ownership check.
- `check-opening.cjs`: 20/20 accurate-aim fresh runs lost to the boss; 20/20 runs with power 1 + health 1 won. Fresh losses earned 14–15G. Also checked off-screen spawning/hits, one-hit kills/rewards, homing contact, and flat first-upgrade effects.
- `check-opening-browser.cjs`: touch menu purchases passed after a real first loss banking 15G; both 5G upgrades purchased; retry won with 2 damage / 15 HP. Screenshots under `output/opening/` visually checked.
- Existing game regression and mobile tests passed. Skill browser harness (temporary copy with Mac-compatible graphics flags) passed; inspected `output/opening-client/` screenshot/state confirming 1 HP/1 gold/32 px/s enemies.
- Updated BALANCE.md, GDD.md, and README.md. Existing saves remain intact; use a separate/private browser session to test the fresh opening without deleting progress. Real-player aim and stages 2–10 still need balance playtesting.

## September 9 — increasing monster density and health

- Updated regular spawn interval to `1.495 / (1 + 0.22 × (stage − 1))` and regular HP multiplier to `1 + 0.5 × (stage − 1) + 0.025 × (stage − 1)²`. Stage 1 retains its exact opening values; stage 10 has approximately 3× spawn density and basic/ranged/armored HP of 8/15/23.
- Separated boss HP scaling to retain its previous curve. Gold per kill, incoming damage, recruitment, and upgrade prices remain unchanged.
- Opening 20-seed balance and game regression checks passed. Controlled combat comparisons in output/check-scaling.cjs show stage 10 low offense winning 0/20 versus upgraded offense winning 20/20 with equal defenses and pre-stage-10 companions; mean banked gold was 13.25 versus 43.55.
- Mobile browser regression passed without browser errors. Ran the skill Playwright client via output/scaling-client.mjs using the previously required Mac graphics-flag workaround and stage-10 setup; visually inspected output/scaling-client/shot-0.png and its state at 16 seconds, showing the denser crowd and correct monster HP. No client error file.
- Updated BALANCE.md and GDD.md. Full fresh-save purchase progression and human touch aiming remain to playtest; controlled maximum-offense checks do not establish natural campaign balance.

## September 9 — approach direction correction

- Diagnosed mismatched camera motion: terrain scrolled at 80+ px/s while enemies only moved 24–32 px/s on screen, so their motion relative to the ground looked backward.
- Enemies now combine route distance with their own speed into one step toward the party. Applying independent vertical camera motion was rejected after screenshots exposed side-lane enemies drifting past the player. The final directed step converges on the player and clamps at contact; bosses stop at their existing stand-off distance.
- Added cache version to the script URL so phone reloads request the corrected build.
- New regression checks prove distance to the player decreases AND world-space movement relative to the ground is toward the player, from left/center/right lanes.
- Faster on-screen boss entry made its triple volley overly punishing at close range; stage 1 now fires single shots. Later boss volleys remain. Twenty seeded runs still give 0/20 fresh wins and 20/20 wins after the first damage/health upgrades.
- Added per-frame distance checks through contact for every spawn lane: enemies never increase their distance or drift past the party, and contact deals damage. Opening browser loss → purchases → retry checks passed; two gameplay screenshots/state snapshots were reviewed.

## September 10 — faster monsters and compact health talents

- All monster movement speeds, including minibosses and major bosses, are multiplied by 1.4. Player/projectile speed and spawn timing are unchanged.
- Moved the existing Health +5 node to Player, preserving its saved ranks. Added Vitality +5 (10/15/25G) and Fortitude +5 (15/25/35G), each with three +5 shared-HP ranks, requiring the previous health node. All three health talents stack.
- Compact 232×108 talent cards replace 460×136 cards. Six Player talents fit into two columns with visible prerequisite connections; cards retain full-area touch targets.
- Game regression checks passed. Phone browser checks passed for prerequisite locking, health purchases, stacked health on stage start, save/reload, and the exact +40% opening monster speed. Skill harness screenshot/state and compact talent screenshots were visually inspected.

## September 10 — Fanglet essence first implementation

- Added species-tagged wild Fanglets, stage-specific density, random/pity essence drops, later-stage bundles and hunting-boss rewards. Added banked/run essence to map, talents, combat, results and text state.
- Fanglet now costs 8 essence to capture; Follow-Up Bite costs 20 essence after capture and grants a non-chaining bonus shot on Fanglet kills. Existing gold talents and old captured Fanglets persist. No XP.
- Added check-essence.cjs for costs/prerequisites, currency isolation, drops, defeat banking and follow-up behavior; updated capture regression and mobile interactions. Opening 20-seed tests remain 0 fresh wins / 20 upgraded wins. Mobile captures, purchases, save/reload, combat and four viewport checks pass with no browser errors.
- Browser launch requires sandbox escalation on this Mac; the skill harness uses a local copy with unsupported graphics flags removed.
- Remaining: playtest essence pacing; spawn lures and prestige are deliberately deferred.
