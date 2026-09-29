# UI Foundation (Reward Juice Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move `survivors.html` to a fixed 540×960 portrait canvas with every piece of UI drawn at 2x in the Pixelarium DarkMode style: new HUD (status frame, relic row with shrine sockets, party bar), and restyled title, pause, won/lost, level-up and relic-choice screens. No gameplay changes.

**Architecture:** All survivors UI is laid out in *logical* coordinates (270×480 portrait, 480×320 landscape) inside one `NativeView` group scaled ×2 (`UI = 2`). The world camera is untouched, so the game world stays at game scale. DarkMode pieces are thin helpers on the existing `NativeView` (`darkText`, `pill`, `card`, `darkPanel`, `banner`, `notice`), reusing the generic nine-slice `WoodPanel`/`WoodButton` classes with DarkMode textures and the NovelMix font. The HUD moves to a new `survivor-hud.js`, and full-screen menus move to a new `survivor-screens.js`. The migration is incremental: old 1x screens keep working until their task converts them, so the suite stays green after every task.

**Tech Stack:** Phaser 4.2.1 (`vendor/phaser-4.2.1.min.js`), plain browser JS (IIFE modules on `window`), Playwright 1.58 check scripts (`scripts/check-*.cjs`, run by `npm run test:survivors`), Python 3 + Pillow for asset preparation.

**Spec:** `docs/superpowers/specs/2026-09-28-reward-juice-design.md` (Phase 1 only). Reference prototype: https://claude.ai/artifact/VgjShiA626rZqRpsRNAAYL.

## Global Constraints

- Portrait canvas is a fixed **540×960**; landscape stays **960×640**; keep `Phaser.Scale.FIT`, never `EXPAND`.
- UI is drawn at 2x: logical space is **270×480** portrait and **480×320** landscape. Every UI coordinate in new code is logical.
- Font: NovelMix `assets/ui/font_medium_9px.ttf` (Phaser key `NovelMix`), sizes **9 or 18 only**. `darkText` throws on any other size.
- Raster UI art is drawn at whole-number scale: nine-slices, status frame, party slot and heart at 2 (logical), banner, icons and facesets at 1 or 2 (logical).
- Presentation never changes the simulation: UI code only reads state, never calls `this.rand()`, never changes `STEP`/`elapsed`.
- Every existing survivor check must still pass with the same asserted numbers. No balance constant changes in Phase 1.
- `legacy.html`/`game.js` keep Theme Wood. Changes to `WoodButton` in `phaser-ui.js` must be additive: `npm run test:ui` must still pass.
- The working tree contains unrelated uncommitted art (`.DS_Store`, `assets/fx/pixelcomposer/*`, new `assets/fx/sheets/*`). **Never `git add -A` or `git add .`**; stage only the paths each task lists.
- Palette: ink `#120a1a`, text `#ffffff`, muted `#b9b0d0`, gold `#ffc41b`, teal `#2dc5c0`, danger `#ef5266`.

## Decisions this plan makes where the spec was silent or the code disagreed

Tell the user about these in the execution report:

1. **2x via a scaled root group, not a second camera.** Same result (logical coordinates, world untouched), with no per-object camera ignore lists. Task 6 updates the spec wording.
2. **No coins exist in survivors runs.** The HUD slot the spec gives to coins shows the **kill count** with the Ninja Adventure sword icon until a currency exists.
3. **Dash stays a dedicated button** (a DarkMode `Dash` pill above the right end of the party bar; Space/Shift still work). The player's party slot is not tappable; its charge bar only *shows* the dash cooldown. The dash-style toggle becomes a small pill above the left end of the party bar, shown only when there's more than one style. (User decision 2026-09-28: tapping the player portrait to dash is rejected.)
4. **Creature slots show a full charge bar** in Phase 1. Live per-creature attack timers come with Phase 2 juice.
5. **Pause gets a small `II` pill** in the top-right corner, with the timer right-aligned just left of it.
6. **The title screen is static in Phase 1.** Its juice (menu pan, logo slam, iris) is not assigned to any phase in the spec.
7. **Notices use a wrapped DarkMode panel**, not the 200px toast art, because existing notices run up to ~65 characters.

## Review Focus

1. **Text overflowing at 2x.** Long notices, capture labels near a screen edge, relic names and banners must stay inside the canvas in portrait and landscape. Covered by `offscreenTexts` in Tasks 3, 4 and 5.
2. **HUD taps leaking into movement.** Tapping the pause pill or the Dash pill must not start the touch joystick. Covered in Tasks 1 and 3.
3. **Landscape fit (480×320 logical).** Title, pause with 13 relics, level-up and relic choice all have to fit 320 logical px of height. Covered in Tasks 4 and 5.
4. **13 relic stacks in the HUD.** The relic row wraps to a second line instead of running off the right edge. Covered in Task 3.
5. **A party member with no faceset texture.** The slot falls back to the creature's walk sprite, and never throws. Covered in Task 3.

---

## File structure

| File | Status | Responsibility |
|---|---|---|
| `scripts/build-ui-assets.py` | create | Crops DarkMode/Zelda-Like/Tiny Dungeons art from `~/Downloads` into `assets/ui/darkmode/` and `assets/icons/relics/`. Re-runnable. |
| `assets/ui/darkmode/*.png` | create (generated) | `panel`, `slot`, `pill`, `banner`, `status`, `zslot`, `heart` |
| `assets/icons/relics/<relicId>.png` | create (generated, 3 already copied) | One 256×16 16-frame spin strip per relic id |
| `phaser-ui.js` | modify | `WoodButton` font/align/hover options; `NativeView` DarkMode helpers |
| `survivor-hud.js` | create | `SurvivorHud`: status frame, kills, timer, pause pill, relic row + sockets, party bar, notices, guardian bar, world-anchored labels |
| `survivor-screens.js` | create | `SurvivorScreens`: title, pause (+relic collection), won/lost, level-up choice, relic choice |
| `survivors.js` | modify | 540×960 config, `UI` constant, preload of new art, `toUI`, draw() wiring, joystick guard, removal of old HUD/screens |
| `survivor-expansion.js` | modify | Export roster, remove Dash buttons and the dead `bestiary` screen/`starterGrid` |
| `survivor-expedition.js`, `survivor-encounters.js`, `survivor-creatures.js`, `survivor-relics.js` | modify | Remove their `drawUI`/`ui` label code (moved to the HUD/screens) |
| `survivors.html` | modify | New script tags, cache-bust `?v=27` |
| `scripts/survivor-test-utils.cjs` | modify | `controlPoint`, `listControls`, `clickButton` via world transforms; `offscreenTexts` |
| `scripts/check-ui-foundation.cjs` | create | Phase 1 checks and screenshots into `output/ui-foundation/` |
| `scripts/test-survivors.cjs` | modify | Register `ui-foundation` |
| `scripts/check-survivors.cjs`, `check-survivor-reliability.cjs`, `check-expedition.cjs`, `check-entrypoints.cjs`, `check-starter-grid.cjs`, `check-capture-choice.cjs` | modify | Use the new helpers and new labels |
| `UI_STYLE_GUIDE.md` | modify | DarkMode for survivors; Theme Wood kept for legacy |

---

### Task 0: Branch and baseline

**Files:**
- Commit: `docs/superpowers/specs/2026-09-28-reward-juice-design.md`, `assets/fx/VFX_REQUESTS.md`, `assets/fx/ShrineStates.png`, `assets/icons/relics/{resonance,drum,veil}.png`, `docs/superpowers/plans/2026-09-28-ui-foundation.md`

- [ ] **Step 1: Create the branch** (uncommitted art carries over untouched)

```bash
git switch -c feat/ui-foundation
```

- [ ] **Step 2: Record the baseline**

Run: `npm run test:survivors 2>&1 | tee output/phase1-baseline.txt | tail -3`
Expected: `Survivors: 17/17 checks passed.`

Also run: `npm run test:ui 2>&1 | tail -3` and note the result as the legacy baseline.

- [ ] **Step 3: Commit the design docs and prepared icons**

```bash
git add docs/superpowers/specs/2026-09-28-reward-juice-design.md assets/fx/VFX_REQUESTS.md assets/fx/ShrineStates.png assets/icons/relics/resonance.png assets/icons/relics/drum.png assets/icons/relics/veil.png docs/superpowers/plans/2026-09-28-ui-foundation.md
git commit -m "docs: reward juice spec, VFX brief and Phase 1 plan"
```

---

### Task 1: Transform-aware test helpers and a joystick guard

Behavior-neutral groundwork. After this task the tests find and tap buttons through their world transform (so they keep working once buttons live in a ×2 group), and a tap on any interactive UI object can never start the touch joystick.

**Files:**
- Modify: `scripts/survivor-test-utils.cjs`
- Create: `scripts/check-ui-foundation.cjs`
- Modify: `scripts/test-survivors.cjs` (tests array)
- Modify: `scripts/check-survivors.cjs:28-32`, `scripts/check-survivor-reliability.cjs:22-36`
- Modify: `survivors.js:69` (pointerdown handler)

**Interfaces:**
- Produces (test utils): `controlPoint(page, label) → Promise<{x,y}>` (page coordinates), `listControls(page) → Promise<Array<{label,x,y}>>` (page coordinates, visible + enabled only), `clickButton(page, label, {touch=false}={})`, `offscreenTexts(page) → Promise<string[]>` (labels of visible Text whose world bounds leave the canvas).
- Produces (game): joystick starts only when the pointer is over no interactive object.

- [ ] **Step 1: Add the helpers to `scripts/survivor-test-utils.cjs`**

Replace the existing `clickButton` function and the `module.exports` line with:

```js
// Every UI control is found through its world transform, so scaled groups (the 2x UI) map correctly.
const BROWSER_HELPERS = `
  window.__uiShown = o => { for (let n = o; n; n = n.parentContainer) if (!n.visible) return false; return true; };
  window.__uiControls = () => {
    const s = __survivorTest.scene, out = [];
    s.ui.walk(o => {
      if (o.type === 'WoodButton' && o.input?.enabled && __uiShown(o)) {
        const p = o.getWorldTransformMatrix().transformPoint(0, 0);
        out.push({label: o.label.getData('label'), x: p.x, y: p.y});
      }
    });
    return {controls: out, width: s.scale.width, height: s.scale.height};
  };
  window.__uiTexts = () => {
    const s = __survivorTest.scene, out = [];
    s.ui.walk(o => {
      if (o.type !== 'Text' || !__uiShown(o) || !o.text) return;
      const m = o.getWorldTransformMatrix(), x0 = -o.originX * o.width, y0 = -o.originY * o.height;
      const a = m.transformPoint(x0, y0), b = m.transformPoint(x0 + o.width, y0 + o.height);
      out.push({text: o.text, left: Math.min(a.x, b.x), right: Math.max(a.x, b.x), top: Math.min(a.y, b.y), bottom: Math.max(a.y, b.y)});
    });
    return {texts: out, width: s.scale.width, height: s.scale.height};
  };`;
async function installHelpers(page) { await page.evaluate(BROWSER_HELPERS); }
async function toPage(page, point, size) {
  const c = await page.locator('canvas').boundingBox();
  return {x: c.x + point.x * c.width / size.width, y: c.y + point.y * c.height / size.height};
}
async function listControls(page) {
  await installHelpers(page);
  const {controls, width, height} = await page.evaluate(() => __uiControls());
  return Promise.all(controls.map(async c => ({label: c.label, ...(await toPage(page, c, {width, height}))})));
}
async function controlPoint(page, label) {
  const found = (await listControls(page)).find(c => c.label === label);
  if (!found) throw Error('Visible button missing: ' + label);
  return found;
}
async function clickButton(page, label, {touch = false} = {}) {
  const p = await controlPoint(page, label);
  if (touch) await page.touchscreen.tap(p.x, p.y); else await page.mouse.click(p.x, p.y, {delay: 30});
}
async function offscreenTexts(page) {
  await installHelpers(page);
  const {texts, width, height} = await page.evaluate(() => __uiTexts());
  return texts.filter(t => t.left < -0.5 || t.top < -0.5 || t.right > width + 0.5 || t.bottom > height + 0.5).map(t => t.text);
}
module.exports = {gameURL, launchOptions, clickButton, controlPoint, listControls, offscreenTexts, run};
```

- [ ] **Step 2: Write the failing joystick test in a new `scripts/check-ui-foundation.cjs`**

```js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {chromium} = require('playwright');
const {gameURL, launchOptions, controlPoint, listControls, offscreenTexts} = require('./survivor-test-utils.cjs');

async function open(browser, viewport, path = 'survivors.html?test', mobile = false) {
  const page = await browser.newPage({viewport, isMobile: mobile, hasTouch: mobile}), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.addInitScript(() => window.__vt_pending = true);
  await page.goto(gameURL(path));
  await page.waitForFunction(() => window.__phaserReady);
  page.errors = errors;
  return page;
}
const state = (page, fn, arg) => page.evaluate(fn, arg);

(async () => {
  fs.mkdirSync('output/ui-foundation', {recursive: true});
  const browser = await chromium.launch(launchOptions);
  try {
    // --- joystick guard: tapping a control during play never starts movement ---
    const phone = await open(browser, {width: 390, height: 844}, 'survivors.html?trial&test', true);
    await state(phone, () => { const s = __survivorTest.scene; s.start(); s.spawnTimer = 999; s.draw(); });
    const pause = (await listControls(phone)).find(c => /pause|^II$/i.test(c.label));
    assert(pause, 'A pause control is visible during play');
    await phone.touchscreen.tap(pause.x, pause.y);
    assert.equal(await state(phone, () => __survivorTest.scene.mode), 'paused');
    assert.equal(await state(phone, () => __survivorTest.scene.joy), null, 'Tapping pause does not start the joystick');
    assert.deepEqual(phone.errors, []);
    await phone.close();
    console.log('PASS: UI foundation');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
```

Register it: in `scripts/test-survivors.cjs`, append `'ui-foundation'` to the `tests` array (after `'survivor-reliability'`).

- [ ] **Step 3: Run it against the current code**

For fast loops, start a static server once in a second terminal and leave it running for the whole plan:

```bash
python3 -m http.server 5174 --bind 127.0.0.1
```

Run: `GAME_URL=http://127.0.0.1:5174/ node scripts/check-ui-foundation.cjs`
Expected: PASS. Today's code only avoids the joystick through hard-coded screen regions (`p.y>85` and the old Dash corner), which happen to cover the old Pause button. Those regions are wrong as soon as Task 3 moves the controls; Task 3's Dash pill test is the one that fails without the guard below. This test pins the pause case so the guard never regresses it.

- [ ] **Step 4: Guard the joystick in `survivors.js:69`**

Replace:

```js
      this.input.on('pointerdown',p=>{if(this.mode==='playing'&&p.y>85&&!this.joy&&!(p.x>this.scale.width-120&&p.y>this.scale.height-145))this.joy={id:p.id,x:p.x,y:p.y,dx:0,dy:0};});
```

with:

```js
      // Any interactive UI object under the pointer owns the press; only bare field starts movement.
      this.input.on('pointerdown',(p,over)=>{if(this.mode==='playing'&&!over.length&&!this.joy)this.joy={id:p.id,x:p.x,y:p.y,dx:0,dy:0};});
```

- [ ] **Step 5: Move two tests onto the helpers**

In `scripts/check-survivors.cjs` replace lines 27-32 (the `const upgrade=await mobile.evaluate(...)` block and the tap) with:

```js
 const upgrade=await mobile.evaluate(()=>{const s=__survivorTest.scene;s.xp=s.xpNeeded();s.checkLevel();s.draw();const choice=s.choices[0];return {id:choice.id,before:s.upgrades[choice.id]||0,label:'1. '+choice.name};});
 const point=await controlPoint(mobile,upgrade.label);
 await mobile.touchscreen.tap(point.x,point.y);
```

and add `controlPoint` to that file's `require('./survivor-test-utils.cjs')` destructuring (`const {gameURL, run, controlPoint} = ...`; match the existing require line).

In `scripts/check-survivor-reliability.cjs` replace the `controls` and `click` helpers (lines 22-37) with:

```js
      const controls = () => listControls(page);
      const click = async (x, y) => { if (mobile) await page.touchscreen.tap(x, y); else await page.mouse.click(x, y, { delay: 60 }); };
      const clickCanvas = async (x, y) => {
        const box = await page.locator('canvas').boundingBox();
        const size = await page.evaluate(() => ({ w: __survivorTest.scene.scale.width, h: __survivorTest.scene.scale.height }));
        await click(box.x + x * box.width / size.w, box.y + y * box.height / size.h);
      };
```

change `await click(oldHistoryPosition.x, oldHistoryPosition.y);` to `await clickCanvas(oldHistoryPosition.x, oldHistoryPosition.y);`, leave `await click(buttons[0].x, buttons[0].y);` (now page coordinates), and add `listControls` to its require.

- [ ] **Step 6: Run the new check and the suite**

Run: `GAME_URL=http://127.0.0.1:5174/ node scripts/check-ui-foundation.cjs`
Expected: `PASS: UI foundation`

Run: `npm run test:survivors 2>&1 | tail -3`
Expected: `Survivors: 18/18 checks passed.`

- [ ] **Step 7: Commit**

```bash
git add scripts/survivor-test-utils.cjs scripts/check-ui-foundation.cjs scripts/test-survivors.cjs scripts/check-survivors.cjs scripts/check-survivor-reliability.cjs survivors.js
git commit -m "test: transform-aware UI helpers; joystick ignores taps on controls"
```

---

### Task 2: DarkMode assets, NovelMix font and NativeView helpers

**Files:**
- Create: `scripts/build-ui-assets.py`
- Create (generated): `assets/ui/darkmode/{panel,slot,pill,banner,status,zslot,heart}.png`, `assets/icons/relics/{boots,stone,ricochet,repulsion,slipstream,bloodroot,pack,echo,hunter,spite}.png`
- Modify: `phaser-ui.js` (WoodButton options, NativeView helpers)
- Modify: `survivors.js` (preload, `FACESETS`, `RELIC_IDS`)
- Test: `scripts/check-ui-foundation.cjs` (add a components block)

**Interfaces:**
- Consumes: `controlPoint`, `listControls` from Task 1.
- Produces (textures): `dk_panel` (32×32, slice 5), `dk_slot` (22×22, slice 5), `dk_pill` (20×11, slice 3), `dk_banner` (192×32), `dk_status` (83×35), `dk_zslot` (31×24), `dk_heart` (9×8), `killIcon` (6×11), `face_<type>` for `walker,cat,owl,beast,frog,mouse,mole,bear,salamander,spider,storm` (38×38), `relic_<id>` (256×16 strip) for all 13 relic ids.
- Produces (`NativeView` methods, all coordinates in the current group's space):
  - `darkText(value, x, y, {size=9, color='#ffffff', align='left', outline=true, wrap=0, id}={}) → Phaser.GameObjects.Text` (origin y 0.5; throws if `size % 9`)
  - `darkPanel(x, y, width, height) → WoodPanel`
  - `pill(label, x, y, width, height, action, {color='#ffffff', id}={}) → WoodButton`
  - `card(label, x, y, width, height, action, {detail, icon, iconFrame=[0,0,16,16], color='#ffffff', size=9, align='left', id}={}) → WoodButton`
  - `banner(text, centerX, y) → void` (192×32 ink banner, 18px text)
  - `notice(text, centerX, y, maxWidth) → {height}` (wrapped 9px text on a dark panel)
- Produces (`WoodButton.layout` options): `font` (default `'NinjaPixel'`), `hoverTint` (default `0xffe4b8`), `align` (`'center'`|`'left'`), `labelX` (left padding when `align:'left'`), `labelY` (vertical offset).

- [ ] **Step 1: Write the asset script `scripts/build-ui-assets.py`**

```python
#!/usr/bin/env python3
"""Copy the DarkMode UI pieces and relic spin icons the survivors UI uses into the repo.

Sources are the purchased packs in ~/Downloads. The licenses allow shipping the art inside
the game but not redistributing the packs, so only the used crops are copied.
"""
from pathlib import Path
from PIL import Image

HOME = Path.home() / 'Downloads'
PIX = HOME / 'Pixelarium - Interfaces Bundle - Full version/Pack Content'
DARK = PIX / 'DarkMode Interface'
ZELDA = PIX / 'Zelda-Like Interface'
TINY = HOME / 'Tiny Dungeons - Items Pack/Tiny Dungeons - Items Pack/items/procedural_animations'
ROOT = Path(__file__).resolve().parent.parent
NINJA = ROOT / 'assets/Ninja Adventure - Asset Pack/Items'
UI_OUT = ROOT / 'assets/ui/darkmode'
ICON_OUT = ROOT / 'assets/icons/relics'

CROPS = {  # output name: (source, crop box or None)
    'panel': (DARK / 'Dialogue interfaces/spr_dialogue_box_withoutstartingpoint_9slice.png', (5, 5, 37, 37)),
    'slot': (DARK / 'Player interface/Player Status/spr_item_slot.png', None),
    'pill': (DARK / 'Dialogue interfaces/spr_dialogue_box_button.png', (1, 1, 21, 12)),
    'banner': (DARK / 'GameplayHud/spr_banner_hud.png', None),
    'status': (DARK / 'Player interface/Player Status/single size player status/spr_player_status_version1.png', None),
    'zslot': (ZELDA / 'Player interface/Player Status/item slots/spr_item_slot_single_charge_zeldalike.png', (0, 0, 31, 24)),
    'heart': (ZELDA / 'Player interface/Player Status/spr_player_healthbar.png', (36, 0, 45, 8)),
}
# relic id -> Tiny Dungeons strip. resonance, drum and veil are hand-made and already in ICON_OUT.
RELIC_STRIPS = {
    'boots': 'armor_01_v2_boots', 'stone': 'monster_loot_desert_sand_giant', 'ricochet': 'jewel_sapphire',
    'repulsion': 'ring_02', 'slipstream': 'armor_02_v2_chestplate', 'bloodroot': 'ring_03',
    'echo': 'monster_loot_snow_boar', 'hunter': 'key_hell_chest_big', 'spite': 'food_01',
}

def main():
    UI_OUT.mkdir(parents=True, exist_ok=True)
    ICON_OUT.mkdir(parents=True, exist_ok=True)
    for name, (src, box) in CROPS.items():
        im = Image.open(src).convert('RGBA')
        (im.crop(box) if box else im).save(UI_OUT / f'{name}.png')
    for relic, strip in RELIC_STRIPS.items():
        Image.open(TINY / f'{strip}.png').convert('RGBA').save(ICON_OUT / f'{relic}.png')
    # Pack Sigil uses the static Ninja Adventure stamp, centred in 16x16 and repeated to match the strip format.
    stamp = Image.open(NINJA / 'Other/Stamp.png').convert('RGBA')
    strip = Image.new('RGBA', (256, 16))
    for i in range(16):
        strip.alpha_composite(stamp, (i * 16 + (16 - stamp.width) // 2, (16 - stamp.height) // 2))
    strip.save(ICON_OUT / 'pack.png')
    for relic in ('resonance', 'drum', 'veil'):
        assert (ICON_OUT / f'{relic}.png').exists(), f'missing hand-made icon {relic}.png'
    print('wrote', sorted(p.name for p in UI_OUT.iterdir()), sorted(p.name for p in ICON_OUT.iterdir()))

if __name__ == '__main__':
    main()
```

- [ ] **Step 2: Generate and check the assets**

Run: `python3 scripts/build-ui-assets.py && python3 -c "from PIL import Image;import glob;[print(f,Image.open(f).size) for f in sorted(glob.glob('assets/ui/darkmode/*.png')+glob.glob('assets/icons/relics/*.png'))]"`
Expected sizes: banner (192,32), heart (9,8), panel (32,32), pill (20,11), slot (22,22), status (83,35), zslot (31,24), and all 13 relic strips (256,16).

- [ ] **Step 3: Write the failing component test**

In `scripts/check-ui-foundation.cjs`, insert this block before `console.log('PASS: UI foundation');`:

```js
    // --- DarkMode components render in a x2 group, hit-test correctly and enforce font sizes ---
    const desk = await open(browser, {width: 1100, height: 760});
    const comp = await state(desk, () => {
      const s = __survivorTest.scene, ui = s.ui;
      s.draw = () => {}; // freeze the scene's own UI so this test owns the display tree
      window.__pillHits = 0;
      ui.begin('component-test');
      ui.beginGroup('x2', {scale: 2});
      ui.darkPanel(10, 10, 200, 120);
      ui.banner('TEST', 110, 14);
      ui.pill('OK', 20, 60, 60, 20, () => window.__pillHits++);
      ui.card('Card title', 90, 56, 110, 40, () => {}, {detail: 'detail text', icon: 'relic_veil'});
      ui.darkText('hello', 20, 110, {size: 18});
      let threw = false; try { ui.darkText('bad', 0, 0, {size: 12}); } catch { threw = true; }
      ui.endGroup(); ui.end();
      const need = ['dk_panel','dk_slot','dk_pill','dk_banner','dk_status','dk_zslot','dk_heart','killIcon','face_walker','face_storm','relic_veil','relic_pack'];
      return {threw, missing: need.filter(k => !s.textures.exists(k)), font: document.fonts.check('9px NovelMix')};
    });
    assert.equal(comp.threw, true, 'darkText rejects sizes that are not multiples of 9');
    assert.deepEqual(comp.missing, [], 'All DarkMode textures load');
    assert.equal(comp.font, true, 'NovelMix is loaded');
    const ok = await controlPoint(desk, 'OK');
    await desk.mouse.click(ok.x, ok.y, {delay: 30});
    assert.equal(await state(desk, () => window.__pillHits), 1, 'A pill inside the x2 group is clickable');
    await desk.locator('canvas').screenshot({path: 'output/ui-foundation/components.png'});
    assert.deepEqual(desk.errors, []);
    await desk.close();
```

Run: `GAME_URL=http://127.0.0.1:5174/ node scripts/check-ui-foundation.cjs`
Expected: FAIL with `ui.darkPanel is not a function`.

- [ ] **Step 4: Extend `WoodButton` in `phaser-ui.js` (additive)**

In the `WoodButton` constructor, change the hover handler to use a per-button tint:

```js
      this.on('pointerover', () => { if (this.callback) this.panel.background.setTint(this.hoverTint ?? 0xffe4b8); });
```

Replace the label block inside `WoodButton.layout` (from `const signature = [label, options.size, ...` through the closing `}` of that `if`) with:

```js
      this.hoverTint = options.hoverTint;
      const font = options.font || 'NinjaPixel', align = options.align || 'center';
      const signature = [label, options.size, options.color, width, font, align].join('|');
      if (signature !== this.labelKey) {
        const shown = font === 'NinjaPixel' ? displayText(label) : String(label);
        this.label.setData('label',String(label)).setFontFamily(font).setText(shown).setFontSize(options.size).setColor(options.color);
        // Pixel fonts other than NinjaPixel are never squashed; their layouts must fit.
        this.label.setScale(font === 'NinjaPixel' ? Math.min(1,(width-16)/Math.max(1,this.label.width)) : 1, 1);
        this.labelKey = signature;
      }
      if (align === 'left') this.label.setOrigin(0, 0.5).setPosition(-width/2 + (options.labelX ?? 8), options.labelY ?? 0);
      else this.label.setOrigin(0.5).setPosition(0, options.labelY ?? 0);
```

- [ ] **Step 5: Add the DarkMode helpers to `NativeView` in `phaser-ui.js`**

Add above `class WoodPanel`:

```js
  // DarkMode (survivors) palette. NovelMix is a 9px pixel font: only 9 and 18 keep it on the pixel grid.
  const DARK = { font:'NovelMix', ink:'#120a1a', text:'#ffffff', muted:'#b9b0d0', gold:'#ffc41b', teal:'#2dc5c0', danger:'#ef5266' };
```

Add these methods inside `class NativeView`, after `reveal(...)`:

```js
    darkText(value,x,y,{size=9,color=DARK.text,align='left',outline=true,wrap=0,id}={}) {
      if (size % 9) throw Error('NovelMix sizes must be multiples of 9: ' + size);
      const object = this.object('DarkText',()=>new Phaser.GameObjects.Text(this.scene,0,0,'',{fontFamily:DARK.font,fontSize:9,color:DARK.text}),id);
      const signature = [value,size,color,outline,wrap].join('|');
      if (object.styleKey !== signature) {
        object.setData('label',String(value)).setFontSize(size).setColor(color).setStroke(DARK.ink,outline?2:0)
          .setWordWrapWidth(wrap||null).setLineSpacing(2).setText(String(value));
        object.styleKey = signature;
      }
      object.setOrigin(align==='center'?0.5:align==='right'?1:0,0.5).setPosition(x,y).setScale(1).setAlpha(1);
      return object;
    }
    darkPanel(x,y,width,height) { return this.panel('dk_panel',x,y,width,height,5,2); }
    pill(label,x,y,width,height,action,{color=DARK.text,id}={}) {
      return this.object('WoodButton',()=>new WoodButton(this.scene,this),id ?? `pill:${x},${y}`)
        .layout(label,x,y,width,height,{texture:'dk_pill',borderX:3,borderY:3,scale:2,size:9,color,font:DARK.font,hoverTint:0xd6cdec,action});
    }
    card(label,x,y,width,height,action,{detail,icon,iconFrame=[0,0,16,16],color=DARK.text,size=9,align='left',id}={}) {
      const labelX = icon ? 40 : 10;
      const button = this.object('WoodButton',()=>new WoodButton(this.scene,this),id ?? `card:${x},${y}`)
        .layout(label,x,y,width,height,{texture:'dk_slot',borderX:5,borderY:5,scale:2,size,color,font:DARK.font,hoverTint:0xd6cdec,
          align,labelX,labelY:detail?-height/2+12:0,action});
      if (icon) this.image(icon,x+8,y+(height-32)/2,32,32,{frame:iconFrame});
      if (detail) this.darkText(detail,x+labelX,y+25,{color:DARK.muted,wrap:width-labelX-10}).setOrigin(0,0);
      return button;
    }
    banner(text,centerX,y) {
      this.image('dk_banner',centerX-96,y,192,32);
      this.darkText(text,centerX,y+15,{size:18,align:'center'});
    }
    notice(text,centerX,y,maxWidth) {
      const label = this.darkText(text,centerX,0,{align:'center',wrap:maxWidth-20});
      const width = Math.min(maxWidth, Math.ceil(label.width)+20), height = Math.ceil(label.height)+12;
      this.darkPanel(centerX-width/2,y,width,height);
      label.setPosition(centerX,y+height/2).setDepth(this.parent.order++); // keep the text above its panel
      return {height};
    }
```

and change the export line to:

```js
  window.ScrollUI = { NativeView, WoodPanel, WoodButton, DARK };
```

- [ ] **Step 6: Load the art in `survivors.js`**

Near the top constants (after `const A = ...`), add:

```js
  const UI = 2; // every survivors UI element is laid out in logical space and drawn at 2x
  const FACESETS = {walker:'Characters/EggBoy',cat:'Animals/CatCyclop',owl:'Monsters/Arcane/Tier1/Owl',beast:'Monsters/Feral/Tier1/Beast',frog:'Animals/Frog',mouse:'Monsters/Arcane/Tier1/MouseBlack',mole:'Monsters/Bloom/Tier1/Mole',bear:'Monsters/Feral/Tier2/Bear',salamander:'Monsters/Feral/Tier1/Lizard',spider:'Monsters/Feral/Tier2/SpiderRed',storm:'Monsters/Feral/Tier1/Lizard2'};
  const RELIC_IDS = ['boots','stone','ricochet','repulsion','slipstream','bloodroot','pack','resonance','echo','drum','hunter','spite','veil'];
```

In `preload()`, before the `loaderror` line, add:

```js
      for(const k of ['panel','slot','pill','banner','status','zslot','heart'])this.load.image('dk_'+k,'assets/ui/darkmode/'+k+'.png');
      this.load.image('killIcon',A+'Items/Weapons/Sword/SpriteInHand.png');
      this.load.font('NovelMix','assets/ui/font_medium_9px.ttf');
      for(const [id,path] of Object.entries(FACESETS))this.load.image('face_'+id,A+'Actor/'+path+'/Faceset.png');
      for(const id of RELIC_IDS)this.load.image('relic_'+id,'assets/icons/relics/'+id+'.png');
```

- [ ] **Step 7: Run the check, the suite and the legacy UI test**

Run: `GAME_URL=http://127.0.0.1:5174/ node scripts/check-ui-foundation.cjs` → `PASS: UI foundation`
Open `output/ui-foundation/components.png`: a dark panel, an ink banner reading TEST, an OK pill, a card with the veil icon, and crisp doubled pixel text.
Run: `npm run test:survivors 2>&1 | tail -3` → `18/18`
Run: `npm run test:ui 2>&1 | tail -3` → same result as the Task 0 legacy baseline.

- [ ] **Step 8: Commit**

```bash
git add scripts/build-ui-assets.py assets/ui/darkmode assets/icons/relics phaser-ui.js survivors.js scripts/check-ui-foundation.cjs
git commit -m "feat(ui): DarkMode assets, NovelMix font and NativeView helpers"
```

---

### Task 3: 540×960 canvas and the new HUD

**Files:**
- Create: `survivor-hud.js`
- Modify: `survivors.js` (config, `toUI`, draw(), `captureLabel`, remove old top/bottom panels and the pickup/owl labels)
- Modify: `survivor-expedition.js:95-97` (drop `drawUI` body), `survivor-encounters.js:142-147` (drop `drawUI` body), `survivor-creatures.js:36` (drop `ui` body), `survivor-relics.js:56` (drop the `Relics:` bottom line only), `survivor-expansion.js` (`ui()` loses the Dash buttons)
- Modify: `survivors.html` (script tag, `?v=27`)
- Test: `scripts/check-ui-foundation.cjs`

**Interfaces:**
- Consumes: Task 2 helpers and textures.
- Produces: `window.SurvivorHud` class with `draw(w, h)` (logical size) and a `layout` object refreshed on every draw: `{slots:[{type,x,y,w,h}], relics:[{id,count,x,y}], sockets:[{x,y,armed}]}` (logical coordinates). Scene gets `this.hud`, `uiSize() → {w,h}` (logical) and `toUI(x, y) → {x,y}` (world → logical).
- The old `SurvivorExpedition.drawUI`, `SurvivorEncounters.drawUI` and `SurvivorCreatures.ui` become empty; the HUD owns their labels.

- [ ] **Step 1: Write the failing HUD tests**

Insert before `console.log('PASS: UI foundation');`:

```js
    // --- canvas size and HUD layout ---
    const tall = await open(browser, {width: 390, height: 844}, 'survivors.html?test', true);
    assert.deepEqual(await state(tall, () => ({w: __survivorTest.scene.scale.width, h: __survivorTest.scene.scale.height})), {w: 540, h: 960});
    await state(tall, () => { const s = __survivorTest.scene; s.start(); s.spawnTimer = 999; s.draw(); });
    let hud = await state(tall, () => __survivorTest.scene.hud.layout);
    assert.equal(hud.slots.length, 4, 'Party bar always has 4 slots');
    assert.equal(hud.slots[0].type, 'walker', 'Player is the first slot');
    assert.equal(hud.slots[1].type, 'cat', 'Starter follows the player');
    assert.equal(hud.sockets.length, 3, 'Three shrine sockets at the start of an expedition');
    // 13 relic stacks wrap inside the screen
    await state(tall, () => { const s = __survivorTest.scene; s.relics.equipped = ['boots','stone','ricochet','repulsion','slipstream','bloodroot','pack','resonance','echo','drum','hunter','spite','veil','veil']; s.draw(); });
    hud = await state(tall, () => __survivorTest.scene.hud.layout);
    assert.equal(hud.relics.length, 13);
    assert(hud.relics.every(r => r.x >= 0 && r.x + 20 <= 270), 'Relic row stays inside 270 logical px');
    assert.equal(hud.relics.find(r => r.id === 'veil').count, 2);
    // long notices wrap inside the screen; a party member without a faceset falls back
    await state(tall, () => { const s = __survivorTest.scene; s.announce('Bonus upgrade earned! Leave the circle before the next challenge.'); const party = s.expedition.party; s.expedition.party = () => ['cat', 'nofaceset']; s.draw(); s.expedition.party = party; });
    assert.deepEqual(await offscreenTexts(tall), [], 'No HUD text leaves the canvas (portrait)');
    // tapping the player slot does nothing; the Dash pill dashes; neither starts movement
    const slot = await state(tall, () => { const s = __survivorTest.scene, r = s.hud.layout.slots[0], c = s.game.canvas.getBoundingClientRect(); return {x: c.left + (r.x + r.w / 2) * 2 * c.width / s.scale.width, y: c.top + (r.y + r.h / 2) * 2 * c.height / s.scale.height}; });
    await tall.touchscreen.tap(slot.x, slot.y);
    assert.equal(await state(tall, () => __survivorTest.scene.expansion.cooldown), 0, 'The player slot is not a dash control');
    await state(tall, () => { __survivorTest.scene.joy = null; });
    const dash = await controlPoint(tall, 'Dash');
    await tall.touchscreen.tap(dash.x, dash.y);
    assert(await state(tall, () => __survivorTest.scene.expansion.cooldown > 0), 'The Dash pill dashes');
    assert.equal(await state(tall, () => __survivorTest.scene.joy), null, 'The Dash pill does not start movement');
    await tall.screenshot({path: 'output/ui-foundation/hud-portrait.png'});
    assert.deepEqual(tall.errors, []);
    await tall.close();

    const trial = await open(browser, {width: 390, height: 844}, 'survivors.html?trial&test', true);
    await state(trial, () => { const s = __survivorTest.scene; s.start(); s.draw(); });
    assert.equal((await state(trial, () => __survivorTest.scene.hud.layout)).sockets.length, 0, 'No shrine sockets in the trial');
    await trial.close();

    const land = await open(browser, {width: 1100, height: 760});
    assert.deepEqual(await state(land, () => ({w: __survivorTest.scene.scale.width, h: __survivorTest.scene.scale.height})), {w: 960, h: 640});
    await state(land, () => { const s = __survivorTest.scene; s.start(); s.announce('Shrine challenge 1/3! Defeat the elite for an upgrade.'); s.draw(); });
    assert.deepEqual(await offscreenTexts(land), [], 'No HUD text leaves the canvas (landscape)');
    await land.screenshot({path: 'output/ui-foundation/hud-landscape.png'});
    await land.close();

    const narrow = await open(browser, {width: 360, height: 900}, 'survivors.html?test', true);
    await state(narrow, () => { const s = __survivorTest.scene; s.start(); s.draw(); });
    await narrow.screenshot({path: 'output/ui-foundation/hud-tall-phone.png'});
    await narrow.close();
```

Also update the Task 1 joystick block: the pause control is now the `II` pill (the regex already accepts it).

Run: `GAME_URL=http://127.0.0.1:5174/ node scripts/check-ui-foundation.cjs`
Expected: FAIL at the `{w: 540, h: 960}` assertion (canvas is 540×820).

- [ ] **Step 2: Canvas size and scene helpers in `survivors.js`**

In the `new Phaser.Game({...})` line change `height:portrait?820:640` to `height:portrait?960:640`.

Add these methods next to `rand()`:

```js
    uiSize(){return {w:this.scale.width/UI,h:this.scale.height/UI};}
    // World point to logical UI point (the world camera never zooms).
    toUI(x,y){const cam=this.cameras.main;return {x:(x-cam.scrollX)/UI,y:(y-cam.scrollY)/UI};}
```

In `create()`, after `this.ui=new ScrollUI.NativeView(this);...`, add `this.hud=new SurvivorHud(this);`.

- [ ] **Step 3: Create `survivor-hud.js`**

```js
(() => {
  'use strict';
  const D = () => ScrollUI.DARK;
  const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
  const SLOT_W = 62, SLOT_H = 48, SLOT_GAP = 4, RELIC_PITCH = 24, RELICS_PER_ROW = 8;
  const NAMES = {storm:'STORM LIZARD'};
  class SurvivorHud {
    constructor(s){this.s=s;this.layout={slots:[],relics:[],sockets:[]};}
    // w,h are logical (270x480 portrait, 480x320 landscape). Called inside the x2 group.
    draw(w,h){
      const s=this.s,ui=s.ui;this.layout={slots:[],relics:[],sockets:[]};
      this.status(ui);
      this.timer(ui,w);
      this.relicRow(ui,w);
      this.partyBar(ui,w,h);
      let y=86;
      if(s.encounters.boss?.hp>0)y=this.guardian(ui,w,y)+6;
      if(s.noticeTime>0)y+=ui.notice(s.notice,w/2,y,w-24).height+6;
      if(s.logStorageError||s.unlockError)ui.darkText('Local progress could not be saved',w/2,y+6,{align:'center',color:D().danger});
      if(s.mode==='playing')this.worldLabels(ui,w,h);
    }
    status(ui){
      const s=this.s,p=s.player,hp=clamp(p.hp/s.maxHp,0,1),xp=clamp(s.xp/s.xpNeeded(),0,1);
      const g=ui.graphics();
      // HP: dark trough, then three red bands; XP: three teal bands. Right ends are slanted like the prototype.
      const bar=(x,y,w,hh,slant,fill,bands)=>{g.fillStyle(0x130306).beginPath().moveTo(x,y).lineTo(x+w,y).lineTo(x+w-slant,y+hh).lineTo(x,y+hh).closePath().fillPath();
        let yy=y;for(const [c,f] of bands){const bh=Math.round(hh*f);g.fillStyle(c).fillRect(x,yy,Math.max(0,(w-slant)*fill),bh);yy+=bh;}};
      bar(56,32,96,10,8,hp,[[0x6c192b,.2],[0xaf2424,.4],[0x4d0c1e,.4]]);
      bar(52,48,84,6,4,xp,[[0x187c8c,.34],[0x2dc5c0,.33],[0x0c4067,.33]]);
      ui.image('dk_status',2,10,166,70);
      ui.image('dk_heart',26,37,18,16);
      ui.darkText('LV '+s.level,148,51,{color:D().teal});
      ui.image('killIcon',178,45,6,11);
      ui.darkText(String(s.kills),188,51);
    }
    timer(ui,w){
      const s=this.s,t=`${Math.floor(s.elapsed/60)}:${String(Math.floor(s.elapsed%60)).padStart(2,'0')} / ${s.isExpedition?'10:00':'2:00'}`;
      if(s.mode==='playing')ui.pill('II',w-26,8,20,16,()=>s.pause(),{id:'pause'});
      ui.darkText(t,w-32,17,{align:'right',color:D().gold});
    }
    relicRow(ui,w){
      const s=this.s,sh=s.expedition.shrine,ids=[...new Set(s.relics.equipped)];
      let i=0;const cell=()=>{const x=54+(i%RELICS_PER_ROW)*RELIC_PITCH,y=58+Math.floor(i/RELICS_PER_ROW)*RELIC_PITCH;i++;return {x,y};};
      for(const id of ids){const {x,y}=cell(),count=s.relics.count(id);this.layout.relics.push({id,count,x,y});
        ui.image('relic_'+id,x+2,y+2,16,16,{frame:[0,0,16,16]});
        if(count>1)ui.darkText(String(count),x+22,y+19,{align:'right'});}
      const left=s.isExpedition?Math.max(0,3-sh.completed):0;
      for(let n=0;n<left;n++){const {x,y}=cell(),armed=n===0&&sh.active&&!sh.needsExit&&(sh.inCombat||sh.progress>0);this.layout.sockets.push({x,y,armed});
        // Placeholder until the artist's Relic_Socket: a thin diamond, gold while its challenge is live.
        const g=ui.graphics(),cx=x+10,cy=y+10;g.lineStyle(3,0x120a1a,1).strokePoints([{x:cx,y:cy-5},{x:cx+5,y:cy},{x:cx,y:cy+5},{x:cx-5,y:cy}],true);
        g.lineStyle(1,armed?0xffc41b:0xcfc3de,armed?1:.7).strokePoints([{x:cx,y:cy-5},{x:cx+5,y:cy},{x:cx,y:cy+5},{x:cx-5,y:cy}],true);}
    }
    partyBar(ui,w,h){
      const s=this.s,members=['walker',...s.expedition.party()].slice(0,4),total=4*SLOT_W+3*SLOT_GAP,x0=Math.round((w-total)/2),y=h-SLOT_H-4;
      for(let i=0;i<4;i++){const x=x0+i*(SLOT_W+SLOT_GAP),type=members[i]||null;this.layout.slots.push({type,x,y,w:SLOT_W,h:SLOT_H});
        ui.image('dk_zslot',x,y,SLOT_W,SLOT_H);
        if(type){if(s.textures.exists('face_'+type))ui.image('face_'+type,x+8,y+10,32,32,{frame:[3,3,32,32]});
          else if(s.textures.exists(type))ui.image(type,x+8,y+10,32,32,{frame:[0,0,16,16]});
          // Player charge is the dash cooldown; creature timers arrive with Phase 2.
          const charge=i===0?1-clamp(s.expansion.cooldown/3,0,1):1,bh=Math.round(34*charge);
          if(bh>0)ui.rect(x+52,y+SLOT_H-6-bh,4,bh,charge>=1?'#08ec64':'#08a048');}}
      const cd=s.expansion.cooldown;
      if(s.mode==='playing')ui.pill(cd>0?'Dash '+cd.toFixed(1):'Dash',x0+total-72,y-24,72,20,()=>s.expansion.dash(),{id:'dash'});
      const styles=s.creatures.elements.dashOptions();
      if(s.mode==='playing'&&styles.length>1){const style=s.creatures.elements.dashStyle==='storm'?'lightning':s.creatures.elements.dashStyle;
        ui.pill('Dash: '+style,x0,y-22,96,18,()=>s.creatures.elements.cycleDash(),{id:'dash-style'});}
    }
    guardian(ui,w,y){
      const b=this.s.encounters.boss,width=w-40;ui.darkPanel(20,y,width,22);
      ui.rect(26,y+14,Math.max(0,(width-12)*b.hp/b.maxHp),3,'#ef5266');
      ui.darkText('GUARDIAN '+Math.ceil(b.hp)+' / '+b.maxHp,w/2,y+9,{align:'center',color:D().gold});
      return y+22;
    }
    // Labels that follow things in the world. All positions go through toUI and are clamped on screen.
    worldLabels(ui,w,h){
      const s=this.s,top=112,bottom=h-SLOT_H-30;
      const at=(text,x,y,color=D().text)=>{const t=ui.darkText(text,0,0,{align:'center',color});const half=t.width/2+4;t.setPosition(clamp(x,half,w-half),clamp(y,top,bottom));return t;};
      const capture=(type,b)=>{const p=s.toUI(b.x,b.y);at('CAPTURE '+(NAMES[type]||type.toUpperCase())+' '+Math.round(b.progress/2.5*100)+'%\nCHOOSE 1 THIS ROUND',p.x,p.y-42);};
      for(const [type,a] of Object.entries(s.creatures.allies))if(a.state==='ready')capture(type,a);
      for(const [type,b] of [['frog',s.expedition.frog],['cat',s.expedition.catCapture],['beast',s.encounters.beast]])if(b?.state==='ready')capture(type,b);
      const o=s.owl;if(o?.state==='ready')capture('owl',o);else if(o?.state==='wild'){const p=s.toUI(o.x,o.y);at('WILD OWL',p.x,p.y-24);}
      for(const item of s.pickups.filter(e=>e.type!=='xp')){const p=s.toUI(item.x,item.y);if(p.x>12&&p.x<w-12&&p.y>top&&p.y<bottom)at({heal:'+8 HP',haste:'FRENZY',shield:'SHIELD',magnet:'XP MAGNET',cleanse:'CLEANSE'}[item.type],p.x,p.y+12);}
      const sh=s.expedition.shrine;if(s.isExpedition&&sh.active&&!sh.done){const p=s.toUI(sh.x,sh.y),st=s.expedition.shrineStats(),near=Math.hypot(s.player.x-sh.x,s.player.y-sh.y)<=240;
        at('SHRINE '+(sh.inCombat?'· DEFEAT ELITE':sh.needsExit?'· LEAVE TO REARM':!near?'· OPTIONAL '+(sh.completed+1)+'/3':'· HOLD 6s · '+(sh.completed+1)+'/3\n'+st.hp+' HP / '+st.damage+' DMG'),p.x,p.y-45,D().gold);}
    }
  }
  window.SurvivorHud = SurvivorHud;
})();
```

Add to `survivors.html` before `survivors.js`: `<script src="survivor-hud.js?v=27"></script>`, and change every other `?v=26` to `?v=27`.

- [ ] **Step 4: Wire the HUD into `draw()` and delete the old HUD**

In `survivors.js` `draw()`, replace everything from `this.ui.begin(this.mode);` up to (not including) `if(this.mode==='relic'||(this.mode==='paused'&&...` with:

```js
      this.ui.begin(this.mode);
      const logical=this.uiSize();
      this.ui.beginGroup('ui2x',{scale:UI});
      if(this.mode!=='title')this.hud.draw(logical.w,logical.h);
      this.ui.endGroup();
```

This removes: the top Wood panel, title label, `HP n / m`, the kills/timer labels, the old Pause button, the bottom party panel and objective line, the `Lv · XP` label and XP bar, the notice panel, the pickup labels and the owl labels (all now in the HUD).

Delete the now-unused `captureLabel` method. Make these bodies empty (keep the methods so callers still work):
- `survivor-expedition.js` `drawUI(w,h){}`
- `survivor-encounters.js` `drawUI(w,h){}`
- `survivor-creatures.js` `ui(w,h){}`

In `survivor-relics.js:56` delete only the first statement inside `ui(w,h){...}`'s `if(this.equipped.length){...}` that draws `'Relics: '+...` (keep the paused collection until Task 4).
In `survivor-expansion.js` `ui(w,h)`, delete the `if(s.mode==='playing'){...}` Dash-button statement (the HUD owns dash now).
The old `if(this.mode==='playing'){...}` block (which called `encounters.drawUI`, `expedition.drawUI`, `creatures.ui`, the notice and the pickup/owl labels) sat inside the replaced region, so it is already gone; `grep -n "drawUI\|creatures.ui(" survivors.js` should print nothing.

- [ ] **Step 5: Run the checks**

Run: `GAME_URL=http://127.0.0.1:5174/ node scripts/check-ui-foundation.cjs` → `PASS: UI foundation`
Run: `npm run test:survivors 2>&1 | tail -3` → `18/18`. If `check-capture-choice` fails on its label bounds, switch its label walk (lines 140-151) to `offscreenTexts(page)` and assert `[]`; its `CHOOSE` text still exists in the HUD capture labels.
Look at `hud-portrait.png`, `hud-landscape.png` and `hud-tall-phone.png`: status frame top-left, `LV` and sword + kills to the right of the XP bar, gold timer top-right with the `II` pill, relic icons under the bars with count digits and diamond sockets, party bar at the bottom with the player first. The tall phone shows thin bars above and below the 9:16 canvas.

- [ ] **Step 6: Commit**

```bash
git add survivor-hud.js survivors.js survivors.html survivor-expedition.js survivor-encounters.js survivor-creatures.js survivor-relics.js survivor-expansion.js scripts/check-ui-foundation.cjs scripts/check-capture-choice.cjs
git commit -m "feat(ui): 540x960 portrait canvas and DarkMode HUD at 2x"
```

---

### Task 4: Title, pause and end screens

**Files:**
- Create: `survivor-screens.js`
- Modify: `survivors.js` (draw() screen branch, `chooseStarter`)
- Modify: `survivor-expansion.js` (export roster, delete `starterGrid` and the dead `bestiary` branch of `ui()`)
- Modify: `survivor-relics.js:56` (delete the paused relic collection; screens own it)
- Modify: `survivors.html` (script tag)
- Modify: `scripts/check-starter-grid.cjs` (rewrite), `scripts/check-entrypoints.cjs`, `scripts/check-expedition.cjs` (`'Begin'` → `'BEGIN'`)
- Test: `scripts/check-ui-foundation.cjs`

**Interfaces:**
- Consumes: Task 2 helpers, Task 3 `uiSize`, `hud`.
- Produces: `window.SurvivorScreens` with `draw(w,h)` handling modes `title`, `paused`, `won`, `lost`; a `layout.faces` array `[{id,x,y,size,known}]` for the title grid. `SurvivorExpansion.roster` (the `[id, description]` list). Scene `chooseStarter(id)`.
- Button labels the tests rely on stay exactly: `BEGIN`, `Woodland`/`Desert`, `History`, `Resume`, `Run history / export`, `Choose starter / play again`. There is no `Legacy` and no trial switch on the title anymore.

- [ ] **Step 1: Write the failing screen tests**

Insert before `console.log('PASS: UI foundation');`:

```js
    // --- title, pause and end screens fit in both orientations ---
    for (const [name, viewport, mobile] of [['portrait', {width: 390, height: 844}, true], ['landscape', {width: 1100, height: 760}, false]]) {
      const page = await open(browser, viewport, 'survivors.html?test', mobile);
      await state(page, () => localStorage.setItem('scrollmonsters-starters-v1', JSON.stringify(['cat', 'owl', 'storm'])));
      await page.reload(); await page.waitForFunction(() => window.__phaserReady);
      const labels = (await listControls(page)).map(c => c.label);
      assert(labels.includes('BEGIN') && labels.includes('History'), 'Title shows BEGIN and History');
      assert(!labels.includes('Legacy') && !labels.some(l => /trial|expedition/i.test(l)), 'Legacy and trial switch are gone');
      assert.deepEqual(await offscreenTexts(page), [], `Title fits (${name})`);
      await page.screenshot({path: `output/ui-foundation/title-${name}.png`});
      await state(page, () => { const s = __survivorTest.scene; s.start(); s.pause(); });
      assert.deepEqual(await offscreenTexts(page), [], `Pause fits (${name})`);
      await state(page, () => { const s = __survivorTest.scene; s.relics.equipped = ['boots','stone','ricochet','repulsion','slipstream','bloodroot','pack','resonance','echo','drum','hunter','spite','veil']; s.draw(); });
      assert.deepEqual(await offscreenTexts(page), [], `Pause with 13 relics fits (${name})`);
      await page.screenshot({path: `output/ui-foundation/pause-relics-${name}.png`});
      await state(page, () => { const s = __survivorTest.scene; s.mode = 'lost'; s.draw(); });
      assert.deepEqual(await offscreenTexts(page), [], `End screen fits (${name})`);
      await page.screenshot({path: `output/ui-foundation/lost-${name}.png`});
      assert.deepEqual(page.errors, []);
      await page.close();
    }
```

Run: `GAME_URL=http://127.0.0.1:5174/ node scripts/check-ui-foundation.cjs`
Expected: FAIL (`Title shows BEGIN and History`: the old title uses `Begin` and has `Legacy`).

- [ ] **Step 2: Export the roster and add `chooseStarter`**

In `survivor-expansion.js`: delete the whole `starterGrid(x,y,width){...}` method; replace `ui(w,h){...}` with `ui(w,h){}`; add after the class: `SurvivorExpansion.roster=entries;` (before `window.SurvivorExpansion=...`).

In `survivors.js`, add next to `start()`:

```js
    chooseStarter(id){if(!this.unlocked.includes(id))return;const mode=this.mode;this.run=null;this.starter=id;this.resetState();this.mode=mode;this.draw();}
```

- [ ] **Step 3: Create `survivor-screens.js` (title, pause, end)**

```js
(() => {
  'use strict';
  const D = () => ScrollUI.DARK;
  const pretty = id => id==='storm'?'Storm Lizard':id[0].toUpperCase()+id.slice(1);
  class SurvivorScreens {
    constructor(s){this.s=s;this.layout={faces:[]};}
    // w,h are logical. Called inside the x2 group.
    draw(w,h){
      const s=this.s;this.layout={faces:[]};
      if(s.mode==='title')this.title(w,h);
      else if(s.mode==='paused')this.paused(w,h);
      else if(s.mode==='won'||s.mode==='lost')this.ended(w,h);
    }
    dim(w,h){const ui=this.s.ui;ui.rect(0,0,w,h,'#0b0710b0');ui.hitArea(0,0,w,h,()=>{},'modal-blocker');}
    title(w,h){
      const s=this.s,ui=s.ui,portrait=h>w,roster=SurvivorExpansion.roster,sel=s.starter;
      this.dim(w,h);
      const L=portrait
        ?{banner:[w/2,26],hero:[87,72],name:[w/2,186],desc:[w/2,204,240],grid:[24,228],begin:[55,340,160,44],field:[55,398,76,26],hist:[139,398,76,26]}
        :{banner:[w/2,10],hero:[64,56],name:[112,172],desc:[112,190,200],grid:[240,60],begin:[250,168,212,40],field:[250,220,104,26],hist:[358,220,104,26]};
      ui.banner('SCROLL MONSTERS',...L.banner);
      const [hx,hy]=L.hero;ui.panel('dk_slot',hx,hy,96,96,5,2);ui.image('face_'+sel,hx+10,hy+10,76,76);
      ui.darkText(pretty(sel).toUpperCase(),L.name[0],L.name[1],{size:18,align:'center'});
      const info=roster.find(([id])=>id===sel);
      ui.darkText(info?info[1]:'',L.desc[0],L.desc[1],{align:'center',color:D().muted,wrap:L.desc[2]}).setOrigin(.5,0);
      roster.forEach(([id],i)=>{const x=L.grid[0]+(i%5)*46,y=L.grid[1]+Math.floor(i/5)*46,known=s.unlocked.includes(id);this.layout.faces.push({id,x,y,size:38,known});
        const face=ui.image('face_'+id,x,y,38,38);if(face){if(known)face.clearTint();else face.setTint(0x2a2238);}
        ui.hitArea(x,y,38,38,()=>s.chooseStarter(id),'face-'+id);
        if(id===sel){const g=ui.graphics();g.lineStyle(2,0xffffff,1);
          for(const [cx,cy,dx,dy] of [[x-4,y-4,1,1],[x+42,y-4,-1,1],[x-4,y+42,1,-1],[x+42,y+42,-1,-1]])g.lineBetween(cx,cy,cx+6*dx,cy).lineBetween(cx,cy,cx,cy+6*dy);}});
      const [bx,by,bw,bh]=L.begin;ui.card('BEGIN',bx,by,bw,bh,()=>s.start(),{color:D().gold,size:18,align:'center',id:'begin'});
      const other=s.field==='desert'?'woods':'desert';
      ui.pill(s.field==='desert'?'Desert':'Woodland',...L.field,()=>location.assign('survivors.html?'+(s.isExpedition?'':'trial&')+'field='+other),{id:'field'});
      ui.pill('History',...L.hist,()=>location.assign('survivor-runs.html'),{id:'history'});
    }
    paused(w,h){
      const s=this.s,ui=s.ui,ids=[...new Set(s.relics.equipped)];this.dim(w,h);
      if(ids.length){
        // Relic collection: one column in portrait, two in landscape so 13 relics fit 320 logical px.
        const cols=w>h?2:1,rows=Math.ceil(ids.length/cols),pw=Math.min(w-16,cols===2?440:254),ph=64+rows*20+34,px=(w-pw)/2,py=Math.max(34,(h-ph)/2);
        ui.darkPanel(px,py,pw,ph);ui.banner('RELICS',w/2,py-16);
        const colW=(pw-24)/cols;
        ids.forEach((id,i)=>{const cx=px+12+Math.floor(i/rows)*colW,cy=py+26+(i%rows)*20;ui.image('relic_'+id,cx,cy,16,16,{frame:[0,0,16,16]});
          ui.darkText(s.relics.name(id)+' ×'+s.relics.count(id),cx+22,cy+8,{color:D().muted});});
        ui.pill('Resume',w/2-50,py+ph-30,100,22,()=>s.pause(),{id:'resume'});
        return;
      }
      const pw=Math.min(w-24,254),ph=178,px=(w-pw)/2,py=(h-ph)/2;ui.darkPanel(px,py,pw,ph);ui.banner('PAUSED',w/2,py-16);
      ['Move with WASD, arrows or touch drag.','R restarts · F fullscreen','Escape or P resumes.'].forEach((t,i)=>ui.darkText(t,w/2,py+32+i*16,{align:'center',color:D().muted}));
      ui.pill('Resume',px+16,py+ph-68,pw-32,24,()=>s.pause(),{id:'resume'});
      ui.pill('Run history / export',px+16,py+ph-38,pw-32,24,()=>{s.saveRun();location.assign('survivor-runs.html');},{id:'history'});
    }
    ended(w,h){
      const s=this.s,ui=s.ui,won=s.mode==='won';this.dim(w,h);
      const ally=Math.round(s.owlDamage+s.encounters.beastDamage+Object.values(s.creatures.damage).reduce((a,b)=>a+b,0));
      const lines=['Survived '+Math.floor(s.elapsed)+' seconds · '+s.kills+' defeated','Your damage: '+Math.round(s.playerDamage),'Cat: '+Math.round(s.catDamage)+' · Ally: '+ally,'Damage taken: '+s.damageTaken];
      const pw=Math.min(w-24,254),ph=196,px=(w-pw)/2,py=(h-ph)/2;ui.darkPanel(px,py,pw,ph);ui.banner(won?'COMPLETE':'FAILED',w/2,py-16);
      ui.darkText(won?'Expedition complete':'Expedition failed',w/2,py+28,{align:'center',color:won?D().gold:D().danger});
      lines.forEach((t,i)=>ui.darkText(t,w/2,py+50+i*16,{align:'center',color:D().muted}));
      ui.pill('Choose starter / play again',px+16,py+ph-68,pw-32,24,()=>{s.mode='title';s.draw();},{id:'again'});
      ui.pill('Run history / export',px+16,py+ph-38,pw-32,24,()=>{s.saveRun();location.assign('survivor-runs.html');},{id:'history'});
    }
  }
  window.SurvivorScreens = SurvivorScreens;
})();
```

In `survivor-relics.js` add a public `name(id){return ITEMS.find(v=>v.id===id).name;}` method next to `count(id)`, and in `ui(w,h)` delete the remaining `if(this.equipped.length){...}` statement (the paused collection).

Add `<script src="survivor-screens.js?v=27"></script>` to `survivors.html` after `survivor-hud.js`.

- [ ] **Step 4: Route the screens from `draw()`**

In `create()` add `this.screens=new SurvivorScreens(this);` after `this.hud=...`.
Inside the `ui2x` group in `draw()`, after the HUD line, add:

```js
      if(['title','paused','won','lost'].includes(this.mode))this.screens.draw(logical.w,logical.h);
```

Today the chain after the group is `if(this.mode==='relic'||(this.mode==='paused'&&this.relics.equipped.length)){}` / `else if(this.mode==='upgrade'){...}` / `else if(this.mode==='bestiary'){}` / `else if(this.mode==='title'){...}` / `else if(this.mode!=='playing'){...}`, followed by `this.relics.ui(w,h);this.expansion.ui(w,h);this.ui.end();...`. Reduce it to:

```js
      if(this.mode==='upgrade'){
        // old Wood level-up panel, unchanged until Task 5
      }
      this.relics.ui(w,h);this.expansion.ui(w,h);this.ui.end(); // rest of the line (joystick drawing) unchanged
```

`relics.ui` now only draws the old relic choice (Task 5 replaces it) and `expansion.ui` is empty.

- [ ] **Step 5: Update the three tests that used the old title**

`scripts/check-expedition.cjs`: change `clickButton(mobile,'Begin')` to `clickButton(mobile,'BEGIN',{touch:true})` (keep whatever the existing call passed if it already used touch).

`scripts/check-entrypoints.cjs`: replace the Legacy click block with:

```js
  const labels = (await listControls(page)).map(c => c.label);
  assert(!labels.includes('Legacy'), 'Legacy is no longer on the survivors title');
  const legacy = await page.request.get(page.url().replace(/survivors\.html.*$/, 'legacy.html'));
  assert.equal(legacy.status(), 200, 'legacy.html is still served on its own entrypoint');
```

and import `listControls` instead of `clickButton`. Rename the test title to `'root redirect, query preservation, and Legacy entrypoint'`.

`scripts/check-starter-grid.cjs`: rewrite as

```js
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const {gameURL,launchOptions,clickButton}=require('./survivor-test-utils.cjs');
(async()=>{const b=await chromium.launch(launchOptions);try{const p=await b.newPage({viewport:{width:1100,height:760}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{window.__vt_pending=true;localStorage.setItem('scrollmonsters-starters-v1',JSON.stringify(['cat','owl','storm']));});
 await p.goto(gameURL('survivors.html?test'));await p.waitForFunction(()=>window.__phaserReady);fs.mkdirSync('output/starter-grid',{recursive:true});
 const tapFace=async id=>{const pt=await p.evaluate(id=>{const s=__survivorTest.scene,f=s.screens.layout.faces.find(v=>v.id===id),c=s.game.canvas.getBoundingClientRect();return {x:c.left+(f.x+19)*2*c.width/s.scale.width,y:c.top+(f.y+19)*2*c.height/s.scale.height};},id);await p.mouse.click(pt.x,pt.y,{delay:60});await p.waitForTimeout(60);};
 await tapFace('owl');assert.equal(await p.evaluate(()=>__survivorTest.scene.starter),'owl');
 await tapFace('bear');assert.equal(await p.evaluate(()=>__survivorTest.scene.starter),'owl','Locked faces cannot be chosen');
 await tapFace('storm');assert.equal(await p.evaluate(()=>__survivorTest.scene.starter),'storm');
 await p.screenshot({path:'output/starter-grid/title.png'});
 await clickButton(p,'BEGIN');
 assert.equal(await p.evaluate(()=>__survivorTest.scene.expedition.party()[0]),'storm');assert.equal(await p.evaluate(()=>__survivorTest.scene.mode),'playing');
 assert.deepEqual(errors,[]);console.log('PASS grid selection, locked selection, starter and start');}finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1)});
```

- [ ] **Step 6: Run the checks**

Run: `GAME_URL=http://127.0.0.1:5174/ node scripts/check-ui-foundation.cjs` → `PASS: UI foundation`
Run: `npm run test:survivors 2>&1 | tail -3` → `18/18`
Look at `title-portrait.png`, `title-landscape.png`, `pause-relics-*.png`, `lost-*.png`: nothing clipped, locked faces shown as dark silhouettes, white corner brackets on the selected face.

- [ ] **Step 7: Commit**

```bash
git add survivor-screens.js survivors.js survivors.html survivor-expansion.js survivor-relics.js scripts/check-ui-foundation.cjs scripts/check-starter-grid.cjs scripts/check-entrypoints.cjs scripts/check-expedition.cjs
git commit -m "feat(ui): DarkMode title, pause and end screens"
```

---

### Task 5: Level-up and relic choice screens; remove Theme Wood from survivors

**Files:**
- Modify: `survivor-screens.js` (`upgrade`, `relic`)
- Modify: `survivors.js` (delete the old upgrade branch, `label`, `panel`, `button`; route `upgrade`/`relic`)
- Modify: `survivor-relics.js` (`ui()` becomes empty)
- Modify: `survivors.js` preload (drop `woodPanel`, `woodButton`, `NinjaPixel` if unused)
- Test: `scripts/check-ui-foundation.cjs`, `scripts/check-survivors.cjs` (label)

**Interfaces:**
- Consumes: `card`, `pill`, `banner`, `darkPanel`, `darkText`.
- Produces: level-up cards labelled `'1. '+name`, `'2. '+name`, `'3. '+name` (tests rely on this). Relic cards labelled `'1. '+relic name`, etc., plus a `Leave reward` pill. Keys 1-3 keep working (unchanged code in `create()`).

- [ ] **Step 1: Write the failing choice-screen tests**

Insert before `console.log('PASS: UI foundation');`:

```js
    // --- level-up and relic choice fit and respond in both orientations ---
    for (const [name, viewport, mobile] of [['portrait', {width: 390, height: 844}, true], ['landscape', {width: 1100, height: 760}, false]]) {
      const page = await open(browser, viewport, 'survivors.html?test', mobile);
      const pick = await state(page, () => { const s = __survivorTest.scene; s.start(); s.xp = s.xpNeeded(); s.checkLevel(); s.draw(); return {id: s.choices[0].id, label: '1. ' + s.choices[0].name, mode: s.mode}; });
      assert.equal(pick.mode, 'upgrade');
      assert.deepEqual(await offscreenTexts(page), [], `Level-up fits (${name})`);
      await page.screenshot({path: `output/ui-foundation/levelup-${name}.png`});
      const p = await controlPoint(page, pick.label);
      if (mobile) await page.touchscreen.tap(p.x, p.y); else await page.mouse.click(p.x, p.y, {delay: 30});
      assert.equal(await state(page, () => __survivorTest.scene.mode), 'playing');
      await state(page, () => { const s = __survivorTest.scene; s.relics.reward('shrine_challenge'); s.relics.open(); s.draw(); });
      assert.equal(await state(page, () => __survivorTest.scene.mode), 'relic');
      const labels = (await listControls(page)).map(c => c.label);
      assert(labels.some(l => l.startsWith('1. ')) && labels.includes('Leave reward'));
      assert.deepEqual(await offscreenTexts(page), [], `Relic choice fits (${name})`);
      await page.screenshot({path: `output/ui-foundation/relic-${name}.png`});
      assert.deepEqual(page.errors, []);
      await page.close();
    }
```

`relics.reward()` only queues a reward; `relics.open()` (what `checkLevel()` calls) rolls the offers and sets `mode='relic'`.

Run: `GAME_URL=http://127.0.0.1:5174/ node scripts/check-ui-foundation.cjs`
Expected: FAIL at `Level-up fits` (the old 1x Wood panel and texts use full-size coordinates, and 21px NinjaPixel labels overflow in portrait) or at `controlPoint` because the Wood labels differ.

- [ ] **Step 2: Add the two screens to `survivor-screens.js`**

Extend `draw(w,h)`:

```js
      else if(s.mode==='upgrade')this.upgrade(w,h);
      else if(s.mode==='relic')this.relic(w,h);
```

and add the methods:

```js
    choicePanel(w,h,title,sub,count,cardH,extra=0){
      const pw=Math.min(w-12,300),ph=34+count*(cardH+6)+extra,px=(w-pw)/2,py=Math.max(30,(h-ph)/2+8);
      this.dim(w,h);this.s.ui.darkPanel(px,py,pw,ph);this.s.ui.banner(title,w/2,py-18);
      this.s.ui.darkText(sub,w/2,py+20,{align:'center',color:D().muted});
      return {px,py,pw,ph};
    }
    upgrade(w,h){
      const s=this.s,ui=s.ui,cardH=h>w?60:52,{px,py,pw}=this.choicePanel(w,h,'LEVEL UP','Level '+s.level+' · combat paused',s.choices.length,cardH);
      s.choices.forEach((c,i)=>ui.card((i+1)+'. '+c.name,px+8,py+32+i*(cardH+6),pw-16,cardH,()=>s.chooseUpgrade(i),{detail:c.detail,id:'up'+i}));
    }
    relic(w,h){
      const s=this.s,ui=s.ui,r=s.relics,cardH=h>w?70:62,{px,py,pw,ph}=this.choicePanel(w,h,'CHOOSE A RELIC','Shrine reward · this run only',r.offers.length,cardH,30);
      r.offers.forEach((item,i)=>{const owned=r.count(item.id),tag=owned?' · '+owned+' → '+(owned+1):' · NEW';
        ui.card((i+1)+'. '+item.name+tag,px+8,py+32+i*(cardH+6),pw-16,cardH,()=>r.choose(i),{detail:item.detail+' '+item.extra,icon:'relic_'+item.id,id:'relic'+i});});
      ui.pill('Leave reward',w/2-50,py+ph-28,100,20,()=>r.skip(),{id:'skip'});
    }
```

- [ ] **Step 3: Route and delete the old Wood code in `survivors.js`**

Change the screen routing line to:

```js
      if(['title','paused','won','lost','upgrade','relic'].includes(this.mode))this.screens.draw(logical.w,logical.h);
```

Delete the whole old `if(this.mode==='upgrade'){...}` block that follows the `ui2x` group, and change the tail `this.relics.ui(w,h);this.expansion.ui(w,h);this.ui.end();` to `this.ui.end();`. Delete `survivor-relics.js` `ui(w,h){...}` and `survivor-expansion.js` `ui(w,h){}` together with their call sites. Delete the `label`, `panel` and `button` methods from `survivors.js`, then `grep -n "this\.label(\|s\.label(\|\.panel(\|\.button(" survivor*.js` and confirm nothing survivors-side still calls them (the `NativeView` methods of the same names stay for legacy). Delete the `woodPanel`, `woodButton` and `NinjaPixel` loads from `preload()` only if that grep shows no remaining users in survivors files. `const w=...,h=...,compact=...` in `draw()` can go too if unused.

- [ ] **Step 4: Update `scripts/check-survivors.cjs`**

Its upgrade tap already uses `controlPoint(mobile, '1. '+choice.name)` from Task 1; the card keeps that label, so no change is needed. Confirm by running it.

- [ ] **Step 5: Run everything**

Run: `GAME_URL=http://127.0.0.1:5174/ node scripts/check-ui-foundation.cjs` → `PASS: UI foundation`
Run: `npm run test:survivors 2>&1 | tail -3` → `18/18`
Run: `npm run test:ui 2>&1 | tail -3` → legacy baseline result.
Look at `levelup-*.png` and `relic-*.png`: three cards inside the panel, relic icons on relic cards, text wrapped inside the cards.

- [ ] **Step 6: Commit**

```bash
git add survivor-screens.js survivors.js survivor-relics.js survivor-expansion.js scripts/check-ui-foundation.cjs scripts/check-survivors.cjs
git commit -m "feat(ui): DarkMode level-up and relic choice; drop Theme Wood from survivors"
```

---

### Task 6: Style guide, spec wording and final verification

**Files:**
- Modify: `UI_STYLE_GUIDE.md`
- Modify: `docs/superpowers/specs/2026-09-28-reward-juice-design.md` (UI at 2x paragraph, HUD coins → kills, component list)

- [ ] **Step 1: Rewrite `UI_STYLE_GUIDE.md`**

Structure it as:

```markdown
# ScrollMonsters UI Style Guide

Two UI families ship today. **Survivors (`survivors.html`) uses Pixelarium DarkMode.** The legacy campaign (`legacy.html`, `game.js`) keeps Ninja Adventure Theme Wood, documented at the end.

## Survivors: DarkMode

### Scale and space
- Canvas: 540×960 portrait, 960×640 landscape, `Phaser.Scale.FIT`. Never `EXPAND`.
- All UI is laid out in logical space (270×480 portrait, 480×320 landscape) inside the `ui2x` group, which is scaled ×2 (`UI` in `survivors.js`). World-anchored labels convert with `scene.toUI(x, y)`.
- Raster UI art is drawn at whole-number scale: nine-slices, status frame, party slots and the heart at 2 (logical); banner, icons and facesets at 1 or 2.

### Type
- NovelMix (`assets/ui/font_medium_9px.ttf`, key `NovelMix`) at **9 or 18** only; `darkText` throws otherwise.
- Text is white with a 2px ink (`#120a1a`) outline. Muted `#b9b0d0`, gold `#ffc41b`, teal `#2dc5c0`, danger `#ef5266`.

### Components (`NativeView` in `phaser-ui.js`)
- `darkText`, `darkPanel` (dialogue box, slice 5), `pill` (button, slice 3), `card` (item slot, slice 5, optional icon and wrapped detail), `banner` (192×32 ink banner, 18px title), `notice` (wrapped text on a panel).
- Titles on banners stay short (about 15 characters at 18px).
- Buttons press to 96% and recover on release or cancel. Any interactive object under the pointer blocks the touch joystick.

### HUD (`survivor-hud.js`)
- Top-left status frame: heart, HP bar (no numbers), XP bar, `LV n`, sword icon and kill count.
- Top-right: gold timer and the `II` pause pill.
- Under the bars: relic row (20px icons on a 24px pitch, 8 per row, counts only above 1) followed by one diamond socket per shrine challenge left; the next socket is gold while its challenge is live.
- Bottom: party bar of 4 Zelda slots, player first. The player's charge bar shows the dash cooldown; slots are not tappable. A `Dash` pill sits above the right end of the bar.

### Screens (`survivor-screens.js`)
- Title, pause (with relic collection), won/lost, level-up and relic choice. Every screen dims the field and blocks taps behind it. Each screen has a portrait and a landscape layout; `scripts/check-ui-foundation.cjs` fails if any text leaves the canvas.

### Assets
- `scripts/build-ui-assets.py` regenerates `assets/ui/darkmode/*` and `assets/icons/relics/*` from the purchased packs. Ship only the crops; never commit the packs.
- Every relic and upgrade has its own icon; never reuse one or ship a near look-alike.

## Legacy: Theme Wood
(Keep the current guide's content here unchanged, from "Approved direction" to the end, under this heading.)
```

Move the existing content under the final heading verbatim.

- [ ] **Step 2: Update the spec to match what was built**

In the spec's `### UI at 2x` section, replace the first two sentences with: "All survivors UI is laid out in fixed logical space (270×480 portrait, 480×320 landscape) inside one `NativeView` group scaled ×2. The world camera is untouched, so world-space juice (aura, damage numbers, capture sheets) stays at game scale." In the HUD decision row, replace "then coins to its right. The coin icon is drawn at its native size (10×13 logical)." with "then the kill count (sword icon) to its right, until the run has a currency." In the `phaser-ui.js additions` bullet, replace the component list with "`darkText`, `darkPanel`, `pill`, `card`, `banner` and `notice` helpers on `NativeView`; the status frame and party slots are drawn by `survivor-hud.js`."

- [ ] **Step 3: Final verification**

Run: `npm run test:survivors 2>&1 | tail -3` → `Survivors: 18/18 checks passed.`
Run: `npm run test:ui 2>&1 | tail -3` → legacy baseline result.
Run: `diff <(grep -E "^PASS" output/phase1-baseline.txt) <(npm run test:survivors 2>&1 | grep -E "^PASS" | grep -v "UI foundation")` and confirm the only differences are the renamed entrypoints title and the starter-grid wording.
Open every PNG in `output/ui-foundation/` and `output/starter-grid/title.png` and check: crisp doubled pixels, nothing clipped, thin bars on the tall phone, landscape layouts balanced.

- [ ] **Step 4: Commit**

```bash
git add UI_STYLE_GUIDE.md docs/superpowers/specs/2026-09-28-reward-juice-design.md
git commit -m "docs: DarkMode style guide and spec updates for Phase 1"
```
