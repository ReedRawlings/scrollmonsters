# Creature abilities and attack ranges

This is the current design reference for ability implementation. The range assignments and individual Tier 1 abilities below are agreed design; they have not yet been wired into combat.

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
| Bat / BlueBat | Medium — 216 px | Quick attacks for minor damage. |
| Beast / Beast2 | Melee — 120 px | Defensive close-range slash with a small AOE arc. Stays in formation; enemies must approach it. |
| Lizard / Lizard2 | Short — 152 px | Fire hit with a 5% chance to burn. Burn deals 1 damage each second for 2 seconds. |

Shinies currently share their base creature's ability and range. Keep their definitions separable so they can diverge later.

## Supplied effect assets

| Effect | Source file |
| --- | --- |
| Bat hit | `/Users/reedrawlings/Downloads/SoggySocks Combat FX/PNG/impact_Bleed_small_sheet.png` |
| Beast slash | `/Users/reedrawlings/Downloads/SoggySocks Combat FX/PNG/slash_1_sheet.png` |
| Lizard hit | `/Users/reedrawlings/Downloads/SoggySocks Fire FX/PNG/impact_fire_sheet.png` |
| Burn status | `/Users/reedrawlings/Downloads/SoggySocks FX Status Effects/PNG/statusfx_burn_sheet.png` |

## Remaining implementation decisions

- Exact direct-hit damage, attack intervals, targeting priorities, and Beast's arc angle remain provisional. Earlier suggested numbers were not explicitly approved.
- Specify whether range eligibility tests enemy centers or overlaps their hitboxes, and how projectile travel is capped by attack range.
- Specify burn reapplication behavior; refreshing duration without stacking was suggested but not explicitly approved.
- Bloom and Arcane Tier 1 abilities are not yet assigned.
