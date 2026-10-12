# Spell & ability FX

Pixel-art effects made in Pixel Composer (v1.22.10). **Game palette: Toasted40** (`scripts/pixelcomposer/palettes/Toasted40.hex`). Bubble, Scissors and Heart effects were moved to Toasted40 with `recolor_t40.py` (re-export their sheets); the dust effects still use Endesga 32.

- `sheets/`: game-ready transparent PNG strips (equal frames, horizontal, no spacing) plus a JSON file per effect
  with frame size, frame count, fps, loop and anchor point. Render with nearest-neighbour (no smoothing).
- `pixelcomposer/`: the editable `.pxc` sources. Open one, then press **F5** (Render All) and **F6** (Export All)
  to write its sheet into `sheets/`.
- `pixelcomposer/_archive/`: rejected or experimental versions, kept for reference.
- Build scripts and node templates: `scripts/pixelcomposer/`. Start with `assets/fx/MAKING_EFFECTS.md`; the `.pxc` technical reference is `scripts/pixelcomposer/EFFECTS_GUIDE.md`.

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

## Reward presentation effects

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

## Evolution merge (2026-10-01)

Shared by all four evolutions (white, tinted in code with the element colour, except the gold slot glow and purple discovery ring). Five are Pixel Composer projects built by `build_merge.py` (`Merge_*.pxc`, `Evolved_Slot_Glow.pxc`, `Recipe_Discovered.pxc`): open each, play it through, **F5** then **F6** to replace the placeholder PNG (`build_fillers.py merge`) at the same size, frame count and anchor. `Merge_Trail` is hand-drawn in `build_fillers.py` (too small for shapes), like `Reward_Trail`.

| Asset | Size | Frames @fps | Loop | Anchor | Used for |
|---|---|---|---|---|---|
| `Merge_Trail` | 8×8 | 6 @24 | no | 4,4 | motes behind each converging parent, in that parent's colour (world, 3x) |
| `Merge_Core` | 32×32 | 6 @24 | no | 16,16 | cocoon pulse hiding the swap (world, 3x; local, never full-screen) |
| `Merge_Reveal` | 48×48 | 8 @24 | no | 24,24 | single burst as the result appears (world, 3x) |
| `Merge_Ring` | 64×44 | 8 @24 | no | 32,22 | 3:2 ground shockwave under the result (world, 3x, below actors) |
| `Evolved_Slot_Glow` | 32×24 | 6 @15 | no | 16,12 | gold glow on the party slot the result lands in (UI, 2x over 62×48) |
| `Recipe_Discovered` | 64×64 | 8 @8 | yes | 32,32 | rotating sparkle ring behind the portrait on the NEW EVOLUTION panel (UI, 3x) |

## Evolution abilities (2026-10-01, Phase B)

Built by `build_abilities.py`; runtime wiring is in `survivor-evolution-fx.js`. Every JSON carries `visible_w` so code can scale to the gameplay radius. Ink and fire are palette-coloured (no tint); the others are white, tinted in code.

| Effect | Source | Size | Frames @fps | Loop |
|---|---|---|---|---|
| Ink landing | `Ink_Splat.pxc` | 48×32 | 6 @20 | no |
| Ink pool start / loop / end | `Ink_Pool_{Start,Loop,End}.pxc` | 48×32 | 4 @15 / 8 @8 / 4 @15 | loop only |
| Octopus tentacle sweep (points right; rotate) | `Tentacle_Sweep.pxc` | 96×96 | 6 @20 | no |
| Inked hit | `Ink_Hit.pxc` | 16×16 | 5 @20 | no |
| Reptile charge kick (authored charging right) | `Charge_Kick.pxc` | 48×32 | 6 @20 | no |
| Burning ground start / loop / end | `Fire_Pool_{Start,Loop,End}.pxc` | 48×32 | 4 @15 / 8 @10 / 4 @15 | loop only |
| Heavy bite (teeth only: snap, hold, slow fade) | `Bite_Impact.pxc` | 64×48 | 12 @20 | no |
| Burning detonation | `Fire_Detonate.pxc` | 64×48 | 8 @20 | no |
| Contact spark | `Zap_Spark.pxc` | 16×16 | 5 @24 | no |
| Thunder warning | `Thunder_Warning.pxc` | 48×32 | 6 @12 | yes |
| Axolotl shield pulse | `Bubble_Pulse.pxc` | 48×48 | 7 @20 | no |
| Bubble break ring | `Bubble_Break.pxc` | 64×44 | 8 @20 | no |
| Bubble Rally motes (gold) | `Rally_Motes.pxc` | 24×32 | 8 @12 | yes |
| Tengu feather (hand-placed, `build_fillers.py tengu`) | — | 16×8 | 4 @15 | yes |
| Lightning link strip (hand-placed, `build_fillers.py tengu`) | — | 32×12 | 4 @20 | yes |

## Evolution upgrade icons (2026-10-01, Phase C)

Pixel art built in Pixel Composer by `build_icons.py`, using the Castle/Tree sample recipe: flat shapes with no anti-aliasing, a 1px `#1c080c` outline outside drawn after the spin, and a Toasted40 posterize. Each is 16×16 with 16 frames @12 as a looping coin spin. After export, add each to `UPGRADE_ICONS` in `scripts/build-ui-assets.py` as `('sheet', 'Icon_…')`. The other eight evolution upgrades use pack icons (see `UPGRADE_ICONS`).

| Upgrade | Icon | Motif |
|---|---|---|
| reptileTrail Blazing Wake | `Icon_Blazing_Wake.pxc` | wall of fire |
| reptileRush Double Charge | `Icon_Double_Charge.pxc` | two chevrons pointing right |
| octoPool Ink Flood | `Icon_Ink_Flood.pxc` | jar of ink |
| octoCrush Squeezing Grip | `Icon_Squeezing_Grip.pxc` | curling tentacle |
| axoPulse Bubble Rhythm | `Icon_Bubble_Rhythm.pxc` | three rising bubbles |
| axoRing Ink Halo | `Icon_Ink_Halo.pxc` | flat purple ring |
| axoHaste Bubble Rally | `Icon_Bubble_Rally.pxc` | bubble with a gold up-chevron |

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

## Head-on ability FX (`build_rich.py`)

Detailed, Pokémon/Dragon Quest-style move animations for a **head-on battle view** (not the top-down map, so the 3:2 ground rule doesn't apply), in the **Apollo palette**. Built by `python3 scripts/pixelcomposer/build_rich.py flame thunder web void`; for how to build detailed effects, see `scripts/pixelcomposer/EFFECTS_GUIDE.md` §3. Anchor bottom-centre, motion along the screen axes.

| Effect | Source | Size | Frames @fps | Loop | Status |
|---|---|---|---|---|---|
| Flame Burst (fire erupts under the target, engulfs it, lifts into embers + smoke) | `Flame_Burst.pxc` | 64×64 | 32 @30 | no | approved |
| Thunder Strike (sky flicker, jagged bolt + forks at f5, sparks, crackling impact glow; anchor = strike point, `hit_frame` 5) | `Thunder_Strike.pxc` | 64×64 | 28 @30 | no | approved |
| Web Snare (threads fly in, spiral spins in, web snaps tight at f21; anchor = web centre on the body) | `Web_Snare.pxc` | 64×64 | 30 @30 | no | not reviewed yet |
| Void Orb (dark orb swirls + pulls debris in, collapses at f25 into flash + ring; anchor = orb centre) | `Void_Orb.pxc` | 64×64 | 32 @30 | no | not reviewed yet |

## Creature attacks, top-down (`assets/fx/attacks/`)

Attack FX for the survivors map in the Apollo palette. Each effect's `.pxc`, PNG and JSON sit together in `assets/fx/attacks/`. Built by `python3 scripts/pixelcomposer/build_attacks.py` (its header explains how to build new ones, using the Pixel Composer Complex examples as the reference); drawn in game by `survivor-attack-fx.js`. After exporting, run `python3 scripts/build-ui-assets.py --manifest-only` to hand the sheet to the game; until a PNG exists, that attack keeps its old visual.

To export: open the `.pxc`, play it through, **F5** then **F6**.

| Effect | Source | Size | Frames | Anchor | Used for |
|---|---|---|---|---|---|
| Mole attack, the whole effect: cracks spread over a 3:2 ellipse, the ground darkens, light leaks up through the cracks, pebbles hop, dust trickles up; the cracks reach the edge on the last frame = the hit, then the game fades that frame out over 0.3s with a small camera jitter | `Mole_Rumble.pxc` | 96×64 | 20, indexed by wind-up progress | 48,32 | friendly mole strikes (wind-up 1.0s), Aftershock echoes (0.5s), mole dash (0.45s), and the wild mole's eruption (1.25s, keeps its red ring + timer arc on top) |
| Storm Thunderhead strike: a bolt drops from above the frame onto the ground point (hit on frame 2), 3:2 ground flash, crackling ring, scorch star and pit, sparks, fading glow. Frames 0-1 play over the last 0.1s of the cast's wind-up so the hit frame lands with the damage | `Storm_Strike.pxc` | 48×96 | 10 @20, hit frame 2 | 24,80 | Thunderhead strikes (every third storm hit) and the wild storm lizard's strike; the game keeps its wind-up ring + timer arc |
| Spider web: the glob splats, eight spokes shoot out to a 3:2 rim, the capture spiral winds in (frames 0-9, once); a glint sweeps round the silk with dew beads (10-25, seamless loop); the snap: spokes recoil, the spiral unravels, shreds fly (26-33) | `Silk_Web.pxc` | 96×72 | 34 @12: land 0-9, loop 10-25, snap 26-33 | 48,36 | every web zone (fades over its last 0.4s; never below 1x, Wide Web stretches it a little; wild webs keep their orange ring) and the Tension Trap burst (snap) |
| Salamander fire patch: the spit flashes, droplets fly, a scorch spreads, Lava-Floor's crust cracks open with molten light between the plates and flame tongues grow (0-7, once), then the tongues flicker out of step over the burning bed with embers (8-31, seamless loop) | `Fire_Patch.pxc` | 80×80 | 32 @12: ignite 0-7, loop 8-31 | 40,54 | every fire zone (fades over its last 0.4s; never below 1x, Fire Pool stretches it a little; wild patches keep their ring), replacing the old elementFire sprite |
| Cat claw swipe: three crescent claw marks sweep a 124° arc on the 3:2 ground, light band under a white core, crescent air smear behind, flecks off the tips | `Cat_Swipe.pxc` | 128×128 | 6 @20 | 12,65 (the cat) | every cat swipe; drawn facing east, flipped for targets on the left, never rotated; Sweep stretches it a little |
| Mouse bite: upper and lower jaws sweep in as comet arcs and snap past each other (hit frame 2), spikes spray from the corners of the mouth, fur tufts | `Mouse_Bite.pxc` | 48×48 | 8 @20, hit frame 2 | 24,26 | each mouse helper bite (starts on frame 1 so the clamp lands right after the hit; follows the target) |
| Storm chain lightning: 32 px bolt pieces (light band, white core, halo through crackle noise, a fork; zigzag re-rolls every 2 frames, pinned to the centre line at both ends) in five drawn directions (0, ~22, 45, ~68, 90° up from east), 8 frames each; then the zap on each hit target (flash, scorch star, thin crackling ring, sparks) | `Storm_Arc.pxc` | 48×48 | 48 @20: dir0-dir4 0-39, zap 40-47 | per section (JSON `sections`) | every lightning jump: pieces laid end to end, nearest direction mirrored for the other quadrants (never rotated), every other piece turned 180° (both flips, anchored at its end), spaced so the last ends on the target; zap on each hit |
| Bear cross slam in three 10-frame pieces: a crack opens with green light seen through it, stone shards erupt one after another and shatter into grit, dust puffs; arm across (0-9), arm down (10-19), the centre crater with four cracks (20-29) | `Cross_Slam.pxc` | 48×72 | 30 @20 | 24,46 (ground under the piece) | every bear slam: the centre plays when the paw lands; 48 px arm pieces drop along all four arms as the sim's front reaches them (left arm flipped); reach upgrades add pieces, nothing stretches |
| Bamboo root spikes: the ground cracks and a hole tears open, three sharpened, jointed culms stab up with a stretch, overshoot and squash while dirt sprays, speed lines streak and leaves unfurl (0-5, once); the culms sway, leaves flutter, a leaf drifts down (6-17, seamless loop); they pop, splinter and sink (18-23, once as the field ends) | `Bamboo_Spike.pxc` | 48×64 | 24 @20 | 24,52 (ground under the cluster) | party Bamboo's root line (a piece every 26 px from the target outward, each 0.05s later, alternate pieces flipped) and Panda's cross (pieces along all four arms) |
| Bamboo snare: roots snake in, a ring of seven dried gold culms bursts up in two waves and clenches inward (0-5); a red pulse drains inward along the roots while the culms creak (6-17, loop); the culms splinter and sink (18-23) | `Bamboo_Snare.pxc` | 80×80 | 24 @20 | 40,54 | the Bamboo enemy's trap under the player (replaces the silk on webs a Bamboo casts) |
| Enemy telegraph, indexed by wind-up progress: a red swirl on the ground, three spiral arms that spin faster, grow and brighten over a dim pulsing core glow that flares on the last frame (v1, cracks with light through them, looked identical to Mole_Rumble: `_archive/`) | `Danger_Mark.pxc` | 80×64 | 24 (by progress) | 40,40 | every enemy wind-up (hostile casts, hostile rumbles, shaman summon points), at a whole-number scale picked from the radius; replaces the orange rings and clock arcs |
| Spirit's orbiting guard wisp: a hand-drawn three-tongue blue flame (deep blue, cyan, white core, dark outline) flickering at three sizes (flame_l 0-7, flame_m 8-15, flame_s 16-23), spawn flare (24-28), trail puff (29-32), block flash and sparks (33-37), blue flame lick on a hit enemy (38-42), fade with shreds and a smoke curl (43-50) | `Spirit_Wisp.pxc` | 48×48 | 51 @20 | 24,26 (the wisp's centre) | each wisp circling the player (size steps down as its 5+ hits run out), a puff behind it every 0.05s, block where it stops a shot, hit on each enemy it burns, fade after its last hit |

Casts have no travelling object (the sliding dot, a lobbed glob and a cast shadow were all dropped); the landing effect plays at the target. Spirit_Wisp v1 (a noise egg), Danger_Mark v1 (cracks) and Lob_Glob are in `_archive/`.

Sheets are shown only at a whole-number scale (`px` in the JSON; new sheets are authored at full on-screen size and shown at 1x; the rumble is shown at 2x). `visible_w` is the base gameplay width in sheet pixels.
