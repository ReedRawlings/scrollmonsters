# ScollMonsters starter assets

21 original code-drawn geometric pixel-style SVG placeholders. No third-party images are included. Each uses a 16 × 16 viewBox; render at integer multiples with image smoothing disabled. These are static stand-ins, not final character art or animation sheets.

- `manifest.json`: asset names, project-relative paths, dimensions.
- `placeholder/`: player, three creatures, three enemies, boss, gold, heart, healing effect, targeting icons, map nodes, lock, projectiles, impact, grass and path tiles.
- `../asset-preview.html`: visual catalog.
- `../scripts/make_assets.py`: reproducible source; run from any directory with Python 3.

Optional future online source: [Kenney Tiny Dungeon](https://www.kenney.nl/assets/tiny-dungeon), listed by its creator as CC0. Checked September 9, 2026. Not downloaded or incorporated in this set.

## Proposed implementation defaults

These are starting values for playtesting, not confirmed user requirements:

- Linear map of ten short stages; allow completed stages to be replayed for gold and to test the stage 10 recruit.
- Start at 100 shared health; each stage attempt restores health. Keep collected gold, recruits, and purchases after defeat.
- Auto-target is a permanent upgrade costing 50 gold; prioritize nearest enemy. Space toggles it after purchase.
- Start with 45–60 second stages; scale enemies using shared content before making unique environments.
- Tune early earnings so a first attempt buys an upgrade. Avoid fixing the full economy before testing.
- Use simple generated sound effects later; audio does not block the first playable loop.

Next implementation milestone: one playable combat stage with cursor-directed auto-fire, enemies, shared health, gold, results, one permanent damage upgrade, and browser saving. Then add the overworld, recruitment milestones, creature abilities, and the rest of the upgrade tree.

## Added earth effects

The player attack uses two sheets from `SoggySocks Earth FX/PNG/`:

- `proj_earth_1_sheet.png`: four 100 × 100 cells, looping at 12 FPS and rotated along projectile velocity.
- `impact_earth_3_sheet.png`: eight 100 × 100 cells, played once over 0.48 seconds when a player projectile damages an enemy.

The visible pixel art occupies a small centered region inside each transparent cell. Cells render at 100 × 100 canvas pixels to retain that native visual scale. The original SVG projectile and impact remain runtime fallbacks if either PNG cannot load.

## Character and pet animations

- `Sprites/MainCharacter/16x16 Walk-Sheet.png`: the player uses the four visible walking poses on row 3 (columns 1, 3, 4, and 6) at 8 FPS, skipping two spacer/transition cells. The source cells are 16 × 24 pixels and render at a 2:3 aspect ratio.
- `Sprites/Pets/Fangle.png`: four 16 × 16 frames for the single-target attacker.
- `Sprites/Pets/buttermant.png`: four 16 × 16 frames for the healer.
- `Sprites/Pets/tinmin.png`: four 16 × 16 frames for the AOE attacker.

All pet strips loop at 8 FPS. Existing SVG character placeholders remain load fallbacks, and internal role/save identifiers stay unchanged for browser-save compatibility.
