# Evolution VFX: integration guide

Handoff for whoever wires the evolution effects into `survivors.html`. It has two parts:
- **Part 1:** how the merge effects are already wired, to use as the reference.
- **Part 2:** exactly where and how to wire the Phase B ability effects.

**Runtime integration is implemented** in `survivor-evolution-fx.js`, including
simulation-clock animation, sprite limits, reset and reduced motion. After exporting
or replacing ability PNGs, run `python3 scripts/build-ui-assets.py --manifest-only`,
then `node scripts/check-evolution-fx.cjs`. The manifest builder reports and skips
missing or completely transparent ability sheets; these must be fixed before the
full visual check can pass. Available pool loops can render while their start/end
exports are pending; pools without a usable loop retain their geometric fallback.

Also read:
- The design brief, `docs/superpowers/specs/2026-10-01-evolution-vfx-ui.md`.
- `UI_STYLE_GUIDE.md` → "Evolution merge and bestiary".
- `assets/fx/README.md` → "Evolution merge" and "Evolution abilities".

## Ground rules (these break things if ignored)

1. **Presentation never touches the sim.**
   - Don't write to `zones`, `projectiles`, `links`, `casts`, `fx`, enemies, the player or any timer.
   - Don't call `scene.rand()`, `Math.random()`, `scene.burst()` or `camera.shake()`. `burst` and `shake` both draw from `Math.random`.
   - For cosmetic randomness, use `scene.juice.rand()`.
   - `check-juice` compares full run logs with juice on and off, and any leak fails it.
2. **World effects freeze with combat.**
   - Drive ability-effect frames from **sim time** (`scene.elapsed`, or a zone's `total - life`), not `juice.now()`.
   - Sim time stops while paused, in menus and during hit-stop. Wall-clock time does not.
   - `juice.play()` runs on wall-clock time. It's fine for UI and short merge beats, but not for ability effects.
3. **Restart clears everything.** `scene.start()` → `resetState()` rebuilds `SurvivorCreatures`, which empties the sim collections. Anything you keep yourself must clear too, either by keying off the sim objects or by hooking `juice.reset()`.
4. **Layering.**
   - Ground pools and rings go under actors: `setDepth(y - 3)`.
   - Projectiles go at about `y + 25`.
   - Flashes and impacts go above actors: `y + 40`, or `800000000` for "always on top".
   - Actors use `y + 20`.
5. **Bounded counts.** The sim already caps:
   - ground effects: 8 per source;
   - Tengu projectiles: 40;
   - lightning links: 64;
   - delayed strikes: 8.

   Pool your sprites to match, and coalesce contact sparks: at most one per enemy per 100ms, and no more than 12 alive.
6. **Reduced motion** is `scene.juice.reduced`. Under it, use no flashes, shakes or spins: show the loop and fades only.
7. **No text over the map.** Use visuals and numbers only. The full rule is in `UI_STYLE_GUIDE.md`.
8. **Ink and fire must read differently from hostile warnings.** Friendly ink and fire are filled, textured pools. Hostile warnings are orange outlines and wind-up lines, so don't use outline-only orange rings for friendly effects.

## How sheets reach the game

1. Pixel Composer `.pxc` sources are built by `scripts/pixelcomposer/build_*.py`.
2. The user exports each one to `assets/fx/sheets/<Name>.png`, with `<Name>.json` beside it. The JSON gives frame size, count, fps, loop and anchor.
3. Add `<Name>` to `FX_FROM_JSON` in `scripts/build-ui-assets.py:22`. Do this only once its PNG exists: a manifest entry with no PNG is a load error.
4. Run `python3 scripts/build-ui-assets.py`. This regenerates `survivor-fx-manifest.js`, a `window.FX_SHEETS` entry per sheet.
5. `survivors.js:56` loads every manifest entry as an image, so there's nothing to add in `preload`.
6. Frames are cut on demand:
   - `juice.frameName(key, i)` for sprites;
   - `juice.frameRect(key, i)` for `ui.image`;
   - `juice.frameAt(key, ms, loop)` turns elapsed milliseconds into a frame index;
   - `juice.meta(key)` returns `{fw, fh, n, fps, loop, ax, ay}`.
7. Bump the `?v=` query on every script tag in `survivors.html` whenever a script changes. It's currently `v=44`.

## Part 1: merge effects (done, for reference)

| Piece | Where |
|---|---|
| Capture choice panel | `SurvivorScreens.merge()` in `survivor-screens.js`. Its card rects go in `screens.layout.merge` (ui2x space, fit-scaled). |
| Merge sequence | `SurvivorJuice.onMergeOffer` / `onMerge` / `updateMerge` / `skipMerge` in `survivor-juice.js`. Timeline comment above `partySprite()`. |
| Sheets used | `Merge_Trail` (world 3x, per-parent tint), `Merge_Core`, `Merge_Reveal`, `Merge_Ring` (world 3x, result tint), `Evolved_Slot_Glow` (UI 2x on the slot) |
| Party slot reveal | `juice.slotFace(type)` / `slotFill(type)`, read by `SurvivorHud.partyBar()`. |
| First-discovery panel | `SurvivorScreens.evolved()` uses `Recipe_Discovered` behind the portrait. It's opened by `juice.realtime()` → `scene.openEvolved()`. |
| Bestiary | `SurvivorScreens.bestiary()`, drawn from `title()` while `scene.bestiaryOpen`. |
| Element tints | `ELEMENT_TINT` in `survivor-juice.js:5` (mollusc, octopus, reptile, tengu, axolotl included) → `juice.elementTint(type)`. |
| Tests | `scripts/check-evolution-ui.cjs` (screens to `output/evolution-ui/`), `scripts/check-evolution.cjs` |

The merge sequence uses `juice.play` and wall-clock time on purpose: the sim is already frozen (`juice.freeze(1500)`) while it plays.

## Part 2: ability effects (Phase B)

### Architecture

Create one presentation module, **`survivor-evolution-fx.js`**, with this shape:

```js
class SurvivorEvolutionFx {
  constructor(s)        // listens to s.events 'reward' for kind === 'abilityfx'
  reset()               // drop one-shots, hide pooled sprites
  draw()                // called once per frame after creatures.draw()
}
```

1. **Load and construct it.**
   - Add its `<script>` after `survivor-evolution.js` in `survivors.html`.
   - Construct it once in `survivors.js` `create()`, next to `this.juice`, as `this.evoFx = new SurvivorEvolutionFx(this)`.
   - Call `this.evoFx.reset()` from `juice.reset()`, or call both in `start()`.
2. **Hook the draw.** In `survivors.js` `draw()`, line ~448, after `this.creatures.draw()`, call `this.evoFx.draw()`.
3. **Retire the placeholder drawing.**
   - In `SurvivorEvolution.draw()` (`survivor-evolution.js:135`), drop the Graphics placeholder for anything the new module draws: the zone disks, links, cast circles and sweep/ring arcs.
   - Keep the projectile `setPosition`/`setDepth` line. That's the sim placing its own pooled sprites.
   - Leave a `if (!s.evoFx) …` fallback only if you want the old look when the module is absent.

**Why one module?** The sim file stays logic-only, and the module can be switched off and checked for determinism like the juice. All pooling and budgets live in one place.

### Two input sources

- **Continuous state.** Read it every frame and never mutate it.
  - `ev.zones`, each `{type:'ink'|'fire', source, x, y, r, life, total}`:
    - start loop: `total - life < 0.2`;
    - end loop: `life < 0.25`;
    - otherwise loop.
    - Pick each sprite's frame from `total - life`, which is sim time.
  - `ev.projectiles`, each `{x, y, dx, dy, life, sprite}`: Tengu feathers. Swap `p.sprite`'s texture/frame to `Tengu_Feather` and keep the rotation.
  - `ev.links`, each `{x, y, tx, ty, life}` (life starts at 0.25): stretch `Lightning_Link` between the endpoints.
  - `ev.casts`, each `{x, y, r, time}` (time counts down from 0.65): draw `Thunder_Warning`. When a cast vanishes, play the strike.
  - `ev.fx`, each `{type:'sweep'|'ring', x, y, angle, r, arc, rear, life, total}`: `sweep` uses `Tentacle_Sweep`, `ring` uses `Bubble_Break`.
- **One-shot events.** These arrive as `scene.events.on('reward', e => e.kind === 'abilityfx' && …)`.
  - On each event, record `{key, x, y, at: scene.elapsed, scale, rotation, tint}`.
  - Draw it with `frameAt(key, (scene.elapsed - at) * 1000, false)`. Drop it once the last frame has passed.

These are the existing events (`e.creature`, `e.effect`, `e.x`, `e.y`, plus `radius` or `angle`):
- octopus `sweep`;
- reptile `bite`;
- axolotl `shield`;
- axolotl `shieldbreak`.

Add the missing events in `survivor-evolution.js`. Each is one `s.reward('abilityfx', {...})` call, which emits only and changes nothing:

| New event | Put it in | Payload |
|---|---|---|
| `{creature:'reptile', effect:'charge'}` | end of `charge()` (line 90) | `x, y, angle: Math.atan2(a.dy, a.dx), followup` |
| `{creature:'reptile', effect:'detonate'}` | `bite()`, inside `if(st.explode&&burning)` (line 91) | `x: e.x, y: e.y, radius: 75` |
| `{creature:'tengu', effect:'strike'}` | `update()` cast resolution (line 125), where `c.time <= 0` | `x: c.x, y: c.y, radius: c.r` |
| `{creature:'tengu', effect:'spark'}` | `update()` feather-hit loop, after `s.hit(e, p.stats.damage, 'tengu', p)` | `x: e.x, y: e.y` (coalesce in the renderer) |
| `{creature:'octopus', effect:'inked'}` | `sweep()`, when `e.inkUntil > s.elapsed` | `x: e.x, y: e.y` (coalesce) |
| `{creature:'axolotl', effect:'rally'}` | `shieldBlock()`, where `this.haste = 3` | `x, y` of the player |
| `{creature:'mollusc' or 'octopus' or 'axolotl', effect:'ink'}` | `zone()`, when `type === 'ink'` | `x, y, radius: r` (landing splat) |

`check-evolution.cjs` asserts gameplay, not events, so adding these is safe. Run `check-juice` and `check-determinism` afterwards anyway.

### Scaling sheets to gameplay geometry

Each Phase B JSON adds `"visible_w"`: the pixel width of the visible effect inside the frame. Scale to the gameplay size like this:

```js
const scale = (2 * radius) / meta.visible_w;  // circular / 3:2 ground effects: radius is the world hit radius
```

- `Tentacle_Sweep` is authored pointing right (0°) with its pivot at the anchor. Use `setRotation(angle)` and scale by `r / visible_w`.
- For the rear sweep, draw a second copy rotated by `angle + Math.PI`.
- `Lightning_Link`: set `setOrigin(0, 0.5)`, `setRotation(atan2(ty - y, tx - x))`, `setScale(dist / fw, 2)`. Fade it by `life / 0.25`.

### Effect map

Each row says what plays, when, where and how.

| Effect | Sheet(s) | Trigger / source | Depth | Tint |
|---|---|---|---|---|
| Ink landing | `Ink_Splat` | `abilityfx ink` | y−3 | none (purple art) |
| Ink pool (Mollusc, Octopus, Axolotl) | `Ink_Pool_Start` → `_Loop` → `_End` | each `ev.zones` with `type==='ink'` | y−3 | none |
| Tentacle sweep, plus rear | `Tentacle_Sweep` | `ev.fx` `type==='sweep'`, frame from `total - life` | y+40 | `0xccafff` |
| Inked hit | `Ink_Hit` | `abilityfx inked` | y+40 | none |
| Reptile charge start / second charge | `Charge_Kick` | `abilityfx charge`; `followup` → scale ×0.7 | y−3 | none (fire art) |
| Burning ground | `Fire_Pool_Start` → `_Loop` → `_End` | each `ev.zones` with `type==='fire'` | y−3 | none |
| Heavy bite | `Bite_Impact` (fangs snap, hold, fade; 0.6s) | `abilityfx bite`, drawn at a fixed 3x (not scaled to radius 70) | y+40 | none |
| Burning detonation | `Fire_Detonate` | `abilityfx detonate`, radius 75 | y+40 | none |
| Tengu feather | `Tengu_Feather` (loop) | each `ev.projectiles[i].sprite` | y+25 | `0x9ce9ff` |
| Lightning link | `Lightning_Link` (loop) | each `ev.links` | 800000000 | `0x9beaff` |
| Contact spark | `Zap_Spark` | `abilityfx spark` (coalesced) | y+40 | `0x9beaff` |
| Thunder warning | `Thunder_Warning` (loop) | each `ev.casts` | y−3 | `0x9beaff` |
| Thunder strike | existing `elementThunder` texture | `abilityfx strike` | y+40 | `0x9beaff` |
| Axolotl shield pulse | `Bubble_Pulse` | `abilityfx shield` | y+40 | `0xa1dbef` |
| Bubble break ring | `Bubble_Break` | `ev.fx` `type==='ring'` (radius `r`) | y−3 | `0xa1dbef` |
| Rally | `Rally_Motes` (loop) | while `ev.haste > 0`, on the player | y+25 | none (gold art) |

**Evolved dashes** need no extra sheets. `dashEnd()` already calls `sweep`, `zone('fire')`, `lightning`, `ink` and `shield`, so the effects above appear on their own.

### Tests to add (`scripts/check-evolution-fx.cjs`, then add to `scripts/test-survivors.cjs`)

- **Each effect starts:** for each row of the map, force the trigger the same way `check-evolution.cjs` does (`ev.sweep(a, 0)`, `ev.charge(...)`, `ev.feather(...)`, `ev.shieldBlock()` …), draw, and assert the module has a visible sprite with the expected texture key.
- **Freezing:** set `s.mode = 'paused'`, wait 300ms real time, and assert the frame indices didn't change.
- **Restart:** `s.start()` leaves no visible module sprites.
- **Budgets:** at most 12 sparks after a 40-feather volley. Pool sizes stop growing after repeated volleys.
- **Determinism:** run `check-juice` and `check-determinism` unchanged.
- **Reduced motion:** no `Zap_Spark` or `Bite_Impact` flashes; pools still draw.
- **Screenshots** to `output/evolution-fx/` at desktop and phone sizes. Look at the ground pools against both grass and desert.
