# ScollMonsters prototype balance

Opening numbers reflect the current direction. Later-stage balance remains provisional.

## Opening loop

- Start with **1 damage** and **10 shared HP**. Fire every 0.34 seconds; player shots travel at 560 pixels/second.
- Stage 1 regular monsters have **1 HP** and die to one starting shot.
- Every defeated monster, including bosses, drops **exactly 1 gold**. There is no stage reward multiplier or boss gold bonus. Enemies that reach the player deal contact damage and are removed without a kill reward.
- **Damage +1** costs 5 gold for its first rank and raises damage to 2. **Health +5** costs 5 gold and raises party HP to 15. Later ranks cost 10 and 20 gold and add the same flat amount.
- The first miniboss has 28 HP. Its base attack is 5 damage (4 after stage-1 scaling), with a 2.4-second cooldown. It begins its attack timer only once visible and fires single shots. Later bosses use a triple volley below 45% HP.
- The boss is tuned to defeat a fresh player through combat stats, without a scripted loss or purchase check. Across 20 seeded runs with accurate aiming, no-upgrade attempts lost, while one damage rank plus one health rank won. First attempts earned 14–15 gold in these checks, enough for both upgrades. Missed shots can reduce earnings or require another attempt.
- All earned drop gold is banked on victory or defeat, including uncollected and off-screen drops. Drops never expire. Replays remain available.
- Existing saves and purchased ranks remain intact; their effects use the new numbers.

## Travel and enemies

Every stage has 30 seconds of traversal. Combat can continue until the remaining enemies and required boss are defeated. The 540 × 900 portrait view keeps the player at (270, 300); placeholder ground scrolls north as the party travels south.

Enemies spawn completely below the screen, close in using the distance covered by the route plus their own slow homing speed, toward the player's actual position, and deal contact damage only when they reach the party. They cannot be targeted or hit by player shots before entering the visible combat area above the bottom controls. Bosses approach to a 240-pixel stand-off distance and attack with projectiles; they must lose all HP to count as defeated.

| Enemy | Base HP | Speed relative to ground (px/s) | Base damage | Gold | Behavior |
| --- | ---: | ---: | ---: | ---: | --- |
| Basic | 1 | 32 | 1 | 1 | Homes toward party |
| Ranged | 2 | 28 | 1 | 1 | Approaches and fires every 2.7 seconds |
| Armored | 3 | 24 | 2 | 1 | Durable approaching enemy |
| Boss | 28 | 28 | 5 | 1 | Stops ahead; fires every 2.4 seconds |

- Regular HP scales by `1 + 0.5 × (stage − 1) + 0.025 × (stage − 1)²`, rounded. Boss HP retains `0.82 + stage × 0.18`, rounded. Damage scales by `0.76 + stage × 0.095`, rounded with a minimum of 1.
- Stages 5 and 10 have a further ×1.5 boss HP multiplier.
- Each stage spawns its required boss at 21.6 seconds and stops spawning regular enemies at that point.
- Regular spawn intervals use `1.495 / (1 + 0.22 × (stage − 1))` seconds, with the existing random variation. Stage 1 is unchanged; stage 10 spawns approximately three times as often.
- Stage 1 uses basic regular enemies; stage 2 adds armored enemies; later stages mix all three.
- Collection range begins at 180 pixels and pulls at 420 pixels/second. Drops drift north at 78 pixels/second.

## Upgrades and companions

Twelve purchasable nodes provide 30 ranks. Capture root nodes unlock at stage 3 (Fanglet), stage 5 (Mossbud), and stage 10 (Novawisp), each with its own tab and connected upgrades.

| Upgrade | Per-rank effect | Rank costs |
| --- | --- | --- |
| Damage +1 | +1 player damage | 5 / 10 / 20 |
| Health +5 | +5 shared HP | 5 / 10 / 20 |
| Quick Hands | 10% shorter firing interval | 8 / 12 / 20 |
| Split Spark | +1 projectile | 15 / 25 |
| Gather Song | +70 collection range | 5 / 10 / 15 |
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

## Stage density and health tuning — September 9

| Stage | Nominal spawn interval | Basic HP | Ranged HP | Armored HP |
| --- | --- | --- | --- | --- |
| 1 | 1.50s | 1 | 2 | 3 |
| 3 | 1.04s | 2 | 4 | 6 |
| 5 | 0.80s | 3 | 7 | 10 |
| 8 | 0.59s | 6 | 11 | 17 |
| 10 | 0.50s | 8 | 15 | 23 |

HP entries describe each type when present; stage 1 still spawns only basic regular monsters. More available kills increase potential gold while higher HP makes damage, firing speed, multishot, and companion investment relevant to clearing the crowd. Gold remains exactly one per kill. Boss timing, boss HP, incoming damage, and upgrade costs retain their previous curves.

A controlled 20-seed accurate-aim comparison at stages 1/3/5/8/10 used equal defensive upgrades and stage-appropriate recruits, comparing power rank 1 against maximum available player/Fanglet offense. At stage 10, low offense won 0/20 and banked 13.25G on average; upgraded offense won 20/20 and banked 43.55G. These are isolated combat checks, not a full purchase-by-purchase progression test. Natural progression and touch aiming still need playtesting.
