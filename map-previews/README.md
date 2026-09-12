# Track scenery previews

Three visual concepts made from the existing Ninja Adventure tilesets. These are review images, not integrated game maps.

- `01-open-meadow.png`: lighter grass, broad dirt track, sparse trees.
- `02-forest-corridor.png`: darker grass, narrower track, dense trees.
- `03-rocky-trail.png`: broad track, mixed boulders and trees.
- `comparison.png`: all three strips side by side.

Each map is 18 × 44 tiles at 16 pixels per tile, exported at 3× nearest-neighbor scale. The comparison uses 2× scale. Dressing is decorative. Source art is unmodified; the generator crops complete tiles and objects from TilesetFloor.png, TilesetFloorDetail.png, and TilesetNature.png.

Regenerate with `python3 map-previews/build_previews.py` (requires Pillow).

Feedback to consider: floor palette, route width, density of foliage, amount of ground detail. Once a direction is selected, refine terrain variation and scrolling seams for game integration.
