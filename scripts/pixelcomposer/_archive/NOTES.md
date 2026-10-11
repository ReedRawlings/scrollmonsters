# Pixel Composer automation notes (v1.22.10, macOS)

## .pxc format
"PXCX" + len, THMB chunk (zlib thumbnail), META chunk (16 bytes, version), then a zlib stream of JSON (+ trailing NUL).
`pxc.py` has `load(path) -> (header, json)` and `save(path, header, json)`.

- `nodes[]`: each has `type`, `id`, `inputs[]` (positional). Value lives in `inputs[k].r.d`.
- Input labels by position: `templates/node_input_labels_en.json` (not committed; it's the app's own locale data. Run `python3 scripts/pixelcomposer/extract_labels.py` to create it) (from the app's locale pack) — `[node_type].inputs[k].name`.
- Links: `inputs[k].from_node` / `from_index`.
- Colors: 32-bit ABGR ints. Gradients: JSON string `{"keys":[{"time":t,"value":abgr}],"type":0}`.
- Animated input: `"anim": true` and `r` = list of keys `[[0, frame], value, [0,1], [0,0], 0, 0, true, 0, 16777215]`.
- Particle direction: `[0, min_deg, max_deg, 0, 0]`, 0=right, 90=up.

## Rendering
- `--headless` CLI is broken in this version (nodes fail to build). Args split on spaces.
- Works: open the file in the app, F5 (Render All), F6 (Export All).
- Export node (templates/export_node.json): 1 Directory (full path incl. name.png), 2 Template (`%d%n`), 3 Type (0 single image, 1 sequence), 9 Format (0 png), 22 Export on Update.
- Render Spritesheet node: 2 Frame Step, 3 Packing (0 horizontal), 11 Custom Range.

## Dust FX (built 2026-09-24)
- Dust_Burst: from built-in "Smoke Explosion" sample, flattened (no upward smoke), dust ramp, 96x64.
- Dust_Trail_{E,NE,SE,N,S}: `build_trail_dir.py`; per-puff 2:1 iso squash (Transform before Cache Array), keyframed spawn path, darker-when-fresh ramp.
- Dust_Burst_Iso: whole-output 2:1 squash (Transform before Posterize).
- assets/fx/sheets/: spritesheet PNG + JSON metadata per effect (15 fps, every other frame, play once).

See also: EFFECTS_GUIDE.md (how to build effects, recipes, art direction).
