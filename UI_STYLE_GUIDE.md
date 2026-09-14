# ScrollMonsters UI Style Guide

This guide records the approved menu direction and the implementation details that must remain consistent across future screens. The live Warm Wood Bestiary in `game.js` is the reference implementation. Shared values live in `UI_THEME`; update this guide and those values together.

## Approved direction

- Use the Ninja Adventure **Theme Wood** family for menus.
- Keep the visual language warm, simple, and readable. Do not combine it with Dragon Regalia, Theme Mix, Bonus, or unrelated frame sets.
- Build hierarchy through spacing, scale, and one appropriate surface per region. Do not stack decorative frames or add background art behind a nine-slice.
- Preserve native pixel shapes. Scale raster art at whole-number multiples with Phaser pixel-art filtering enabled.
- The production Bestiary and `ui-previews/bestiary-concepts.html?variant=warm` show the approved composition.

## Shared source of truth

`game.js` contains `UI_THEME`, which owns:

- Warm Wood colors.
- Nine-slice borders and scale.
- Currency-sheet row assignments.

Native components live in `phaser-ui.js`: `WoodPanel`, `WoodButton`, and the retained `NativeView` display tree. The game-facing helpers include:

- `drawWood`: native Phaser NineSlice inside a reusable WoodPanel container.
- `drawPanel`: standard menu surface.
- `drawButton`: native interactive WoodButton with enabled/disabled and pressed states.
- `drawCurrencyIcon`: gold and affinity icons from the shared currency atlas.
- `drawBestiaryButton`: approved button-state pattern.
- `drawMenuTab`: shared selected/unselected tab rendering with integer typography.

New menus should compose these native components. Group a card's background, text,
artwork, and controls with `beginGroup`/`endGroup` so the entire card can move or
animate together. Use Phaser pointer events and hit areas, not a manual click-target
list. Reconcile native objects instead of destroying and recreating controls each
frame, which interrupts tweens and pointer state. Do not restore Canvas draw-call
adapters or custom Canvas render methods.

Buttons press to 96% scale and recover on release or cancellation. Summon reveal
and result-card transitions use Phaser tweens; respect reduced-motion preferences.
The font has narrow spaces, so native labels use Unicode thin spaces for display
and retain the original label as Phaser data for UI inspection.

## Asset roles

Use each asset only for its intended component.

| Component | Asset | Source size | Slice borders at 2x |
| --- | --- | ---: | --- |
| Normal panel | `nine_path_panel.png` | 16×16 | x 7px, y 7px |
| Locked panel | `nine_path_panel_disabled.png` | 16×16 | x 7px, y 7px |
| Party slot | `inventory_cell.png` | 16×16 | x 7px, y 7px |
| Selected tab | `tab_selected.png` | 16×12 | x 7px, y 5px |
| Unselected tab | `tab_unselected.png` | 16×12 | x 7px, y 5px |
| Normal button | `button_normal.png` | 16×8 | x 7px, y 3px |
| Active/hover button | `button_hover.png` | 16×8 | x 7px, y 3px |
| Disabled button | `button_disabled.png` | 16×8 | x 7px, y 3px |
| Focus outline | `nine_path_focus.png` | 8×8 | x 3px, y 3px |

The border pixels scale to 2x without distortion. Only the 2px center seam expands to fill the remaining width or height. Do not stretch the whole source image.

Never use `button_checked.png` or `button_unchecked.png` as wide action buttons. They are checkbox-style controls with different silhouettes.

## Palette

These values are mirrored in `UI_THEME.colors`:

| Token | Value | Use |
| --- | --- | --- |
| Field | `#5c9855` | Outer Bestiary background |
| Path | `#b8895a` | Central menu path |
| Speck | `#5b684466` | Sparse background detail |
| Title | `#fff0b0` | Primary menu title |
| Text | `#fff5d7` | High-emphasis panel text |
| Muted | `#e2ccb0` | Descriptions and empty slots |
| Dark | `#30221a` | Text on light buttons/tabs |
| Locked | `#463c32` | Disabled text |
| Accent | `#ffd36b` | Section labels |
| Feral | `#ef5266` | Feral values and metadata |
| Bloom | `#4ac56b` | Bloom values and metadata |
| Arcane | `#5ed5f2` | Arcane values and metadata |

Use dark text on light controls. Colored currency text and disabled text should not receive a drop shadow. White or cream panel text may use the existing two-pixel shadow where it improves separation.

## Typography and spacing

- Use `NormalFont.ttf` through the `NinjaPixel` font family.
- Use integer font sizes and integer coordinates.
- Bestiary reference sizes: 30px title, 21px creature names, 18px section/currency text, and 15px metadata, descriptions, tabs, and controls.
- Keep labels concise. Shrink a button label only when it cannot fit inside the preserved button ends.
- Keep roster cards 120px tall with 9px between their visual bounds. Do not reintroduce the older oversized gaps.
- Touch targets may cover the full card even when the visible button is smaller.

## Headers and currency

`Coin2-Sheet.png` is a 40×40 atlas made of 10×10 cells. It uses four animation columns and these rows:

1. Gold
2. Feral
3. Bloom
4. Arcane

Animate icons by changing the column while keeping the currency row fixed. Render icons at exact 2x or 3x scale.

- The Bestiary header shows Feral, Bloom, and Arcane icons with counts. It does not show gold and does not repeat the affinity names.
- Other economy-bearing menu headers may show gold plus all three affinity icons within the same header surface.
- Do not create a separate essence banner below a header.

## Bestiary component rules

### Active party

- Show three slots.
- Center one south-facing creature sprite in each occupied slot.
- Do not repeat creature name, affinity, combat role, or role labels inside party slots.
- Empty slots show only `EMPTY`.

### Creature cards

- Use one panel per card.
- Show the creature sprite, name, affinity icon, affinity/role line, short description, and one state/action button.
- An active creature uses `ACTIVE`; a recruited reserve creature uses `ADD TO PARTY`; an available unowned creature uses `RECRUIT` plus its numeric cost.
- The full open card remains tappable for comfortable mobile selection.

### Locked state

- Use the disabled wood panel.
- Reduce the creature and affinity-icon opacity.
- Use the locked text color and the word `LOCKED`.
- Explain the stage requirement in the description.
- Do not add a padlock icon, selection cursor, badge, or separate locked-state ornament.

### Affinity tabs

- Use the real selected and unselected tab assets.
- Preserve their ends with the tab nine-slice values; never scale the entire tab horizontally.
- The current three-creature roster remains visible while the selected affinity tab changes state. When multiple creatures exist per affinity, these controls can become filters after designing a clear all-types/default state.

## Creature sprite rules

The directional pet atlas is `assets/Sprites/Pets/minimize_F-Sheet.png` at 192×80.

- Creature rows begin at y=0, y=32, and y=64; the intervening 16px rows are transparent spacers.
- Each animation step occupies three facing columns.
- South is facing offset 0, north is 1, and east is 2. West mirrors east.
- Column formula: `animationStep * 3 + facingOffset`.
- Bestiary and party portraits always use the south-facing walk cycle.
- Render 16×16 creature frames at exact multiples such as 48px or 64px. Do not select a visually similar frame from the standalone strips when direction matters.

## Interaction and state language

- Visual state and behavior must agree: disabled controls do not trigger actions.
- Recruitment is always a player action, including Fangle. Fangle has no stage-clear gate but is not recruited automatically.
- Owned creatures can move between active party and reserves. Preserve the three-member party limit and save immediately after changes.
- Use the existing menu accept sound for ordinary selection and the success jingle for completed recruitment or purchases.

## Future-model handoff

Before changing or extending menus:

1. Read this file and inspect the live Bestiary in `game.js`.
2. Reuse `UI_THEME` and the shared draw helpers.
3. Confirm the chosen source asset's native dimensions before slicing it.
4. Keep `ctx.imageSmoothingEnabled = false` and use integer destination sizes.
5. Use exactly one structural surface per panel, card, or slot.
6. Do not restore Dragon Regalia, Theme Mix, Bonus, oversized margins, redundant labels, padlock icons, or creature-side selector ornaments without new user direction.
7. Do not infer asset purpose from its filename alone. Inspect the pixels and compare with the asset's source dimensions.
8. Validate the 540×900 canvas in a real browser. Inspect screenshots rather than trusting layout arithmetic or text-state output alone.
9. Exercise navigation, locked controls, recruitment, party add/remove, persistence, and at least one combat start after menu changes.
10. Update this guide and `UI_THEME` together if a new visual direction is approved.

On this Mac, the stock web-game browser client may stall with forced SwiftShader arguments. The established local flag-free client at `output/scenery-playwright-client.mjs` has been used for visual checks. This is a test-environment workaround, not game code.

Font and image loading can produce incomplete first captures. Allow assets and `NinjaPixel` to load, render again, and visually inspect the resulting screenshot. A successful script exit is not proof that the pixels are correct.

## New-menu review checklist

- Correct Theme Wood asset for each component.
- Correct nine-slice borders; only center seams stretch.
- Whole-number sprite/icon scaling.
- No duplicate panels or decorative layers.
- Currency icons use the correct atlas rows.
- Clear normal, active, reserve, and disabled states.
- No redundant labels or status icons.
- Comfortable touch targets without visually oversized controls.
- Screen remains legible at 540×900 and when CSS-scaled on mobile.
- Screenshot, text state, interactions, persistence, and browser console verified.

## Upgrade screen refinement
- Preserve the Player / Feral / Bloom / Arcane tab row and connected node layout. Upgrade tab labels use 30px NinjaPixel (2x) and actual glyph bounds for visual centering.
- Show ranks on node icons only, not in the description heading.
- Generic Feral stat labels use Feral Focus / Feral Rhythm; generic companion stats use type ownership requirements. Named creature abilities retain their individual ownership requirements.

- Player tree supports dragging and zoom buttons/mouse wheel inside its clipped viewport; header and node detail panel stay fixed. Damage +3 requires Damage +1 rank 5; Boulder Buster branches from Rock Breaker.


## Approved overworld roster panels — September 14

Use `nine_path_bg.png` (4px slices, 2x) inside the orange frames of the overworld encounter and action panels, as approved in the Stage 1 preview. Buttons retain the normal orange Wood styling. Stages 1–3 display actual monster portraits, names, affinity below each name, HP, and ATK. Stage 1 includes its boss as the third column; Stages 2–3 put their boss in a compact footer below three regular monsters. These roster cards replace affinity density summaries for the configured stages.

## Combat sprite scale — September 14

The player, companions, and regular monsters render at 32×32 (16px frames at 2x) using `COMBAT_SPRITE_SIZE`. Boss and menu portrait sizes retain their existing values. Player/companion collision radii are 12px; regular enemy radii are basic 11px, ranged 12px, armored 15px. Enemy health bars follow those radii. Player shots originate 12px below the center. Terrain, camera, HUD and encounter spawn rates retain their existing settings.

## Collection and summon layout — September 14

Both Bestiary views use a solid black full-page backdrop. Collection affinity selectors use normal/selected Wood buttons, not tabs. The collection lists only owned creatures of the selected affinity across all tiers, four rows per page; there are no collection tier filters. Empty affinities show a short unlock prompt without revealing creature names. Center pagination above side-by-side Summon and Back to Map buttons at y=805, matching the summon view's footer. The collection Summon button opens the summon view regardless of essence balance; tier selection and affordability belong to that view.

## Title screen surface
Use a black page background with `nine_path_bg.png` inset inside the orange Wood title frame, matching the updated menu surfaces. Title, instruction, and secondary text use the shared title/text/muted colors. Keep normal orange Wood action buttons.
