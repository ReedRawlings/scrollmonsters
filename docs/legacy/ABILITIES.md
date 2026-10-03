# Creature abilities and attack ranges

This is the current ability reference. Player range and the Tier 1 Feral abilities below are implemented in `game.js` using shared `ABILITY_RANGES` and per-creature `feralAttacks` definitions. Bloom already has the separate attacks documented below.

## Shared range definitions

Ranges are circular radii measured in game pixels from the attacking creature's center. They do not scale with viewport size or add the creature's sprite half-width. The logical battlefield is 540 × 900 pixels. These definitions replace the earlier percentage-based rectangles and sprite-edge range proposals.

| Range | Radius |
| --- | ---: |
| Melee | 120 px |
| Short | 152 px |
| Medium | 216 px |
| Large | 280 px |
| All | Entire battlefield |

## Current assignments

| Attacker | Range | Ability behavior |
| --- | --- | --- |
| Player | Short — 152 px | Player's primary attack. |
| Bat / BlueBat | Medium — 216 px | 1 base damage every 0.5 seconds; targets the lowest-health eligible enemy. |
| Beast / Beast2 | Melee — 120 px | 3 base damage every second in a 90° arc aimed at the nearest enemy. Stays in formation; enemies must approach it. |
| Lizard / Lizard2 | Short — 152 px | 2 base damage every second to the nearest enemy; 5% chance to burn. Burn deals 1 damage at 1 and 2 seconds. Reapplication refreshes duration and tick clock without stacking. |

Shinies currently share their base creature's ability and range. Keep their definitions separable so they can diverge later.

## Supplied effect assets

| Effect | Source file |
| --- | --- |
| Bat hit | `/Users/reedrawlings/Downloads/SoggySocks Combat FX/PNG/impact_Bleed_small_sheet.png` |
| Beast slash | `/Users/reedrawlings/Downloads/SoggySocks Combat FX/PNG/slash_1_sheet.png` |
| Lizard hit | `/Users/reedrawlings/Downloads/SoggySocks Fire FX/PNG/impact_fire_sheet.png` |
| Burn status | `/Users/reedrawlings/Downloads/SoggySocks FX Status Effects/PNG/statusfx_burn_sheet.png` |

## Range and scaling rules

- Eligibility uses center-to-center distance, inclusive of the radius boundary. Hidden/underground enemies cannot be selected.
- Player projectiles originate at the player's center, stop at 152 px of travel, and cannot damage enemy centers beyond that radius. Auto-target selection uses the same radius.
- Feral Focus adds damage to each direct Feral hit. Feral speed, critical, and double/triple attack upgrades continue to apply. Burn remains a fixed 1 damage per tick.
- Initial damage, intervals and Beast arc are provisional tuning values; they are implemented, not yet campaign-balanced.

## Existing Bloom Tier 1 implementation

Verified against the current code and browser behavior; these predate the Feral update and retain their existing custom ranges.

| Creature | Attack | Damage | Interval | Radius |
| --- | --- | ---: | ---: | ---: |
| Bamboo / BambooYellow | Leaf projectile, 300 px/s | 3 | 2 s | 480 px |
| Fish / FishRed | Water impact directly on target | 1 | 1 s | 240 px |
| Mole / Mole2 | Targeted earth impact | 1 | 1 s | 240 px |

Bloom's custom radii have not been reassigned to the shared range categories. Arcane Tier 1 individual abilities remain undefined.

## Beast upgrade: Follow-Up Slash

Replaces Follow-Up Bite. Five ranks cost 30/41/55/74/100 Feral essence and require owning Beast. Each kill from a normal Beast slash independently has a 20/40/60/80/100% chance to grant another slash at ranks 1–5. Resolve the first arc fully, then aim each earned slash at the nearest surviving enemy within 120 px. Bonus slashes retain the 90° arc and damage scaling, but cannot trigger further bonus slashes. No target means no bonus attack; boss victory ends attacks immediately.

The linked Mending Slash upgrade replaces Mending Bite and heals the party by 1 HP per rank for each bonus-slash hit, capped at maximum health. It requires Beast and Follow-Up Slash. Base and shiny Beast behave identically.

Attack artwork renders at exactly 4× its original source pixels (roughly 96×96 visible art for a 24×24 effect); damage, hitboxes, ranges, and cooldowns are unchanged. Fish applies its hit immediately and plays the water animation on the target, preserving Water Burst shield-on-kill behavior.

## Starter — Cyclops Cat

- Joins the tutorial and becomes the player's first owned, equipped creature upon tutorial completion. Can be moved to reserves and equipped from the collection afterward.
- Single nearest-enemy slash: exactly **1 damage**, **120 px melee range**, **1 second cooldown**. No critical hits, extra attacks, damage/range/speed bonuses, or on-hit upgrade benefits. It appears under Feral in the bestiary for party management, but has no gameplay affinity or upgrade tree.
- Uses the bundled `Actor/Animals/CatCyclop/SpriteSheet.png` (two 16 × 16 frames) and `FX/SlashFx/Slash/SpriteSheet.png` (four slash frames) from Ninja Adventure.
