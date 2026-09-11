Original prompt: Read GDD.md and assets/README.md. Use the develop-web-game skill to build the first browser-playable version using the existing placeholder assets. Implement the overworld, stages 1–10, cursor-directed auto-fire, shared party health, battle gold, permanent branching upgrades, recruitment after stages 3/5/10, and unlockable auto-targeting toggled with Space. Use reasonable provisional balance values and document them. Test the complete gameplay loop and browser saving. Start by making one combat stage work, then expand to the full prototype.

## Progress

- Added the first vertical slice: one stage with cursor-directed auto-fire, three enemy types, shared health, magnetic gold collection, clear/defeat results, one permanent damage upgrade, local browser saving, fullscreen, and deterministic test hooks.
- Disabled the continuous RAF loop when the skill harness virtual clock is present so automated stepping remains deterministic.
- Expanded the slice into the full ten-stage prototype: linear replayable overworld, scaling encounters, bosses on stages 5/10, a twelve-node branching upgrade tree, milestone recruits, all companion abilities, auto-target unlock/toggle, and the complete save model.
- Documented combat, economy, upgrades, recruits, and test-mode pacing in `BALANCE.md`.
- Fixed end-of-stage gold loss by banking uncollected earned drops, increased collection pull, made the overworld static, changed stages 1–2 to visibly advance the party against charging-only enemies, and increased travel/enemy/projectile speeds from player feedback.

## September 10 — animated player and pet roster

- Replaced the player placeholder with the four visible walking poses on row 3 of `16x16 Walk-Sheet.png`, looping at 8 FPS while skipping two nearly empty spacer cells.
- Replaced companion placeholders with four-frame 8 FPS strips: Fangle as the single-target attacker, Buttermant as healer, and Tinmin as AOE attacker.
- Applied the pet sprites across title, map milestones, capture nodes, combat, wild matching species, and recruitment results.
- Preserved `striker`/`healer`/`aoe` save identifiers so existing browser saves remain compatible.
- `node scripts/check-game.cjs` passed. `scripts/check-party-sprites.cjs` passed player/pet frame advancement, roster names, save reload, and browser errors.
- The supplied develop-web-game client produced `output/party-sprites-client/shot-0.png` and matching text state with no error log; title and combat captures were visually inspected.

## TODO

- Playtest a fresh-save journey through all ten stages to tune the new miniboss difficulty and economy.
- Add terrain later, as requested.

## September 10 — earth projectile and impact sprites

- Integrated `proj_earth_1_sheet.png` as the player's four-frame looping projectile, rotated along shot velocity at 12 FPS.
- Integrated `impact_earth_3_sheet.png` as an eight-frame, 0.48-second player-hit animation on enemies.
- Sheets use 100 × 100 source cells containing small centered pixel art and render at native cell size; previous SVGs remain load fallbacks.
- Companion, enemy, obstacle, AOE, and healing effects retain their existing visuals.
- Added projectile animation frames and active effect types to `render_game_to_text` for deterministic inspection.

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

## September 10 — hidden buildup and boss victory

- The 30-second clock is background encounter pacing only. Regular spawns continue through the buildup; the boss spawns at 30 seconds. No timer or timed progress is shown to players.
- Boss death immediately completes the round, banks earned gold/essence and unlocks the next stage. Remaining enemies are not required kills and award no free rewards. Combat updates stop on victory.
- Stages 1–2 cannot spawn wild Fanglets before 15 seconds. After that, their existing random densities apply; these Fanglets have exactly 2 HP and 2 damage, bypassing stage stat scaling. Later stages retain their existing behavior.
- Expected earnings now use the full 30-second regular spawn window. Old campaign economy estimates are superseded; later-stage balance needs playtesting with the increased gold income.
- Verified boss spawn boundary, immediate victory with surviving enemies, correct reward banking, early Fanglet boundary/stats, mobile controls and saving. Twenty seeded opening runs retain 0 fresh wins / 20 upgraded wins.

## September 10 — calculated HP, persistent melee, sparse cover

- Regular enemies stay alive at melee range and attack immediately, then every 1.5 seconds. They stop at the party's edge and follow as it moves. Ranged enemies use melee while touching the party, avoiding simultaneous ranged/contact attacks. Only kills award gold/essence.
- Stage HP now comes from `stageDpsEstimate`, using expected campaign gold, 35% player-offense spending, 75% player hit/uptime, 65% effectiveness for additional projectiles, and a base Fanglet from stage 4. This is an assumed loadout, not guaranteed capture timing; healer contributes no damage. Creature talent spending, Follow-Up Bite and future AOE contributions are excluded.
- Basic HP from stage 3 is rounded effective party DPS × 0.4 (minimum 2), with ranged/armored at 2×/3×. Stages 1–2 retain opening stats, including 2 HP/2 damage Fanglets. Stage 10: 7/14/21 HP. Boss targets are 12 seconds, or 15 seconds for stages 5/10; stage-1 boss retains 28 HP. Health never adapts to the actual player's save.
- Run `node scripts/calculate-dps.cjs` for all stage estimates, or append a stage number. These are arithmetic estimates, not simulated balance validation; crowds, aim, capture timing and rocks affect real performance. Old HP/economy tables are superseded.
- Each run gets two staggered rocks with randomized position/size outside the center travel corridor. Rocks scroll with the terrain and block player projectiles with swept collision and impact feedback. Companion/enemy shots pass through; rocks do not block movement.
- Focused behavior checks passed for repeated melee hits/cooldown, kill-only rewards, blocked shots and open lanes. No new balance simulation was used to choose HP.

## Centered camera and parallax

All stages now spawn the player at (270, 450), fixed at the canvas center. Ground and rocks scroll north at 24 px/s continuously, including boss combat. Outer grass scrolls at 45% of ground speed for depth. Companions retain their formation relative to the centered player. Enemy pursuit uses enemy speed independently of background movement. This replaces both the opening moving-player camera and the later upper-screen camera.

## Stages 2–10: double enemy health

Apply a ×2 HP multiplier after rounding to every enemy in stages 2–10, including Fanglets and bosses. Stage 1 remains unchanged. Stage-2 Fanglets now have 4 HP and retain 2 damage. Stage-10 basic/ranged/armored/boss HP is now 14/28/42/556. Damage, density, rewards and upgrade costs remain unchanged. The DPS calculator reports the multiplied HP and doubled estimated kill times. This is a direct balance adjustment, without additional combat simulations.

## Upgrade pricing and five damage ranks

Ranks 2 and 3 of every applicable upgrade now cost 20% more, rounded to the nearest whole currency unit. Rank-1 prices and existing purchases are preserved. Player Damage +1 now has five +1 ranks costing 5/12/24/40/60G; Fang Focus costs 8/14/24/40/60G; Nova Heart costs 10/18/30/50/75G. Other upgrade rank caps stay unchanged. The calculator includes player damage ranks 4 and 5 after the existing offense path. Stage HP is now stored at the last deployed values, preventing changed upgrade prices from automatically making enemies weaker. Calculator kill-time estimates use those fixed HP values and the revised prices.

## Ten +1 damage ranks

Player Damage +1, Fang Focus and Nova Heart now have ten ranks, each adding exactly one damage to its existing base (1, 2 and 3 respectively). Maximum damage is therefore 11/12/13 per hit. Labels distinguish the +1 purchase effect from total damage. Existing ranks and first-five prices remain intact.

Ranks 6–10 follow round(rank5Cost × 1.35^(rank−5)): player/Fanglet cost 81/109/148/199/269G; Novawisp costs 101/137/185/249/336G. First-five prices stay 5/12/24/40/60G, 8/14/24/40/60G and 10/18/30/50/75G respectively. The exponential tail follows the model discussed in Kongregate's The Math of Idle Games, Part I (https://www.kongregate.com/en/pages/the-math-of-idle-games-part-i); 1.35 is our provisional tuning choice, not a source-prescribed rate. Enemy HP remains fixed. The offense calculator includes all ten player damage ranks.

## Unified compounded ability prices

Every purchasable ability now uses round(baseCost × 1.35^(rank−1)), including rank 1. No legacy-price prefix remains. Gold bases: player damage/health/Golden Echo 15; Quick Hands/Fang Focus/Kind Bloom/Vitality 20; Hunter's Eye/Fang Rhythm/Bloom Rhythm/Nova Heart 25; Split Spark/Wide Nova/Fortitude 30. Follow-Up Bite starts at 30 Fanglet essence. Capture remains a separate 8-essence unlock. Purchased ranks, rank caps and effects are preserved. All three base damage nodes still grant exactly +1 per rank, up to ten ranks.

Player damage costs: 15/20/27/37/50/67/91/123/165/223G. Fang Focus: 20/27/36/49/66/90/121/163/221/298G. Nova Heart: 25/34/46/62/83/112/151/204/276/372G. Higher opening prices mean the prior claim of buying both opening damage and health after one failed run no longer applies. Enemy HP remains fixed; affordability and kill-time estimates update through the calculator.

## Reset progress control

Added RESET PROGRESS on the title screen. A confirmation explains what is erased; accepting removes only scollmonsters-save-v1 and reloads. Cancel does nothing. Browser-local reset, no server/admin route needed.

## Trail Pace: travel-driven encounters

Added Trail Pace to Shared: ten ranks, each adding 5% travel speed and enemy spawn frequency, up to +50%. Costs follow round(20 × 1.35^(rank−1)): 20/27/36/49/66/90/121/163/221/298G. Base terrain speed is 24 px/s, reaching 36 px/s. Spawn intervals (including the first spawn delay) divide by 1 + rank × 0.05, so max rank yields 1.5× spawn frequency, not a 50% shorter interval. Grass retains its 45% parallax ratio and rocks follow terrain. Player remains centered; boss appears after 30 seconds and first-two-stage Fanglet gating stays at 15 seconds. Enemy movement, HP and per-kill rewards are unchanged. More encounters increase potential gold/essence and difficulty. Save defaults naturally treat absent travelSpeed as zero.

## Retry wallet display

Confirmed finishStage banks gold/essence before results; Retry calls startStage without modifying saved currencies, recruits or upgrades. Corrected combat HUD to show banked + current-run gold/essence instead of a run-only counter that appeared to erase rewards. A separate +N this run label preserves earnings feedback. Text state now includes totalGold/totalEssence.

## Total gold only

Removed run-earned gold labels from combat and results. Only total gold is displayed; internal run accounting remains for correct reward banking.

## Stage damage and Mossbud essence

Damage multiplier now follows 0.855 + 0.25×(stage−1) + 0.025×(stage−1)², rounded after multiplication by base damage. Stage 1 retains its opening values; stage 10 basic/ranged enemies hit for 5, armored for 10, bosses for 26. Opening Fanglets retain 2 damage in stages 1–2. The calculator exposes basic/armored/boss damage alongside HP.

Mossbud uses a separate saved essence wallet and dry-kill counter. Its absolute population share by stage is 0/0/10/35/60/15/50/40/15/50%, disjoint from Fanglets. Wild Mossbuds use their creature sprite and the encounter's combat stats. Drops follow Fanglet's 30% chance, fifth-dry-kill guarantee, and 1/2/3/4 essence bundle tiers. Bosses on 5/8/10 guarantee two bundles. Earned essence persists after victory or defeat.

Mossbud capture now costs 12 Mossbud essence instead of an automatic stage-5 reward; existing recruits remain captured. Deep Bloom costs 30 Mossbud essence and doubles a heal when pre-heal party HP is strictly below 50%. Kind Bloom and Bloom Rhythm remain gold-funded. Map, HUD, results and upgrade nodes display the correct species currency; ME means Mossbud essence.

## Consolidated health

Player Health +5 is now one ten-rank node, adding +5 shared HP per rank (60 total HP at rank 10 including the starting 10). Uses the same 15G base and 1.35 cost curve. Removed Vitality and Fortitude nodes. Loading an older save sums Health/Vitality/Fortitude ranks into Health and drops the legacy fields, preserving earned HP without changing currency. The migration is idempotent.

## South-spawning destructible rocks

Stages 1–3 have no rocks. From stage 4, rocks enter from below the south edge every 3.5–4.5 seconds of base travel (faster with Trail Pace), moving north with terrain and despawning above the playfield. Spawn positions avoid the central party corridor. Each rock has 15 HP. Player Rock Breaker costs 30G, requires one Damage +1 rank, and unlocks player-shot damage against rocks. Shots use actual player damage and are absorbed on impact, including the destroying shot. Without the node rocks block shots without losing HP. Damaged rocks show health bars after unlock, and destruction clears the firing lane. No rock rewards are awarded.

## September 10 — chance-based Spark upgrades

Replaced guaranteed Split Spark projectiles with ten 10%-chance ranks. Added Triple Spark (ten ranks, 30G base, existing 1.35 price curve), requiring Split Spark rank 5. Third-shot rolls are conditional on a second shot. Updated expected DPS, rank-aware prerequisites/connection states, locked-node text, and Player tab layout. Saves retain purchased ranks. Successful purchases clear stale prerequisite messages.

Validation: check-spark.cjs covers chance boundaries, conditional third shots, guaranteed shots at max, prerequisite purchases, cap, and average DPS. Game regression and 20-seed opening checks passed. Fixed an outdated opening test wallet (10G -> 30G) to match existing 15G starting damage/health prices. Browser checked rank-4 lock -> rank-5 purchase -> Triple Spark purchase -> save reload without errors. Skill client gameplay and upgrade screenshots were visually inspected in output/spark-client. Natural campaign pacing needs playtesting because early Split Spark ranks now provide less damage than the former guaranteed projectiles.

## September 10 — Fangle Double/Triple Bite

Added ten-rank Double Bite after Fangle Rhythm and ten-rank Triple Bite after Double Bite rank 5, each 10% per rank, 30G base, existing 1.35 cost curve. Shared shot-count roller preserves conditional third attacks for player and Fangle. Fangle fires full-damage projectiles toward the same target; on-kill Follow-Up Bite remains separate and non-recursive. Generalized prerequisite labels and painted connectors behind all cards to keep labels readable.

Passed check-spark.cjs including Fangle capture/rank gating, both caps, actual projectile counts/damage, threshold rolls, and Follow-Up Bite non-chaining; check-game.cjs passed. Skill browser gameplay and native purchase/reload checks passed with no page errors; inspected output/bite-client screenshots. Legacy check-essence.cjs still assumes a 20-essence Follow-Up Bite and 8G Fangle Focus, while current definitions already charge 30 essence and 20G; this unrelated stale test fails at line 21.

## September 10 — critical chance and damage for all party members

Added eight nodes across Player/Fangle/Buttermant/Tinmin: 10 chance ranks (+1% each) and five multiplier ranks (+10 percentage points each, 150% base to 200% max). Buttermant gets critical healing. Gold bases 20/30 with existing cost curve; multiplier requires chance rank 1 and pets require capture. Per-projectile crits cover player/Fangle/follow-up, one roll per Tinmin blast, one per actual heal; no enemy crit changes. Expanded larger branch tabs to four rows and retained existing saves.

check-crits.cjs passes all owners' gates/caps/boundaries, actual projectile damage, follow-up, AOE targets, heal cap and DPS. Existing spark and game regressions and opening checks pass. Browser gameplay uses output/crit-client; purchase/reload checks cover all four tabs.

## September 10 — 110% crit baseline and decimal gold

Corrected critical multiplier to 100% + 10% per purchased rank (110% first, 150% fifth) for all party members, including healing and expected player DPS. Preserved fractional combat values; normalized enemy HP subtraction and heals to six decimals. Replaced whole-gold accumulation with immediate fractional credits, normalized banking/purchases, and decimal-aware HUD/results/shortage formatting. Removed per-run goldFraction remainder.

Crit tests pass for all owners and now also cover 1.1 damage, fractional health and exact death, 1.1G per kill, banking across runs, affordability and decimal remainders after purchase, and repeated fractional additions. Existing spark and game regression checks pass. Browser checks use output/decimal-client with a fractional wallet and save/reload.

## September 10 — estimated party output and economy audit

Updated standalone calculate-dps.cjs to include optional saved loadouts with all creature offensive ranks/crit/extra attacks, separate healing, travel/gold bonuses, real spawn HP, HP/sec crowd load, boss time and gold ranges. Default explicitly labels legacy budget/capture assumptions. Printed stages 1–10 and all-upgrade ceiling; checked formulas against passing crit/spark combat tests. Findings recorded in BALANCE.md: default stage-10 party 10.73 DPS vs 46.84 HP/sec spawn load, 556 boss HP, 50.53G full-traversal estimate at 82% kills (optimistic under that DPS). No gameplay tuning changed.

## September 10 — all earned gold reinvested

Replaced default calculator's 35% hypothetical baseline with a seeded real-combat campaign simulator. Buys all eligible affordable gold upgrades after every attempt using an explicit marginal-benefit policy; no reserved budget. Actual gold/essence, capture costs, retries, health and party ranks are simulated. Ledger and no-affordable-purchase-left assertions pass across ten completed campaigns. Stage 8 averaged 37.5 attempts; stage 10 winning party DPS 104.9 with 99.62G per attempt. Full rows and caveats in BALANCE.md; raw records output/economy-simulation.json. Gameplay unchanged.

## September 10 — isolate normal kills from boss outcome

Added hybrid default to simulation: 90% regular gold kills with actual spawn count and sampled species essence, then expected-DPS/discrete-hit boss survival. Full party HP and one landed hit per volley are explicit configurable baseline assumptions; triple-hit sensitivity available. Full simulation preserved as SIM_MODE=full with failure telemetry. Ten seeds completed for baseline and three-hit sensitivity; stage-8 means 20.6/26.8 attempts, so a significant wall remains. Reproduced original seed-1 full stage-8 33 attempts, mostly losses after boss spawn. Documented HP/damage step and caveats in BALANCE.md. No combat tuning changed.

## September 10 — boss shots, pet hitboxes and following line

Removed low-health boss triple fire. Pets follow player anchor in a 40px-spaced northward line. Nearest-member enemy targeting, member-specific melee impacts and swept enemy-projectile collisions now reduce shared HP once per hit; earliest intercepted body consumes the projectile. No offensive stat changes. Added party bodies to text state. Simulator triple-hit option removed and duplicated failure loadouts trimmed.

check-party-hits.cjs passes: formation, player/all pets projectile collisions, pet melee hits/cooldowns, fast projectile first interception, lethal pet hit, every stage-6–10 boss full/low HP single shot. Existing game/spark/crit and opening checks passed. Skill browser gameplay inspected in output/party-hit-client; line is visible, no browser errors. Hybrid ten-seed audit still reports stage-8 20.6 attempts.

Line-count audit: game.js was 989 lines before this change (now 1005), CSS 33, HTML 15. Approximately 165k lines were in output, dominated by generated simulation JSON (not runtime code). Historical artifacts retained; new reports avoid repeated loadouts on every failed attempt.

## September 10 — ignored reports and unlock timing

Added /output/ to .gitignore and removed previously tracked output artifacts from the Git index using --cached; all local files retained. Verified git check-ignore and zero tracked output entries. No commit created.

Added chronological first-eligibility, rank-purchase and capture events to the simulator, with stage/attempt, cumulative gold and combat seconds. Prints first-rank summaries across ten seeds and writes ignored output/unlock-timing-hybrid.json. Existing stage results unchanged. Observed first purchases: Split Spark stage 4/~255G earned, Triple Spark stage 9/~2915G, Double Bite stages 7–8/~1231G, Triple Bite stage 10/~3645G. These depend on the purchase policy; capture timing uses essence/stage rules, not gold. Menu time excluded.

## September 11 — priced Party Bond calculator scenario

Added calculator-only +5 party damage hypothetical node, then corrected it to cost 50G per user instruction. Requires Buttermant capture and actual purchase; no healing bonus. All-affordable spending policy includes the new node. Baseline comparison uses bonus=0. Tested capture/price/cap and damage math; ten-seed ledger checks pass. Available stage 4, bought stages 4–5 (~432G cumulative earnings); stage-8 mean attempts 3.1 vs 20.6 baseline, campaign total 34 vs 73.1. No live game changes.

## September 11 — Party Bond implemented

Live Buttermant-branch node, one rank at 50G after capture, +5 to player and Fangle including Follow-Up Bite before crits. No healing/Tinmin bonus. Calculator uses actual definition without duplicating the node or bonus. Unit checks passed before user directed that tests are not needed; browser checks had already been launched. No further tests requested or run after that instruction.
