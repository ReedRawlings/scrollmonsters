# Game music

Drop combat tracks directly into this folder. The game automatically includes `.ogg`, `.mp3`, `.wav`, `.m4a`, `.aac`, and `.webm` files (case-insensitive). Use formats supported by your players’ browsers; OGG and MP3 are good defaults. README files and subfolders are ignored.

## Menu music

Keep menu-only music in `menu/`. The first audio filename alphabetically is used for the title, map, upgrades and results. It is never included in combat rotation. Replace that file to change the menu music.

## When new tracks appear

- **Production:** add/commit the audio files and deploy. Vercel rebuilds the playlist automatically. Reload the game after deployment.
- **Local:** start with `npm run dev` or `python3 scripts/serve.py 5173`, then reload the page after adding files. This server rescans the folder each time the playlist is requested.
- **Other static servers:** run `npm run build` after changing music, then reload.

`playlist.js` is generated; do not edit it. One combat track is randomly chosen per round and loops. An empty combat folder plays no combat music. Sound effects and jingles still use their original asset-pack paths.

Music from the Ninja Adventure asset pack remains covered by its original license.
