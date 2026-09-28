# Making effects in Pixel Composer by editing files

General lessons from building effects by editing Pixel Composer projects directly (v1.22.10, macOS, Sept 2026).
File-format and rendering details are in `NOTES.md`.

---

## 1. The approach

A `.pxc` project is a compressed JSON **node graph**. An effect is a chain of nodes (generate → shape → move →
color → clean up → output), and each node has a list of settings. You can make new effects without the app:

1. **Start from something that works:** a built-in sample, an example project, or an effect you've already approved.
2. **Change a few settings,** and sometimes insert or rewire a node.
3. **Save it under a new name,** then check it in the app.

Building a graph from scratch is the hardest and least reliable path. Almost any effect has a sample that's close.
Good places to look:

- `~/Library/Application Support/com.MakhamDev.PixelComposer/Welcome files/Sample Projects/`: complete
  effects such as Smoke Explosion, Magic Circle, Star Collapse, Cyber Frame, and Spiral.
- `Welcome files/Getting started/`: tutorials with clean, minimal uses of individual nodes (particles,
  paths, animation, loops, simulations). These are good places to copy a single node from.
- To survey what's available, list the node types used in each sample (see `pxc.py`).

```python
from pxc import load, save
header, project = load("Some_Sample.pxc")
# edit project["nodes"][i]["inputs"][k]["r"]["d"]
save("New_Effect.pxc", header, project)
```

---

## 2. Editing settings safely

Settings are stored **by position**, with no names. Slot 18 on a Particle node is "Speed", but the file doesn't say so.

- **Look up every slot in the label map:** `templates/node_input_labels_en.json` (not committed; it's the app's own locale data. Run `python3 scripts/pixelcomposer/extract_labels.py` to create it), taken from the app's language pack.
  `labels["Node_Particle"]["inputs"][18]["name"] == "Speed"`. Check that the slot count in the file matches the label count.
- **Never guess a slot's meaning.** One guessed slot turned on "Export on Save" instead of "Export on Update".
- **Check units:** `unit: 1` means a fraction of the canvas (0.5 = center), and `unit: 0` means pixels.
  `attri.use_project_dimension: 1` means the node follows the canvas size and ignores its own value.
  Fractions keep things centered when you resize a canvas; pixel values don't.
- **Dropdowns** are stored as bare numbers. Infer their meaning from samples that use them, and tell the user which
  ones were inferred.
- **After every save, reload and diff against the source** so you know that only the intended settings changed.

### Value formats
| Kind | Stored as |
|---|---|
| Color | 32-bit int, **ABGR** (`0xAABBGGRR`) |
| Gradient | JSON *string* `{"keys":[{"time":t,"value":<abgr float>}],"type":0}` |
| Palette | list of ABGR ints |
| Range | `[min, max]` |
| Direction range | `[0, min_deg, max_deg, 0, 0]`; 0° = right, 90° = up |
| Area | `[x, y, w, h, shape, ?]` in canvas fractions |
| Animated setting | `"anim": true`; `r` becomes keys `[[0, frame], value, [0,1], [0,0], 0, 0, true, 0, 16777215]` |

### Rewiring
- A link is `inputs[k].from_node` (source id) plus `from_index` (which output).
- **To insert a node between A and B:** copy a template node (`templates/*.json`, or any node from a sample), give it a
  unique `id`, point its input at A, then point B's input at it.
- **To add an output:** attach a new node to the last node in the chain, without changing the existing links.

---

## 3. How common effects are built

Once you recognize these patterns, you'll see them in most samples.

**Particles carrying a sprite.** A small animated shape (a simulation, a Shape node, or an image) is cached,
and a **Particle** node spawns copies of it. You control the look with the sprite and the motion with Particle
settings: spawn area, amount, delay, direction, speed, lifespan, size, and alpha over life.
- **Burst:** spawn once, Directed From Center on, 360° angle range.
- **Stream / trail:** spawn every frame (Spawn Delay 1), a few particles each time, with a keyframed Spawn Area to move the source.
- **Rising / falling:** set a direction range around 90° or 270° with Directed From Center off.
- Particles often start out barely moving (speed 0–0.3). Check speed before assuming the direction is wrong.

**Trails through feedback.** A **Feedback** loop blends each frame with a faded copy of the previous one. That's where the
smeared, lingering look comes from. Anything placed *inside* the loop is applied again every frame, so put
one-time transforms after it.

**Pixel-art cleanup at the end.** A typical ending is **Threshold → Level → Colorize → Posterize (palette) → De-Stray**.
- **Threshold** cuts faint pixels; lower it for fuller shapes.
- **Level** sets how quickly pixels reach full density, and applies to alpha too.
- **Colorize** maps brightness to a color ramp. This is usually the one place to change an effect's colors.
- **Posterize with a palette** snaps every pixel to the nearest palette color, so new colors must be *in* the palette.
- **De-Stray** removes lone pixels.

**Shapes.** The Shape node's **Positioning Mode** (slot 15) decides which settings place it: **0 = Area** uses Position (slot 3,
`[cx, cy, half_w, half_h, 0, 0]` in canvas fractions), 1 = Center/Half Size, and **2 = fill the whole canvas** (it ignores
position and only uses Shape Scale). Many templates are mode 2, so set mode 0 before keyframing a shape's size or position.
**Donut Inner Radius (slot 5) sets ring thickness, not hole size:** 0.1 gives a thin outline, and 0.8 gives a nearly solid disc.
Keyframing Position from size 0 is a clean way to make something appear and grow (the Magic Circle sample does this).
No sample uses transparency in shape colors; get translucency from the **Blend** node's Opacity (slot 3, which can be keyframed) instead.
Blend opacity is also a reliable way to switch a layer on and off at a given frame.

**Fake 3D / thickness:** don't show depth with one shifted copy of a shape. On thin (edge-on) frames it separates from the face and the outline draws a gap between them. Stack several copies at small offset steps (under ½ px apart) so they merge into a solid, attached band (see `build_heart.py`, Heart_Spin).

**Simulations** (smoke, fluid, rigid bodies, strands) come with their own node group. The emitter's position and velocity,
and the domain's inertia or acceleration, decide whether the result rises, drifts, or stays put.

---

## 4. Common changes

| Goal | Where to change it |
|---|---|
| Recolor | The **Colorize** gradient. Palette-snapped colors must be in the palette. Rotating the hue of *every* color also shifts backgrounds and neutrals, so skip very dark and grey colors. |
| Bigger or smaller canvas | `attributes.surface_dimension`, plus any node with a fixed dimension (e.g. Blend "Constant dimension"). Check that positions are fractions. |
| Longer or shorter animation | `animator.frames_total`; then check lifespans and keyframe frames. |
| Faster, slower, spreading | Particle Speed, Lifespan, Speed Over Lifespan |
| Stop something rising | Emitter velocity, domain inertia or acceleration, particle direction and gravity |
| Different random variation | Particle **Seed** (and any other seed settings) |
| Fuller or more opaque | Lower Threshold, lower the Level white point, raise particle Alpha |
| Isometric (2:1 top-down) | A **Transform** with Scale `(1, 0.5)`, Anchor `(0.5, 0.5)` relative, Position at the canvas center. For a moving source, squash the *sprite* (before it becomes a particle) so the path isn't squashed too, and turn off particle rotation. For radial effects, squash the whole output after the feedback loop. Diagonals use a 2:1 slope. |
| Directional variants | Generate with a script: E, NE, SE, N, S, then flip horizontally in the engine for W, NW, SW. |

---

## 5. Art direction lessons

- **Tiny canvases look crude.** Even with 16×16 to 16×32 characters, 16×12 effects looked "way too pixelated". Effects at
  roughly 64–192 px across looked right. Choose canvas size for how the effect reads, not to match the character's size.
- **Match the game's viewpoint.** Round, side-view shapes in a straight line read as a "2D battle screen" in a top-down iso game.
  Flatten ground effects to 2:1.
- **Motion reads before detail.** Puffs popping one after another at scattered points read as "a frog hopping", whereas a
  continuous source reads as the intended motion.
- **Match the rest of the game's palette.** The examples use Endesga 32; keeping to it keeps new effects consistent.

---

## 6. Rendering and export

- **Headless / CLI rendering is broken** in 1.22.10 on Mac: most nodes fail to build. Also, command-line arguments split on spaces.
- **In the app:** open the file, press **F5** (Render All) and then **F6** (Export All). `File → Export` saves the *project*, not images.
- **Images come from nodes:** an **Export** node (`templates/export_node.json`) set to single image PNG
  (slot 3 = 0, 9 = 0, template `%d%n`, slot 1 = full path including the name) or an image sequence (slot 3 = 1).
- **Sprite sheets:** **Render Spritesheet** → Export. Check **Custom Range** (samples may limit it to a few frames),
  **Frame Step** (2 = every other frame), and **Packing** (0 is assumed to be horizontal; not yet confirmed).
- **What the game needs per effect:** a transparent PNG strip with equal frame sizes, FPS or duration, loop or play once, and the
  anchor point, written to a JSON file next to the sheet. About 10–15 FPS matches the game's pixel-art effects.
- **If Claude must render:** launching a second app instance with a file works (relaunching right after a quit sometimes
  fails, so retry). Clicking in the app needs screen-control permission and a regular desktop Space, not a full-screen one.

---

## 7. Workflow

- **Skip render checks on simple edits.** The user checks in the app faster. Render only for risky structural changes or when final files are needed.
- **Once a plan is approved, build without check-ins,** then report a short table of what changed and what to look for.
- **Ask one question when feedback is ambiguous** before redoing work.
- **Prototype one variant, get a yes, then script the rest.**
- **Never overwrite approved work.** Save new names and keep backups (`output/pixelcomposer-backups/`, gitignored).

---

## 8. Still unverified

- Particle Spawn Type 0 = stream, 1 = burst (inferred from samples).
- Render Spritesheet Packing 0 = horizontal.
- Some sample chains render blank in this version (e.g. Spark-Bolt's final Camera, Chromatic Aberration, and Bloom nodes); the cause is unknown.
