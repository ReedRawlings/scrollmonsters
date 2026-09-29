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

## Shrine

The shrine appears at 1:30. The player stands in its circle (radius 70 world px) for 6 seconds. Charge drains twice as fast when they step out. A shrine elite then spawns 150px away. Beating it grants a relic choice, and the player must leave the circle before the next challenge arms. There are 3 challenges per run.

**Done:** `assets/fx/ShrineStates.png` (4 frames of 32×32: whole, cracked, badly cracked, shattered). The frame equals challenges cleared, so the shrine itself shows how many are left, with no runes or dots needed. It should get a JSON like the other sheets (4 frames, not time-driven, anchor bottom-center (16,31)) and move into `sheets/`.

**Breaking effects use the VfxMix pack, with no new art needed.** They're built in the prototype:
- **Clears 1 and 2:** the crystal flashes white, swaps to its next frame, and a few small `particle/gem_broken_yellow` shards pop off.
- **Clear 3 (shatter):** a bigger white flash with a 110ms freeze and shake. `fx/spark_04` gives the burst of light, with gold shards and `particle/rock_gray` rubble arcing out, landing and blinking away. The ring turns grey.

**The circle and charge use `Capture_Ring` and `Capture_Fill` for now** (ring drawn at 3x to cover the 70px radius, fill frame = round(progress ÷ 6 × 16)). A dedicated shrine circle and charge can come later.

Colors already in use: idle mint `#b2eddf`, charge gold `#ffd36b`, in combat orange `#ffa066`, spent grey `#66716e`. None of this should read as a Vampire Survivors light beam.

### Shrine_Summon
- **Where:** at the elite's spawn point, once. It replaces the earth burst.
- **Look:** a gold crack splits the ground and the elite climbs out, with crystal dust in the air. The crack is left behind as a faint scar for the last few frames.
- **Spec:** 48×64 · 12 frames · 16fps · once · anchor bottom-center (24,63).

### Shrine_EliteMark
- **Where:** floating above the shrine elite's head while it lives, so the player can pick it out of the horde.
- **Look:** a small shard of the shrine's gold crystal, bobbing and glinting.
- **Spec:** 12×12 · 6 frames · 8fps · loop · anchor bottom-center (6,11).

### Relic_Socket
- **Where:** UI. This is the empty slot in the HUD relic row: one for each shrine challenge still to clear. The prototype draws a thin diamond as a placeholder.
- **Look:** a faint, empty outline of the shrine's crystal, with no box or background behind it.
  - **Frame 0:** dormant.
  - **Frame 1:** armed, lit gold while its challenge is active.
- **Spec:** 16×16 · 2 frames · anchor center.

## Nice to have

- **Capture affinity variants:** tinted versions of `Capture_Ring`, `Capture_Fill` and `Capture_Burst` for Feral (red), Bloom (green) and Arcane (cyan). The current sheets are warm gold for everything.
- **Guardian arrival:** a ground crack or portal under the boss at 9:30. 96×64 · 12 frames · once. Woodland and Desert versions.
