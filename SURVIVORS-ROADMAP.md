# Scroll Monsters — expansion ideas and playtest decisions

Updated September 22, 2026. This records our discussion; proposed features below are not implemented or final commitments.

## Current playtest: slower movement
- Normal base movement reduced by 10%: 178 → 160.2 pixels/second.
- Applies to both movement axes, keyboard and touch. Fleet Feet and Slipstream still multiply the base speed.
- Dash retains its existing speed, distance and cooldown. Ordinary dash has no invulnerability; Phase Veil supplies a brief window.
- Run logs identify this iteration as movement-tuning-v17.
- Evaluate whether positioning and dash timing matter more, whether enemy attacks remain avoidable, and whether travelling to objectives becomes tedious. Compare damage taken, survival, captures and relic collection with the previous build before further tuning.

## Already implemented
- Ten-minute expeditions; Guardian arrives at 9:30, victory requires ten minutes and its defeat. Two-minute trial remains available.
- Seven capturable creatures; first capture unlocks that creature as a starter. Support creatures do not need to excel solo.
- Thirteen run-only relics, unlimited equipment and duplicate stacking; relics are separate from XP upgrades.
- Recurring guarded caches, relic-bearing elites, and relics from each shrine challenge.
- Fixed late-run enemy escalation, independent of the player's relic inventory.
- Woodland and desert visuals; both currently share encounter/reward systems.

## Next gameplay proposals
### Creature combinations through level-ups
Keep individual damage, speed and behavior upgrades. Compatible teams can receive random combo upgrade offers; once selected, triggers should be predictable.
- Cat + Beast: Beast's charge ends with an outward-moving arc of Cat's swipe.
- Owl + Mole: eruption launches feathers outward.
- Frog + Cat: shield pulse empowers Cat's next swipe.
- Mouse + Beast: charge releases pursuing mice.
Start with Cat + Beast before building more combinations. No requirement to cover every pair immediately.

### Creature-dependent dash choices
Recruiting creatures could unlock selectable dash styles, chosen on recruitment or pause:
- Cat: finishing swipe.
- Beast: damaging charge through ordinary enemies.
- Owl: delayed feathers along the path.
- Mole: eruption left at the starting point.
- Frog: party attack-speed pulse with its own cooldown.
Creature combinations could later modify these. Bosses/elites remain immune to knockback. Keep dash relics limited to invulnerability; do not add the proposed Aftershock Stone or Momentum Thread.

### Major creature evolutions
Consider in-run branching transformations after sufficient upgrades, such as Cat shockwaves versus chained pounces. Leave enough time to enjoy the transformation. Requirements and branches are undecided.

### Distinct biome engagements
Woodland retains the escalating shrine. Proposed desert alternative: a mid-run sandstorm reveals buried ruins with optional chambers, defenders and relic rewards; deeper chambers are harder. Current desert cache naming is not this event. Use capturable creature types for encounters.
Randomized objective locations and encounter selections could make routes and team choices vary between runs.

### Replayability beyond captures
Explore creature mastery challenges unlocking evolution branches, relics and harder expedition tiers. Capturing all seven should not exhaust progression. Permanent stat upgrades are undecided; no XP-derived currency was requested.

## Open balance/design decisions
- Optional continuation after a timed victory versus a defined ending only; not implemented.
- Reward frequency and stack curves across ten minutes; allow strong combinations to pull ahead without automatically matching enemy stats to the player's power.
- Resonance Bell currently triggers from three different party attackers, not bespoke combo attacks. Revisit when combos exist.
- Echo Fang currently echoes damage on the target; it does not reproduce a creature's whole attack animation/projectile pattern.
- XP should track challenge: Owl worth 1 XP; equally difficult creatures should award equal XP. Higher-tier rewards need a separate balance pass.
- Bear's visual similarity to Beast and den visibility still merit review.

## Reference standard
Use games with demonstrated audiences and commercial traction for market comparisons, especially Megabonk and Vampire Survivors. Small-download examples alone are not evidence of a successful design. Treat proposed mechanics as experiments, not guarantees of replayability.

## September23 playtest follow-up
Implemented in enemy-pressure-v18: charging enemy Beast knockback immunity,2x Guardian attack cadence (same damage/projectile speed), and gentle body spacing between enemies. Retains10% slower player movement fromv17. Evaluate whether crowds occupy meaningful space while deliberate herding remains rewarding. Potential later behavior changes: flankers, varied approach angles and coordinated ranged positioning; these are not implemented.
Supplied v16 run:10:18win,1948kills,Cat/Frog/Mouse; boss inflicted one damaging hit in48seconds. This does not yet measure the slower-player build.

## September23 — elemental expansion implemented
Salamander, Spider and Storm Lizard now have capture habitats, persistent starter unlocks, level-up upgrades, bestiary entries and damage logging. Their four proposed pairs (Salamander+Beast, Spider+Cat, Storm+Owl, Spider+Frog) are selectable level-up combo upgrades. Their three creature-supplied dash styles are available from an in-game cycle button. Small hostile hazards and a shared cap are implemented; the map size is unchanged. This supersedes the earlier proposed status for these specific features. Cat/Beast standalone dash styles, Cat+Beast swipe combo, full branching evolutions and the desert ruin event are still future work.

## Upgrade balance to investigate
Do not automatically reduce all damage upgrades. Current flat damage and additive speed bonuses already decline in relative value per rank. Compare actual choices and outcomes for damage versus jumps, reach, area and combos. Prefer clear current→next values in upgrade descriptions and improve situational usefulness of alternatives. No damage nerfs applied in combat-clarity-v20.

## September24 — exploration implemented
XP Magnet, Frenzy and Cleanse are now occasional map supplies. Map enlarged20% per dimension, dens randomized, and den/chest locator labels removed in favor of a generic den appearance notification. Breakable supply objects remain a future proposal.
