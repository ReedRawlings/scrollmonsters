# Runtime assets

The survivor game loads art from `MapAssets/Greens`, `Enemies`, `fx`, `ui`, `icons`, the three SoggySocks effect folders, and selected files in the Ninja Adventure pack. The legacy campaign also uses scenery, ability effects, pet sprites, and three PatternMix textures.

`npm run build:demo` copies the survivor runtime assets into the itch archive and selects three combat tracks plus one menu track. The complete source asset folders remain available for local development. The Ninja Adventure license is preserved in its source folder and in the demo archive.

`fx/README.md` documents the generated effect sheets. `music/README.md` describes playlist generation for the full local game.

The player character is from Pixelarium — Grasslands Full Version by LukeThePolice. Selected idle, walk and dodge-roll sheets are in `player/grasslands`; its supplied license is preserved there and in the playable demo package. These source assets are for use in the game, not standalone redistribution. Frames are 64×64, with 12 idle, 6 walk and 7 roll frames.
