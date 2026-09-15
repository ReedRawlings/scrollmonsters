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

## September 11 — movement and boss HP tuning

Increased non-boss movement by 20% (existing 1.4 multiplier now additionally ×1.2 only for regular enemies), preserving boss/projectile speed. Added stage bossHpMultiplier: 1 for stage 1, 0.8 afterward, applied to final HP without integer truncation; calculator and game estimates updated. Inspected contact/removal paths: enemies persist at contact and attack every 1.5s; only HP<=0 removes them. Visual report not reproduced. No tests run per user preference. Changes are local, not deployed.

## September 11 — enforce Buttermant's stage-5 capture gate

User corrected early capture assumption. Added explicit requiresStageClear:5 on Buttermant capture and enforced it in UI/purchase handler; calculator inherits real handler. Existing captured saves retained. Reran requested estimate: stage 4 averages 5.9 attempts across ten seeds (5–6), no healer or Party Bond available. Captures all follow stage-5 clear. No additional tests run; local change not deployed.

## September 11 — feasible fresh-save campaign rerun

Calculator now explicitly enforces every listed capture milestone (including Fangle stage 3) inside its isolated VM. Added feasibility assertions before each attempt for stage clears, recruits, purchased prerequisites, and no Buttermant/Party Bond before stage-5 completion. Reran 100 hybrid seeds with all spending, 90% regular kills, actual essence, single-shot bosses and current reduced HP. Every campaign finished; stage 4 mean 5.90 attempts (5–7), only player/Fangle; campaign total mean 34.43 attempts. Full per-stage summary is ignored output/feasible-campaign-estimate.md. No further live game changes in this rerun.

- Updated hybrid calculator at user request: stage 4 takes two ranged hits (4 HP) before boss; all stages require a spawn-timed ideal-DPS clear of every regular enemy by the 30s boss arrival. Leftovers fail the attempt; only modeled kills award gold/essence (100% on full clears). Retained capture gates and all-affordable spending. Reran requested 100-seed estimation, no gameplay tests: stage 4 5.63 attempts, cumulative through stage 4 14.11; cumulative through stage 10 33.53. Ignored report output/feasible-campaign-estimate.md documents assumptions, including no projectile travel/overkill and no post-deadline survival on failed clears.

- Changed stage-4 hybrid assumption from two to 3.5 ranged hits (7 HP pre-boss damage); retained full regular-clear requirement and spending policy. Reran 100-seed calculator: stage 4 5.77 average attempts; total through stage 10 33.51. No gameplay tests.

- Implemented 20% player Damage +1 price reduction at every rank; stage-3 Fangle boss with exactly 15 essence; saved first-stage-4 chest introduction at 5–10s plus later 0.1% per-attempt rolls. Chest scrolls in via rock-free center lane and automatically awards flat 15G on reaching party. Calculator shares rewards. Syntax checks passed; gameplay tests skipped per user instruction. Changes remain local; no deployment performed.

- Corrected treasure chest interaction: 5 HP, player-shot damage with swept collision, visible health bar, player auto-target support, and 15G awarded only on destruction. Passing the party does not award gold; missed chests scroll offscreen. Calculator reserves player damage time for chest destruction before awarding gold. Syntax checks only; no gameplay tests per user instruction.

- Finished five-rank Follow-Up Bite: +20% trigger chance per rank on Fangle kill; one non-chaining bonus shot. Added matching five-rank Deep Bloom chance on low-health heals. Both start at 30 species essence and use normal price scaling. Mending Bite unlocks at Follow-Up Bite 1, heals 1–5 HP per landed follow-up, starts at 60 FE. Updated calculator Deep Bloom rolls and docs. Syntax checks only; no gameplay tests per user preference. Not deployed.

- Bloom Guard: one purchase for 200 Buttermant essence, unlocked by Deep Bloom rank 5. Each Deep Bloom proc can grant a single shared shield blocking the entire next damaging hit on any party member. No stacking or expiry; a 2-second cooldown starts when granted. A fresh Deep Bloom proc is required to reapply it after the cooldown. Shield and cooldown reset each stage attempt. Blue rings show protection; calculator includes boss-hit absorption.

## September 11 — EggBoy and Ninja Adventure monsters

- EggBoy uses 16×16 cells: Walk first column, four vertical frames at 8 FPS; each player volley triggers all four horizontal Attack frames over 0.24s. Rendering keeps square proportions.
- Bamboo/basic, Axolot/ranged and Beast/armored use four animated rows with spawn-edge columns north=0, south=1, east=2, west=3. Capture species and companions retain their existing art; Ninja Adventure Animals remain unused. Boss art is unchanged.
- Updated browser cache version. Syntax check passed; existing skill browser harness captured gameplay with EggBoy and Bamboo, with no browser error log. Screenshot visually inspected. No balance or progression suite run.

## September 11 — DemonCyclop early bosses

- Stages 1, 2 and 4 use DemonCyclop and force north-edge spawns, retaining existing pursuit/combat stats. Stage 3 capture boss and other stages are unchanged.
- Actual Walk.png is 300×50 (six horizontal 50×50 frames), looping at 8 FPS. Hit.png is 150×50 (three frames), playing for 0.3s on damage before returning to walk; subsequent hits restart it. Display size is 100×100.
- Syntax check passed. Skill harness temporary browser preview verified forced north despite requested south, hit frames 1/2 and return to walk; screenshots visually inspected. Preview setup first needed stage unlock correction; final run completed without browser errors. Production test hooks were not expanded.

## September 11 — coin drops and persistent open chest

- Coin2 uses four horizontal 10×10 frames at 10 FPS. Enemy kills spawn a coin; chest opening releases 15 coins in a spreading upward arc over 0.5 seconds, then rests on scrolling ground. Gold remains credited immediately; drops are visual and cannot duplicate rewards.
- LittleTreasureChest uses its closed/open 16×16 cells at 3× scale. At zero HP it stays open, scrolls with terrain, loses its health bar and is excluded from player bullet collision and auto-targeting.
- Syntax and skill browser preview passed. Verified 15 chest coins + one enemy coin, duplicate chest damage does not pay twice, a projectile passes through the open chest, coins settle and remain with ground. Pop and settled screenshots inspected in output/coins-client.
- Reviewed Ui/Theme/preview.png and asset inventory for upcoming UI discussion: complete Theme Wood controls, Wip panel themes, health receptacles/hearts, and fonts. No UI changes yet.

## September 11 — wood UI and pixel font

- Applied Theme Wood nine-slice panels, enabled/disabled buttons, focus frames, map nodes, headers, upgrade cards, and menu/combat controls. Dark wood interiors preserve text contrast and existing interaction bounds.
- Loaded NormalFont.ttf as NinjaPixel in CSS and all canvas text; font-load completion repaints deterministic screens. Added word spacing and fitted narrow branch labels.
- Replaced combat health bar with the rectangular BackgroundWood receptacle and bottom-up ProgressHealth fill, retaining numeric HP. Asset is vertical, displayed beside the HUD text.
- Syntax and browser captures passed; visually inspected title, map, upgrades and combat. Menu click navigation works; no browser error logs in final captures. Existing balance and saves unchanged.

## September 11 — attack pose, homing coins, compact nodes

- Corrected EggBoy attacks to hold only the first 16×16 column of the 64×16 Attack strip for 0.24s per volley; the sheet has only one frame in that column.
- Coins pop, briefly rest, then accelerate toward the player while spinning and disappear on contact. Existing immediate gold credit is retained without duplicate pickup rewards. Browser trace shows 16 -> 8 -> 0 coins and animated travel.
- Upgrade cards are compact full-width two-line rows: name, numeric current/total rank, numeric price; description below. Essence currency is named in relevant descriptions. Hit areas follow the new row dimensions.
- Removed custom brown interior overlay and fixed panel nine-slicing to preserve its full border. Focus assets use their own smaller slices. Final menu screenshot inspected; syntax and browser harness passed.

## September 11 — native creature pixels and directional capture atlas

- Doubled player earth projectile rendering from 100 to 200 source-canvas display size (including fallback); damage/collision unchanged.
- Regular monsters and capture pets now render at exactly 16×16 game pixels, independent of enemy radius, role, and menu context. DemonCyclop retains its separate boss size. Combat radii unchanged.
- New minimize_F-Sheet.png is 192×80: creature rows begin at y=0/32/64, with fully transparent spacer rows at y=16/48. Four animation steps use columns step*3 + facing offset. South=0, north=1, east=2; west mirrors east. Wild spawn edges reverse facing; party pets face south.
- Browser preview caught and corrected spacer-row indexing. Final screenshot shows all three pets; four-facing preview inspected. Syntax check and browser captures passed. Existing save IDs/display names preserved.

## September 11 — restore node dimensions and integer creature scaling

- Corrected interpretation: restored original 232×108 two-column upgrade cards and spacing, retaining condensed name/rank/price header and wrapped description below. Click bounds restored with cards.
- All regular monsters and tameable creature frames use consistent 3× integer scaling (16×16 source to 48×48 display), including pets, wild captures and menu appearances. Boss art retains its own scale.
- Syntax and browser checks passed. Restored node and party screenshots visually inspected in output/wood-client/upgrades.png and output/creature-scale-client/shot-0.png.

## September 11 — minimal trail HUD

- Removed stage and direction/boss labels from the trail header. Shows HP gauge/count, gold and separate essence totals only.
- No timer-driven health animation existed; replaced fractional source cropping with a fixed texture and integer-pixel clipping to prevent fractional-edge shimmer. Gauge only responds to actual HP changes.
- Syntax and browser checks passed; screenshot inspected and gauge crop identical across successive frames with unchanged HP.

## September 11 — readable node text and prerequisite paths

- Kept two-column 232×108 cards, removed rank/total counters to free header space, enlarged names/prices/descriptions, and restored prerequisite lines behind cards with cross-column paths through the gutter.
- Damage and Health descriptions show only the resulting next-purchase total (or current value at maximum), calculated from actual current stats.
- Reduced trail header height and used native-size static health receptacle to trim unused space. No gameplay or hitbox changes.
- Syntax and node browser preview passed; screenshot inspected for text fit and requirement connections.

## September 11 — music and menu sounds

- Adventure Begin loops on title/map/upgrades/results. Each round randomly selects one looping track from Dark Forest, Dark Castle, Fight (17), Road, Final Area, Tension, Dungeon.
- Accept4 plays on menu target clicks; Success1 plays only on successful upgrade/capture purchases. Music volume 30%, effects 55%. Reuses a single music element so tracks cannot overlap.
- Audio unlocks on first pointer/keyboard interaction for browser autoplay rules; hidden tabs pause audio and visible tabs resume music. Playback rejection is caught.
- Syntax and browser harness passed. Instrumented playback confirmed Accept4, Success1 on a real purchase, and active round music. Screenshot inspected; no browser error output. Audio was verified through browser playback state, not a listening review.

## September 11 — targeted Fanglet ground traps

- Replaced normal, double/triple and on-kill follow-up Fanglet projectiles with instant targeted damage and ground_trap_sheet animation attached to the victim. Existing crits, damage, cooldowns, follow-up chance and Mending Bite remain; follow-ups cannot chain.
- Provisional range 360 pixels from Fanglet. Wounded in-range visible enemies are prioritized by lowest absolute HP; ties random. If none are wounded, select randomly among visible enemies in range. Each additional attack reselects a living target.
- Actual sheet is 1000×100 (ten padded 100×100 cells), rendered 3× over 0.6 seconds. Surviving victims carry the effect with them; lethal strikes finish visually at the kill location unless the stage ends.
- Syntax and targeted browser checks passed: lowest HP selection, exclusion of out-of-range enemy, guaranteed follow-up damage, two trap effects, no Fanglet projectiles. Late animation screenshot visually inspected. No balance re-simulation performed.

## September 11 — equal player/Fangle damage ranks

- Aligned Fangle base damage to player base 1; both now deal 1 + own damage rank + shared Party Bond bonus. Updated Fangle upgrade preview. Normal and follow-up traps inherit the same damage function.
- Syntax and rank 0–10 parity checks passed with/without Party Bond. Attack cadence and individual critical upgrades remain separate.

## September 11 — restore rank/currency headers

- Node headers again show title, current/maximum rank, and G-prefixed gold or E-prefixed essence cost. Header columns are measured to avoid overlap within existing 232×108 cards; descriptions and connections retained.
- Syntax and browser screenshot checks passed.
- Prior damage audit: scripts/check-fangle-damage.cjs passes 44 actual-hit comparisons across ranks, Party Bond and criticals, plus follow-up damage and animation timing. Controlled 10-second rank-5 output was player 138 vs Fangle 60 due to cadence. No damage rebalance made during the audit.

## September 11 — approved low-density tile scenery and brown rocks

- Integrated the original meadow, forest, and rocky strip designs as combat backgrounds, cycling by stage. All background elements scroll at the same speed; nearest-neighbor 2× tiles retain crisp pixels. Props wrap across the repeated strip boundary.
- Added a reproducible scenery build script using the original preview generator. Denser pass-02 concepts remain review files only.
- Replaced placeholder obstacle blocks with small (32px, radius 13, 8 HP) and medium (64px, radius 27, 15 HP) brown nature sprites. Existing stage-4 spawn gate, lanes, treasure clearance, and Rock Breaker requirement retained.
- Browser tests verified both spawned sizes, immunity without Rock Breaker, and destruction at 4/8 two-damage hits. Inspected all three scenery screenshots and the corrected loop join; no browser page errors. General gameplay checks pass after repairing their pre-existing missing measureText mock.
- Skill browser harness hung with forced SwiftShader flags on this Mac; a local copy with only those flags removed runs successfully. Original preview art and pass-02 remain available for comparison.

## September 11 — environment particles and breakable pottery

- Added asset-pack Rain/RainOnFloor, Leaf, Rock and Vase particles with atlas-specific frame sizes. Meadow stages have sparse drifting leaves; forest stages have light rain and linked impact splashes; rocky stages remain clear.
- Rain splashes scroll with the ground. Leaves flutter; debris bursts move outward under gravity and fade. Particle drawing clips to gameplay below the HUD; a separate deterministic random stream keeps cosmetics out of combat random rolls. Particle count is capped at 96 (long-run rain test peaked at 12).
- Small/medium rock destruction creates six/ten brown fragments. Added sparse 32px pots using TilesetElement (64,16,16,16), 1 HP, no reward or Rock Breaker requirement, every 14–18 seconds after the initial entry. Pots scroll/cull and clear on restart.
- Browser validation passed rain-to-splash lifecycle, both rock bursts, vase shot destruction without Rock Breaker, fragment expiry, prop scrolling/culling, stage reset, and particle budget. No console/page errors. Inspected stills and animation sequences in output/particles; effects-preview.gif compares all four effects.
- General gameplay and 44 player/Fangle damage parity checks passed. The working skill client (without this Mac's hanging forced SwiftShader flags) passed normal menu-to-combat gameplay; screenshot inspected.

## September 11 — broader leaves, varied loot props, sand and rock-ground paths

- Clarified asset scope: both new terrain palettes come from TilesetFloor.png (sand at top, grey/brown rock ground at row 14). No TilesetDesert building/palm art is used. Two new low-density strips use the same 16px tiles, 2× game scale, lane dimensions and repeat wrapping. Five scenery palettes cycle through stages 1–10.
- Leaves start distributed across the width and upper/middle bands, then replenish every 0.9 seconds with six-second lifetimes.
- Six destructible variants: two vases and a crate from TilesetElement, two mossy vases and a discarded crate from TilesetVillageAbandoned. All retain 1 HP. Crates emit Wood particles, pottery emits Vase particles.
- Each stage schedules two sparse props, first visible at 1.5 seconds, second entering later. Spawn conflicts retry using alternate lanes. Each destroyed prop independently rolls Math.random() < 0.25 for exactly one gold and one animated coin; collection animation does not double-credit it.
- Browser checks passed all ten stages spawning two props and 24 loot threshold/variant cases, including <0.25 vs >=0.25, material fragments, and pickup completion. Leaf positions span upper and middle screen regions. In-game new paths, six prop variants and wider leaves visually inspected; no browser errors. Skill gameplay harness and general checks passed.
- Updated path outputs: map-previews/pass-03; in-game screenshots: output/biomes-props.

## September 11 — consolidated combat header and book toggle

- Combined Fangle and Buttermant essence on one header line, with measured text fitting. Gold sits to the left of the new 48px BookRock icon.
- Removed the bottom aim/auto-target banner. Header icon uses BookRock when unlocked automatic targeting is enabled and BookRockDisabled when off/locked; tap toggles the existing saved auto-target setting. Space shortcut and the upgrade gate remain.
- Browser checks passed touch toggling in both directions, persistence, keyboard shortcut, locked behavior, and aiming in the cleared bottom area. Enabled/disabled screenshots and normal skill-harness gameplay screenshot visually inspected; no page errors. General gameplay checks pass.

## September 11 — essence portrait counters and production release

- Replaced the essence labels with static 32px Fangle/Buttermant portraits and numeric totals. Centered the 48px book toggle at banner y=60 and moved its touch bounds with it.
- Touch on/off, saved setting, Space shortcut, locked behavior and bottom aiming checks passed; final HUD screenshot inspected. Production uses Vercel linked to main at scrollmonsters.vercel.app.

## September 11 — spinning HUD coin and centered health vessel

- Replaced static header gold with the four-frame Coin2 animation at 10 fps, positioned directly beside the measured gold total.
- Moved the 56px health vessel and its fill/clipping down 12px so its center matches the banner and book toggle at y=60.
- Syntax, general gameplay, HUD touch/keyboard checks and skill gameplay capture passed. Final HUD and gameplay screenshots visually inspected.

## September 12 — type essence design review

- Reviewed the live title, overworld, combat HUD, and Fangle/Buttermant upgrade branches, plus the current save, spawn, reward, recruitment, and upgrade code. No gameplay implementation changed.
- Recommended replacing per-species essence wallets with affinity/type wallets, while keeping combat role as a separate axis. Use `affinityId` rather than `type` because `enemy.type` already means basic/ranged/armored/boss behavior.
- A scalable version also needs an owned-creature roster and three-slot active-party selection; the current save simply auto-equips every recruited creature.
- Current friction to address during implementation: two species counters already consume the portrait HUD, essence has no distinct pickup feedback, Fangle's card says stage 3 is required although the handler does not enforce it, the results screen omits the run's Moss essence gain, and the essence regression harness is stale (`measureText` mock failure).
- General gameplay regression passed and browser review produced no console warnings/errors. Existing `.DS_Store` worktree changes were left untouched.
- TODO: choose the affinity names/current-creature mappings and decide whether affinity essence is recruitment-only or also pays for creature talents before implementing the save migration and UI.

## September 12 — affinity essence and Bestiary implementation

- Replaced individual species wallets with Feral, Bloom and Arcane affinity essence. Fanglets/Mossbuds/Tinmins drop their affinity through independent 30% rolls and fifth-dry-kill pity counters; all three affinities appear at varied densities in every stage.
- Added a Bestiary beside Upgrades on the overworld and moved the full-width Play button below them. Removed the overworld drop-density line to make room.
- Bestiary handles recruitment, three active creature slots, reserves, wallet display, stage gates and costs. Fangle is ungated at 8 Feral essence; Buttermant requires stage 5 plus 12 Bloom; Tinmin requires stage 10 plus 20 Arcane. New recruits auto-fill open slots.
- Stage 3 remains a Fangle boss and awards 15 Feral essence. Stage 5 awards 15 Bloom and stage 10 awards 20 Arcane. Clearing a stage no longer auto-recruits a creature.
- Fangle essence talents now spend Feral essence; Buttermant essence talents spend Bloom essence. Party Bond's combat bonus now requires Buttermant to be in the active party, while ownership still unlocks its talent branch.
- Started a fresh `scollmonsters-save-v2` schema with nested essence/pity wallets plus separate owned and active party lists; v1 is intentionally deleted instead of migrated.
- Added temporary colored letter tokens for affinities pending supplied icon art. Updated map, upgrades, combat HUD, results and text-state output.
- Added focused checks for browser recruitment/party/persistence/combat composition and species drops/pity/boss rewards/affinity-funded talents. Both pass. Browser screenshots of map, Bestiary, creature talents and combat were visually inspected; no browser warnings/errors.
- The stock skill client was attempted but hung under its forced SwiftShader flags on this Mac; the established flag-free local copy ran. Its screenshot was blank, so visual QA used the in-app browser and the focused Playwright captures instead.
- TODO: replace temporary affinity tokens when the user supplies the final icons; tune multi-affinity densities and Tinmin's provisional 20-essence cost after playtesting.

## September 12 — dedicated game music folder

- Moved the seven active combat tracks and menu track into assets/music and updated the playback base path. Added assets/music/README.md listing current uses and how to add tracks. Unused pack music, sounds and jingles retain their original locations.
- Verified all eight destination files exist and are nonempty; game syntax check passed.

## September 12 — folder-driven music rotation

- Added music scanner generating assets/music/playlist.js. Combat discovers supported audio files at the music folder root; menu-only music moved into menu/. Filenames are URL-encoded for playback. Empty playlists stop playback cleanly.
- Vercel build configuration rebuilds playlist on deployment. npm run dev starts a localhost-only Python preview server that rescans on playlist requests; other static servers need npm run build after changing music. Updated music and main READMEs.
- Scanner tests passed additions/removals, menu exclusion, case-insensitive extensions and empty folder. Current scan finds 11 combat tracks and one menu track. Browser gameplay smoke test passed and screenshot inspected. The legacy check-game script encounters a stage-number error in the current working tree; no unrelated stage changes made here.

## September 12 — Bestiary UI concept pass

- Added an isolated interactive Bestiary preview with three switchable visual directions: Woodland, Regalia and Hybrid. The live game UI is unchanged pending selection.
- All concepts use the actual creature sprites, the current Coin2 strip for gold/Feral/Bloom/Arcane counters, active/reserve/locked roster states and the existing Accept4 selection sound.
- Woodland keeps the existing Ninja Adventure wood language; Regalia applies the Dragon Regalia panels, buttons, party frames and selector; Hybrid keeps wood structural panels and reserves Dragon Regalia assets for selection/state emphasis.
- The preview supports both the currently present 40x10 four-column Coin2 strip and a future four-row animated sheet. No `coin2-sheet.png` file was present; the modified asset found in the workspace is `Items/Treasure/Coin2.png`.
- Native 540x900 screenshots for all three directions were visually inspected. Browser state confirmed all currency, party and roster states, concept switching worked, and the corrected final capture produced no console/page errors.

## September 12 — revised Hybrid Bestiary hierarchy

- Removed the Woodland/Regalia/Hybrid review controls from the visible mockup; they were concept-preview navigation only and are not intended for the game UI.
- Replaced the separate essence banner and gold header counter with Feral, Bloom and Arcane essence counters directly in the Bestiary header. The preview now uses the supplied 40x40 `Coin2-Sheet.png`; its four rows animate gold/Feral/Bloom/Arcane across four columns.
- Removed the creature-side selection cursor and the padlock overlay. Locked creatures are communicated with a greyed card/portrait and the existing LOCKED button text.
- Shifted the party, affinity filters and roster upward to use the reclaimed space. The 540x900 Hybrid capture was visually inspected; all three new essence icons render with distinct colors and there were no console/page errors.

## September 12 — compact Bestiary header and roster

- Simplified active-party slots to a centered creature sprite only; removed the repeated creature name and combat-role text from the slot.
- Removed the header subtitle and affinity names, leaving a vertically centered BESTIARY title plus icon-and-count essence counters.
- Reduced roster-card spacing from 28 pixels to 10 pixels and shifted the party, filters and list upward to match the shorter header.
- The native 540x900 Hybrid capture was visually inspected. Text state still matches the visible party/currency/lock states, and the run produced no console/page errors.

## September 12 — Theme Mix and Bonus Bestiary concepts

- Replaced all removed Dragon Regalia dependencies in the isolated Bestiary preview with the new `assets/ui/theme_mix` and `assets/ui/bonus` kit plus its MediumPixel font.
- Added three URL-selectable review variations with no in-screen concept controls: Theme Mix uses light exterior shells and blue/gray state panels; Bonus Frame uses the neutral Bonus surfaces and frames throughout; Field Fusion uses Theme Mix shells and controls with Bonus-framed roster cards.
- Preserved the approved compact layout: centered active-party sprites, tight 10-pixel roster spacing, icon-and-count essence header, no Bestiary gold, no redundant lock icon and no review selector inside the UI.
- Captured and visually inspected all three at 540x900. Each text-state report matches the visible essence, party and roster states; none produced a console/page error file.
- TODO: select one of Theme Mix, Bonus Frame or Field Fusion before replacing the live Bestiary components.

## September 12 — wood-only Bestiary direction selected

- User rejected the Dragon Regalia and new Theme Mix/Bonus directions and selected the original Theme Wood visual language.
- Collapsed the isolated Bestiary preview to one wood-only implementation and removed all Dragon Regalia and `assets/ui` dependencies from its HTML/JavaScript.
- Retained the approved compact structure: vertically centered title, icon-and-count essence header, centered party sprites, tight roster spacing, no gold and no redundant lock icon.
- The final wood-only 540x900 screenshot was visually inspected. Text state matches the visible currency/party/roster states, and the run produced no console/page errors.
- TODO: apply this approved wood-only layout and the Coin2 essence sheet to the live Bestiary and shared headers when implementation is requested.

## September 12 — corrected crisp wood-only concepts

- Rebuilt the Bestiary preview after identifying that the prior pass incorrectly stretched `button_checked.png` (a checkbox-style control) as a wide button and rendered several sprites/icons at non-integer scales.
- The new pass uses only Theme Wood assets in their intended roles: `tab_*` for filters, `button_*` for action buttons, `inventory_cell` for party slots, and the background/panel/interior/focus nine-patches for surfaces and selection.
- Added three URL-selectable wood-only directions with no in-screen review controls: Classic Wood uses orange panels and a focus outline; Framed Wood uses the alternate muted panel frame with orange active states; Wood Board places the whole screen inside a dark inset wood board.

## September 12 — Warm Wood selected and south-facing creatures

- User selected Warm Wood as the Bestiary direction.
- Switched the Bestiary party and roster portraits to the production directional creature atlas. Every creature now uses the atlas's south-facing walking frames, matching the game's southbound presentation.
- JavaScript syntax and the local browser preview check passed. The final 540x900 Warm Wood capture was visually inspected with all three creatures facing south and no browser errors.
- Creature sprites now render only at exact 3x/4x scale and essence icons at exact 2x/3x scale. Pixel-font sizes and coordinates were normalized to the same grid, with shadow removed from colored and dark text.
- Captured and visually inspected Classic and Framed at the normal settle interval and Wood Board with an extended settle interval. Final screenshots and text state are complete; none produced a console/page error file.

## September 12 — corrected Wood nine-slice construction

- Removed the layered focus/background treatment from creature cards and the full-screen board treatment. Every header, party area and creature card now uses exactly one Theme Wood nine-slice.
- Corrected the source slice boundaries: 16x16 panels/cells preserve 7-pixel sides around a 2-pixel center seam; 16x12 tabs preserve 7-pixel ends and 5-pixel top/bottom around a 2-pixel seam; 16x8 buttons preserve 7-pixel ends and 3-pixel top/bottom.
- Only those center seams are expanded with nearest-neighbor pixel duplication. Corners and tab/button ends remain fixed at 2x, so the control silhouettes are not distorted and no tiled source grid appears.
- Simplified the three wood-only options to Warm, Muted and Light; they differ only by their single panel family. All use the actual selected/unselected tab assets and normal/hover/disabled button assets.
- Switched the preview to the dedicated 64x16 Fangle, Buttermant and Tinmin strips and preload all used font sizes/glyphs before a forced two-pass render, eliminating partial capture artifacts.
- Final 540x900 captures for all three were visually inspected and contain complete sprites/text with no page/console error files.

## September 12 — mobile icon-tree UI prototype

- Added upgrade-prototype.html using existing skill icons, disabled variants, wood buttons and focus borders. Existing main upgrade screen remains the default.
- Connected nodes arranged by prerequisite depth; tap selects, shows current/next effects and locked requirements, and highlights prerequisite lines. Rank badges persist; explicit Upgrade button is the only purchase action. Five branch tabs retain current economy and unlock logic.
- Prototype uses an independent save key and starts with 500 demo gold and 100 of each essence. No production deployment.
- Mobile browser checks passed node inspection without spending, explicit purchase, and all five branches. Inspected mobile screenshots and skill harness capture under output/upgrade-prototype.

## September 12 — compact prototype details and header navigation

- Moved prototype Map navigation into the upper-left header. Detail panel now sizes to its actual description text with a compact purchase button instead of reserving 198px.
- Mobile checks passed selection, explicit purchasing, branch rendering, and header navigation. Mobile and skill-harness screenshots inspected. Main upgrade screen remains unchanged.

## September 12 — Warm Wood Bestiary integration

- Began integrating the approved Warm Wood Bestiary into the live game. The new screen uses one correctly sliced wood panel per surface, native tab/button assets, centered south-facing party sprites, compact roster spacing, greyed locked cards without padlocks, and no Bestiary gold counter.
- Added the supplied Coin2-Sheet currency art to the live asset set. Feral, Bloom and Arcane now use their own icon rows in the Bestiary and shared currency displays instead of temporary colored letter tokens.
- Completed the live interaction wiring: open creatures recruit or toggle between active party and reserves, locked creatures remain disabled, all three active slots show only centered sprites, and the existing three-member limit/persistence behavior is preserved.
- Corrected the shared wood button slicing to preserve the 7px horizontal and 3px vertical ends, and fixed `drawPet` to respect requested integer display sizes. Bestiary creatures animate through the production atlas's south-facing walk columns.
- Affinity drop/talent checks and the focused browser recruitment/party/persistence/combat flow pass. The required game harness reached the live Bestiary, produced matching text state, and the final 540x900 fresh-save and populated screenshots were visually inspected with no browser errors.

## September 13 — UI style guide and future-model handoff

- Added `UI_STYLE_GUIDE.md` and linked it from the main README. It defines the approved Warm Wood direction, component asset roles, exact nine-slice borders, palette, type-currency atlas rows, typography, spacing, Bestiary states, south-facing creature atlas math, interaction language, and a new-menu QA checklist.
- Included an explicit future-model handoff covering rejected asset families, previous stretching/layering mistakes, redundant-state UI to avoid, asset-inspection requirements, browser screenshot verification, font/image load timing, and the Mac SwiftShader test-client workaround.
- Added a shared immutable `UI_THEME` in `game.js` for colors, panel/button/tab slice geometry, and currency rows. The live drawing helpers and Bestiary now consume those constants so later menus can reuse the same implementation instead of copying magic values.
- Syntax and whitespace checks pass. The focused Bestiary browser flow still passes recruitment, stage locks, party changes, persistence, and combat composition. The required game-harness capture was visually inspected at 540x900 and matches the approved screen with no browser errors.

## September 13 — production release preparation

- Prepared the affinity essence, Bestiary, Warm Wood UI, shared style guide, supplied currency icons, and folder-driven music changes for the production branch. Rejected UI packs and isolated concept/prototype pages remain outside the release.
- Updated the stale general regression check from removed capture-stage/recruits fields to explicit Bestiary recruitment with `ownedCreatures`, and updated the party-sprite browser check to seed `ownedCreatures` plus `activeParty`. Its player assertion now allows the real attack animation to override the walk frame while still proving companion frame advancement.
- `npm run build`, `node --check game.js`, `check-game.cjs`, `check-affinity-drops.cjs`, `check-party-sprites.cjs`, and `check-bestiary.cjs` pass. The required final Bestiary game-harness state and 540x900 screenshot were inspected with no browser errors.

## September 13 — upgrade prototype aligned with UI_STYLE_GUIDE

- Read the guide and inspected the Warm Wood Bestiary helpers. Prototype now reuses UI_THEME, Bestiary background, approved buttons, shared tab nine-slices, and gold/affinity atlas rows. Extracted drawMenuTab so both pages share tab rendering.
- Preserved connected icon nodes and compact inspect/purchase panel. Corrected 24px skill icons from fractional 64px rendering to exact 72px (3×), rounded tree coordinates, removed redundant padlocks, and adopted muted disabled wood detail panels with unshadowed locked text.
- Mobile tests passed node selection without spending, explicit purchase, branches and Map navigation. Bestiary regression passed recruitment gates, party selection, persistence and combat roster. Skill harness and Bestiary screenshots visually inspected; no browser errors. Prototype remains separate and local.

## September 13 — concise rank-zero upgrade descriptions

- Rank-zero prototype nodes show only NEXT. Purchased non-maxed nodes retain NOW/NEXT; maxed and locked requirements retain their existing behavior.
- Syntax and prototype mobile purchase/navigation checks passed; rank-zero screenshot inspected.

## September 13 — combat sizing, coin animation, upgrade pricing

- Wild capturable creatures now render at 48px only in combat.
- Coin drops use Coin2-Sheet.png row 1 (four 10px frames).
- Health +5 and Fangle Focus share the exact ten-rank Damage +1 price array.
- Verified: node syntax check and existing check-game.cjs pass. Browser check confirms all ten prices match, captures all three wild creatures beside an ordinary monster and a coin drop, and reports no page errors. Visually inspected combat and skill-client map screenshots; combat sizes and the first-row coin frame are correct.
- No outstanding implementation TODOs for this request; campaign pacing remains a playtest tuning task.

- Follow-up: Damage +1, Health +5, and Fangle Focus now start at 10G and retain 1.35 growth (rounded each rank): 10/14/18/25/33/45/61/82/110/149G. Bosses currently award 1 base gold each.

## September 13 — compact PUNY overworld

- Rebuilt the overworld with supplied PUNY_WORLD_v1 terrain, trees, water, and settlement sprites. Reproducible generator: scripts/build-overworld.py; output assets/scenery/overworld.png rendered at 2×.
- Top half holds the ten-stage winding route with unreached terrain hidden and unreached nodes unavailable; the entire landscape reveals at stage 10. Third quarter shows selected-stage species icons/rates, enemy types, and boss HP/timing. Bottom quarter holds Bestiary, Upgrades, and Play.
- Mobile browser checks pass hidden-stage blocking, stage selection, both menu links, and launching selected-stage combat, with no page errors. Syntax and diff checks pass. Inspected fresh and fully revealed screenshots plus skill harness screenshot/state.
- Available locally on port 5174; no deployment requested. No outstanding implementation TODOs.

## September 13 — explored map preview and enemy stats

- Added ?overworld=explored preview, opening directly onto all ten visible stages without changing saved unlock progress.
- Removed stage title/status, enemy-type prose, and opening-rate note. Species now show HP/DMG (ranges for variable enemy types), with ordinary monster and boss stats below using combat scaling and early Fanglet overrides.
- Syntax and mobile overworld navigation checks pass; explored harness screenshot visually inspected.

## September 13 — menu top spacing

- Reduced overworld action panel top padding from 52px to 18px; moved both button rows up 34px and shortened the panel to preserve bottom padding.
- Syntax check passed and browser screenshot visually inspected.

## September 13 — overworld background surface

- Replaced the overworld's full-screen field/path backdrop with the supplied Theme Wood/nine_path_bg.png using nine-slice rendering at 2× border scale. Map terrain and other menus remain as before.
- Syntax check passed; inspected the explored-map browser capture.

## September 13 — promote connected upgrade nodes

- Main game now opens the approved connected-icon upgrade UI. Removed the old card renderer; prototype demo save remains isolated on its own page.
- Verified main-entry mobile node inspection without spending, explicit purchase, all five branches, Map return, and starting combat. Build and syntax pass; inspected browser and skill-harness screenshots.
- Updated the main script cache version for release.

## September 13 — dark upgrade background

- Upgrade nodes now use the overworld's woodBackground nine-slice instead of the old walking path. Lightened instruction text and connector lines for contrast on the darker surface.
- Syntax check and visual browser capture passed. Local update, not deployed.

## September 13 — purchasable node shimmer

- All rank-zero nodes use their grey disabled artwork, including unlocked roots. Purchased nodes use colored artwork.
- Added a low-opacity staggered diagonal shimmer only for unlocked, affordable, non-maxed nodes; rank labels remain unobscured.
- Syntax and mobile purchase/branch checks pass; inspected funded and unfunded screenshots. Changes remain local.

## September 13 — affinity upgrade tab names

- Renamed companion upgrade tabs to Feral, Bloom, and Arcane; Player and Shared retain their names. Text-state branch labels match the UI.
- Syntax check passed.

## September 13 — merge Shared into Player

- Moved Golden Echo, Hunter's Eye, Trail Pace, and Party Bond into Player. Removed Shared tab; remaining tabs are Player, Feral, Bloom, Arcane. Party Bond retains its recruitment requirement and effect.
- Expanded node layout width to keep six root nodes separated at original icon size. Syntax and four-tab purchase/navigation checks pass; inspected merged-tree screenshot.

## Upgrade screen label refinement
- Kept existing four-tab connected-node layout, doubled upgrade tab labels to 30px and centered actual glyph bounds. Removed duplicate description rank. Renamed generic Fangle stat labels to Feral and changed generic stat ownership wording/checks to matching type; individual abilities retain creature gates.

## September 13 — paired monster summons and directional combat

- Added an explicit catalog of 34 base/shiny pairs across all three affinity types and tiers. Uses SeparateAnim/Walk.png where supplied, otherwise the available 64×64 creature sheet (including nonstandard filenames). User approved SpiderRed→SpiderYellow, HeartGreen→HeartRed, KappaGreen→KappaRed; SpiritLarge remains excluded without a pair.
- Live Bestiary now filters type/tier, pages the roster, summons for 10/100/1000 matching essence, awards the base on first summon and one fragment per duplicate, and removes a creature from its pool at five fragments. Base/shiny selection is available at five fragments and persists. Existing owned legacy companions remain available in Tier 1.
- New companions use the existing Feral striker/Bloom healer/Arcane area role implementations. Wild monsters use base catalog artwork by stage tier (1–4 / 5–8 / 9–10); existing encounter stats, essence rolls and special Demon Cyclop bosses remain. Spawn-edge columns are north=0, south=1, east=2, west=3; rows animate at 8 FPS. Updated map labels to affinity groups and fixed stale fallback paths.
- check-monster-summons.cjs passes all nine pool completions, exact summon costs, first unlock/duplicate fragment transitions, completion and insufficient-funds guards, asset existence/loading, reload persistence, actual summon/shiny buttons, four entry columns, and shiny Tengu combat. Browser screenshots and required game-skill harness screenshots visually inspected; final browser run has no console/page errors. Syntax and diff checks pass.
- Existing check-game.cjs cannot run unchanged: its VM lacks URLSearchParams. A temporary fixture correction exposed another pre-existing stale upgrade lookup at line 91; fixture was restored. Legacy Bestiary click tests target the superseded three-card recruitment UI and are superseded for this flow by check-monster-summons.cjs.
- Remaining tuning: human playtest of tier prices and new party combinations. No deployment performed.

## Double Attack shared Feral upgrade
- Renamed Double Bite to Double Attack and clarified that its second-attack chance applies to all Feral creatures. Added type ownership gating and explicit affinity check in the shared Feral attack loop. Kept the saved upgrade ID and existing ranks, prices, prerequisites, and Triple Bite behavior.

## Player central upgrade tree
- Centered Damage +1 with Health +5, Quick Hands, Rock Breaker, and Golden Echo spokes. Quick Hands continues through Split Spark to Triple Spark; Golden Echo leads to Trail Pace and existing Hunter’s Eye. Preserved other Player nodes and their prerequisites. Health and Golden Echo now require Damage 1; Trail Pace requires Golden Echo 1.

## Damage +3, Boulder Buster, movable node tree
- Damage +3 branches diagonally from Damage +1 and requires rank 5. Provisional five ranks, starting at 50G. Boulder Buster requires Rock Breaker, has five ranks starting at 40G, and emits 1–5 current player shots in random directions from destroyed rocks (not vases). Both use existing cost scaling.
- Added clipped tree viewport with drag pan, mouse-wheel and +/- zoom, reset, transformed node hit targets, and a fixed detail panel.
- Browser checks passed rank-4 lock/rank-5 unlock, +3 damage purchase, projectile counts 0–5, origins/damage, vase exclusion, drag and wheel zoom; no page errors. Screenshot inspected and established game harness run. Local only.

- Boulder Buster now uses its own damage source and provisional flat 1 damage, independent of player damage/critical upgrades. Reuses the player projectile and impact art, with existing collision behavior; dedicated damage function provides a future tuning point.

## September 14 — tier-folder roster only

- Removed Fangle, Buttermant, and Tinmin from creature definitions and removed the legacy Tier 1 roster exception. Only the 34 paired tier-folder monsters are available. Title portraits now use Bat, Bamboo, and Eye.
- User clarified alpha development does not need older-save compatibility. Do not add migration work for retired content; removed the migration-specific test added during this change.
- Tier-only roster assertion and existing summon browser checks passed; syntax and diff checks passed. Inspected Bestiary screenshot. Default skill harness stalled with Mac graphics flags; reran its Mac-compatible copy for title capture.


## September 14 — approved wood panels and opening rosters

- Applied the approved Stage 1 preview to the live game: dark Wood asset inside orange encounter/action frames, individual monsters with affinity/HP/ATK, and boss details.
- Stage 1: Bat 80%, Bamboo 20%. Stages 2–3: Beast 20%, Bat 50%, Bamboo 30%; interpreted user's “Bloom” as Bamboo. Beast uses armored durability/movement. Shared roster stats power both combat and menu. Stage 3 Feral boss art is fixed to Bat to match its preview.
- Verified existing essence rules: 30% per affinity kill, fifth dry kill guarantee, one essence in stages 1–3; no separate Tier 1 drop-rule update exists. All configured roster spawns now have their matching affinity, removing the old opening Feral suppression for these stages.
- Passed `scripts/check-stage-rosters.cjs` (1,000 stratified rolls per stage, combat stats, actual spawned-monster rewards, pity and bosses) and `scripts/check-stage-rosters-browser.cjs` (map selection, combat rosters, navigation, no page errors). Ran Mac-compatible skill harness and inspected all three stage screenshots under `output/stage-rosters/`. Syntax and whitespace checks passed.

## September 14 — 32px combat spacing prototype

- Added isolated `ui-previews/combat-scale/` prototype with current/32px toggles and 6/12 monster toggles, using the real Stage 1 terrain, HUD, player, Bat and Bamboo sprites. Positions remain fixed and sprites animate; this is a visual comparison, not combat balance simulation. Live game files are unchanged by this request.
- `build.py` regenerates the prototype game copy. Browser checks passed all four size/count combinations with no page errors. Ran the Mac-compatible web-game skill harness and inspected the rendered prototype. Opened the comparison in Codex's browser panel.

## September 14 — applied 32px combat scale

- User approved the spacing prototype. Applied 32px rendering to player, companions, and regular monsters in the live game. Reduced corresponding contact/projectile hitboxes and adjusted player shot origin; health bars follow the smaller enemy radii. Bosses, terrain, camera, HUD, menu portraits and spawn rates retain their prior settings.
- Passed stage roster regression checks and new combat-scale collision checks (old-radius miss, new-radius contact, projectile hit/miss, boss radius). Browser draw-call assertions verified actual 32×32 player/companion/monster rendering without page errors; inspected `output/combat-scale/live.png`. Ran Mac-compatible skill harness, syntax and whitespace checks.

## Approved summon layout restored
- Bestiary defaults to the approved dedicated summon screen: type and tier choices, large downward-drifting Paw/Brambles/Iso background, VfxMix type-colored charge, stable creature reveal and single-line results. No visible pool, party slots, roster cards or explanatory footer on summon screen. Collection remains accessible for party management.
- Uses real summon transaction and balances; prevents repeat purchase during animation. Browser purchase and asset loading verified. Phaser image clipping suppressed patterns; replaced pattern mask with explicit edge crops and visually confirmed. Local only.


## September 14 — Phaser 4 migration

- Installed and pinned Phaser 4.2.1; vendored its browser bundle and MIT license so local/static hosting needs no CDN. Both browser entry points load Phaser and the renderer adapter.
- Phaser now owns the visible Canvas renderer and frame loop through ScrollMonstersScene. All image/spritesheet draws use pooled native Phaser Images and texture frames. The approved text, paths, gradients, and nested clips use custom Canvas Game Objects. Canvas rendering is intentional; this is not a WebGL conversion.
- Retained gameplay, combat timing, collision formulas, save schema/key, audio behavior, touch gestures, CSS portrait sizing, and deterministic hooks. Kept the Node simulation path for existing regression scripts.
- Fixed Phaser Canvas half-pixel source expansion on stretched wood panels, clip transform restoration, and custom object visibility/depth sorting. Compared against the original renderer and inspected title, map, upgrade tree/pan, summoning, combat, mobile, and result screenshots.
- Added scripts/check-phaser.cjs and npm run test:phaser. Verified upgrades, drag/zoom, summon/party changes, auto-target/mouse/touch input, victory/defeat/retry, all ten stage clears, save reload, upgrade prototype, and real-time Phaser updates, with no browser console errors. Ran the required web-game client successfully.
- Current stage-roster and combat-scale Node checks pass. Ten older VM scripts fail with URLSearchParams undefined; reproduced identical failures against the pre-migration game (a4ed06e), so these are pre-existing harness issues.
- Preserved concurrent summoning-screen changes arriving in game.js and verified their latest UI under Phaser.

- Fixed summoned/owned creature facing: portraits and party sprites now use south-facing column 0. Kept enemy entry-edge mapping separate so spawn directions remain correct.

## Fix shared type ownership gates
- Replaced lookup of removed legacy creature IDs with explicit STRIKER→feral, HEALER→bloom, AOE→arcane mapping for shared nodes. Unknown types cannot pass ownership accidentally.
- Verified each type accepts a matching owned creature, rejects missing/wrong ownership, and still enforces Double Attack prerequisites. Individual creature ability gates remain separate. Syntax passes; local only.

- Summon prices increased to 20 / 200 / 2,000 matching essence. Centralized summonCosts for tier labels, affordability, transactions and creature metadata; updated summon-check expectations.

## September 14 — collection and summon UI cleanup

- Replaced both Bestiary backdrop styles with solid black. Collection affinity filters now use Wood buttons, removed collection tier filters, and show only owned creatures across tiers (four per page).
- Centered pagination above side-by-side Summon and Back to Map buttons. Summon navigation remains available with no essence; empty collections provide a discovery prompt.
- Passed `scripts/check-collection-ui.cjs`: hidden locked names, all-tier ownership filtering, empty states, page wrapping/reset, active-party toggle, summon navigation and real transaction, return to map, and no browser errors. Inspected populated collection and summon screenshots under `output/collection-ui/`; ran the Mac-compatible web-game harness. Preserved existing uncommitted summoning and pricing changes.

## Tier 1 Bloom abilities
- Bamboo: Nature proj_nature_2, 1 damage, 240px targeting/travel range, 2s cooldown. Fish: Water impact_water used as traveling projectile, 1 damage, 480px range, 1s cooldown. Mole: Earth impact_earth_2 at target, 1 damage, 480px range, 1s cooldown. Distances/damage provisional.
- These three creature IDs now attack instead of inheriting the healer behavior; shinies retain the same ability. Effects use full strip frame counts (4/8/9). Projectile travel limits enforced, no cooldown consumed without a target.
- Browser checks passed attacks, damage, ranges and cooldowns with no page errors; screenshot inspected and game harness run. Local only.

- Bamboo base attack damage increased from 1 to 3; medium range and 2-second cooldown unchanged.

## September 14 — remove obsolete drawing helpers

- Removed unused treeRequirements, speciesDensity, and captureFacing helpers. Replaced the old upgrade-card coordinate generator with direct branch-definition selection; the active icon tree supplies its own positions. Removed the redundant definition-array copy and retired capture-card sorting.
- Kept active Canvas artwork, Phaser adapter, upgrade prototype, and Node simulation entry after checking their references. These remain functional dependencies, not abandoned HTML implementation code.
- Updated the Phaser browser check's outdated Tier 1 summon expectation from 10 to the current 20 essence. Full Phaser browser checks, roster and combat-scale checks, syntax and diff checks passed. Ran the required web-game client and inspected title and panned upgrade screenshots.

- Bloom range adjustment: Bamboo now long range (480px); Fish and Mole now medium range (240px). Damage and cooldowns unchanged.

## September 14 — Bloom type nodes

- Bloom tab now shows Health → Bloom → Flush and solo Razor Leaf, Water Burst, Rock Burst; all five ranks. Health starts at 10 gold, Bloom 20 gold, Flush 50 gold, and the solo nodes 20 Bloom essence, using existing 35% rank-cost scaling.
- Health grants +5 max HP/rank. Bloom/Flush heal +1/+3 HP per rank on enemy hits with an active Bloom party member; nodes show “Bloom Required.” Bamboo pierces +1 additional enemy/rank, Fish kills grant +1 stackable hit-blocking shield/rank, Mole hits on full-health enemies stun for +0.2s/rank. User confirmed shield/stun scaling and essence costs.
- Legacy healer definitions/save ranks retained internally; Bloom tab displays the six requested nodes. Interpreted connected nodes as Health → Bloom → Flush with one parent rank needed; solo nodes have no prerequisite.
- Added check-bloom-nodes.cjs and check-bloom-browser.cjs. Both passed combat effects, party gating, purchase limits, all six browser purchases, persistence, and no page errors. Inspected tree, purchased tree and combat screenshots under output/bloom-nodes. Browser requires software WebGL flags in this environment.
- Existing check-game.cjs cannot initialize because its sandbox omits URLSearchParams; left unrelated test unchanged.


## September 14 — full native Phaser UI and WebGL port

- Removed phaser-renderer.js and all Canvas context calls from the game. Phaser WebGL now renders native Image, Text, Graphics, NineSlice, Container, and Zone objects. The Node-only simulation path simply skips presentation; it has no old renderer.
- Added phaser-ui.js with retained WoodPanel/WoodButton components, grouped cards, native masks, stable hit areas, disabled/hover/pressed states, release/drag cancellation, and clean screen/tween lifecycles.
- Replaced manual uiTargets and DOM pointer/keyboard handlers with Phaser input. Moved images/font/audio to the Loader and Sound Manager, and portrait/fullscreen scaling to Scale Manager FIT. Preserved existing gameplay, save keys, and balance, including the current Bloom changes.
- Added native press/release tweens, summon reveal bounce/fade, result-card entry, reduced-motion handling, and a native reset-confirmation modal that blocks underlying controls.
- Updated native font spacing and removed duplicate CSS font loading. Retained source labels as Phaser object data; collection tests now inspect native labels instead of intercepting Canvas fillText.
- Validation: current roster, combat-scale, and Bloom logic checks pass; full Phaser gameplay checks, native component/tween/modal/reduced-motion/fullscreen checks, and collection navigation/transaction checks pass. Inspected title, combat, upgrade/panned tree, explored-map masks, collection, summon reveal, result, and reset-modal captures.
- The required web-game client was run. Its default Mac headless backend could not render WebGL reliably, so used a local copy with Metal and browser screenshots (WebGL's cleared drawing buffer otherwise produces black toDataURL captures). No custom rendering fallback was added to the game.

## September 14 — player attack interval and Quick Hands

- Player base firing interval is now 1 second. Quick Hands has five ranks, reducing the interval by 2% per rank to 0.90 seconds at rank 5. Starts at 10 gold with existing rank scaling (10, 14, 18, 25, 33).
- Updated both offense projection formulas to match live combat. Syntax, all six rank interval/cost checks, and Bloom combat regression checks passed.

- Map 1 Bat attack reduced to 1 and boss attack to 3. Shared stat calculations keep map previews and combat aligned; later maps retain prior attack values.

- Stage 2 Beast set to exactly 6 HP; Stage 2 boss set to 40 HP / 5 ATK. Updated combat and map/balance readouts; other stages unchanged.

## Tier 1 stage rosters through Stage 10
- Preserved Stages 1–3; explicit three-creature rosters for Stages 4–10 rotate Feral/Bloom/Arcane at 40/30/30%. All eleven Tier 1 species now appear across the campaign. Later HP scaling rises 3→9, with existing stage attack scaling.
- Catalog-based bosses use explicit Tier 1 identities; special Demon Cyclop bosses and boss stats retained. Map cards show actual creature HP/ATK; corrected major-boss preview multiplier.
- check-stage-rosters.cjs passed 100 regular spawns per stage, exact combat/preview stats, probability sums, Tier 1 regular/boss catalog entries, and Stage 2 boss regression. Uses Metal flags required by current Phaser WebGL renderer. Stage 4 map screenshot inspected. Local only.

## Enemy Owl and Mole behavior
- Confirmed all 11 base Tier 1 creatures are represented across Stages 1–10; higher tiers excluded.
- Owl enemies hold ~300px from player, retreat below 280px, stay within visible bounds and fire ranged attacks.
- Mole enemies move underground using the existing Character Shadow asset, emerge at 240px from the nearest party member with moleImpact earth animation and 0.45s rise, then attack normally. Burrow/emergence suppress targeting, damage, health bars and attacks.
- check-enemy-behaviors.cjs passes Owl range/firing and Mole underground immunity, emergence and surface damage; screenshot inspected with no page errors. Local only.

- Removed obsolete map type-summary fallback (HP ranges/Other monsters) now that all ten stages have explicit rosters. Creature previews show actual roster name, type, spawn percentage, HP and ATK. Bumped game asset version to refresh cached clients.

## Title screen theme refresh
- Applied the black page background and dark Wood panel interior inside the existing orange title frame. Text uses shared warm theme colors; existing title layout, portraits, journey and reset controls retained.
- Syntax/whitespace checks passed. Default headless skill harness hit WebGL unsupported; software-WebGL browser check passed with no page errors and verified the journey button opens the map. Inspected `output/title-wood/title.png`.

### Legacy-code cleanup after native port
- Removed unreachable stage-gated direct recruitment purchase logic. Current catalog creatures are acquired through tier summons; the legacy test hook still toggles already-owned party members.
- Old Canvas renderer is already removed. Kept captureDefs compatibility data because historical test/economy scripts still reference it; those scripts need a dedicated migration to current summon mechanics.
- Validation: Phaser browser regression suite, all-stage roster browser check, combat hitbox check, syntax and diff checks passed. Ran the adapted web-game client and inspected its title screenshot/state; no client errors.

## September 14 — Feral Tier 1 abilities and player range

- Implemented Bat (216px, 1 base damage/0.5s, lowest HP), defensive Beast (120px, 3 damage/1s, nearest-target 90° arc), and Lizard (152px, 2 damage/1s, nearest target). Copied the four supplied hit/slash/fire/burn sheets into assets/abilities and wired their animation frames. Base/shiny variants share abilities; Feral damage/speed/crit/multiple-attack upgrades apply.
- Lizard rolls 5% burn per direct hit: fixed 1 damage at 1s and 2s; reapplication resets the timer without stacking. Status animation follows the enemy. Generic impacts no longer hide supplied Feral hit effects.
- Shared ABILITY_RANGES defines 120/152/216/280/All. Player shots originate at the player's center, expire at 152px, and cannot hit enemy centers beyond that radius. Auto-target uses the same radius. Projectile range endpoints are processed before expiry.
- Corrected stale conversation/docs: Bloom already has Bamboo leaf projectiles (3 damage/2s, 480px), Fish water projectiles (1/1s, 240px), and Mole targeted earth impacts (1/1s, 240px). Preserved these custom ranges and verified all three attacks; no new Bloom design inferred.
- check-feral-abilities.cjs passes exact range boundaries, damage, arc inclusion/exclusion, burn probability boundary/ticks/refresh, player endpoint/expiry, shiny dispatch/cooldowns, and all Bloom direct/projectile damage checks. Browser assets loaded without errors. Syntax/diff checks passed; combat screenshot inspected. Skill harness adapted for Phaser Metal rendering and page screenshots (WebGL toDataURL returned a cleared black buffer).
- Updated ABILITIES.md with implemented behavior and provisional tuning. Campaign balance remains untested; no deployment.

## Explicit party slot replacement
- Add now selects an owned reserve creature without changing the saved party. Highlighted party slots accept a click to replace an occupant or fill an empty slot; other members remain in place. The selected creature's button becomes Cancel. Selection clears on placement or leaving collection; existing Active removal remains available.
- Browser checks passed full-party replacement, persistence after reload, cancellation, and empty-slot placement with no page errors. Inspected `output/party-replacement/select.png`. Browser actions wait for existing button transitions to settle.

## September 14 — Beast Follow-Up Slash

- Replaced the retired Fangle Follow-Up Bite with Beast-specific Follow-Up Slash: one 30-Feral-essence rank, fixed 20% per normal slash kill. Rolls resolve after the original arc; bonus slashes retarget in the same 120px/90° area and cannot chain. Removed the old Fangle kill proc.
- Updated dependent Mending Slash wording and Beast ownership gate; its existing per-hit healing now applies to bonus slashes. Base and shiny share behavior.
- Added browser assertions for proc success, exact 20% boundary, non-chaining, missing-upgrade guard, animation creation, and linked healing. Updated ABILITIES.md.

## September 14 — Bloom trigger chance

- Bloom node now has a fixed 50% chance per positive-damage enemy hit to heal its existing +1 HP/rank. Updated node text. Flush retains its separate existing healing behavior.
- Deterministic checks pass for triggering below 0.5, not triggering at 0.5, unchanged healing amount, independent Flush healing, and existing Bloom combat regressions.

## September 14 — restore slash ranks and first-clear stage 3 bonus

- Follow-Up Slash restored to five ranks: 20/40/60/80/100% proc chance and original 30/41/55/74/100 Feral essence costs. Beast ownership and non-chaining bonus attacks remain.
- Stage 3's bonus 15 Feral essence is awarded only while stage 3 is not yet in completed; normal boss victory records completion and banks the reward together. Repeat clears retain normal gold and regular-enemy essence.
- Browser assertions pass purchases through all five ranks, rank cap, proc scaling, and first/repeat stage 3 boss victories with exactly 15 total bonus FE. Existing ability regression passes. Updated ABILITIES.md and BALANCE.md.

## September 14 — stage 1 health swap

- Set stage 1 Bamboo to 2 HP and Bat to 1 HP; opening Bat calculation now respects roster base HP. Stage 2 Bat retains its existing 4 HP.
- Syntax check passed; skipped gameplay tests at user's request. Pushed only this change as 96e691c to production-connected main, preserving existing uncommitted work.

## September 14 — stage 1 boss health

- Lowered stage 1 boss HP from 28 to 20 through the shared boss scale table. Syntax check passed; no broad tests requested. Pushed c11cb9c to main.
- Reviewed later-stage scaling: regular HP uses a hand-set multiplier table; boss HP uses a separate hand-set table. Existing calculate-dps/simulate-economy scripts retain legacy companion/model assumptions. Proposed halving regular scale growth after stage 4 and 15% per-stage boss growth; waiting on tuning preference.

## September 14 — approved late-stage health tuning

- Halved regular HP scale growth after stage 4 and applied 15% compounded boss HP growth from stage 4. Stage 5–10 bosses: 171.2/196.8/225.6/260.8/299.2/344 HP. Smoothing increases stage 6–7 versus the old dip.
- Syntax and configuration arithmetic checked; skipped broad tests per user. Pushed only tuning changes in ad3bc36, preserving pre-existing uncommitted edits. Await human playtesting before further tuning.

## September 14 — player progression and stage 6 Mole

- Bloom now triggers at 10% per hit; healing amount/rank unchanged. Reach connects to Damage and adds 10% player range/rank (152 → 228px, five ranks), including targeting, projectile travel, and collision range. Essence Finder connects to Golden Echo: five ranks of +10% relative Tier 1 essence chance (30% → 45%); pity and boss rewards unchanged. Both new nodes provisionally start at 10 gold with standard 35% cost scaling.
- Party Bond now unlocks permanently after filling three companion slots once, costs 50G, and no longer depends on a healer for its purchased damage bonus. Milestone persisted on summon/slot changes and recovered from existing full-party or Party Bond saves.
- Stage 6 Mole was stopping at 240px, the exact emergence threshold, leaving floating-point cases underground. Burrowing enemies now approach to 220px and reliably cross the emergence threshold.
- Boulder Buster already handles every destructible obstacle rock, both small and medium. Added tests exercising actual rock destruction and bursts for both sizes; vase/crate props remain separate.
- check-player-expansion.cjs and check-bloom-nodes.cjs pass range/prerequisites, Tier 1-only drop boost, milestone persistence, boss emergence/damage, rock bursts, and 10% proc boundaries.
- check-player-expansion-browser.cjs passed native purchases, Party Bond unlock/save reload, and stage 6 emergence with no page/asset errors. Inspected Reach, Essence Finder, Party Bond, and the surfaced Mole screenshots in output/player-expansion. Required game client also ran; native browser screenshots provide visual verification because its WebGL buffer capture is black on this Mac.

## September 14 — shared Demon Cyclop boss roster

- All stages except stage 3 now use stage 1’s Demon Cyclop. Stage 3 retains Bat. Removed other boss creature assignments and random creature fallback for bosses, preventing accidental Mole burrowing or Owl movement. Stage-specific stats and rewards remain. Changes local; verification left to user per request.

## September 14 — music toggle

- Added a global upper-right music toggle using the existing Sing/SingDisabled icons, with musicEnabled persisted in the save. Music pauses/resumes independently of sound effects and remains off through screen/track changes. Moved nearby currency/auto-target controls to avoid overlap. Local changes; testing left to user per preference.

## September 14 — larger attack artwork and targeted Fish attack

- Doubled rendered attack projectile/impact/ability sizes with a shared visual scale; combat damage, collision radii, ranges, and timing preserved.
- Fish now deals its hit directly to its selected target and plays the eight-frame water impact there, following the target while alive. No Fish projectile is spawned. Water Burst still receives the Fish kill source. Testing left to user per preference; local changes only.

## September 14 — explicit cheap-ability cost curve

- Interpreted “6090” as separate 60/90 entries. All current base-10G abilities now use 10/15/20/25/30/60/90/120/150/200 by rank; shorter abilities use the prefix. Other base costs and rank caps are unchanged. Local edit; testing left to user.

## September 14 — gold ranks and party-wide damage

- Golden Echo: five ranks at +5% gold/rank, existing 15G base. Party Bond: +3 damage for player and all companion attack paths (Feral hits/bonus slashes, Bloom projectiles/targeted hits, Arcane blasts), applied once before critical multipliers where applicable. Updated node copy and player DPS projection. Local changes; testing left to user.

## September 14 — summon costs and guaranteed Bat

- Updated shared summon prices to 30/300/3000 essence, affecting purchasing and tier labels. First Tier 1 Feral pool contains only Bat until a Tier 1 Feral is owned; ownership persists the consumed guarantee. Failed purchases do not consume it. Existing Feral collections and higher-tier pools remain intact. Local changes; testing left to user.

## September 14 — attack size correction and Cyclop approach

- Reduced visual scaling from 2× to 1.25× original dimensions (2× width/height had quadrupled area).
- Fixed the missed stage-based AI rule: Demon Cyclop now uses melee approach/contact attacks on every stage, with the same base speed of 72 as stage 1. Previously stages 6+ stopped at 240px and used speed 28 despite the changed boss identity. HP, damage, cooldown and rewards unchanged.

- Removed the fractional attack multiplier after user correction, restoring original render sizes. Inspected PNG headers: all eight main attack sheets use 100×100 frames; visible art occupies only part of those frames. Existing Beast size 240 remains a separate pre-existing fractional scale to address when choosing per-effect integer sizes.

## September 14 — native 4× ability pixels

- All sprite-based attack/status/heal visuals now render at exactly four times their source frame dimensions, replacing mixed per-effect display sizes. Roughly 24×24 visible art becomes roughly 96×96; the 100×100 padded cells render at 400×400 without stretching the artwork to fill the padding. Frame alignment remains intact. Procedural AOE rings retain their gameplay radius. No combat-stat changes; local only.

## September 14 — accessible base upgrade prices

- Player Damage +1, player Health +5, Feral Focus, and Bloom Health now share prices 5/10/15/20/25/50/75/100/125/150 gold. Bloom Health expanded from five to ten ranks to use the full sequence; per-rank effects unchanged.
- Syntax and focused price/rank checks passed. Pushed only these two definition changes as 1e504d3; preserved existing unrelated local work. No broad test suite per user preference.

## September 14 — stage 2 enemy health

- Set final stage 2 Beast HP to 4 and Bat HP to 3 in shared rosterStats, used by combat and stage projections. Other stages and creatures unchanged. Local edit.

## September 14 — currency loot and victory presentation

- Essence rewards spawn matching Feral/Bloom/Arcane rows from Coin2-Sheet.png using gold's pop, spin, and homing animation. Failed essence rolls spawn no essence coins; guaranteed/boss rewards do.
- Boss defeat stops combat and waits at least 1.2 seconds plus completion of coin collection before banking rewards once and showing results. Result background uses shared dark wood menu styling.
- Focused browser checks passed missed/pity essence drops, boss gold/essence animation delay, result transition, and exactly-once banking. Inspected four-color loot and result screenshots. No broad suite run per user preference.

## September 14 — all bosses pursue the player

- Bosses now target the player explicitly, close to melee distance regardless of stage/artwork, and cannot inherit regular Owl standoff or Mole spawn burrowing. Removed the stage-based ranged-boss movement fallback.
- Focused browser checks passed all ten stage bosses reaching the player and dealing melee damage without ranged projectiles; inspected screenshot. Stage 6/8 also checked with Mole/Owl artwork.
- Scaling audit: stage 3 average regular HP 7.6 vs stage 4 8.4; roster changes offset the scale increase. Average hit damage 2.4 vs 2.8. Expected regular spawn counts about 30 vs 34, increasing to 60 by stage 10 at Trail Pace rank zero. Trail Pace adds 5% scenery/prop speed and spawn frequency per rank, not player movement or a shorter stage timer. No tuning changes made to these systems.

## September 14 — one essence pickup per reward

- Corrected essence visuals to spawn one colored coin per award instead of one per essence unit. Full bundle amounts still credit once; zero awards show no coin. Gold remains unchanged.
- Syntax and focused checks passed bundle sizes 1/2/3/4/15/20 and zero. No broad test suite per user preference.

## September 14 — regular enemies award exactly one essence

- Corrected the earlier misunderstanding: each successful regular-enemy essence drop now credits exactly 1 essence on every stage, rather than stage-scaled bundles of 1/2/3/4. One coin remains the visual. Drop chance and pity logic remain the same; separately defined boss bonus rewards are unchanged.
- Syntax check passed. Publishing only the reward-amount change.

## September 15 — new-player tutorial

- Added a separate tutorial before stage 1 for fresh saves: paused mouse/thumb aiming overlay with Begin, ten bats at 1 HP / 1 damage, no vases, rocks, treasure, or boss.
- Ten kills grant a total wallet of 10 gold, preserve stage 1 as the campaign starting point, and save an upgrade guidance step. Failed attempts can restart without banking partial rewards.
- The guided map disables stage selection, Bestiary, Play, and music; Upgrades blinks using the existing focus selector. Opening it selects the Player branch and Damage +1, then restores normal navigation.
- Existing saves with progress skip onboarding. Tutorial guidance survives reloads.
- Fixed a browser audio unlock race exposed by transitions: music tracks are created only after audio unlock, avoiding queued operations on destroyed HTML audio sounds.
- `node scripts/check-tutorial.cjs` passed mouse and touch combat, exact enemy stats/count, no destructibles, gold reward, reload, map restrictions, first damage purchase, and entry into normal stage 1, with no page errors. Screenshots of intro, combat, map, and upgrade focus visually inspected.
- `node --check game.js` and `git diff --check` passed. The skill client ran; its WebGL canvas capture was blank, so native Playwright canvas screenshots supplied visual QA (with a headed client follow-up).

## September 15 — Cyclops Cat starter companion

- Found and integrated Ninja Adventure's `Actor/Animals/CatCyclop` two-frame sprite and four-frame `FX/SlashFx/Slash` animation.
- Cat accompanies the tutorial, then is permanently awarded and auto-equipped as the first creature. It is a neutral starter in the collection, can enter reserves and be equipped again, and survives save reloads. Summon pools stay unchanged.
- Dedicated attack path uses exactly 1 damage, 120px melee range and a one-second cooldown, bypassing critical hits, party damage, speed ranks, extra attacks and on-hit upgrade effects.
- Mouse and touch tutorial regression passed, including ownership/equipment after reload and entering stage 1 with the cat. Focused combat checks verify actual damage under upgrades, melee range boundary and fixed cooldown. Slash and collection screenshots visually inspected; syntax/whitespace checks passed.
- Skill browser client also executed with macOS graphics adaptation; native Playwright screenshots provide reliable WebGL visual captures.

## September 15 — tutorial production release

- Cyclops Cat now appears only in the Feral collection tab for equip/remove controls; its gameplay affinity remains neutral and its dedicated fixed-stat attack is unchanged.
- Confirmed the cat follows the normal companion formation. Focused checks passed Feral-only visibility, fixed damage/range/cooldown, equip/remove/reload, and full mouse/touch tutorial completion. Production music build, syntax and whitespace checks passed.

## September 15 — early-stage tuning

- Stage 3 regular Beast HP reduced from 12 to 8, Bat from 8 to 6 using final-HP roster overrides shared by preview and spawning.
- Stage 4 replaces Eye with Bamboo at the same 30% spawn chance. Other regular enemies and bosses retain their existing stats.
- Browser roster checks passed 100 spawns on each stage plus explicit requested HP/lineup assertions; stage 4 preview visually inspected. Syntax/whitespace checks passed and skill client smoke check executed.
