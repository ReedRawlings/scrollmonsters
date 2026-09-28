# Reward juice and DarkMode UI: design

Date: 2026-09-28 · Status: awaiting review
Reference prototype: https://claude.ai/artifact/VgjShiA626rZqRpsRNAAYL (private) · VFX brief: `assets/fx/VFX_REQUESTS.md`

## Goal

Rewards in `survivors.html` currently just happen: a capture sets a flag and prints a line, a level-up shows a static panel, and an upgrade increments a counter. This work makes every reward moment readable and satisfying on a phone, replaces relic drops with a luck-based upgrade pack, adds damage numbers, and moves the whole survivors UI to the Pixelarium DarkMode look at double size.

Success means:
- A player can tell what they gained and which creature it went to without reading.
- Every existing `scripts/check-*.cjs` balance and behavior script produces the same numbers, except for checks that deliberately cover the new pack economy.

## Non-negotiable rules

1. **Presentation never changes the simulation.** Juice code reads game state and never writes to it. Cosmetic randomness uses `Math.random()`, never the seeded `this.rand()`.
2. **Logic first, animation after.** Captures, unlocks, upgrades and pack cards apply on the tick they happen. Animations show what already changed, and cutting one short breaks nothing.
3. **Freezes pause through `mode`.** Hit-stop and reveal screens stop `tick()` the way the level-up screen does today. They never stretch `STEP` or `elapsed`.
4. **Reduced motion** turns off shake, freezes, flashes and the menu pan. Fades stay.

## Scope

In scope: everything in `survivors.html`, meaning the title screen, HUD, capture, starter unlock, level-up, upgrade pick, upgrade packs, pause, won and lost screens, and damage numbers.

Out of scope, as follow-ups: `legacy.html` (the Theme Wood Bestiary in `game.js`), `survivor-runs.html`, sound, and Priority 3 VFX.

## Decisions already made

| Area | Decision |
|---|---|
| UI skin | Pixelarium DarkMode everywhere, replacing Theme Wood in these screens. Party slots use the Zelda-Like item slot with its charge bar. |
| UI scale | UI draws at 2x relative to today. The game world stays at its current scale. |
| Font | NovelMix `font_medium_pixel_9.ttf`, at 9px and exact multiples only. It replaces NinjaPixel and its thin-space workaround in these screens. |
| Portraits | Creature `Faceset.png` for the home screen, captures, the starter unlock and party slots. |
| Icons | Every relic and upgrade has its own icon, with no repeats or look-alikes. Creature upgrades show the owning creature small in the corner. |
| Capture | The artist's `Capture_Ring`, `Capture_Fill` (frame = round(progress ÷ 2.5 × 16)) and `Capture_Burst` replace the arc. |
| Pick pause | 260ms between tapping an upgrade and combat resuming. |
| Starter unlock | Stops the game and waits for Continue. |
| Rewards travel | Upgrade icons fly to the owning creature's slot in the bottom party bar, not to the creature in the world. |
| Upgrade packs | Replace relic drops at caches, elites and shrine waves. Size by luck: 1 card 82%, 3 cards 17%, 5 cards 2%. Cards are drawn from the active team's upgrade pool and all are granted. Tap flips a card; a tap, a swipe or a one-second wait files it. No on-screen prompts. |
| HUD | Top: heart diamond, HP bar without numbers, XP bar with level then coins to its right, and a timer set down from the top edge. Bottom: party bar with the player first, then creatures. |

## Open decisions (please confirm in review)

1. **Relics.** Packs take over relic drop points. Recommendation: fold the 13 existing relics into the pack pool as a rarer card type, so relic content isn't lost and the drop sources stay single-purpose. The alternative is to retire relics.
2. **Party overflow.** The bar fits the player plus three creatures at 2x. Recommendation: when a fourth creature joins, the last slot becomes a "+N" slot that cycles through the extra portraits.
3. **Canvas height.** The portrait canvas is 540×820, not the prototype's 540×900. Recommendation: keep 540×820 and anchor the party bar to the bottom edge. Nothing in the prototype needs the extra 80px.

## Architecture

### New files
- **`survivor-juice.js`**: the shared presentation module, owned by the scene as `this.juice`. It holds:
  - The sheet registry, loaded from `assets/fx/sheets/*.json`.
  - `freeze(ms)`, `flash(sprite)`, `burst(x, y, color, n)`, `shake(px, ms)`, `popText`, `flyTo(icon, from, to, onLand)` with `Reward_Trail`, and `playSheet(key, x, y, layer)`.
  - Damage numbers.
  - Its own random source.

  It never writes game state.
- **`survivor-packs.js`**: the upgrade-pack system.
  - **Sim side:** the roll at the drop, using `this.rand()`; the pack pickup; and granting cards through the same path as `chooseUpgrade`.
  - **Presentation side:** the stack, flip and hand row.
- **`phaser-ui.js` additions:** DarkMode components alongside the existing Wood ones, all built on `NativeView` reconcile: `DarkPanel` (dialogue-box nine-slice), `DarkCard` (item-slot nine-slice with corner brackets), `DarkPill`, `InkBanner`, `Toast`, `StatusFrame` and `PartySlot` (Zelda slot, faceset, charge bar).

### UI at 2x
A second Phaser camera renders only UI objects at zoom 2. UI is laid out in logical space: 270×410 in portrait (540×820 canvas) and 480×320 in landscape (960×640 canvas). The main camera ignores UI objects, and the UI camera ignores world objects, so world-space juice (aura, damage numbers, capture sheets) stays at game scale. All HUD, panel, menu and pack layouts use logical coordinates. Hit areas scale with the camera.

### Modes
- New `mode='unlock'` for the starter reveal, and `mode='pack'` for the pack reveal. The latter replaces `mode='relic'`.
- Both pause `tick()` exactly like `'upgrade'`.
- A queued level-up opens after an unlock or pack closes, in the same order as today's `relics.open()` check in `checkLevel()`.

### Data flow per moment

| Moment | Sim event (unchanged timing) | Presentation |
|---|---|---|
| Capture | `body.state='ally'` when progress reaches 2.5 | Ring loop, then Fill by progress, then Burst with a 90ms freeze. The faceset pops in with a toast, then flies to its party slot. |
| Starter unlock | `expedition.unlock(type)` | `mode='unlock'`. `Unlock_Rays` behind the silhouette faceset, then `Unlock_Fill` swaps in the real faceset. Stamp, then Continue. |
| Level-up | `checkLevel()` rolls the offers | `LevelUp_Aura` ignite, loop, then fade. "LEVEL N" pops, then the cards deal in with a 370ms input lock. |
| Upgrade pick | `chooseUpgrade(i)` | Press, dismiss, a 260ms hold, then resume. The icon flies to the party slot and `Slot_PowerUp` plays. |
| Pack drop | The pack spawns at the relic source with a rolled size and rolled cards | `Pack_Drop_<rarity>` idle on the ground. |
| Pack pickup | Cards granted immediately, `mode='pack'` | `Pack_Open`, then the stack, flip, hand row, then each icon flies to its slot. |
| Damage | `hit()` already applied | A number in world space. Hits on the same target within 150ms merge. Crits get `Damage_Crit`. At most 40 on screen. |

### Assets to add to the repo
Only the files used, copied into `assets/ui/` and `assets/icons/`:
- **Pixelarium DarkMode:** dialogue box, item slot, button, banner, status frame, bar fills, coin counter.
- **Zelda-Like:** item slot with charge bar, toast banner, coin icon, heart.
- **NovelMix:** `font_medium_pixel_9.ttf`.
- **Tiny Dungeons icons:** 12 strips.
- **Prototype relic icons:** Resonance Bell, Guardian's Drum, Phase Veil.
- **Ninja Adventure items:** already in the repo.

The licenses allow commercial use in the game but not redistribution of the packs themselves.

## Phases

Each phase ships on its own, with every balance script still passing.

1. **UI foundation.** UI camera at 2x, DarkMode components, NovelMix font, HUD rework (party bar, status frame), title screen, pause, won and lost screens. `UI_STYLE_GUIDE.md` rewritten for DarkMode.
2. **Juice module and reward moments.** `survivor-juice.js`, the capture sheets, starter unlock, level-up aura, pick flights and slot power-ups.
3. **Damage numbers.** Font strip generated from NovelMix, merge, crits, and hits on the player. A settings toggle to turn them off.
4. **Upgrade packs.** Drop rolls, the pickup and reveal flow, the team pool, and the relic handling from open decision 1. This is the only phase that changes balance, so it adds its own check script.

## Testing

- **Balance and behavior:** every `scripts/check-*.cjs` runs before and after each phase. Their numbers must match, except in Phase 4.
- **Determinism:** a new `scripts/check-juice-determinism.cjs` runs a fixed-seed expedition twice, once with juice on and once with it stubbed out, and asserts that the run event logs are identical.
- **Visual:** Playwright screenshots of each moment at 540×820 and 960×640, checked by eye, following the existing `output/<name>/` convention.
- **Phase 4:** `scripts/check-upgrade-packs.cjs` asserts the 82/17/2 distribution over many seeded rolls, that cards come only from the active team's pool, and that every card is applied on pickup.
