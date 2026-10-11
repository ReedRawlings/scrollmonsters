# Making effects: how we do it and what we've learned

The main doc for building ScrollMonsters pixel VFX in Pixel Composer: house rules, workflow, art direction and the
hard-won lessons. The `.pxc` file format and node-by-node facts are in `scripts/pixelcomposer/EFFECTS_GUIDE.md`; the
`making-scrollmonsters-vfx` skill is the short version loaded into every effects session.

---

## 1. What a good effect looks like

- **Layered, distinct elements.** The reference is `/Applications/PixelComposerExamples/Complex`. Every example there is
  several separate elements, each with its own pipeline: drawn paths, crafted sprites fed to particles, cellular
  structure, light seen through other layers. Richness comes from that layering.
- **Not one noise field.** "Noise × envelope → threshold → colour ramp", tweaked across near-identical nodes, always
  reads as a smudge or blob, however it's tuned.
- **Specific drawn elements beat generic blobs** and soft gradient flashes.
- **Elements read as one piece**: no outlines separating them from each other.
- **Phases grow out of each other.** A follow-up phase reuses the same cracks, the same light; it doesn't switch looks.
- **Hard rings on the ground read as UI selection circles.** A crisp ellipse outline (splash ring, dust ring, snap
  ring, zap ring) kept coming out looking like a target marker. Break the edge up (particles, crackle, noise-cut
  dust) or drop it.
- **Tiny drawn details die at 1x.** Teeth on a 48 px bite read as "!!", "11" or nails in four tries; motion and light
  carried the bite instead. Prefer a strong silhouette in motion over small literal detail.
- **Motion reads before detail.** A continuous source reads as the intended motion; scattered pops read as something
  else (puffs popping one after another looked like "a frog hopping").

## 2. House rules

| Rule | Detail |
|---|---|
| Palette | **Apollo** for detailed attack FX (`palettes/Apollo.hex`). Older sheets use Toasted40 + white. Effects "tinted in code" are pure white. The Pixel Composer examples use Endesga 32, so recolour anything borrowed from them. |
| View | 3/4 top-down. Anything on the ground is a **3:2 ellipse**; height goes straight up the screen. 2:1 iso looked too flat; round side-view shapes in a line looked like a "2D battle screen". |
| Size | **Author at the size it appears on screen and show it at 1x.** Need more detail? Make the canvas bigger. Tiny canvases (16×12) looked "way too pixelated"; ~48–192 px reads well. |
| Scale | **Whole-number scales only.** Never 1.5×, 2.03×, a stretched arc, or scaling to fit a gameplay radius. Upgrades that grow an area may stretch it a little; don't design around that. |
| Direction | **Draw directional attacks once, facing east, and flip horizontally in game** for targets on the left. No 5- or 8-direction sets: at survivors pace exact aim doesn't read, and extra directions multiply build and export work. Never rotate at runtime: it breaks the pixel grid like fractional scaling, and a 90° turn stands a 3:2 ground arc on end. (The older `Dust_Trail_{E,NE,SE,N,S}` set predates this rule.) |
| Long things | Long links (chain lightning, cross arms) **tile** in fixed-size pieces; crop the last piece, never stretch. |
| One sheet per attack | Cover every phase in one strip (wind-up through hit, ignite plus loop, land/loop/snap). The game plays it, loops a range, indexes it by progress, or picks a section. No Start/Loop/End trios. Record ranges in the JSON (`loop_frames`, `sections`, …). |
| Output contract | Horizontal strip, equal frames, no spacing; JSON with `image, frame_width, frame_height, frame_count, layout, fps, duration_s, loop, anchor, palette, notes, smoothing`, plus `px` (display scale) and `visible_w` where it applies. `fxlib.finish` writes it. |
| Game side | Presentation only (`survivor-attack-fx.js`): reads sim state, never writes it, no sim `rand()`. Dynamic things (homing trails, progress bars) stay in code. |
| Never | Make fonts; overwrite a `.pxc` the user approved or edited (new name, back up to `output/pixelcomposer-backups/`). |

## 3. Workflow

1. **Read the sim** for the attack: radius, duration, travel, what upgrades change. The design has to fit it.
2. **Propose a short design** per effect (size, frames, fps, phases, elements, colours, anchor). Wait for the OK, then
   build without check-ins.
3. **Study the closest example's wiring** before building: dump its nodes in dataflow order with every changed
   setting (labels from `templates/node_input_labels_en.json`). Also look outside `Complex/`: `Cobweb` and
   `Fire & Smoke` in `/Applications/PixelComposerExamples/` matched webs and fire directly.
4. **Build each effect on its own** in `build_attacks.py`; never make one and script the rest from it.
5. **Reload and check** what was saved: links, colours in palette, every surface size (see §5).
6. **The user exports** (headless rendering is broken): open the file, press play through the whole animation, then
   Rendering → Export All. Sprite sheets only collect frames that played (a partial play leaves blank frames at the
   end). **After a rebuild, close and reopen the file**: Pixel Composer keeps the old graph in memory and exports it
   unchanged (Storm_Arc came back pixel-identical to the previous version).
7. **Read the PNG** (crop and enlarge frames with PIL) and critique honestly before changing anything.
8. Wire it into the game, then update `assets/fx/README.md`.
9. Keep only approved work: move rejected versions to `_archive/` so they don't steer the next attempt.

## 4. Techniques from the examples

| Example | What to take from it |
|---|---|
| **Fire-Tornado** | A crafted flame piece (gradient × noise, displaced by upward-blurred streak noise, wrapped with Polar, shaped by a Curve) repeated along a Path with scale and colour over copy; lines drawn along paths with a width curve. The displacement trick makes flames lick. |
| **Lava-Floor** | Crust plates: Cellular → Invert → × gradient → Threshold → Smear (thickness). A separate molten layer: Cellular displaced by scrolling noise. Rim light from Convolution edge kernels. Cracks open over time by animating the gradient's Shift/Scale. |
| **Spark-Bolt** | A Path drawn in with Trim Path / Line Range, a textured line along it, a head that follows the path, Line 2 Points sparks, sparkle sprite particles. |
| **Icicle** | One crafted shard (a Line along a short Path, textured with a faceted gradient and a sweeping Shine, two Outlines) → **Delay with an array of frames** (`[0, 2, 4, 6]`) → **Repeat** = a staggered row of shards; they shatter into physics particles. |
| **Rocket-Thrust** | A crafted sprite (noise wrapped on a Shape 3D cylinder) fed to Particles with size/alpha/colour over lifetime. |
| **Cobweb** | Silk as MK Cables along concentric paths (sagging catenaries between anchor points). |
| **Fire & Smoke** | A moving source inside a Feedback loop that shifts up and fades each frame: flames trailing from a source. |

Copy a working sub-graph with `Rich.borrow_tree(example, node_id)`, then re-time its keys, re-point its positions,
and recolour its ramps. Don't recolour an example and call it a new effect.

## 5. Technical facts that bit us

- **Dimension with "use project dimension" is a multiple of the canvas.** `attri.use_project_dimension: 1` means the
  value is ×canvas: `[1, 1]` = the canvas. Writing pixels there (`[80, 80]`) made every borrowed noise/cellular node
  render **6400×6400**: the file lagged, crashed at random, and anything that did render was a tiny zoomed-in corner of
  huge noise, i.e. a **blob**. Three archived effects (Mole_Eruption ×2, Fire_Pool_Loop_Noise) had this bug.
  `borrow_tree` now leaves those alone, and `fxlib.finish` refuses to save a file with the mistake. To give a node its
  own pixel size, set the flag to 0 (`Rich.dim`).
- **Units.** `unit: 1` = fraction of the canvas, `unit: 0` = pixels. Set `unit` explicitly when you pass pixels
  (`Rich.px`).
- **Never guess a slot.** Look it up in the label map; one guessed slot once turned on "Export on Save".
- **When behaviour is unclear, read the source.** Shaders are in `strings Contents/Resources/game.ios`; node logic is
  on GitHub (`Ttanasart-pt/Pixel-Composer`, `scripts/node_<name>/node_<name>.gml`). That's how we learned:
  - **Repeat**: Circular pattern places copy *i* at `start + (r·cos a, −r·sin a · Circular Ratio)` with
    `a = Start Rotation + lerp(Angle Range, i / Amount)` (the range end is excluded); each copy's Anchor point lands
    on its position; Sort Y orders them front to back; Delay arrays + Array Select "Order" cycle through variants.
  - **Gradient**: circular prog = length(uv offset / Shape) / (Radius × √2); a 3:2 ground ellipse of half-width rx
    on a W-wide canvas is Radius = rx / (W√2), Shape `[1, 2/3·W/H]`, Uniform ratio off.
  - **Smear** samples about once per pixel of canvas width along its direction.
- **Paths.** Anchors are `[x, y, in-dx, in-dy, out-dx, out-dy, 0]` in canvas fractions; one input per anchor. A Line
  reads a Path from the Path's **output 1** (`Rich.path` + `Rich.wire(..., out=1)`).
- **A Line along a Path samples it at only 8 segments by default**, joining 9 points with straight chords and skipping
  every anchor in between. Silk_Web's 33-anchor spiral came out as a few long lines slashing across the web, so it read
  as an asterisk. Turn on **Fix Length** with **Segment Length 1** (`path_line` in `build_attacks.py` does) so the line
  follows the path pixel by pixel.
- **A Width Curve only shapes a line drawn along a Path.** On a two-point line it's ignored: Mouse_Bite's "tapered"
  teeth came out as 3 px bars ("11"). Draw tapered pieces (teeth, shards, claws) with a tiny Path + `path_line`.
- **Pixel Composer's preview loops the whole strip,** so sections of a multi-section sheet play back to back there.
  A piece that only makes sense on its own (Mouse_Bite's scurry puff) looked like the bite "spawning from a ground
  circle". Keep pieces that are used separately in their own sheet, or warn the user the preview runs them together.
- **Two opacity keys on the same frame cancel out;** Mouse_Bite's frame 0 came out empty that way.
- **Seamless loops.** Anything that moves must move a whole tile (Offset by 1.0 on tiling noise) or a whole turn
  (360°) per loop. If the loop starts after an intro, key it so frame `start + period` would equal frame `start`
  (`looped()` in `build_attacks.py`). Particles can't loop exactly; keep them sparse so the seam doesn't show.
- **Sections in one sheet.** Repeat the same relative keys in every section (`every()` in `cross_slam`), gate each
  section's layers with Blend opacity, and make sure Delay never pulls a previous section's frames into view.
  **Hold every key to the section's last frame**: keys interpolate across the gap to the next section's first key, so
  without it Cross_Slam's shards faded back in (and shrank) between pieces.
- **Shapes.** Positioning Mode 0 (Area) or they fill the canvas; rotate with slot 19 "Shape Rotation"; Donut Inner
  Radius is thickness; fade with Blend opacity, not transparent shape colours; under ~2 px they vanish.
- **Multiply needs an opaque base.** A field built from transparent copies (Repeat output) must sit on black before
  you multiply it with noise, or the noise shows through everywhere.
- **Cache Array** only fills after the timeline has played, so a first export can come out empty. Avoid it for
  anything an export depends on.
- **Feedback loops** apply whatever is inside them every frame; put one-time transforms after the loop.

## 6. When a file is slow, crashes or exports blank

What worked (and what didn't) on Fire_Patch:

- **A blank exported strip means no frame finished rendering**, not that the art is empty.
- **Bisect with test files.** Split the graph into parts that each export on their own, have the user open each,
  then split the guilty part again. Two rounds pinned it to the crust branch.
- **Don't stop at the first plausible culprit.** We blamed Smear because it's the heaviest node; removing it changed
  nothing (still slow). The fix based on that guess had to be reverted.
- **One variable per experiment, against a working reference.** The decisive tests: the original example re-saved by
  our tools (smooth → our save path is fine), the example at our canvas size (smooth → size isn't it), *our* nodes in
  the example's project (slow → our nodes), the *example's* nodes in our project (smooth → our project is fine).
  Then a full field-by-field diff of our copied nodes against the originals, plus the app's source, found the
  Dimension multiplier.
- **Random crash-or-lag across near-identical files points at resource blow-up** (huge surfaces, memory), not at one
  bad setting.

## 7. Process lessons

- **Build blind, check with real frames.** Ask for the export and read it; don't iterate on guesses.
- **Ask one short question** when feedback is ambiguous ("go back", "bigger") instead of rebuilding.
- **Don't turn one miss into a rule.**
- **Never regenerate approved files as a side effect.** Rebuilding `build_rich.py` effects to test a guard overwrote
  approved `.pxc` files (restored from git). Run only the builders you're working on.
- **Be honest about what's borrowed vs invented,** and say which parts you're least sure of before the user exports.

## 8. The files: guide, libraries and builders

Everything is generated by Python in `scripts/pixelcomposer/`; graphs are never hand-built. Run a builder with the
effect names you want (`python3 build_attacks.py fire_patch`); run only the ones you're working on (§7).

**Docs**

| File | What it's for |
|---|---|
| `assets/fx/MAKING_EFFECTS.md` | This doc: house rules, workflow, lessons. |
| `scripts/pixelcomposer/EFFECTS_GUIDE.md` | The technical reference: `.pxc` format, where to find working sample graphs, editing settings by slot, value formats, rewiring, how each Complex example is wired, node patterns, common changes, Export and Render Spritesheet node slots. |
| `.claude/skills/making-scrollmonsters-vfx/SKILL.md` | The short version loaded into every effects session: where things live, conventions, workflow, past mistakes. |
| `assets/fx/README.md` | Inventory: every sheet, its builder, size, frames, anchor, and where the game uses it. |
| `assets/fx/VFX_REQUESTS.md` | Requests with exact specs. |

**Libraries**

| File | What it gives you |
|---|---|
| `pxc.py` | `load` / `save` a `.pxc` (zlib-compressed JSON behind a thumbnail header). |
| `fxlib.py` | `Project`: canvas, frames, fps, palette; `shape`, `stack`, `show` (opacity keys), procedural helpers; `finish` adds Posterize → Render Spritesheet → Export, saves, reloads to check for dangling links and oversized Dimensions, and writes the JSON. |
| `richlib.py` | `Rich` (Apollo, for detailed effects): `node(kind, name, {label: value})` borrows a node type from a Complex example and sets it by label (unset settings reset to defaults); `borrow_tree` copies an example sub-graph with its settings; `set`, `px`, `dim`, `wire`, `path`, `line`, `particles`, `cutcolor`, `mix`, `audit` (colours outside the palette); `ramp` and `hold` for gradients and stepped keys. |
| `extract_labels.py` | Rebuilds `templates/node_input_labels_en.json` (setting names by slot) from the installed app. Run once after cloning. |
| `recolor.py`, `recolor_t40.py` | Hue-rotate a `.pxc`, or move an Endesga-32 file onto Toasted40 + white. |

**Builders**

| File | Builds |
|---|---|
| `build_attacks.py` | **Detailed creature attack FX for the survivors map** (Apollo, `assets/fx/attacks/`): Mole_Rumble, Fire_Patch, Silk_Web, Cross_Slam. The header explains how to build new ones; `looped()`, `black()` and `every()` live here. Drawn in game by `survivor-attack-fx.js`. |
| `build_rich.py` | Head-on battle FX (Apollo, side view, not top-down): `flame()` and `thunder()` are good references; ignore `web()` and `void()`. |
| `build_abilities.py`, `build_merge.py`, `build_icons.py` | Evolution ability effects, merge effects, upgrade icons (Toasted40 + white). |
| `build_capture.py`, `build_rewards.py`, `build_levelup.py`, `build_heart.py` | Capture ring set, reward effects, level-up aura, heart missile. |
| `build_monster_fx.py` | Monster attack effects from "THE SCROLL — Confirmed Monsters". |
| `build_bubble.py`, `build_scissors.py`, `build_trail_dir.py` | Single older effects (Bubble_Burst still uses 2:1 iso; it predates the 3:2 rule). |
| `build_fillers.py`, `build_monster_sprites.py` | Hand-placed pixel art with PIL (no `.pxc`) for pieces too small or too hard-edged for Pixel Composer: placeholders, tiny sprites, monster attack bits. |

## 9. Checklist before handing over a build

- [ ] Each effect is its own graph, made of distinct elements; borrowed parts came from a dumped, understood example.
- [ ] Authored at on-screen size; JSON has `px` (normally 1), anchor, phase/section ranges.
- [ ] Ground shapes are 3:2; directional attacks are one east-facing sheet (flipped in game), never rotated.
- [ ] Loops move whole tiles/turns per period.
- [ ] Builder reports no dangling links and no colours outside the palette.
- [ ] Every surface in the file is canvas-sized or a deliberate sprite size (`fxlib.finish` enforces the multiplier rule).
- [ ] Approved `.pxc` files untouched; new names for new work.
- [ ] Tell the user what to look for and where you're least sure.
