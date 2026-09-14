# ScrollMonsters UI Style Guide

This guide records the approved menu direction and the implementation details that must remain consistent across future screens. The live Warm Wood Bestiary in `game.js` is the reference implementation. Shared values live in `UI_THEME`; update this guide and those values together.

## Approved direction

- Use the Ninja Adventure **Theme Wood** family for menus.
- Keep the visual language warm, simple, and readable. Do not combine it with Dragon Regalia, Theme Mix, Bonus, or unrelated frame sets.
- Build hierarchy through spacing, scale, and one appropriate surface per region. Do not stack decorative frames or add background art behind a nine-slice.
- Preserve native pixel shapes. Scale raster art at whole-number multiples with canvas smoothing disabled.
- The production Bestiary and `ui-previews/bestiary-concepts.html?variant=warm` show the approved composition.

## Shared source of truth

`game.js` contains `UI_THEME`, which owns:

- Warm Wood colors.
- Nine-slice borders and scale.
- Currency-sheet row assignments.

Reusable drawing functions include:

- `drawWood`: general nine-slice rendering.
- `drawPanel`: standard menu surface.
- `drawButton`: standard enabled/disabled menu button.
- `drawCurrencyIcon`: gold and affinity icons from the shared currency atlas.
- `drawBestiaryButton`: approved button-state pattern.
- `drawMenuTab`: shared selected/unselected tab rendering with integer typography; `drawBestiaryTab` supplies the Bestiary layout.

New menus should call these helpers or extract them into a shared UI module. Do not copy their pixel math into another screen.

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
