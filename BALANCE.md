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
