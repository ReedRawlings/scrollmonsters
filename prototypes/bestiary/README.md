# Bestiary prototypes

Four HTML prototypes for a ScrollMonsters bestiary. They are mock-ups, not game code. All four read the same roster, the same sprites and the same mock save, so you can compare them fairly.

## Open them

- Double-click `index.html`, or run `python3 scripts/serve.py 5173` from the repo root and open `/prototypes/bestiary/`.
- Each page has a **DEMO bar** at the bottom. Switch between *Mid-game*, *New save* and *Complete*. The save carries over between pages.
- Extra demo buttons: **+ / - Research** (Journal), **Discover next** (Binder), **Merge next** (Web).
- Pages work on desktop and phone widths. Resize the window to check.

| File | Direction |
| --- | --- |
| `v1-field-guide.html` | List and detail, like a Pokédex. Matches the game's DarkMode UI. |
| `v2-hunters-journal.html` | A field journal. Marker bars hide what you have not researched. |
| `v3-card-binder.html` | Trading cards in sleeves. Ghost cards, foil, tilt, flip. |
| `v4-evolution-web.html` | A constellation of creatures, evolution recipes and combos. Foes get a timeline. |

## What makes a great bestiary

Found by searching. The *Bestiary Codex* and *Collection Sets* pages blocked direct access here, so those two points rest on search summaries only.

1. **Information is the reward.** Hollow Knight's [Hunter's Journal](https://hollowknight.wiki/w/The_Hunter) and Monster Hunter World's [research levels](https://attackofthefanboy.com/guides/monster-hunter-world-guide-research/) fill in as you play.
2. **Show the gaps.** Silhouettes and "N of M" counters pull players to finish a set ([Bestiary Codex](https://csaf.itch.io/bestiary-codex), [Collection Sets](https://yukaichou.com/advanced-gamification/game-design-technique-collection-sets/)).
3. **Seen is not owned.** Palworld shows a silhouette when you meet a Pal and fills it in on capture ([Paldeck guide](https://xgamingserver.com/blog/palworld-paldeck-guide/)).
4. **Portrait first, numbers second.** The [Pokédex](https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9dex) pairs a big sprite with a two or three sentence note.
5. **Show what changes play.** Weak points in Monster Hunter. For us: tells and counters for foes, combos and recipes for allies.
6. **Tie it to the player's story.** Hades' [Codex](https://hades.fandom.com/wiki/Codex) fills in as you meet and defeat each subject.

## Shared reveal model: research rank

Every prototype hides information by the same five ranks. This is the part to keep, whatever look you choose.

| Rank | Creature | Evolution | Foe | What shows |
| --- | --- | --- | --- | --- |
| 0 | Unknown | Undiscovered | Unknown | `???` only. In the game today, evolutions stay `? + ? = ?`. |
| 1 | Seen | Hinted | Sighted | Name and silhouette. Evolutions keep `???` as a name. |
| 2 | Captured | Discovered | Defeated | Portrait, type, role, ability, field note, ratings |
| 3 | Studied | Studied | Studied | Upgrades, combos, tactics, personal history |
| 4 | Mastered | Mastered | Mastered | Deep lore note, mastery mark |

The thresholds for ranks 3 and 4 (for example "deal 1,000 damage", "win an expedition with it") are placeholders.

## Real data and mock data

**Real, taken from the code:** roster order and names, one-line ability text, upgrade names and details, dash effects, the four evolution recipes and their bonuses, the four party combos (Blazing Charge, Silk Ripper, Conductive Feathers, Sheltering Silk), base stats from `stats()`, and foe numbers such as HP, speed, contact damage, the Shaman's summon timing and the Hunter's aim time.

**Mock, for layout only:** flavour text and lore notes, the 1 to 5 radar ratings, type names and colours (the game has none yet), personal history numbers, save presets and rank thresholds. The foe "tell" and "how to beat it" lines are my reading of the code, so check them.

## Things the prototypes show about the game

- **Three creatures have no recipe and no combo:** Mouse, Mole and Bear. The Web calls them "loose ends".
- **Mollusc links two recipes** (Octopus and Axolotl). It is the hub of the web.
- **Cat, Frog and Spider form a ring** through the Silk Ripper and Sheltering Silk combos.
- **Shaman, Golem and Lion have no faceset** in the asset pack. The prototypes use a still frame of the walking sprite for them.

## Porting notes

- **Field Guide** extends `bestiary()` in `survivor-screens.js`. It already has a face grid, evolution rows and a detail panel.
- **Journal** needs new paper art. The game's UI guide says to keep DarkMode, so this would be a deliberate break.
- **Binder** needs tilt and foil. Phaser can fake these with a few tweened sprites, or use a shader.
- **Web** needs only lines and nodes. Hand-placed positions are fine for 15 nodes. Add a force layout later if the roster grows.
- The prototypes use NovelMix at multiples of 9 px, like the game. Body text on the Binder and Web uses the system font for readability.

## Open questions

1. Which direction, or which mix? See the suggestion on `index.html`.
2. Do foes belong in the bestiary? They are in all four prototypes. Remove the third tab if not.
3. Should ranks 3 and 4 give a reward (for example a palette swap)? Nothing is promised in the prototypes.
4. Should capture count as the unlock moment, as it does today, or should *seen* also unlock a page?
5. Types and roles are invented here. Keep them, replace them, or drop them?

## Regenerate the embedded assets

`bestiary-assets.js` holds the sprites and font as data URIs, so the pages work from any location. Rebuild it after any asset change:

```
python3 scripts/build-bestiary-prototype-assets.py
```
