# Reward juice and DarkMode UI: design

Date: 2026-09-28 · Status: awaiting review
Reference prototype: https://claude.ai/artifact/VgjShiA626rZqRpsRNAAYL (private) · VFX brief: `assets/fx/VFX_REQUESTS.md`

## Goal

Rewards in `survivors.html` currently just happen: a capture sets a flag and prints a line, a level-up shows a static panel, and an upgrade increments a counter. This work makes every reward moment readable and satisfying on a phone. It adds a luck-based upgrade pack as the regular drop, keeps relics as a separate build-defining reward from the shrine, adds damage numbers, and moves the whole survivors UI to the Pixelarium DarkMode look at double size.

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
| Upgrade packs | Drop from elites, caches and shrine waves. Size by luck: 1 card 82%, 3 cards 17%, 5 cards 2%. Cards are drawn from the active team's upgrade pool and all are granted. Tap flips a card; a tap, a swipe or a one-second wait files it. No on-screen prompts. |
| Relics | Stay a separate, build-defining reward. They come **only** from completing the interactive shrine, and elites and caches no longer drop them. The existing choose-1-of-3 flow (`mode='relic'`) is kept and restyled: DarkMode cards with relic icons, a shining "NEW" badge, a stack count that rolls up (for example 2 → 3), and the chosen relic flying to a relic row in the HUD. |
| Party | Capped at the player plus 3 creatures, so the party bar has exactly 4 slots. |
| Canvas | Portrait becomes a fixed **540×960 (9:16)** canvas, replacing 540×820, with `Phaser.Scale.FIT` kept. No `EXPAND`: the canvas size never changes, so pixel art always scales as one integer grid. Screens that aren't 9:16 get thin bars. All portrait layouts are redone for 960 height. Desktop landscape stays 960×640. |
| HUD | Top-left: heart diamond, HP bar without numbers, XP bar with the level then coins to its right. The coin icon is drawn at its native size (10×13 logical). Top-right: the timer as plain gold text with a dark outline, with no panel behind it, set down from the top edge. Under the bars, starting just right of the diamond's bottom point: the relic row. Relic icons sit directly on the field, with no tiles or boxes behind them, on a fixed pitch (20 logical px per slot, 4px gap). Each stack count is a white digit with a dark outline at the icon's bottom-right corner, shown only above 1. The row ends with one empty `Relic_Socket` for each shrine challenge not yet cleared (3 minus completed), so the player can see how many relics are left this run. The next socket lights gold while its challenge is armed or in combat. A new relic fills that socket; a stacked relic bumps its count and the socket fades out. Bottom: party bar with the player first, then creatures. |

## Open decisions

None. All decisions were resolved in review on 2026-09-28.

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
A second Phaser camera renders only UI objects at zoom 2. UI is laid out in fixed logical space: 270×480 in portrait (540×960) and 480×320 in landscape (960×640). The prototype's layouts are already built at 270×480. The main camera ignores UI objects, and the UI camera ignores world objects, so world-space juice (aura, damage numbers, capture sheets) stays at game scale. All HUD, panel, menu and pack layouts use logical coordinates. Hit areas scale with the camera.

### Modes
- New `mode='unlock'` for the starter reveal, and `mode='pack'` for the pack reveal. `mode='relic'` stays for the shrine's relic choice.
- All of them pause `tick()` exactly like `'upgrade'`.
- A queued level-up opens after an unlock, pack or relic screen closes, in the same order as today's `relics.open()` check in `checkLevel()`.

### Drop sources
In `survivor-relics.js` and the shrine code in `survivor-expedition.js`:
- `relics.reward(source)` is called only on shrine completion.
- Elite deaths, claimed caches and shrine-wave enemies call `packs.drop(x, y)`. Elites keep their current spawn cadence (every 90s).

### Data flow per moment

| Moment | Sim event (unchanged timing) | Presentation |
|---|---|---|
| Capture | `body.state='ally'` when progress reaches 2.5 | Ring loop, then Fill by progress, then Burst with a 90ms freeze. The faceset pops in with a toast, then flies to its party slot. |
| Starter unlock | `expedition.unlock(type)` | `mode='unlock'`. `Unlock_Rays` behind the silhouette faceset, then `Unlock_Fill` swaps in the real faceset. Stamp, then Continue. |
| Level-up | `checkLevel()` rolls the offers | `LevelUp_Aura` ignite, loop, then fade. "LEVEL N" pops, then the cards deal in with a 370ms input lock. |
| Upgrade pick | `chooseUpgrade(i)` | Press, dismiss, a 260ms hold, then resume. The icon flies to the party slot and `Slot_PowerUp` plays. |
| Pack drop | The pack spawns where an elite, cache or shrine-wave enemy was defeated, with its size and cards rolled at that moment | `Pack_Drop_<rarity>` idle on the ground. |
| Pack pickup | Cards granted immediately, `mode='pack'` | `Pack_Open`, then the stack, flip, hand row, then each icon flies to its slot. |
| Shrine | `updateShrine()` and `completeShrine()` (timing unchanged) | The shrine sprite is `ShrineStates` with frame = completed (whole, cracked, badly cracked, shattered), replacing the altar prop and the three dots. For now the circle reuses `Capture_Ring` at 3x, and the charge reuses `Capture_Fill` with frame = round(progress ÷ 6 × 16). The ring fades to grey once the shrine shatters. Dedicated shrine circle art is a later follow-up. `Shrine_Summon` at the elite spawn, and `Shrine_EliteMark` over the elite. On the kill, the crystal flashes and moves to its next frame with a few VfxMix gold shards. The third clear is a full shatter: a 110ms freeze, `spark_04` light burst, shards and rubble, and a grey ring. |
| Relic choice | Shrine completion calls `relics.reward('shrine')`, then `relics.open()` | DarkMode choice cards with relic icons, deal-in and input lock. On pick, the relic icon flies to the HUD relic row. |
| Damage | `hit()` already applied | A number in world space. Hits on the same target within 150ms merge. Crits get `Damage_Crit`. At most 40 on screen. |

### Assets to add to the repo
Only the files used, copied into `assets/ui/` and `assets/icons/`:
- **Pixelarium DarkMode:** dialogue box, item slot, button, banner, status frame, bar fills, coin counter.
- **Zelda-Like:** item slot with charge bar, toast banner, coin icon, heart.
- **NovelMix:** `font_medium_pixel_9.ttf`.
- **Tiny Dungeons icons:** 12 strips.
- **Prototype relic icons:** Resonance Bell, Guardian's Drum, Phase Veil.
- **Ninja Adventure items:** already in the repo.
- **VfxMix:** `fx/spark_04.png`, `particle/gem_broken_yellow.png`, `particle/rock_gray.png`.

The licenses allow commercial use in the game but not redistribution of the packs themselves.

## Phases

Each phase ships on its own, with every balance script still passing.

1. **UI foundation.** The fixed 540×960 portrait canvas, UI camera at 2x, DarkMode components, NovelMix font, HUD rework (party bar, status frame, relic row), title screen, pause, won and lost screens. `UI_STYLE_GUIDE.md` rewritten for DarkMode.
2. **Juice module and reward moments.** `survivor-juice.js`, the capture sheets, the shrine sheets, starter unlock, level-up aura, pick flights and slot power-ups.
3. **Damage numbers.** Font strip generated from NovelMix, merge, crits, and hits on the player. A settings toggle to turn them off.
4. **Upgrade packs and relic sources.** Drop rolls, the pickup and reveal flow, and the team pool. Relics move to shrine completion only, and the relic choice gets its DarkMode restyle. This is the only phase that changes balance, so it adds its own check script, and existing relic-count checks are updated deliberately.

## Testing

- **Balance and behavior:** every `scripts/check-*.cjs` runs before and after each phase. Their numbers must match, except in Phase 4.
- **Determinism:** a new `scripts/check-juice-determinism.cjs` runs a fixed-seed expedition twice, once with juice on and once with it stubbed out, and asserts that the run event logs are identical.
- **Visual:** Playwright screenshots of each moment at 540×960 and 960×640 landscape, plus one tall-phone viewport to confirm the bars, checked by eye, following the existing `output/<name>/` convention.
- **Phase 4:** `scripts/check-upgrade-packs.cjs` asserts:
  - the 82/17/2 distribution over many seeded rolls
  - cards come only from the active team's pool
  - every card is applied on pickup
  - relics are offered only after a shrine completion
