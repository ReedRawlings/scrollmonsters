# Spell & ability FX

Pixel-art effects made in Pixel Composer (v1.22.10). **Game palette: Toasted40** (`scripts/pixelcomposer/palettes/Toasted40.hex`). Bubble, Scissors and Heart effects were moved to Toasted40 with `recolor_t40.py` (re-export their sheets); the dust effects still use Endesga 32.

- `sheets/`: game-ready transparent PNG strips (equal frames, horizontal, no spacing) plus a JSON file per effect
  with frame size, frame count, fps, loop and anchor point. Render with nearest-neighbour (no smoothing).
- `pixelcomposer/`: the editable `.pxc` sources. Open one, then press **F5** (Render All) and **F6** (Export All)
  to write its sheet into `sheets/`.
- `pixelcomposer/_archive/`: rejected or experimental versions, kept for reference.
- Build scripts, node templates and notes: `scripts/pixelcomposer/` (start with `EFFECTS_GUIDE.md`).

| Effect | Source | Size | Frames @15fps | Loop | Built by |
|---|---|---|---|---|---|
| Dust burst (charge impact) | `Dust_Burst.pxc` | 96×64 | 12 (from 24) | no | edited sample |
| Dust burst, iso-flattened | `Dust_Burst_Iso.pxc` | 96×64 | 12 (from 24) | no | edited sample |
| Charge dust trail, 5 directions (flip E/NE/SE for W/NW/SW) | `Dust_Trail_{E,NE,SE,N,S}.pxc` | 192×64 – 64×128 | 14 (from 28) | no | `build_trail_dir.py` |
| Bubble burst | `Bubble_Burst.pxc` | 96×96 | 16 (from 32) | no | `build_bubble.py` (shadow removed by hand afterwards) |
| Scissor snip | `Scissor_Snip.pxc` | 64×64 | 16 (from 32) | no | `build_scissors.py` |
| Heart missile, coin-flip spin | `Heart_Spin.pxc` | 32×32 | 12 | **yes** | `build_heart.py spin` |
| Heart missile, trail pip | `Heart_Pip.pxc` | 16×16 | 6 | no | `build_heart.py pip` |
| Heart missile, impact | `Heart_Impact.pxc` | 32×32 | 8 | no | `build_heart.py impact` |
| Capture ring, idle | `Capture_Ring.pxc` | 48×32 | 12 | **yes** | `build_capture.py ring` |
| Capture ring, fill (indexed by progress, not played) | `Capture_Fill.pxc` | 48×32 | 17 (0–100%) | – | `build_capture.py fill` |
| Capture ring, capture burst | `Capture_Burst.pxc` | 48×96 | 12 | no | `build_capture.py burst` |

`Dust_Trail.pxc` is the side-view original that `build_trail_dir.py` builds the directional trails from.
Rebuilding with a script overwrites the `.pxc`, so hand edits made in Pixel Composer are lost unless they're also made in the script.

## Reward juice pass (from `VFX_REQUESTS.md`)

Pixel Composer effects: open the `.pxc`, press **F5** then **F6** to write the PNG into `sheets/`. JSON is already there.

| # | Effect | Source | Size | Frames @fps | Loop | Built by |
|---|---|---|---|---|---|---|
| 3 | Foil sheen (white; tint lightly) | `Pack_Sheen.pxc` | 24×85 | 8 @12 | yes | `build_rewards.py sheen` |
| 4 | Card flip flash (white; tint by rarity) | `Pack_Flip.pxc` | 48×48 | 6 @20 | no | `build_rewards.py flip` |
| 6 | Slot power-up (gold) | `Slot_PowerUp.pxc` | 32×32 | 6 @15 | no | `build_rewards.py slot` |
| 7 | Level-up aura: Ignite / Loop / Fade × Back / Front | `LevelUp_Aura_*_{Back,Front}.pxc` | 32×48 | 5 / 6 / 5 @15 | Loop only | `build_levelup.py` |
| 8 | Reveal rays | `Unlock_Rays.pxc` | 64×64 | 8 @8 | yes | `build_rewards.py rays` |
| 9 | Silhouette fill (swap portrait on frame 3) | `Unlock_Fill.pxc` | 48×48 | 8 @20 | no | `build_rewards.py unlockfill` |
| 11 | Crit spark (gold, open center) | `Damage_Crit.pxc` | 24×24 | 5 @20 | no | `build_rewards.py crit` |

**Placeholder pixel art** (PNG + JSON written directly to `sheets/` by `build_fillers.py`; no `.pxc`; replace with final art at the same size and frame count):

| # | Asset | Size | Frames @fps | Notes |
|---|---|---|---|---|
| 1 | `Pack_Drop_{Common,Rare,Legendary}` | 16×20 | 6 @10, loop | wrapper width grows with rarity; bob, glint, glow |
| 1b | `Pack_Open_{Common,Rare,Legendary}` | 24×32 | 7 @20, once | one strip per rarity |
| 2 | `Pack_CardBack` | 60×85 | 3 (common, rare, legendary) | inner art only |
| 5 | `Reward_Trail` (final, not a placeholder; too small for Pixel Composer shapes) | 8×8 | 5 @20, once | white sparkle, tint gold in code |
| — | `Icon_{Bolstering_Croak,Growing_Colony,Staggering_Roar}` | 16×16 | 16, coin spin | stand-ins for the icon redraws |

Rarity colors: common `#78949b`, rare `#8973ab`, legendary `#f7b750`. Not done yet: Priority 3 (capture affinity variants, guardian arrival).

## Monster attacks (from "THE SCROLL — Confirmed Monsters")

Already covered by earlier effects: Blushcap = `Bubble_Burst`, Outsnip = `Scissor_Snip`, Parasocial Relationships = `Heart_*`.
No attack defined yet: Digital Detox, MossSnooze.

Pixel Composer effects (open the `.pxc`, play through, **F5** then **F6**; JSON is already in `sheets/`), built by `build_monster_fx.py`:

| Monster | Effect | Size | Frames @fps | Loop | Notes |
|---|---|---|---|---|---|
| Fizzteen | `Fizzteen_Flame` | 64×48 | 10 @15 | no | points right from the anchor (mouth); rotate to aim |
| Chorubble | `Chorubble_Wave_Out` | 96×64 | 8 @15 | no | outgoing rings, low damage |
| Chorubble | `Chorubble_Wave_Back` | 96×64 | 9 @15 | no | echo collapses inward; `hit_frame` 6 |
| Ghosting | `Ghosting_Ink_{Appear,Loop,Fade}` | 32×24 | 5 / 6 / 6 @10 | Loop only | puddles dropped along the player's path |
| Hushwisp | `Hushwisp_Note_Burst` | 32×32 | 6 @20 | no | when a note touches an enemy or times out |
| Glazel | `Glazel_Lipstick_Swipe` → `Glazel_Smear_Loop` → `Glazel_Smear_Fade` | 48×32 | 8 @15 / 6 @10 / 5 @10 | Loop only | same anchor for all three |

Hand-placed pixel pieces (PNG + JSON written straight to `sheets/`, no `.pxc`), built by `build_monster_sprites.py`:

| Monster | Effect | Size | Frames @fps | Notes |
|---|---|---|---|---|
| Palimaw | `Palimaw_Tongue_Mid` / `_Tip` / `_Hit` | 8×16 / 16×16 / 16×16 | 1 / 4 @8 loop / 5 @20 | code stretches Mid from the mouth to the Tip along the lash |
| Quibblet | `Quibblet_Pierce` | 48×48 | 8 @20 | warning triangle, spikes pierce up; `hit_frame` 3 |
| Alert Beaked Caller | `Caller_Anger_Pop` → `Caller_Anger_Loop` | 16×16 | 5 @15 / 6 @10 loop | anchor bottom-center, above the enemy's head |
| Hushwisp | `Hushwisp_Note_A` / `_B` | 16×16 | 8 @10 loop | single / beamed note, pick at random |
| Grindle | `Grindle_Step_Left` / `_Right` | 24×20 | 9 @15 | alternate along the line; `hit_frame` 0 |
| Ratiot | `Ratiot_Bite` | 48×56 | 8 @20 | anchor = target center; `hit_frame` 3 |
