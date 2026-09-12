# Pass 02 — floor detail and brown rocks

Review concepts only; no game code has been changed.

- comparison.png: three complete strips side by side.
- 01-meadow-details.png: light grass and a broad track.
- 02-forest-details.png: darker grass and a denser tree border.
- 03-brown-rock-trail.png: small and medium brown rocks in the verge and track.
- rock-size-study.png: proposed sprite sizes and health.

All three strips include alternating small and medium brown rocks as sample gameplay obstacles. Floor dressing now samples 11 tiles from FloorDetail row 0 and all eight green vegetation tiles in row 2. This pass deliberately shows more variety for review.

## Proposed game integration

TilesetNature.png, zero-based source rectangles:
- Small: x=272, y=208, width=16, height=16; draw at 32x32; proposed 8 HP.
- Medium: x=240, y=160, width=32, height=32; draw at 64x64; proposed 15 HP.

Current game rocks have radius 24–32, 15 HP, spawn from stage 4, and require Rock Breaker to take damage. Proposed health stays fixed by rock type; upgrades reduce shots needed. At 2 damage per shot, small takes 4 hits and medium takes 8. At 5 damage, they take 2 and 3. Critical hits alter these counts. These numbers are a starting proposal, not a tested balance change.

On integration, align collision bounds to visible rock bodies (accounting for transparent sprite margins), and preserve the current spawn lanes and treasure clearance behavior. Floor details remain decorative.

Run: python3 map-previews/pass-02/build_previews.py
Requires Pillow. Uses original tileset pixels with nearest-neighbor enlargement.
