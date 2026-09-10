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
