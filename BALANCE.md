# ScollMonsters prototype balance

Opening numbers reflect the current direction. Later-stage balance remains provisional.

## Opening loop

- Start with **1 damage** and **10 shared HP**. Fire every 0.425 seconds, which is 20% fewer shots per second than the previous 0.34-second interval; player shots travel at 560 pixels/second.
- Stage 1 regular monsters have **1 HP** and die to one starting shot.
- Every defeated monster, including bosses, awards **exactly 1 gold immediately**. There is no pickup delay, stage reward multiplier, or boss gold bonus. Enemies that reach the player deal contact damage and are removed without a kill reward.
- **Damage +1** costs 5 gold for its first rank and raises damage to 2. **Health +5** costs 5 gold and raises party HP to 15. Later ranks cost 10 and 20 gold and add the same flat amount.
- The first miniboss has 28 HP. Its base melee attack is 5 damage (4 after stage-1 scaling), with a 2.4-second cooldown. Bosses in stages 1–5 charge to melee range; stages 6–10 stop at range and later bosses use a triple projectile volley below 45% HP.
- The boss is tuned to defeat a fresh player through combat stats, without a scripted loss or purchase check. Across 20 seeded runs with accurate aiming, no-upgrade attempts lost, while one damage rank plus one health rank won. First attempts earned 14–15 gold in these checks, enough for both upgrades. Missed shots can reduce earnings or require another attempt.
- Kill gold appears in the combat counter immediately and is banked on victory or defeat. Replays remain available.
- Existing saves and purchased ranks remain intact; their effects use the new numbers.

## Travel and enemies

Every stage has 30 seconds of traversal. Combat can continue until the remaining enemies and required boss are defeated. In stages 1–2 the ground stays fixed while the party moves south from y=180 toward y=600 at 14 pixels/second. From stage 3 onward, the camera keeps the player at (270, 300) while the ground scrolls north.

Enemies and bosses spawn just outside the north, east, south, or west edge, then home toward the player's actual position. They cannot be targeted or hit before entering the visible combat area between the HUD and bottom controls. Regular enemies deal contact damage when they reach the party. Stage 1–5 bosses charge to melee range and attack without projectiles; stage 6–10 bosses approach to a 240-pixel stand-off distance and fire. All bosses must lose all HP to count as defeated.

| Enemy | Base HP | Speed relative to ground (px/s) | Base damage | Gold | Behavior |
| --- | ---: | ---: | ---: | ---: | --- |
| Basic | 1 | 92 in stages 1–2; 32 later | 1 | 1 | Homes toward party |
| Ranged | 2 | 28 | 1 | 1 | Approaches and fires every 2.7 seconds |
| Armored | 3 | 70 in stages 1–2; 24 later | 2 | 1 | Durable approaching enemy |
| Boss | 28 | 72 in stages 1–5; 28 later | 5 | 1 | Melee through stage 5; ranged afterward |

- Regular HP scales gradually by `1 + 0.22 × (stage − 1)`, rounded, reaching ×2.98 at stage 10. Boss HP retains `0.82 + stage × 0.18`, rounded. Damage scales by `0.76 + stage × 0.095`, rounded with a minimum of 1.
- Stages 5 and 10 have a further ×1.5 boss HP multiplier.
- Each stage spawns its required boss at 21.6 seconds and stops spawning regular enemies at that point.
- Regular spawn intervals use `1.495 / (1 + 0.22 × (stage − 1))` seconds, with the existing random variation. Stage 1 is unchanged; stage 10 spawns approximately three times as often.
- Stage 1 uses basic regular enemies; stage 2 adds armored enemies; later stages mix all three.
- Gold is collected automatically on a kill. Golden Echo ranks add 10% battle-gold yield each, accumulating fractional bonuses until they produce another whole gold.

## Upgrades and companions

Twelve purchasable nodes provide 30 ranks. Capture root nodes unlock at stage 3 (Fanglet), stage 5 (Mossbud), and stage 10 (Novawisp), each with its own tab and connected upgrades.

| Upgrade | Per-rank effect | Rank costs |
| --- | --- | --- |
| Damage +1 | +1 player damage | 5 / 10 / 20 |
| Health +5 | +5 shared HP | 5 / 10 / 20 |
| Quick Hands | 10% shorter firing interval | 8 / 12 / 20 |
| Split Spark | +1 projectile | 15 / 25 |
| Golden Echo | +10% battle gold | 5 / 10 / 15 |
| Hunter's Eye | Unlock auto-target button and Space toggle | 10 |
| Fang Focus | +1 striker damage | 8 / 12 / 20 |
| Fang Rhythm | 15% shorter striker cooldown | 10 / 18 |
| Kind Bloom | +1 healing | 8 / 12 / 20 |
| Bloom Rhythm | 15% shorter heal cooldown | 10 / 18 |
| Nova Heart | +1 AOE damage | 10 / 15 / 25 |
| Wide Nova | +22 AOE radius | 12 / 20 |

Fanglet starts at 2 damage every 1.05 seconds; Mossbud heals 2 HP every 4.6 seconds; Novawisp deals 3 damage in a 70-pixel radius every 3.3 seconds. Companion numbers and later upgrade prices were reduced to match the smaller starting economy. Prerequisites remain unchanged.

## Testing

- `node scripts/check-game.cjs`: progression, boss completion, vertical movement, drop persistence, capture prerequisites.
- `node scripts/check-opening.cjs`: 20 seeded fresh/upgraded comparisons, 1 HP/1 gold, off-screen hits, homing/contact, first upgrade costs/effects.
- `node scripts/check-mobile.cjs`: touch controls, viewport fit, capture upgrades, save/reload, real combat.
- `node scripts/check-opening-browser.cjs`: first boss defeat → bank gold → buy both upgrades by touch → successful retry.

Browser tests require Playwright, Chromium, and the local game server. Automated accurate-aim checks validate the intended loop; later stages and real touch-aim difficulty still need playtesting.

## Campaign damage model

The prototype now links stage pressure, earned gold, and expected player damage with a rough planning model. This is a tuning guide rather than a hidden stat bonus: the player's real damage still comes only from purchased upgrades.

1. Expected regular spawns in stage `s` are `1 + (21.6 − 0.35) / spawnInterval(s)`.
2. Expected gold per attempt is `round(1 + expectedSpawns × 0.82)`. The `1` is the boss reward and `0.82` assumes some regular enemies reach the party instead of being defeated.
3. Expected campaign gold assumes two stage-1 attempts for the designed upgrade tutorial, then one attempt per cleared stage. When actual player gold is known, the model uses that value instead.
4. The model assumes 35% of all earned gold goes to player offense; the remaining 65% covers health, bonus gold, auto-targeting, and companion branches.
5. Player DPS is `(damage × projectileCount) / fireInterval`.
6. Required stage DPS is `1.25 × max(averageRegularHP / spawnInterval, bossHP / 10)`. The 1.25 factor covers imperfect aim and target switching.

The recommended offense path is Damage 1 → Speed 1 → Damage 2 → Speed 2 → Damage 3 → Multishot 1 → Speed 3 → Multishot 2. It is not enforced; it provides a stable baseline for comparing stages.

| Entering stage | Expected total gold | Offense budget | Projected shot | Projected DPS | Required DPS | Coverage |
| ---: | ---: | ---: | --- | ---: | ---: | ---: |
| 1 | 0 | 0 | 1 × 1 at 0.425s | 2.4 | 3.5 | 0.67× |
| 2 | 26 | 9 | 2 × 1 at 0.425s | 4.7 | 4.1 | 1.14× |
| 3 | 42 | 14 | 2 × 1 at 0.383s | 5.2 | 4.8 | 1.10× |
| 4 | 61 | 21 | 2 × 1 at 0.383s | 5.2 | 5.4 | 0.97× |
| 5 | 82 | 28 | 3 × 1 at 0.383s | 7.8 | 9.0 | 0.87× |
| 6 | 106 | 37 | 3 × 1 at 0.340s | 8.8 | 6.6 | 1.33× |
| 7 | 132 | 46 | 3 × 1 at 0.340s | 8.8 | 7.4 | 1.20× |
| 8 | 161 | 56 | 4 × 1 at 0.340s | 11.8 | 9.7 | 1.21× |
| 9 | 192 | 67 | 4 × 1 at 0.340s | 11.8 | 11.1 | 1.06× |
| 10 | 226 | 79 | 4 × 2 at 0.340s | 23.5 | 13.8 | 1.71× |

Companion damage is deliberately excluded from coverage, so recruited attackers provide the margin on stages 4–5 where projected player DPS is below the requirement. Future balance changes should adjust spawn rate, HP scaling, reward rate, upgrade costs, or the 35% spending assumption and rerun the projection assertions instead of tuning each stage independently.

## Stage density and health tuning — September 9

| Stage | Nominal spawn interval | Basic HP | Ranged HP | Armored HP |
| --- | --- | --- | --- | --- |
| 1 | 1.50s | 1 | 2 | 3 |
| 3 | 1.04s | 1 | 3 | 4 |
| 5 | 0.80s | 2 | 4 | 6 |
| 8 | 0.59s | 3 | 5 | 8 |
| 10 | 0.50s | 3 | 6 | 9 |

HP entries describe each type when present; stage 1 still spawns only basic regular monsters. Each stage is slightly tougher than the previous one, while encounter density supplies most of the later pressure. Gold remains exactly one per kill. Boss timing, boss HP, incoming damage, and upgrade costs retain their previous curves. Every multi-rank upgrade uses strictly ascending rank costs.

The prior stage-10 comparison used the superseded steeper health curve and should not be treated as current balance evidence. Natural progression and touch aiming still need playtesting.

## September 10 — faster monsters and compact health talents

- All monster movement speeds, including minibosses and major bosses, are multiplied by 1.4. Player/projectile speed and spawn timing are unchanged.
- Moved the existing Health +5 node to Player, preserving its saved ranks. Added Vitality +5 (10/15/25G) and Fortitude +5 (15/25/35G), each with three +5 shared-HP ranks, requiring the previous health node. All three health talents stack.
- Compact 232×108 talent cards replace 460×136 cards. Six Player talents fit into two columns with visible prerequisite connections; cards retain full-area touch targets.
- Game regression checks passed. Phone browser checks passed for prerequisite locking, health purchases, stacked health on stage start, save/reload, and the exact +40% opening monster speed. Skill harness screenshot/state and compact talent screenshots were visually inspected.

## September 10 — Fanglet essence progression

This supersedes Fanglet's automatic stage-3 recruitment. No XP or creature levels are added. Existing captured Fanglets and gold talent ranks are preserved.

- Wild Fanglets use the Fanglet sprite and occur among regular enemies, retaining the encounter's combat stats. Species density by stage 1–10: 20%, 30%, 70%, 35%, 25%, 65%, 30%, 40%, 75%, 35%. The map shows the selected stage's density and essence bundle size.
- Wild Fanglet kills have a 30% essence drop chance, guaranteed on the fifth consecutive dry Fanglet kill. The dry-kill counter persists when a run ends. Contact removals award nothing.
- Drops yield 1 essence in stages 1–3, 2 in 4–6, 3 in 7–9, and 4 in 10. Stage 3/6/9 bosses guarantee two bundles. Essence banks on victory or defeat alongside gold.
- Fanglet capture costs 8 Fanglet essence, with no stage-clear prerequisite. Once captured, Follow-Up Bite costs 20 essence: a normal Fanglet projectile kill fires one bonus shot at another visible enemy. Bonus kills cannot trigger another bonus.
- Fang Focus and Fang Rhythm retain their existing gold prices. Each node uses one currency; FE denotes Fanglet essence. Gold yield upgrades do not multiply essence.
- Prices, density and drop amounts are provisional. Spawn lures, other species' essence systems, and evolution/prestige remain future work.

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

## Trail Pace: travel-driven encounters

Added Trail Pace to Shared: ten ranks, each adding 5% travel speed and enemy spawn frequency, up to +50%. Costs follow round(20 × 1.35^(rank−1)): 20/27/36/49/66/90/121/163/221/298G. Base terrain speed is 24 px/s, reaching 36 px/s. Spawn intervals (including the first spawn delay) divide by 1 + rank × 0.05, so max rank yields 1.5× spawn frequency, not a 50% shorter interval. Grass retains its 45% parallax ratio and rocks follow terrain. Player remains centered; boss appears after 30 seconds and first-two-stage Fanglet gating stays at 15 seconds. Enemy movement, HP and per-kill rewards are unchanged. More encounters increase potential gold/essence and difficulty. Save defaults naturally treat absent travelSpeed as zero.

## Stage damage and Mossbud essence

Damage multiplier now follows 0.855 + 0.25×(stage−1) + 0.025×(stage−1)², rounded after multiplication by base damage. Stage 1 retains its opening values; stage 10 basic/ranged enemies hit for 5, armored for 10, bosses for 26. Opening Fanglets retain 2 damage in stages 1–2. The calculator exposes basic/armored/boss damage alongside HP.

Mossbud uses a separate saved essence wallet and dry-kill counter. Its absolute population share by stage is 0/0/10/35/60/15/50/40/15/50%, disjoint from Fanglets. Wild Mossbuds use their creature sprite and the encounter's combat stats. Drops follow Fanglet's 30% chance, fifth-dry-kill guarantee, and 1/2/3/4 essence bundle tiers. Bosses on 5/8/10 guarantee two bundles. Earned essence persists after victory or defeat.

Mossbud capture now costs 12 Mossbud essence instead of an automatic stage-5 reward; existing recruits remain captured. Deep Bloom costs 30 Mossbud essence and doubles a heal when pre-heal party HP is strictly below 50%. Kind Bloom and Bloom Rhythm remain gold-funded. Map, HUD, results and upgrade nodes display the correct species currency; ME means Mossbud essence.

## Consolidated health

Player Health +5 is now one ten-rank node, adding +5 shared HP per rank (60 total HP at rank 10 including the starting 10). Uses the same 15G base and 1.35 cost curve. Removed Vitality and Fortitude nodes. Loading an older save sums Health/Vitality/Fortitude ranks into Health and drops the legacy fields, preserving earned HP without changing currency. The migration is idempotent.

## South-spawning destructible rocks

Stages 1–3 have no rocks. From stage 4, rocks enter from below the south edge every 3.5–4.5 seconds of base travel (faster with Trail Pace), moving north with terrain and despawning above the playfield. Spawn positions avoid the central party corridor. Each rock has 15 HP. Player Rock Breaker costs 30G, requires one Damage +1 rank, and unlocks player-shot damage against rocks. Shots use actual player damage and are absorbed on impact, including the destroying shot. Without the node rocks block shots without losing HP. Damaged rocks show health bars after unlock, and destruction clears the firing lane. No rock rewards are awarded.

## Split Spark and Triple Spark — September 10

Split Spark now has ten ranks, each adding 10 percentage points to the chance of a second projectile (10% at rank 1, 100% at rank 10). Split Spark rank 5 unlocks Triple Spark, a separate ten-rank node. When a second projectile triggers, Triple Spark rolls for a third with 10% per rank. Both maxed guarantees three projectiles per volley. Both nodes start at 30G and use the existing rounded 1.35-per-rank price curve. Existing Split Spark ranks are retained with the new effects. Damage projections use the expected shot count `1 + secondChance × (1 + thirdChance)`.

## Fangle extra attacks — September 10

Double Bite requires Fangle capture and one Fangle Rhythm rank. Its ten ranks add 10 percentage points per rank to the chance of a second regular attack projectile. Rank 5 unlocks Triple Bite, with ten ranks giving 10%–100% chance for a third projectile when the second triggers. Both maxed guarantees three full-damage projectiles per normal Fangle attack, aimed at the same target. Both start at 30 gold and use the existing rounded 1.35 price curve. Follow-Up Bite remains a separate essence-funded on-kill attack; its bonus projectile does not roll Double/Triple Bite or chain another follow-up.

## Critical upgrades — September 10

Player, Fangle, Buttermant and Tinmin each have independent Crit Chance (10 ranks, +1 percentage point each; 0% before purchase, 1%–10%) and Crit Damage (5 ranks, +10 percentage points to the multiplier each). Base critical output is 100%, increasing to 110%–150% with damage ranks. Buttermant's equivalent is named Crit Healing and increases healing, capped at party maximum HP. Crit Chance starts at 20G; Crit Damage/Healing starts at 30G, with the existing rounded 1.35 rank curve. One Crit Chance rank unlocks the multiplier node; pet upgrades require capture.

Player and Fangle roll independently per projectile, including Fangle's on-kill follow-up. Tinmin rolls once per blast and applies the same multiplier to every target. Buttermant rolls once per actual heal, stacking with Deep Bloom. Fractional damage/healing is retained. Enemy attacks do not use party crit upgrades. Player DPS calculations include average crit output. Upgrade tabs with eight nodes use four rows and two columns to fit portrait screens.

## Fractional damage and gold — September 10

Crit Damage/Healing rank 1 now gives 110% output; ranks 2–5 give 120%/130%/140%/150%. A character with only Crit Chance has no critical output bonus until buying a multiplier rank. Fractional damage and healing are retained (1 damage at 110% = 1.1 damage). Enemy health subtraction normalizes to six decimal places to avoid residual floating-point health.

Gold gain now credits the full fractional amount immediately, including Golden Echo: one 1G kill with rank 1 earns 1.1G. Fractions are banked after victory or defeat, retained across runs and save/reload, and preserved after purchases. Removed the whole-gold accumulator that discarded a remainder at the end of a run. Gold accounting normalizes to six decimal places; HUD/menu/result and purchase shortage displays omit unnecessary trailing zeros. Upgrade price curves are unchanged.

## Party DPS / gold / HP audit — September 10

Updated scripts/calculate-dps.cjs to include Fangle's extra attacks and critical damage, Tinmin's per-target AOE damage, Buttermant healing, Golden Echo and Trail Pace in optional supplied-save calculations. Reads actual enemy spawn HP instead of reconstructing ranged/armored HP from rounded basic HP. Run `node scripts/calculate-dps.cjs [stage] [save.json]`; save JSON uses `upgrades` and `recruits`. This updates the external audit tool, not combat tuning or the older in-game projection helpers.

Default baseline retains the old 35%-of-prior-gold player offense path, assumes base Fangle at stage 4 and base healer at stage 6, and has no Tinmin until after stage 10. These are hypothetical capture timings, not modeled essence acquisition. DPS is sustained ideal single-target output; excludes misses, rocks, overkill, travel and kill-dependent Follow-Up Bite. Gold estimates assume a full traversal and defeated boss.

| Stage | Baseline party DPS | Gold at 82% regular kills | Basic / ranged / armored HP | Boss HP | Ideal boss seconds | Incoming regular HP/sec |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 2.35 | 18.16 | 1 / 2 / 3 | 28 | 11.90 | 0.67 |
| 3 | 4.71 | 25.36 | 4 / 8 / 12 | 94 | 19.97 | 6.47 |
| 5 | 7.13 | 32.55 | 6 / 12 / 18 | 256 | 35.89 | 12.66 |
| 8 | 9.75 | 43.34 | 14 / 28 / 42 | 396 | 40.62 | 39.92 |
| 10 | 10.73 | 50.53 | 14 / 28 / 42 | 556 | 51.83 | 46.84 |

Stage-1 ordinary spawns are basic only; opening Fangle HP overrides apply in stages 1/2. Incoming HP/sec is spawn load, not enemy attack damage. The 82% kill assumption becomes optimistic once party DPS falls below that load. Maxing all upgrades yields ideal player/Fangle/Tinmin DPS of 116.47/51.43/4.14 = 172.04 single-target DPS; max healing is 1.63 HP/sec before Deep Bloom. All gold-funded ranks cost 17,779G, so this ceiling is not a plausible one-pass campaign loadout. Max crit chance and multiplier add only 5% average output, whereas max second/third-shot upgrades triple projectile count. More natural purchase/retry simulation is needed before tuning enemy stats again.

## Spend-all campaign simulation — September 10 (supersedes 35% baseline)

`node scripts/calculate-dps.cjs` now runs the actual combat simulation in `scripts/simulate-economy.cjs`. No gold budget is reserved: after each attempt, buy eligible affordable upgrades until none remain. A marginal-benefit heuristic chooses between damage, health/healing, economy and rock-breaking; its weights rank purchases, not fractions of money held aside. Captures and essence-funded abilities use real earned essence. Defeats bank actual rewards and retry the same stage. The default uses 10 seeds with accurate nearest-target aiming and an 80-attempt-per-stage safety cap. All ten campaigns completed.

The simulation asserts after every shop that no eligible gold upgrade remains affordable, and that total earnings equal spending plus the remaining wallet. Residual gold is only an affordability remainder. Stored per-attempt-ending stage records contain the winning loadout, earned/spent gold and captures in output/economy-simulation.json. No combat tuning changed. Existing in-game legacy projection helpers are not used by the default audit; optional save-file mode remains a static comparison.

| Stage | Mean attempts | Mean winning party DPS | Mean gold/attempt | Boss HP | Mean cumulative spent | Mean leftover |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 2 | 4.71 | 20.9 | 28 | 35 | 6.8 |
| 2 | 4 | 9.6 | 26.7 | 84 | 140 | 8.59 |
| 3 | 1.6 | 12.6 | 31.9 | 94 | 190 | 9.63 |
| 4 | 7.4 | 23.79 | 35.2 | 186 | 454.9 | 5.75 |
| 5 | 5.7 | 29.94 | 45.79 | 256 | 715.5 | 9.02 |
| 6 | 3.7 | 33.26 | 57.04 | 204 | 930.3 | 5.16 |
| 7 | 4 | 38.39 | 64.27 | 258 | 1182.9 | 7.75 |
| 8 | 37.5 | 70.58 | 73.85 | 396 | 3944.2 | 20.13 |
| 9 | 15.3 | 89.24 | 90.97 | 446 | 5289.1 | 57.26 |
| 10 | 14.7 | 104.9 | 99.62 | 556 | 6808.5 | 7.12 |

DPS is ideal sustained output of the actual winning loadout; success/failure uses real combat collision, cooldowns, crits, rocks and healing. This is one explicitly stated purchase strategy, not an optimal-policy claim or human difficulty estimate. Stage 8 shows a large retry spike (37.5 average attempts), worth testing with other purchase priorities before tuning. Tinmin is acquired after stage 10 and therefore contributes no damage to the first campaign clear.

## 90% regular kills + independent boss calculation — September 10

Default calculator now uses a hybrid estimate. Each attempt grants gold for exactly 90% of the sampled full-stage regular spawn count, applying Golden Echo. A deterministic 90% integer sample of spawned species runs the existing essence/drop logic. The remaining 10% generate no rewards or further pressure in this abstraction. Boss gold and boss essence are granted only after a boss win. All affordable gold purchases continue between attempts.

Boss calculation: expected sustained party DPS drains actual boss HP; incoming hits occur every 2.4 seconds; healing occurs at actual cooldowns with expected critical healing and conditional Deep Bloom. Full starting party HP is the default (`BOSS_ENTRY_HP=1`), no boss approach delay, no rocks/misses/regular-enemy pressure. Crit/multishot randomness is averaged. Killing at the exact same time as an incoming attack resolves the kill first. Baseline assumes one landed projectile per volley; `BOSS_VOLLEY_HITS=3` is a conservative triple-hit sensitivity scenario below 45% boss health on stages 6+. These assumptions are explicit rather than consequences of the 90% kill input.

Ten-seed mean stage-8 attempts: hybrid baseline 20.6; three-hit sensitivity 26.8; previous full combat 37.5. These campaigns have different prior purchases and earnings, so differences are not a controlled single-variable boss comparison. The high requirement persists even when trash attrition is removed. No actual gameplay stats changed.

Stage 7 -> 8: regular HP 8/16/24 -> 14/28/42 (+75%), boss HP 258 -> 396 (+53.5%), boss damage 16 -> 19 (+18.75%), spawn density +9.48%. A seed-1 full-combat trace reproduced 33 stage-8 attempts: 32 losses, 30 after boss spawn; average 2.72 regular enemies remained at death. First loss left the boss untouched with two regular enemies alive. This supports crowd delay plus stronger boss pressure; the exact delay varies with targeting and purchases.

Commands: `node scripts/calculate-dps.cjs` (hybrid default), `BOSS_VOLLEY_HITS=3 node scripts/calculate-dps.cjs 8`, `SIM_MODE=full node scripts/calculate-dps.cjs`. Outputs: output/economy-hybrid-hits1.json, output/economy-hybrid-hits3.json, output/economy-full.json. Assertions cover gold conservation/no affordable upgrade left, exact 90% reward and boss gating, known boss kill/death times and discrete landed damage.

## Single boss shots and vulnerable following pets — September 10

Ranged bosses now fire exactly one projectile per attack at every health level; removed low-health triple volleys. Early melee bosses retain their existing attacks. Companions form a close northward line behind the southbound player, with 40px spacing and positions following the player anchor. Player and companions share the existing health pool; no separate pet HP/death system is introduced.

Enemies approach/aim at the nearest party member. Melee contact on a pet damages shared HP using existing cooldowns. Enemy projectiles use swept collision against party hitboxes (20px player, 18px pet), damage the first body only and disappear, preventing a single shot from damaging multiple members in the line. Impact feedback appears at the struck body. Offensive damage, attack cadence and upgrade formulas are unchanged; actual target positioning and exposure can change combat outcomes.

The hybrid boss calculator now permanently models one shot per attack; the obsolete BOSS_VOLLEY_HITS sensitivity option is removed. Its default stage-8 result remains 20.6 mean attempts because it already assumed one hit per volley. Future failure reports omit repeated full loadouts per loss, retaining concise failure metrics plus stage-winning loadouts. Historical reports are retained.

## Calculator-only Party Bond scenario — September 11

Default hybrid calculator includes a hypothetical single-rank Party Bond node costing 50G, requiring Buttermant capture, adding +5 flat damage to the player/Fangle/Tinmin before extra-shot and crit multipliers. It grants no healing bonus and no bonus from capture alone. The node is inserted only into the calculator's isolated VM; game.js is unchanged. It competes with other gold upgrades under the existing spend-all policy. Static supplied-save estimates require `upgrades.partyBond: 1` as well as the healer recruit. Disable the scenario with `BUTTERMANT_PARTY_BONUS=0 node scripts/calculate-dps.cjs`. Full-combat mode remains the real game with no hypothetical bonus.

Ten-seed comparison: Party Bond available stage 4, purchased stage 4–5 at average 432.34 cumulative gold earned (price is still 50G). Average campaign attempts 73.1 -> 34.0; stage 8 attempts 20.6 -> 3.1; stage 10 16.9 -> 8.3. Different purchase paths and earlier retries affect later loadouts; this is a campaign comparison rather than a fixed-loadout damage test. The earlier zero-cost capture scenario is superseded. Reports live in ignored output/economy-hybrid-buttermant5-cost50.json and output/unlock-timing-hybrid-buttermant5-cost50.json.

Assertions verify capture gating, no free bonus, 49G rejection / exact 50G debit, one-rank cap, extra damage for all three attackers, unchanged healing, and campaign gold conservation.

## Party Bond live implementation — September 11

Implemented the 50G capture-gated node for player/Fangle damage. Player and Fangle gain +5 on every projectile, including extra attacks and Follow-Up Bite; crit multipliers apply afterward. Healing and Tinmin are unchanged. Calculator uses the live node definition instead of inserting a hypothetical duplicate; its +5 modifier is applied once. This supersedes calculator-only descriptions above.

## Faster regular enemies and reduced boss HP — September 11

All non-boss enemies move 20% faster than their prior speeds, including wild creature variants. Boss movement and projectile speeds are unchanged. Boss final HP is multiplied by 0.8 in stages 2–10; stage 1 stays at 28 HP. Decimal boss HP is retained so the reduction is exactly 20%. New boss HP by stage: 28, 67.2, 75.2, 148.8, 204.8, 163.2, 206.4, 316.8, 356.8, 444.8. Both the in-game projections and separate boss calculator use the new multiplier.

Contact behavior remains persistent melee: regular enemies stop at the nearest party member and deal damage every 1.5 seconds until killed. Contact itself does not remove the enemy; only zero HP triggers combat removal.

## Buttermant stage gate correction — September 11

New Buttermant captures require clearing stage 5 as well as paying 12 Buttermant essence. Previously the stage metadata was not enforced by the essence purchase handler, allowing early captures. The capture card and purchase handler now enforce the stage-5-clear requirement; existing owned creatures are retained. Party Bond still requires capture and costs 50G, so fresh progression cannot obtain it during stage 4 or before clearing stage 5.

The corrected ten-seed hybrid estimate gives stage 4 a mean of 5.9 attempts (5–6), without Buttermant or Party Bond. All modeled captures happen after stage-5 clear; Party Bond purchases occur after stage 5 or during stage 6. Buying choices differ from the earlier invalid early-capture scenario.

### Early progression rewards
- Player Damage +1 prices are 80% of each previous rank price, rounded to whole gold (rank 1: 12G; rank 5: 40G). Other nodes retain their prices.
- Stage 3 uses an enlarged Fangle boss with its existing boss stats. Each defeat grants exactly 15 Fangle essence instead of the previous boss essence award; no additional random Fangle drop is rolled for this boss.
- The first stage-4 attempt schedules a 15G treasure chest 5–10 seconds into the run. It enters from the south, scrolls along the center lane, and has 5 HP and must be destroyed by player shots to award gold. Rocks are excluded from its lane while active. The reward is a flat 15G, banked with the run even on defeat after destruction.
- The first-attempt flag is saved when stage 4 starts, so abandoning or losing early does not repeat the guarantee. Existing saves that already cleared stage 4 skip the guarantee. After that introduction, each stage attempt (including replays) rolls once at 0.1% for a chest; no chest upgrades yet.
- The hybrid calculator shares chest scheduling/destruction and boss essence rewards with gameplay. Its ideal regular-clear and stage-4 7 HP pre-boss damage assumptions remain in effect.

### Ranked essence traits
- Follow-Up Bite now has five ranks: 20/40/60/80/100% chance on a regular Fangle attack kill to fire one extra bite at a remaining visible enemy. Extra bites cannot chain. Prices: 30/41/55/74/100 Fangle essence.
- Rank 1 unlocks Mending Bite: five ranks healing 1/2/3/4/5 shared HP per landed follow-up, capped at max HP. Prices: 60/81/109/148/199 Fangle essence. Misses do not heal; this heal is flat, not a critical heal.
- Deep Bloom now has five ranks: 20/40/60/80/100% chance per eligible Buttermant heal to double its healing while below half shared HP. Prices: 30/41/55/74/100 Buttermant essence. Above or at half HP it does not trigger.
- Existing saved rank-1 purchases remain rank 1 (now a 20% trigger chance). The hybrid boss calculator rolls Deep Bloom chance at each eligible heal; Follow-Up Bite and Mending Bite remain excluded from isolated boss math because no regular-enemy kills are modeled during the boss fight.

- Bloom Guard: one purchase for 200 Buttermant essence, unlocked by Deep Bloom rank 5. Each Deep Bloom proc can grant a single shared shield blocking the entire next damaging hit on any party member. No stacking or expiry; a 2-second cooldown starts when granted. A fresh Deep Bloom proc is required to reapply it after the cooldown. Shield and cooldown reset each stage attempt. Blue rings show protection; calculator includes boss-hit absorption.
