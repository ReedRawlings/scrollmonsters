# ScollMonsters — Small GDD

Version 0.5 · September 9, 2026 · Working title: ScollMonsters

## Concept

A single-player pixel-art rail shooter with light monster-taming progression. The player starts with one character, recruits creatures through gameplay, aims attacks with the cursor while traveling forward automatically, and invests run rewards into a branching upgrade tree. Traveloot is the gameplay reference; this project uses original characters and art. The first deliverable is a small browser-playable prototype, with an eventual Steam release as a longer-term goal.

## Confirmed direction

- Party building and automated combat are the highest priorities.
- Forward travel is automatic along a fixed route; exploration is not a core mechanic.
- The player continuously auto-fires toward the cursor. After unlocking automatic targeting, Space toggles it on or off; disabling it returns to cursor aim.
- Creature abilities choose targets according to their moves, independently of cursor aim.
- Start with one character and recruit three creatures in sequence: a single-target attacker, a party healer, then an area-of-effect (AOE) attacker.
- World progression follows a series of playable levels connected by an overworld map. Completing a level advances the player through the map.
- Completing levels 3, 5, and 10 recruits the single-target attacker, healer, and AOE attacker respectively.
- There are no character experience levels. Character strength grows through permanent upgrades purchased with gold collected from battles.
- The party caps at four total members: the player character and three creatures.
- The entire party shares one health bar.
- Light monster taming is central to the game’s identity.
- Gathering should happen through a skill or ability instead of repeated mouse collection.
- Progression emphasizes damage, firing speed, projectile count, and companion upgrades.
- The eventual skill tree should feel dense, with mostly improvements to established mechanics.
- Use stand-in objects for the prototype. The user will procure new pixel art later.
- Working title: ScollMonsters.
- No co-op is required.

The sections below combine confirmed direction with proposed prototype defaults. Stage length, map layout, upgrade costs, and upgrade counts remain provisional.

## Player experience and core loop

Start with one character → select an available level on the overworld map → travel forward automatically, aim attacks, and collect battle gold → complete the level or lose the party → buy permanent upgrades → advance to the next level or retry. Completing levels 3, 5, and 10 adds a creature to the party.

The main decisions are which upgrades to buy, where to aim during combat, and when to use automatic targeting. Each run should make the effect of the player's last purchase easy to see.

## Prototype mechanics

| System | Proposed first version |
| --- | --- |
| Overworld | A map connects sequential playable levels. Completing a level unlocks the next; branching paths and replay rules remain undecided. |
| Levels | Each level is an automatically scrolling combat stage. Proposed prototype: ten short stages built from one environment and a small shared enemy set, sufficient to test all three recruitment milestones. Stage length and boss placement remain tuning decisions. |
| Movement and aiming | Forward travel is automatic. The cursor sets the attack target point; it does not steer the party. |
| Party building | Begin with one player character. Recruit creatures through gameplay. The party caps at four total members: the player character plus three creatures. All three prototype creatures can be active together. |
| Attacks | The player continuously auto-fires, aiming at the cursor when automatic targeting is off and at selected enemies when it is on. Creatures use abilities automatically and select targets according to the move: enemy targets for attacks, party targets for healing. |
| Automatic targeting | Unlockable player ability that selects enemy targets automatically. After unlocking it, press Space to toggle it on/off without interrupting auto-fire. Unlock requirement and target priority remain undecided. |
| Recruitment | Completing stage 3 recruits the single-target attacker; completing stage 5 recruits the healer; completing stage 10 recruits the AOE attacker. These are stage-completion milestones, not character levels. Proposed behavior: recruits are permanent and join an empty active slot immediately. |
| Survival | One shared party health bar. Enemy hits reduce health; zero health ends the run. |
| Collection | Gold from defeated enemies is added automatically without a pickup action. Golden Echo upgrades increase battle-gold yield. |
| Rewards | Automatically collected battle gold funds permanent upgrades and is retained after defeat. |
| Progression | No character levels or experience-level system. Purchase permanent upgrades with battle gold. Proposed flow: buy upgrades between stage attempts; starting a stage restores shared party health. |
| Saving | Save gold, purchased upgrades, completed/unlocked stages, recruited creatures, and active party locally in the browser. |

## Player character and recruitable creatures

The starting player character auto-fires projectiles toward the cursor, then gains automatic targeting through an unlockable ability. Use colored geometric stand-ins and distinct attack/healing effects until new pixel art is available.

| Recruitment milestone | Creature role | Confirmed ability | Details still to tune |
| --- | --- | --- | --- |
| Complete level 3 | Single-target attacker | Automatically attacks one enemy at a time | Target priority, damage, and attack speed |
| Complete level 5 | Party healer | Automatically heals the party | Healing amount and cooldown; restores shared party health |
| Complete level 10 | AOE attacker | Automatically attacks an area, damaging multiple enemies | Area size, damage, cooldown, and target-area selection |

Creature targeting belongs to each move. Single-target attacks select an enemy, healing restores the shared party health pool, and AOE attacks select an area containing enemies. Attack speeds and targeting priorities remain tuning decisions; a slower AOE cadence is a possible starting point.

The four-member cap accommodates the starting character and all three recruitable creatures. No bench or swapping system is required for this initial roster. Award each milestone creature once when its stage is first completed.

## Upgrade tree

Begin with approximately 10–12 nodes across a shared/player branch and the defined creature branches. Use several ranks on basic stat nodes to suggest the eventual dense tree without requiring a large content set.

- **Shared/player:** player attack damage, firing rate, projectile count, party health, collection improvements, and the automatic targeting unlock.
- **Single-target attacker:** damage and attack-rate improvements.
- **Healer:** healing amount and cooldown improvements.
- **AOE attacker:** area damage, radius, and cooldown improvements (proposed).

Show prerequisites, current rank, cost, and the exact effect of the next rank. Early purchases should be affordable after the first run. Final costs and stat values are tuning decisions.

## Route and enemies

Use one shared environment for the prototype and authored encounters across sequential stages: weak groups first, then mixed groups and bosses. The overworld communicates completed, available, and locked stages. Exact boss placement remains open.

- **Basic enemy:** low health; demonstrates targeting and damage.
- **Durable enemy:** high health; rewards concentrated damage.
- **Ranged enemy:** telegraphed attacks that reward aiming at the attacker before it fires; no manual movement is required to respond.
- **Boss:** one clear attack pattern with a more intense final phase.

The combat view needs readable projectiles, hit feedback, shared party health, current stage, next recruitment milestone, stage progress, gold, and player targeting mode with a Space toggle hint after unlock. Keep enemy and companion silhouettes distinct at the intended pixel scale.

## Screens and scope

Three screens are enough: an overworld map with party and upgrade access, a combat screen, and a results screen showing stage completion, gold, any newly recruited creature, and a return to the map.

Proposed prototype scope includes a simple overworld with ten short stages reusing one environment, one starting character, three recruitable creatures (single-target attacker, healer, and AOE attacker), a basic recruitment flow, three basic enemy types, one reusable boss type, a compact upgrade tree, automated collection, and local saving. Additional environments, story systems, equipment, crafting, online features, and Steam integration are outside this first build. The ten-stage scope is a proposed way to exercise the confirmed stage 3/5/10 milestones; it does not require ten unique environments. Earlier recruitment stages should be replayable in the prototype so the stage 10 AOE recruit can be tested without adding an eleventh stage (proposed).

## What the prototype must prove

- A new game starts with exactly one character.
- Completing stages advances overworld availability and persists completion.
- First completion of stages 3, 5, and 10 recruits the correct creature once, without exceeding four total party members.
- The three creatures respectively attack individual enemies, restore shared party health, and damage enemies within an area.
- Battle gold purchases permanent upgrades without a character-level system.
- Forward travel runs automatically and player attacks follow cursor aim before the automatic targeting unlock.
- After the automatic targeting unlock, Space switches between automatic enemy targeting and cursor aim while firing continues.
- Creature abilities choose suitable targets independently of the cursor.
- Combat and collection work without repeated clicking.
- Players can understand incoming threats and the effect of upgrades.
- A complete stage → reward → upgrade → map progression loop works, including defeat and retry.
- Reloading the browser preserves upgrades and recruited creatures.
- The loop is enjoyable enough to justify adding companions and expanding the tree.

## Open decisions

1. **Overworld structure:** linear sequence for the prototype as proposed, or branching paths? Can completed levels be replayed for gold?
2. **Automatic targeting:** which upgrade unlocks it, what does it cost, and how does it prioritize enemies?
3. **Persistence:** recruits and unspent collected gold persist after defeat as proposed; permanent purchased upgrades are confirmed.
4. **Setting:** what kind of world and creatures should the eventual art establish? Stand-ins allow this to remain open during prototyping.

Stage length, boss placement, upgrade counts, costs, and ability values remain tuning defaults for the first prototype.

## Reference and provenance

Based on the user's requirements in **“Plan Traveloot game copy”**, thread `01a08766-4a62-7c02-9115-b431f9fdc629`, particularly the request for original art, browser play, party building, automated combat, ability-based collection, and a small prototype.

This document uses that conversation and subsequent user decisions in the current thread as its sources. Current decisions establish the ScollMonsters title, automatic travel, cursor-directed auto-fire, an unlockable automatic targeting ability toggled with Space, temporary stand-ins followed by new art, a four-member party with shared health, three recruits (single-target attacker, healer, AOE attacker), permanent gold-funded upgrades without character experience levels, and an overworld of playable stages whose completion triggers recruitment at stages 3/5/10. Proposed mechanics and scope above extend it for discussion. The unrelated turn-based design document mentioned in the old folder is not a design source for this game. No assets have been moved or selected by creating this GDD.

## September 9 prototype update

- Each stage traverses its route in 30 seconds. Terrain work is deferred.
- Defeated enemies award gold immediately; no manual or proximity pickup is required.
- Every stage has a required miniboss, with stronger bosses at stages 5 and 10. A boss must be defeated through damage to count toward stage completion. Combat may continue after traversal.
- Each capturable monster has a capture root node in the upgrade tree, connected to its upgrades. Current capture milestones remain stages 3, 5, and 10.

These decisions supersede earlier provisional pacing, boss placement, and drop-retention defaults.

## Portrait and mobile prototype update

Travel is visually north to south. The camera keeps the player centered horizontally and one-third down the 540 × 900 playfield while the ground moves north. All stages retain 30-second traversal and required boss kills. Touch-and-drag aims automatic attacks on phones; an on-screen auto-target toggle supplements Space. Portrait menus, branch tabs, safe-area spacing, and aspect-ratio-preserving scaling support mobile browser testing. Terrain content remains deferred.

## Opening progression update

The player starts at 1 damage and 10 shared HP. Stage-1 regular monsters have 1 HP, and each defeated monster awards one gold. Enemies spawn fully off-screen, approach slowly toward the player, and deal contact damage when they reach the party. Off-screen monsters cannot be hit before they enter the visible combat area.

The opening boss should defeat an unupgraded party. A failed attempt retains earned gold so the player can buy simple first upgrades: +1 damage or +5 shared health, initially 5 gold each, then retry. Boss difficulty is implemented through combat stats rather than an artificial upgrade requirement. Existing progress is retained. See BALANCE.md for the current values and checks.

## Stage scaling update

Later stages increase regular monster health gradually and spawn density more noticeably. The opening stage remains unchanged. By stage 10, the nominal spawn interval is approximately 0.5 seconds and basic monsters have 3 HP, so enemies become slightly tougher without turning every regular target into a damage sponge. Boss health retains its separate existing curve. See BALANCE.md for values and validation limits.

## Opening movement and boss update

Stages 1–2 now show literal party movement: terrain remains fixed while the player and companions advance south. Their regular encounters contain charging basic and armored enemies with higher ground speeds. From stage 3 onward, the camera-scroll travel presentation resumes.

Bosses in stages 1–5 also charge toward the party and attack at melee range without projectiles. Bosses in stages 6–10 retain the ranged stand-off behavior. Every boss must still be defeated through damage before its stage can clear.

The opening party now advances at 14 pixels/second, and enemies can enter from any of the four edges rather than only from the south. Base player fire rate is reduced by 20% to one shot every 0.425 seconds. Kill gold is added immediately; Golden Echo replaces collection-range upgrades with increased battle-gold yield.

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

## Animated party roster

The current visual roster is the player plus Fangle (single-target attacker), Buttermant (healer), and Tinmin (AOE attacker). The player loops the four visible walking poses from row 3 of `assets/Sprites/MainCharacter/16x16 Walk-Sheet.png`; each pet loops its four-frame PNG strip. All party animations currently run at a provisional 8 FPS. Legacy internal role identifiers and essence save fields remain unchanged so existing browser saves continue to load.

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

## Single boss shots and vulnerable following pets — September 10

Ranged bosses now fire exactly one projectile per attack at every health level; removed low-health triple volleys. Early melee bosses retain their existing attacks. Companions form a close northward line behind the southbound player, with 40px spacing and positions following the player anchor. Player and companions share the existing health pool; no separate pet HP/death system is introduced.

Enemies approach/aim at the nearest party member. Melee contact on a pet damages shared HP using existing cooldowns. Enemy projectiles use swept collision against party hitboxes (20px player, 18px pet), damage the first body only and disappear, preventing a single shot from damaging multiple members in the line. Impact feedback appears at the struck body. Offensive damage, attack cadence and upgrade formulas are unchanged; actual target positioning and exposure can change combat outcomes.

The hybrid boss calculator now permanently models one shot per attack; the obsolete BOSS_VOLLEY_HITS sensitivity option is removed. Its default stage-8 result remains 20.6 mean attempts because it already assumed one hit per volley. Future failure reports omit repeated full loadouts per loss, retaining concise failure metrics plus stage-winning loadouts. Historical reports are retained.

## Party Bond — September 11

Party Bond is now a live, single-rank 50G node in Buttermant's upgrade branch. Capturing Buttermant unlocks the purchase. Buying it adds +5 flat damage to player shots and Fangle attacks, including Follow-Up Bite, before critical multipliers. It does not increase healing or Tinmin damage. The purchased rank persists with existing upgrade saves.

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
