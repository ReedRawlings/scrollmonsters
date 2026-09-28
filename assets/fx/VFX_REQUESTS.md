# VFX requests: reward juice pass

This list covers only what's still open. Finished effects have been removed.

## Format (same as the existing sheets)

- Horizontal PNG strip, equal frames, no spacing, nearest-neighbour. Save to `sheets/`, with the editable `.pxc` in `pixelcomposer/`.
- One JSON per effect with the same fields as `Capture_Burst.json`: `image`, `frame_width`, `frame_height`, `frame_count`, `layout`, `fps`, `duration_s`, `loop`, `anchor`, `palette`, `notes`, `smoothing`.
- Palette: **Toasted40**, matching the capture sheets.
- Sizes are native pixels. On the 540×900 phone canvas, **world effects draw at 2x** and **UI effects draw at 4x**.
- Replacing a placeholder: keep the same file name, frame size, frame count and anchor, and the prototype picks it up with no code changes. Remove `PLACEHOLDER` from the JSON `notes`.

## Final pixel art for placeholders

These sheets exist and work in the prototype, but they're marked `PLACEHOLDER` and need final hand-drawn pixel art.

### Pack_Drop (Common, Rare, Legendary)
- **Where:** in the world, where the enemy died, until the player walks over it.
- **Look:** a small sealed card pack, like a foil booster: crimped top and bottom edges, a diamond emblem on the front matching the card backs, and thicker for bigger packs. Wrapper colors: common cyan, rare violet, legendary gold. Idle frames: a slight bob, a glint sweeping across the foil, and a soft glow under it. It must not read as a chest, and should have no coins or light beams.
- **Spec:** 16×20 · 6 frames · 10fps · loop · anchor bottom-center (8,19).

### Pack_Open (Common, Rare, Legendary)
- **Where:** in the world, where the pack lay, the moment the player picks it up.
- **Look:** the top crimp tears off, the wrapper puffs open, and cards peek out with a pop of rarity-colored sparkles.
- **Spec:** 24×32 · 7 frames · 20fps · once · anchor bottom-center (12,31).

### Pack_CardBack
- **Where:** UI. The face-down cards in the pack stack, inside the DarkMode item-slot nine-slice, so draw only the inner art.
- **Look:** a dark navy base (`#191524`) with a diagonal pattern and a central diamond emblem in the rarity color, with a "?" in the diamond. Legendary can have extra ornament.
- **Spec:** 60×85 · one frame per rarity in one strip (common, rare, legendary) · anchor center (30,42).

### Icons: Bolstering Croak, Growing Colony, Staggering Roar
- **Where:** upgrade cards, pack cards and the icon that flies to the party bar.
- **Look:** 16×16 items in the Tiny Dungeons style, each clearly its own object. Every reward must have its own icon, so don't reuse an icon, or a close look-alike, from another relic or upgrade. Staggering Roar in particular must not resemble Quake Charge's earth scroll.
- **Spec:** 16×16 · 16-frame spin strip (256×16), matching the other Tiny Dungeons icons · anchor center.

## Nice to have

- **Capture affinity variants:** tinted versions of `Capture_Ring`, `Capture_Fill` and `Capture_Burst` for Feral (red), Bloom (green) and Arcane (cyan). The current sheets are warm gold for everything.
- **Guardian arrival:** a ground crack or portal under the boss at 9:30. 96×64 · 12 frames · once. Woodland and Desert versions.
