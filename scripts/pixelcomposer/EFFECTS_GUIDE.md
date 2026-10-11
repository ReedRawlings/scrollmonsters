# Pixel Composer technical reference

How `.pxc` files and their nodes work, for building effects by editing files directly (Pixel Composer v1.22.10,
macOS). House rules, workflow, art direction and lessons learned are in `assets/fx/MAKING_EFFECTS.md`; read that first.

---

## 1. The `.pxc` file

A `.pxc` project is a compressed JSON **node graph**. On disk: `"PXCX"` + length, a THMB chunk (zlib thumbnail), a META
chunk (16 bytes, version), then a zlib stream of JSON with a trailing NUL. `pxc.py` reads and writes it:

```python
from pxc import load, save
header, project = load("Some_Sample.pxc")
# edit project["nodes"][i]["inputs"][k]["r"]["d"]
save("New_Effect.pxc", header, project)
```

- `project["nodes"]`: each node has `type`, `id` and a positional `inputs[]` list. A setting's value is `inputs[k].r.d`.
- To survey what a sample uses, list the node types in it.

**Working graphs to start from** (almost any effect has a sample that's close; building from scratch is the least
reliable path):

- `/Applications/PixelComposerExamples/Complex`: the reference for detailed effects (§3).
- `/Applications/PixelComposerExamples/`: also `Cobweb`, `Fire & Smoke` and others.
- `~/Library/Application Support/com.MakhamDev.PixelComposer/Welcome files/Sample Projects/`: Smoke Explosion,
  Magic Circle, Star Collapse, Cyber Frame, Spiral.
- `Welcome files/Getting started/`: tutorials with clean, minimal uses of single nodes. Good to copy one node from.

---

## 2. Editing settings safely

Settings are stored **by position**, with no names. Slot 18 on a Particle node is "Speed", but the file doesn't say so.

- **Look up every slot in the label map:** `templates/node_input_labels_en.json`, taken from the app's language pack.
  It isn't committed; run `python3 scripts/pixelcomposer/extract_labels.py` to create it.
  `labels["Node_Particle"]["inputs"][18]["name"] == "Speed"`. Check that the slot count in the file matches the label count.
- **Never guess a slot's meaning.** One guessed slot turned on "Export on Save" instead of "Export on Update".
- **Check units:** `unit: 1` means a fraction of the canvas (0.5 = center), and `unit: 0` means pixels.
  `attri.use_project_dimension: 1` makes a Dimension a **multiple of the canvas** (`[1, 1]` = the canvas; source:
  `node_value_dimension.gml`). Never write pixels into it: `[80, 80]` there rendered 6400×6400 surfaces and froze or
  crashed Pixel Composer. `fxlib.finish` refuses to save that; set the flag to 0 to give a node its own pixel size.
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
| Curve | `[0, 1, 0, 0, 1, 0]`, then six numbers per point: `[in-handle x, in-handle y, x, y, out-handle x, out-handle y]` |

### Rewiring
- A link is `inputs[k].from_node` (source id) plus `from_index` (which output).
- **To insert a node between A and B:** copy a template node (`templates/*.json`, or any node from a sample), give it a
  unique `id`, point its input at A, then point B's input at it.
- **To add an output:** attach a new node to the last node in the chain, without changing the existing links.

---

## 3. How the Complex examples are wired

None of them is one noise field: each layers several distinct elements, and each element has its own pipeline.

- **Fire-Tornado:** one crafted flame piece (gradient × simplex noise, displaced by upward-smeared anisotropic noise,
  wrapped with Polar, shaped by a Curve) is cached with **Cache Array** and **Repeat**ed along a **Path** (10 copies,
  scale and colour over copy, random scale), plus lines drawn along paths with a width curve.
- **Rocket-Thrust:** a crafted sprite (noise wrapped onto a **Shape 3D** cylinder, then a Transform) is fed to a
  **Particle** node as its sprite, with size, alpha and colour **over lifetime** curves; the rocket body is built
  separately from UV-mapped gradients, Outline and Shadow; Bloom on top.
- **Lava-Floor:** **Cellular** noise → Invert → Threshold → **Smear** makes crust plates with thickness, laid over a
  separate displaced molten layer; **Convolution** edge kernels give the rim light; burst particles.
- **Spark-Bolt:** a **Path** drawn in with **Trim Path**, a textured line along it, a head that follows the path
  (Sample Path → Transform), Line 2 Points sparks, MK Sparkle sprite particles, camera shake.

To study one, list its nodes in dataflow order with each node's links and changed settings (load it with `pxc.load`,
walk `from_node` links). To reuse a working part, `Rich.borrow_tree(example, node_id)` copies a node and everything
upstream of it with its settings intact, re-timed to your frame count and resized to your canvas; then pin any one-time
animations so loops stay seamless, and recolour its Colorize ramps.

**Reading the app's own logic:** every node's GLSL is in `strings Contents/Resources/game.ios`; node code is on GitHub
(`Ttanasart-pt/Pixel-Composer`, `scripts/node_<name>/node_<name>.gml`). Facts found that way:

- **Gradient:** circular prog = length(uv offset / Shape) / (Radius × √2), so a ground ellipse of half-width rx px on a
  W-wide canvas is Radius = rx / (W × √2) with Shape `[1, 2/3 × W/H]` and Uniform ratio off. Radial (angular) prog =
  fract((atan2(dy, dx) + Angle) / 360°) with y pointing down. Loop: 0 none, 1 loop, 2 ping-pong; Scale divides prog, so
  a small Scale with ping-pong repeats the ramp many times.
- More (Repeat placement, Smear sampling, Path anchors, Line sampling): `MAKING_EFFECTS.md` §5.

---

## 4. Node patterns

**Particles carrying a sprite.** A small animated shape (a simulation, a Shape node, or an image) is cached,
and a **Particle** node spawns copies of it. The sprite controls the look; Particle settings control the motion:
spawn area, amount, delay, direction, speed, lifespan, size, and alpha over life.
- **Burst:** spawn once, Directed From Center on, 360° angle range.
- **Stream / trail:** spawn every frame (Spawn Delay 1), a few particles each time, with a keyframed Spawn Area to move the source.
- **Rising / falling:** set a direction range around 90° or 270° with Directed From Center off.
- Particles often start out barely moving (speed 0–0.3). Check speed before assuming the direction is wrong.

**Trails through feedback.** A **Feedback** loop blends each frame with a faded copy of the previous one, which gives the
smeared, lingering look. Anything placed *inside* the loop is applied again every frame, so put one-time transforms after it.

**Pixel-art cleanup at the end.** A typical ending is **Threshold → Level → Colorize → Posterize (palette) → De-Stray**.
- **Threshold** cuts faint pixels; lower it for fuller shapes.
- **Level** sets how quickly pixels reach full density, and applies to alpha too.
- **Colorize** maps brightness to a color ramp. This is usually the one place to change an effect's colors.
- **Posterize with a palette** snaps every pixel to the nearest palette color, so new colors must be *in* the palette.
- **De-Stray** removes lone pixels.

**Shapes.** The Shape node's **Positioning Mode** (slot 15) decides which settings place it: **0 = Area** uses Position (slot 3,
`[cx, cy, half_w, half_h, 0, 0]` in canvas fractions), 1 = Center/Half Size, and **2 = fill the whole canvas** (it ignores
position and only uses Shape Scale). Many templates are mode 2, so set mode 0 before keyframing a shape's size or position.
- **Rotating:** slot 19 "Shape Rotation" (degrees; can be keyframed). Slot 7 "Rotation" does not rotate area-positioned shapes.
- **Donut Inner Radius (slot 5) sets ring thickness, not hole size:** 0.1 gives a thin outline, 0.8 a nearly solid disc.
- Keyframing Position from size 0 is a clean way to make something appear and grow (the Magic Circle sample does this).
- No sample uses transparency in shape colors; get translucency from the **Blend** node's Opacity (slot 3, can be
  keyframed). Blend opacity is also a reliable way to switch a layer on and off at a given frame.

**Fake 3D / thickness:** don't show depth with one shifted copy of a shape. On thin (edge-on) frames it separates from
the face and the outline draws a gap between them. Stack several copies at small offset steps (under ½ px apart) so they
merge into a solid, attached band (see `build_heart.py`, Heart_Spin).

**Simulations** (smoke, fluid, rigid bodies, strands) come with their own node group. The emitter's position and velocity,
and the domain's inertia or acceleration, decide whether the result rises, drifts, or stays put.

---

## 5. Common changes

| Goal | Where to change it |
|---|---|
| Recolor | The **Colorize** gradient. Palette-snapped colors must be in the palette. Rotating the hue of *every* color also shifts backgrounds and neutrals, so skip very dark and grey colors (`recolor.py`). |
| Bigger or smaller canvas | `attributes.surface_dimension`, plus any node with a fixed dimension (e.g. Blend "Constant dimension"). Check that positions are fractions. |
| Longer or shorter animation | `animator.frames_total`; then check lifespans and keyframe frames. |
| Faster, slower, spreading | Particle Speed, Lifespan, Speed Over Lifespan |
| Stop something rising | Emitter velocity, domain inertia or acceleration, particle direction and gravity |
| Different random variation | Particle **Seed** (and any other seed settings) |
| Fuller or more opaque | Lower Threshold, lower the Level white point, raise particle Alpha |
| ¾ top-down ground (3:2) | Gradient Shape `[1, 2/3 × W/H]`, or a **Transform** with Scale `(1, 0.667)`. For a moving source, squash the *sprite* (before it becomes a particle) so the path isn't squashed too. |

---

## 6. Rendering and export

- **Headless / CLI rendering is broken** in 1.22.10 on Mac: most nodes fail to build, and command-line arguments split
  on spaces. The user renders in the app (see `MAKING_EFFECTS.md` §3).
- **In the app:** open the file, press **F5** (Render All) and then **F6** (Export All). `File → Export` saves the *project*, not images.
- **Export node** (`templates/export_node.json`): slot 1 Directory (full path including the name), 2 Template (`%d%n`),
  3 Type (0 single image, 1 sequence), 9 Format (0 PNG), 22 Export on Update.
- **Render Spritesheet node:** slot 2 Frame Step (2 = every other frame), 3 Packing (0 assumed horizontal), 11 Custom
  Range (samples may limit it to a few frames).
- **Sprite sheets only collect frames that have played:** play the animation through once before exporting, or the
  sheet comes out empty or sparse.
- **If Claude must render:** launching a second app instance with a file works (relaunching right after a quit sometimes
  fails, so retry). Clicking in the app needs screen-control permission and a regular desktop Space, not a full-screen one.

---

## 7. Still unverified

- Particle Spawn Type 0 = stream, 1 = burst (inferred from samples).
- Render Spritesheet Packing 0 = horizontal.
- Some sample chains render blank in this version (e.g. Spark-Bolt's final Camera, Chromatic Aberration, and Bloom nodes); the cause is unknown.
