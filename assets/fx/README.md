# Spell & ability FX

Pixel-art effects made in Pixel Composer (v1.22.10). **Game palette: Toasted40** (`scripts/pixelcomposer/palettes/Toasted40.hex`); effects built before the capture ring still use Endesga 32.

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
