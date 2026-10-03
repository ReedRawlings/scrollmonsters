# ScrollMonsters

A browser survival game about recruiting monsters and combining compatible companions into evolutions.

## Play locally

Run `npm run dev`, then open [the ten-minute demo](http://localhost:5173/demo.html). The full twenty-minute expedition remains at `survivors.html`; the older campaign is at `legacy.html`.

Move with WASD, arrow keys, or touch drag. Attacks fire automatically. Space or a quick swipe dashes. Break a den and stand in the capture ring to recruit, evolve, or leave its monster. P or Escape pauses; F toggles fullscreen.

## Itch demo

Run `npm run build:demo`. On itch.io choose **HTML Game**, upload `dist/scrollmonsters-demo.zip` as the browser game, and choose an embed option. Do not add a separate downloadable file. The ZIP is the upload format; players launch the game on the page. Its `index.html` always opens the demo, including when links or query strings change.

The archive omits the older campaign, project docs, and most source assets. The full twenty-minute expedition is not playable from the archive, though some shared JavaScript still contains its logic. Like any browser game, its delivered code and assets can be inspected or saved by a determined visitor.

The forest-only demo initially offers Cat as a starter. Owl, Frog, Storm Lizard, and Mollusc can be captured and selected as starters on later runs; the available evolutions are Octopus, Tengu, and Axolotl. The first minute has only golem-looking Bat enemies, then the current game's enemy progression resumes. Dens appear at 1:00; their types and positions vary by run. Later dens favor ingredients compatible with the current party. The guardian appears at 9:30, enemy spawns taper off and stop at 10:00, and the run continues until the guardian is defeated or the player falls.

The archive contains the game runtime and the art and music it needs. Legacy content, old specs, previews, and unused asset-pack audio are excluded. Asset licensing is included in the archive.

See [SURVIVORS.md](SURVIVORS.md) for the current game modes and [LEGACY.md](LEGACY.md) for the older campaign. Historical campaign design and balance notes live in `docs/legacy/`.
