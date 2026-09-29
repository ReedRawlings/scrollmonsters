# Reward Juice (Phase 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every reward moment in `survivors.html` readable and satisfying: capture, starter unlock, level-up, upgrade pick and shrine clears. All of it happens through a presentation-only juice module that never changes the simulation.

**Architecture:**
- **Simulation side.** Code that grants a reward calls `scene.reward(kind, data)`, which only emits a Phaser scene event. The simulation code changes are these emit calls, `expedition.unlock` returning whether the type was new, and the `unlock` mode below; everything else stays as it is.
- **Presentation side.** A new `SurvivorJuice` (`survivor-juice.js`) listens and plays sheet animations. Sheets are plain images cut into frames on demand. It also runs icon flights with a trail, pop text, a white-flash copy, its own camera jitter and hit-stop.
- **Pauses.** Hit-stop and the starter-unlock screen pause only the real-time loop in `update()`. `window.advanceTime` (every automated check) is never frozen and never sees the unlock screen, so every existing balance check keeps its numbers.
- **Randomness.** The juice has its own seeded RNG and never touches `Math.random()`. The simulation calls `Math.random()` for den, chest and nest placement, so any extra draw would move those. A new determinism check pins this.

**Tech Stack:** Phaser 4.2.1, plain browser JS modules on `window`, Playwright 1.58 checks run by `npm run test:survivors`, Python 3 + Pillow for asset preparation.

**Spec:** `docs/superpowers/specs/2026-09-28-reward-juice-design.md` (Phase 2). Builds on Phase 1 (`docs/superpowers/plans/2026-09-28-ui-foundation.md`, branch `feat/ui-foundation`). Reference prototype: https://claude.ai/artifact/VgjShiA626rZqRpsRNAAYL (moments 1–4 and 6).

## Global Constraints

- **Presentation never changes the simulation.** Juice code reads state and never writes it, except that it opens and closes `mode='unlock'`. It never calls `scene.rand()`, `Math.random()`, `scene.burst()` or Phaser's `camera.shake()`, which calls `Math.random()`.
- **Logic first, animation after.** Rewards apply on the tick they happen, and cutting an animation short breaks nothing.
- **Hit-stop and the unlock screen pause through the real-time loop only.** They never stretch `STEP` or `elapsed`, and they never pause `window.advanceTime`.
- **Reduced motion** (`ui.reducedMotion`) turns off shake, freezes and flashes. Fades and flights stay.
- **Timings:**
  - pick hold: 260ms
  - capture burst freeze: 90ms
  - shrine shatter freeze: 110ms
  - level-up card input lock: 370ms
  - unlock screen opens 900ms after the capture that caused it
- **Sheets:**
  - `Capture_Ring` loops at 3x in the world.
  - `Capture_Fill` frame = round(progress ÷ 2.5 × 16) for creatures, round(progress ÷ 6 × 16) for the shrine.
  - `ShrineStates` frame = challenges completed.
- **Icons:** every upgrade has its own icon, with no repeats or look-alikes (also across relics). Creature upgrades show the owning creature's faceset small in the icon's corner.
- **Fonts and art:** NovelMix at 9 or 18 only, and whole-number art scales, as in Phase 1.
- **Git:** never `git add -A`/`.`; stage only listed paths.

## Decisions this plan makes where the spec was silent or the code disagreed

Report these to the user at the end:

1. **The juice uses its own seeded RNG, not `Math.random()`.** The spec's rule 1 says cosmetic randomness uses `Math.random()`, but the simulation itself calls `Math.random()` (`survivor-encounters.js:16`, `survivor-expedition.js:61`, `survivors.js:122`). Task 7 updates the spec. Separately, those three calls make runs non-reproducible; that is out of scope here and is flagged as its own follow-up.
2. **Hit-stop gates `update()`'s accumulator instead of switching `mode`.** It is the same pause for the player, and it doesn't interrupt the automated checks, which drive `advanceTime`.
3. **The unlock screen opens from the real-time loop** once play resumes (at least 900ms after the capture). If a level-up lands on the same tick, the level-up shows first and the unlock follows.
4. **Icons for the 14 elemental and combo upgrades are Tiny Dungeons strips** chosen for distinct shapes (listed in Task 2). The user can swap any of them.
5. **The capture ring is the oval `Capture_Ring`** over the circular 70px capture area. The user accepted this placeholder for the shrine; creatures use it too.

## Review Focus

1. **Rewards arriving together.** A capture and a level-up on the same tick, or a capture during a level-up, must not lose either screen or get stuck. Test in Task 4.
2. **Restart (R) mid-effect.** A new run must start unfrozen, with no aura, flights, rings or queued unlocks from the old run. Test in Task 6.
3. **Reduced motion.** No freeze or shake, but capture, level-up, unlock and shrine flows all still complete. Test in Task 6.
4. **Reward spam.** Many captures, upgrades or shrine chunks in a short time keep live effects bounded (at most 60 juice sprites) and clean up. Test in Task 6.
5. **Window blur or pause during a freeze or the unlock screen.** The game must never stay frozen, and the unlock screen must still close. Test in Task 4 (blur during unlock) and Task 1 (freeze expiry).

---

## File structure

| File | Status | Responsibility |
|---|---|---|
| `survivor-juice.js` | create | `SurvivorJuice`: sheet frames, RNG, freeze, jitter, flash copies, pop text, flights with trail, level-up aura, capture/shrine rings, reward handlers, unlock queue |
| `survivor-fx-manifest.js` | create (generated) | `window.FX_SHEETS`: frame size, count, fps, loop, anchor and `src` for every sheet the juice uses |
| `scripts/build-ui-assets.py` | modify | Also copy VfxMix particles, write upgrade icons and generate the manifest |
| `assets/icons/upgrades/<id>.png` | create (generated) | 256×16 16-frame strip per offerable upgrade id |
| `assets/fx/vfxmix/{spark_04,gem_broken_yellow,rock_gray}.png` | create (copied) | Shrine shatter art |
| `survivors.js` | modify | `reward()`, juice construction, preload, freeze-gated `update()`, `openUnlock`/`closeUnlock`, capture-ring removal for the owl, level-up/upgrade emits, key lock |
| `survivor-expedition.js` | modify | Capture and unlock emits, `unlock()` returns true when new, shrine sprite and ring replaced, shrine clear emit |
| `survivor-creatures.js`, `survivor-encounters.js` | modify | Remove drawn capture rings and arcs |
| `survivor-screens.js` | modify | Level-up deal-in, lock, icons and card layout; unlock screen |
| `survivor-hud.js` | modify | Live creature charge bars |
| `phaser-ui.js` | modify | `card` gets a `badge` (small faceset) option |
| `survivors.html` | modify | Script tags, `?v=28` |
| `scripts/check-juice.cjs` | create | Phase 2 checks, determinism, screenshots in `output/juice/` |
| `scripts/test-survivors.cjs` | modify | Register `juice` |
| `scripts/check-survivors.cjs`, `scripts/check-ui-foundation.cjs` | modify | Wait out the 370ms level-up lock before tapping |
| `docs/superpowers/specs/2026-09-28-reward-juice-design.md`, `UI_STYLE_GUIDE.md` | modify | Rule 1 wording, juice section |

---

### Task 0: Branch and baseline

- [ ] **Step 1:** `git switch feat/ui-foundation && git pull --ff-only && git switch -c feat/reward-juice`
- [ ] **Step 2:** Start a static server for the loops: `python3 -m http.server 5174 --bind 127.0.0.1` (second terminal).
- [ ] **Step 3:** Run `npm run test:survivors 2>&1 | tail -1` → `Survivors: 18/18 checks passed.`
- [ ] **Step 4:** `git add docs/superpowers/plans/2026-09-28-reward-juice-phase2.md && git commit -m "docs: reward juice Phase 2 plan"`

---

### Task 1: Juice core, FX manifest and determinism check

**Files:**
- Modify: `scripts/build-ui-assets.py`
- Create (generated): `survivor-fx-manifest.js`, `assets/fx/vfxmix/*.png`
- Create: `survivor-juice.js`, `scripts/check-juice.cjs`
- Modify: `survivors.js`, `survivors.html`, `scripts/test-survivors.cjs`

**Interfaces:**
- **Produces, in the browser:**
  - `window.FX_SHEETS[key] = {src, fw, fh, n, fps, loop, ax, ay}`
  - `scene.juice`: `SurvivorJuice`
  - `scene.reward(kind, data)`, which emits `'reward'` with `{kind, ...data}`
- **`SurvivorJuice` members:**
  - `enabled` (bool, default true); `reduced` (bool)
  - `rand() → [0,1)`; `now() → ms` (scene clock)
  - `observe()`, called at the start of `draw()`; `since(mode) → ms` since the scene entered `mode`, `Infinity` otherwise
  - `meta(key) → {fw,fh,n,fps,loop,ax,ay}`, which falls back to a 16×16 strip for icons
  - `frameName(key, i) → string`; `frameRect(key, i) → [x,y,w,h]`; `frameAt(key, ms, loop?) → int`
  - `play(key, x, y, {scale=3, ui=false, loop=false, depth=2900, tint, onDone}) → fx|null`; `stop(fx)`
  - `freeze(ms)`, `frozen() → bool`
  - `jitter(px, ms)` (camera follow-offset shake that uses `rand()`)
  - `flashCopy(sprite, ms=120)`
  - `popText(text, x, y, {size=18, color}) → Text` (logical)
  - `flyTo(key, from, to, {size=32, onLand}) → flight` (logical points)
  - `update()`, called at the end of `draw()`
  - `realtime()`, called from `update()` only while the real-time sim runs
  - `reset()`
  - `played`: the last 50 sheet keys started, for tests
  - `fx`, `flights`: live arrays
  - `handlers`: kind → function(event)
- **Produces, in the test utils:** nothing new. `scripts/check-juice.cjs` has its own `open(browser, viewport, path, {mobile, realtime, reducedMotion, seedRandom})`.

- [ ] **Step 1: Extend `scripts/build-ui-assets.py` to copy the VfxMix art and write the manifest**

Add near the top:

```python
import json
VFXMIX = HOME / 'FullBundle/AllPackBundle/VfxMix'
FX_OUT = ROOT / 'assets/fx/vfxmix'
SHEETS = ROOT / 'assets/fx/sheets'
# Sheets the juice uses, read from the artist's JSON so re-exports need no code change.
FX_FROM_JSON = ['Capture_Ring', 'Capture_Fill', 'Capture_Burst', 'Reward_Trail', 'Slot_PowerUp',
    'LevelUp_Aura_Ignite_Back', 'LevelUp_Aura_Ignite_Front', 'LevelUp_Aura_Loop_Back', 'LevelUp_Aura_Loop_Front',
    'LevelUp_Aura_Fade_Back', 'LevelUp_Aura_Fade_Front', 'Unlock_Rays', 'Unlock_Fill']
# Sheets without artist JSON: src, frame w/h, frames, fps, loop, anchor x/y.
FX_EXTRA = {
    'ShrineStates': ('assets/fx/ShrineStates.png', 32, 32, 4, 1, False, 16, 31),
    'Spark_Light': ('assets/fx/vfxmix/spark_04.png', 142, 119, 16, 24, False, 71, 60),
    'P_Shard': ('assets/fx/vfxmix/gem_broken_yellow.png', 18, 16, 6, 1, False, 9, 8),
    'P_Rock': ('assets/fx/vfxmix/rock_gray.png', 22, 22, 6, 1, False, 11, 11),
}
```

Add to `main()` before the final `print`:

```python
    FX_OUT.mkdir(parents=True, exist_ok=True)
    for src, name in [('fx/spark_04.png', 'spark_04.png'), ('particle/gem_broken_yellow.png', 'gem_broken_yellow.png'), ('particle/rock_gray.png', 'rock_gray.png')]:
        Image.open(VFXMIX / src).convert('RGBA').save(FX_OUT / name)
    manifest = {}
    for key in FX_FROM_JSON:
        j = json.loads((SHEETS / f'{key}.json').read_text())
        manifest[key] = {'src': f'assets/fx/sheets/{j["image"]}', 'fw': j['frame_width'], 'fh': j['frame_height'], 'n': j['frame_count'],
                         'fps': j.get('fps') or 1, 'loop': bool(j.get('loop')), 'ax': j['anchor']['x'], 'ay': j['anchor']['y']}
    for key, (src, fw, fh, n, fps, loop, ax, ay) in FX_EXTRA.items():
        manifest[key] = {'src': src, 'fw': fw, 'fh': fh, 'n': n, 'fps': fps, 'loop': loop, 'ax': ax, 'ay': ay}
    (ROOT / 'survivor-fx-manifest.js').write_text('// Generated by scripts/build-ui-assets.py from assets/fx/sheets/*.json. Do not edit.\nwindow.FX_SHEETS=' + json.dumps(manifest, separators=(',', ':')) + ';\n')
```

Run: `python3 scripts/build-ui-assets.py && head -c 300 survivor-fx-manifest.js`
Expected: the manifest starts with `window.FX_SHEETS={"Capture_Ring":{"src":"assets/fx/sheets/Capture_Ring.png","fw":48,...`.

- [ ] **Step 2: Write the failing core checks in `scripts/check-juice.cjs`**

```js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {chromium} = require('playwright');
const {gameURL, launchOptions, controlPoint, listControls, offscreenTexts} = require('./survivor-test-utils.cjs');

// Seeded Math.random so two page loads place dens and chests identically.
const SEED_RANDOM = () => { let a = 1234; Math.random = () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
async function open(browser, viewport, path = 'survivors.html?test', {mobile = false, realtime = false, reducedMotion = 'no-preference', seedRandom = false, starters} = {}) {
  const context = await browser.newContext({viewport, isMobile: mobile, hasTouch: mobile, reducedMotion});
  const page = await context.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  if (!realtime) await page.addInitScript(() => window.__vt_pending = true);
  if (seedRandom) await page.addInitScript(SEED_RANDOM);
  if (starters) await page.addInitScript(s => localStorage.setItem('scrollmonsters-starters-v1', JSON.stringify(s)), starters);
  await page.goto(gameURL(path));
  await page.waitForFunction(() => window.__phaserReady);
  page.errors = errors;
  return page;
}
const state = (page, fn, arg) => page.evaluate(fn, arg);
const wait = ms => new Promise(r => setTimeout(r, ms));

// One fixed-seed expedition driven only by tick(); rewards are resolved by a fixed policy.
async function expeditionEvents(browser, juiceOn) {
  const page = await open(browser, {width: 1100, height: 760}, 'survivors.html?test', {seedRandom: true});
  const events = await state(page, on => {
    const s = __survivorTest.scene; s.juice.enabled = on; s.start();
    let steps = 0, released = false;
    while (s.elapsed < 420 && steps++ < 40000) {
      if (s.mode === 'relic') s.relics.choose(0);
      else if (s.mode === 'upgrade') s.chooseUpgrade(0);
      else if (s.mode === 'unlock') s.closeUnlock();
      else if (s.mode !== 'playing') break;
      if (!released && s.elapsed >= 20) { released = true; s.expedition.release('mouse', s.player.x + 20, s.player.y, false); }
      s.player.inv = 2; s.tick(1 / 60);
      if (steps % 30 === 0) s.draw(); // exercise every presentation path between ticks
    }
    return JSON.stringify(s.run.events);
  }, juiceOn);
  assert.deepEqual(page.errors, []);
  await page.close();
  return events;
}

(async () => {
  fs.mkdirSync('output/juice', {recursive: true});
  const browser = await chromium.launch(launchOptions);
  try {
    // --- manifest and frames ---
    const core = await open(browser, {width: 1100, height: 760});
    const frames = await state(core, () => { const s = __survivorTest.scene, j = s.juice;
      const missing = Object.keys(FX_SHEETS).filter(k => !s.textures.exists(k));
      const name = j.frameName('Capture_Fill', 16), f = s.textures.get('Capture_Fill').get(name);
      return {missing, name, w: f.width, x: f.cutX, clamp: j.frameName('Capture_Fill', 99), icon: j.meta('relic_veil').n}; });
    assert.deepEqual(frames.missing, [], 'Every manifest sheet loads');
    assert.deepEqual([frames.name, frames.w, frames.x, frames.clamp, frames.icon], ['f16', 48, 768, 'f16', 16]);
    // --- disabled juice does nothing ---
    const off = await state(core, () => { const j = __survivorTest.scene.juice; j.enabled = false; const fx = j.play('Slot_PowerUp', 10, 10, {ui: true}); j.freeze(500); const r = {fx, frozen: j.frozen()}; j.enabled = true; return r; });
    assert.deepEqual(off, {fx: null, frozen: false});
    // --- flights land and clean up ---
    await state(core, () => { const j = __survivorTest.scene.juice; window.__landed = 0; j.flyTo('relic_veil', {x: 20, y: 20}, {x: 200, y: 300}, {onLand: () => window.__landed++}); });
    await wait(700);
    assert.deepEqual(await state(core, () => ({landed: window.__landed, flights: __survivorTest.scene.juice.flights.length})), {landed: 1, flights: 0});
    assert.deepEqual(core.errors, []);
    await core.close();

    // --- hit-stop pauses the real-time sim, then expires on its own ---
    const live = await open(browser, {width: 1100, height: 760}, 'survivors.html?test', {realtime: true});
    await state(live, () => { const s = __survivorTest.scene; s.start(); s.spawnTimer = 999; s.player.inv = 999; });
    await wait(300);
    const e0 = await state(live, () => { const s = __survivorTest.scene; s.juice.freeze(500); return s.elapsed; });
    await wait(250);
    assert(await state(live, () => __survivorTest.scene.elapsed) - e0 < 0.05, 'Frozen: the sim does not advance');
    await wait(450);
    assert(await state(live, () => __survivorTest.scene.elapsed) - e0 > 0.1, 'The freeze expires and the sim resumes');
    await live.close();

    // --- determinism: the juice never changes what happens in a run ---
    const withJuice = await expeditionEvents(browser, true), without = await expeditionEvents(browser, false);
    assert(withJuice.length > 200, 'The fixed run produced events');
    assert.equal(withJuice, without, 'Run event log is identical with juice on and off');

    console.log('PASS: juice');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
```

Register it: append `'juice'` to the `tests` array in `scripts/test-survivors.cjs`.

Run: `GAME_URL=http://127.0.0.1:5174/ node scripts/check-juice.cjs`
Expected: FAIL with `FX_SHEETS is not defined`.

- [ ] **Step 3: Create `survivor-juice.js`**

```js
(() => {
  'use strict';
  const UI = 2, MAX_FX = 60;
  const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
  // Presentation only: reads scene state, never writes simulation state. Never call scene.rand(),
  // Math.random() (the sim uses it for dens and chests), scene.burst() or camera.shake() (uses Math.random).
  class SurvivorJuice {
    constructor(s){
      this.s=s;this.enabled=true;this.reduced=s.ui.reducedMotion;this.seed=(Date.now()>>>0)||1;
      this.front=s.add.container(0,0).setScrollFactor(0).setDepth(10002).setScale(UI); // logical UI space, above the HUD
      this.handlers={};this.played=[];
      this.reset();
      s.events.on('reward',e=>{if(this.enabled)this.handlers[e.kind]?.(e);});
    }
    reset(){
      for(const f of this.fx||[])f.sprite.destroy();for(const f of this.flights||[])f.im.destroy();
      for(const r of Object.values(this.rings||{})){r.ring.destroy();r.fill.destroy();}
      this.fx=[];this.flights=[];this.rings={};this.frozenUntil=0;this.jitterUntil=0;this.unlocks=[];this.unlockAt=0;
      this.mode=this.s.mode;this.modeAt=this.now();this.s.cameras.main.setFollowOffset(0,0);
    }
    rand(){let t=this.seed=(this.seed+0x6D2B79F5)|0;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;}
    now(){return this.s.time.now;}
    observe(){if(this.s.mode!==this.mode){this.mode=this.s.mode;this.modeAt=this.now();}}
    since(mode){return this.mode===mode?this.now()-this.modeAt:Infinity;}
    meta(key){const m=FX_SHEETS[key];if(m)return m;const t=this.s.textures.get(key).getSourceImage();return {fw:16,fh:16,n:Math.max(1,Math.floor(t.width/16)),fps:12,loop:true,ax:8,ay:8};}
    // Sheets load as plain images; frames are cut on demand so sprites and NativeView.image share them.
    frameName(key,i){const m=this.meta(key),n=clamp(Math.floor(i),0,m.n-1),name='f'+n,t=this.s.textures.get(key);if(!t.has(name))t.add(name,0,n*m.fw,0,m.fw,m.fh);return name;}
    frameRect(key,i){const m=this.meta(key),n=clamp(Math.floor(i),0,m.n-1);return [n*m.fw,0,m.fw,m.fh];}
    frameAt(key,ms,loop=this.meta(key).loop){const m=this.meta(key),f=Math.floor(Math.max(0,ms)/1000*m.fps);return loop?f%m.n:Math.min(f,m.n-1);}
    play(key,x,y,{scale=3,ui=false,loop=false,depth=2900,tint,onDone}={}){
      if(!this.enabled||this.fx.length>=MAX_FX)return null;
      const m=this.meta(key),sp=this.s.add.sprite(x,y,key,this.frameName(key,0)).setOrigin(m.ax/m.fw,m.ay/m.fh).setScale(scale);
      if(tint!==undefined)sp.setTint(tint);
      if(ui)this.front.add(sp);else sp.setDepth(depth);
      const fx={sprite:sp,key,start:this.now(),loop,onDone};this.fx.push(fx);this.note(key);
      return fx;
    }
    note(key){this.played.push(key);if(this.played.length>50)this.played.shift();} // test-visible history of started effects
    stop(fx){if(!fx)return;fx.sprite.destroy();this.fx=this.fx.filter(f=>f!==fx);}
    freeze(ms){if(!this.enabled||this.reduced)return;this.frozenUntil=Math.max(this.frozenUntil,this.now()+ms);}
    frozen(){return this.now()<this.frozenUntil;}
    jitter(px,ms){if(!this.enabled||this.reduced)return;this.jitterPx=px;this.jitterUntil=this.now()+ms;}
    flashCopy(obj,ms=120){
      if(!this.enabled||this.reduced||!obj?.active||this.fx.length>=MAX_FX)return;
      const c=this.s.add.sprite(obj.x,obj.y,obj.texture.key,obj.frame.name).setOrigin(obj.originX,obj.originY).setScale(obj.scaleX,obj.scaleY).setDepth(obj.depth+1).setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
      const fx={sprite:c,key:'flash',start:this.now(),loop:true};this.fx.push(fx);
      this.s.tweens.add({targets:c,alpha:0,duration:ms,onComplete:()=>this.stop(fx)});
    }
    popText(text,x,y,{size=18,color='#ffc41b'}={}){
      const t=this.s.add.text(x,y,text,{fontFamily:'NovelMix',fontSize:size,color}).setOrigin(.5).setStroke('#120a1a',2);this.front.add(t);
      if(!this.reduced){t.setScale(.4);this.s.tweens.add({targets:t,scale:1,duration:220,ease:'Back.Out'});}
      this.s.tweens.add({targets:t,y:y-14,alpha:0,delay:700,duration:300,onComplete:()=>t.destroy()});
      return t;
    }
    flyTo(key,from,to,{size=32,onLand}={}){
      if(!this.enabled)return null;
      const im=this.s.add.image(from.x,from.y,key,this.frameName(key,0)).setDisplaySize(size,size);this.front.add(im);
      const f={im,key,from,to,start:this.now(),dur:460,lift:40,lastTrail:0,onLand};this.flights.push(f);return f;
    }
    advanceFlights(now){
      for(const f of [...this.flights]){
        const k=clamp((now-f.start)/f.dur,0,1),e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;
        const x=f.from.x+(f.to.x-f.from.x)*e,y=f.from.y+(f.to.y-f.from.y)*e-f.lift*Math.sin(Math.PI*e);
        f.im.setPosition(x,y).setFrame(this.frameName(f.key,this.frameAt(f.key,now-f.start,true)));
        if(now-f.lastTrail>30){f.lastTrail=now;this.play('Reward_Trail',x,y,{ui:true,scale:1});}
        if(k>=1){f.im.destroy();this.flights=this.flights.filter(v=>v!==f);f.onLand?.(f.to);}
      }
    }
    // Called at the end of every draw().
    update(){
      const now=this.now(),cam=this.s.cameras.main;
      for(const f of [...this.fx]){if(f.key==='flash')continue;const t=now-f.start,m=this.meta(f.key);
        if(!f.loop&&t>=m.n/m.fps*1000){this.stop(f);f.onDone?.();continue;}
        f.sprite.setFrame(this.frameName(f.key,this.frameAt(f.key,t,f.loop)));}
      this.advanceFlights(now);
      if(now<this.jitterUntil){const p=this.jitterPx;cam.setFollowOffset((this.rand()*2-1)*p,(this.rand()*2-1)*p);}else cam.setFollowOffset(0,0);
      this.updateWorld?.(now);
    }
    // Called from scene.update() only while the real-time sim runs (never from advanceTime).
    realtime(){
      if(this.s.mode==='playing'&&this.unlocks.length&&this.now()>=this.unlockAt&&!this.frozen())this.s.openUnlock(this.unlocks.shift());
    }
  }
  window.SurvivorJuice = SurvivorJuice;
})();
```

- [ ] **Step 4: Wire it into `survivors.js` and `survivors.html`**

`survivors.html`: add `<script src="survivor-fx-manifest.js?v=28"></script><script src="survivor-juice.js?v=28"></script>` before `survivor-hud.js`, and change every `?v=27` to `?v=28`.

`survivors.js`:
- In `preload()`, before the `loaderror` line: `for(const [key,m] of Object.entries(FX_SHEETS))this.load.image(key,m.src);`
- In `create()`, right after `this.ui=new ScrollUI.NativeView(this);...` (before `resetState()` runs), add `this.juice=new SurvivorJuice(this);`.
- Add next to `logEvent`: `reward(kind,data={}){this.events.emit('reward',{kind,...data});} // presentation hook: emits only, changes nothing`
- Replace `update(time,delta){...}` with:

```js
    update(time,delta){
      if(!this.manual&&!window.__vt_pending){
        this.juice.realtime();
        // Hit-stop holds the real-time loop only; STEP and elapsed never stretch and advanceTime is never frozen.
        if(this.juice.frozen())this.accumulator=0;
        else{this.accumulator+=Math.min(delta/1000,.1);while(this.accumulator>=STEP){this.tick(STEP);this.accumulator-=STEP;}}
      }
      this.draw();
    }
```

- In `draw()`, make the first statement after `if(!this.ui)return;` be `this.juice.observe();`, and add `this.juice.update();` right after `this.ui.end();`.
- In `start()`, add `this.juice.reset();` right after `this.resetState();`.
- Add next to `start()`: `openUnlock(type){this.unlockType=type;this.mode='unlock';this.joy=null;this.input.keyboard.resetKeys();this.accumulator=0;this.draw();}` and `closeUnlock(){if(this.mode!=='unlock')return;this.unlockType=null;this.mode='playing';this.accumulator=0;this.draw();}` (the screen arrives in Task 4; the determinism policy already calls `closeUnlock`).

- [ ] **Step 5: Run the check, then the suite**

Run: `GAME_URL=http://127.0.0.1:5174/ node scripts/check-juice.cjs` → `PASS: juice`
Run: `npm run test:survivors 2>&1 | tail -1` → `Survivors: 19/19 checks passed.`

- [ ] **Step 6: Commit**

```bash
git add scripts/build-ui-assets.py survivor-fx-manifest.js assets/fx/vfxmix survivor-juice.js survivors.js survivors.html scripts/check-juice.cjs scripts/test-survivors.cjs
git commit -m "feat(juice): presentation-only juice core, FX manifest and determinism check"
```

---

### Task 2: Upgrade icons, level-up juice and pick flights

**Files:**
- Modify: `scripts/build-ui-assets.py` (upgrade icons), `phaser-ui.js` (`card` badge), `survivors.js` (preload icons, emits, key lock), `survivor-screens.js` (deal-in, lock, icons, `layout.cards`), `survivor-juice.js` (`ownerOf`, level-up and upgrade handlers, aura)
- Create (generated): `assets/icons/upgrades/<id>.png`
- Modify tests: `scripts/check-juice.cjs`, `scripts/check-survivors.cjs`, `scripts/check-ui-foundation.cjs`

**Interfaces:**
- Consumes (Task 1): `play`, `flyTo`, `popText`, `freeze`, `since`, `frameName`, `handlers`, `played`.
- **Produces:**
  - textures `upgrade_<id>` for every offerable id
  - `juice.ownerOf(id) → 'walker'|creature type`
  - `screens.layout.cards: [{x,y,w,h}]` (logical)
  - `NativeView.card(..., {badge})`
  - `scene.reward('levelup',{level})` from `checkLevel()`
  - `scene.reward('upgrade',{id,index})` from `chooseUpgrade()`
  - `SurvivorScreens.LOCK_MS = 370`

- [ ] **Step 1: Add upgrade icons to `scripts/build-ui-assets.py`**

```python
UPGRADE_OUT = ROOT / 'assets/icons/upgrades'
# Every offerable upgrade id -> ('tiny', strip) | ('ninja', Items/ path, static) | ('sheet', artist strip in assets/fx/sheets).
# No icon may repeat or closely resemble another upgrade's or a relic's icon.
UPGRADE_ICONS = {
    'partyDamage': ('tiny', 'sword_02'), 'partySpeed': ('ninja', 'Object/Hourglass.png'),
    'hide': ('tiny', 'armor_02_v1_helmet'), 'feet': ('tiny', 'monster_loot_garden_fly'),
    'sweep': ('ninja', 'Tool/Sickle.png'), 'pull': ('ninja', 'Weapons/Whip/Sprite.png'),
    'marks': ('ninja', 'Projectile/Arrow.png'), 'feather': ('ninja', 'Resource/feather.png'), 'split': ('ninja', 'Projectile/Caltrop.png'),
    'slam': ('ninja', 'Scroll/ScrollRock.png'),
    'bubble': ('ninja', 'Resource/Water.png'), 'frogPower': ('sheet', 'Icon_Bolstering_Croak'), 'chorus': ('ninja', 'Object/PanFlute.png'),
    'mouseCount': ('sheet', 'Icon_Growing_Colony'), 'mouseJump': ('ninja', 'Food/Meat.png'),
    'moleArea': ('ninja', 'Tool/Shovel.png'), 'moleEcho': ('ninja', 'Tool/Hammer.png'), 'moleSlow': ('ninja', 'Tool/Pickaxe.png'),
    'bearArea': ('ninja', 'Weapons/Club/Sprite.png'), 'bearStun': ('sheet', 'Icon_Staggering_Roar'), 'bearGuard': ('ninja', 'Tool/Anvil.png'),
    'fireLife': ('tiny', 'potion_02'), 'fireArea': ('tiny', 'monster_loot_desert_larva'), 'fireSpread': ('tiny', 'food_06'),
    'webWeaken': ('tiny', 'monster_loot_dungeon_flying_skull'), 'webCount': ('tiny', 'food_07'), 'webArea': ('tiny', 'monster_loot_garden_goblin'),
    'webBurst': ('tiny', 'monster_loot_hell_reaper'), 'stormJumps': ('tiny', 'money_gem'), 'stormRange': ('tiny', 'armor_02_v2_legs'),
    'stormStrike': ('tiny', 'monster_loot_snow_impish'), 'comboFire': ('tiny', 'monster_loot_hell_fire_pig'),
    'comboWeb': ('tiny', 'monster_loot_dungeon_rat'), 'comboStorm': ('tiny', 'monster_loot_dungeon_slime'), 'comboShield': ('tiny', 'shield_03'),
}

def static_strip(path):
    """A static 16x16-or-smaller item, centred and repeated 16 times so every icon is a 256x16 strip."""
    im = Image.open(path).convert('RGBA')
    assert im.width <= 16 and im.height <= 16, f'{path} is larger than 16x16'
    strip = Image.new('RGBA', (256, 16))
    for i in range(16):
        strip.alpha_composite(im, (i * 16 + (16 - im.width) // 2, (16 - im.height) // 2))
    return strip
```

In `main()`:

```python
    UPGRADE_OUT.mkdir(parents=True, exist_ok=True)
    for upgrade, (kind, src) in UPGRADE_ICONS.items():
        if kind == 'tiny': im = Image.open(TINY / f'{src}.png').convert('RGBA')
        elif kind == 'sheet': im = Image.open(SHEETS / f'{src}.png').convert('RGBA')
        else: im = static_strip(NINJA / src)
        assert im.size == (256, 16), (upgrade, im.size)
        im.save(UPGRADE_OUT / f'{upgrade}.png')
    upgrade_ids = sorted(UPGRADE_ICONS)
    manifest_ids = 'window.UPGRADE_ICON_IDS=' + json.dumps(upgrade_ids) + ';\n'
```

and append `manifest_ids` to the text written to `survivor-fx-manifest.js`.

Also refactor the existing Pack Sigil block to reuse `static_strip(NINJA / 'Other/Stamp.png')`.

Run: `python3 scripts/build-ui-assets.py && ls assets/icons/upgrades | wc -l` → `35`.

- [ ] **Step 2: Write the failing checks**

In `scripts/check-juice.cjs`, insert before `console.log('PASS: juice');`:

```js
    // --- every offerable upgrade has its own icon, distinct from every other icon ---
    const icons = await open(browser, {width: 1100, height: 760});
    const pool = await state(icons, () => { const s = __survivorTest.scene; s.start();
      for (const t of ['salamander','spider','storm']) s.expedition.release(t, s.player.x + 60, s.player.y, true);
      for (const t of ['mouse','mole','bear']) s.creatures.release(t, s.player.x - 60, s.player.y, true);
      s.expedition.release('owl', s.player.x, s.player.y + 60, true); s.expedition.release('beast', s.player.x, s.player.y - 60, true); s.expedition.release('frog', s.player.x + 90, s.player.y, true);
      const ids = [...new Set(s.upgradePool().map(u => u.id))];
      return {ids, missing: ids.filter(id => !s.textures.exists('upgrade_' + id)), owners: Object.fromEntries(ids.map(id => [id, s.juice.ownerOf(id)]))}; });
    assert.deepEqual(pool.missing, [], 'Every offerable upgrade has an icon texture');
    const hashes = new Map();
    for (const file of [...fs.readdirSync('assets/icons/upgrades').map(f => 'assets/icons/upgrades/' + f), ...fs.readdirSync('assets/icons/relics').map(f => 'assets/icons/relics/' + f)]) {
      const h = require('node:crypto').createHash('sha1').update(fs.readFileSync(file)).digest('hex');
      assert(!hashes.has(h), `${file} reuses the icon of ${hashes.get(h)}`); hashes.set(h, file);
    }
    assert.equal(pool.owners.partyDamage, 'walker'); assert.equal(pool.owners.mouseCount, 'mouse'); assert.equal(pool.owners.fireArea, 'salamander');
    assert(Object.values(pool.owners).every(o => o === 'walker' || ['cat','owl','beast','frog','mouse','mole','bear','salamander','spider','storm'].includes(o)));
    await icons.close();

    // --- level-up: aura, pop, cards deal in with a 370ms lock, icons on cards; pick flies to the owner's slot ---
    const lvl = await open(browser, {width: 390, height: 844}, 'survivors.html?test', {mobile: true});
    await state(lvl, () => { const s = __survivorTest.scene; s.start(); s.spawnTimer = 999; s.xp = s.xpNeeded(); s.checkLevel(); s.draw(); });
    assert(await state(lvl, () => __survivorTest.scene.juice.played.includes('LevelUp_Aura_Ignite_Back')), 'Level-up ignites the aura');
    const cardIcons = await state(lvl, () => { let n = 0; __survivorTest.scene.ui.walk(o => { if (o.type === 'Image' && o.visible && /^upgrade_/.test(o.texture.key)) n++; }); return n; });
    assert.equal(cardIcons, 3, 'Each level-up card shows its upgrade icon');
    const label = await state(lvl, () => '1. ' + __survivorTest.scene.choices[0].name), pick = await state(lvl, () => __survivorTest.scene.choices[0].id);
    let p = await controlPoint(lvl, label);
    await lvl.touchscreen.tap(p.x, p.y);
    assert.equal(await state(lvl, () => __survivorTest.scene.mode), 'upgrade', 'Taps inside the 370ms deal-in are ignored');
    await wait(420); p = await controlPoint(lvl, label);
    await lvl.screenshot({path: 'output/juice/levelup.png'});
    await lvl.touchscreen.tap(p.x, p.y);
    const after = await state(lvl, id => { const s = __survivorTest.scene, f = s.juice.flights[0], owner = s.juice.ownerOf(id), slot = s.hud.layout.slots.find(v => v.type === owner) || s.hud.layout.slots[0];
      return {mode: s.mode, flights: s.juice.flights.length, frozen: s.juice.frozen(), to: f && [Math.round(f.to.x), Math.round(f.to.y)], slot: [slot.x + 24, slot.y + 26]}; }, pick);
    assert.equal(after.mode, 'playing'); assert.equal(after.flights, 1, 'The picked icon flies'); assert.equal(after.frozen, true, '260ms hold after the pick');
    assert.deepEqual(after.to, after.slot, "It flies to the owner's party slot");
    await wait(700);
    assert(await state(lvl, () => __survivorTest.scene.juice.played.includes('Slot_PowerUp')), 'The slot powers up when the icon lands');
    assert.deepEqual(lvl.errors, []);
    await lvl.close();
```

In `scripts/check-survivors.cjs`, before `const point=await controlPoint(mobile,upgrade.label);` add `await mobile.waitForTimeout(420); // level-up cards lock input while they deal in`.

In `scripts/check-ui-foundation.cjs`, in the Task 5 loop, before `const p = await controlPoint(page, pick.label);` add `await page.waitForTimeout(420);`.

Run: `GAME_URL=http://127.0.0.1:5174/ node scripts/check-juice.cjs`
Expected: FAIL at `Every offerable upgrade has an icon texture` (textures not loaded yet).

- [ ] **Step 3: Preload icons and emit the two rewards**

`survivors.js` `preload()`: `for(const id of UPGRADE_ICON_IDS)this.load.image('upgrade_'+id,'assets/icons/upgrades/'+id+'.png');`

In `checkLevel()`, after `this.logEvent('level_up',...)` add `this.reward('levelup',{level:this.level});`.
In `chooseUpgrade(index)`, after the `hide` line (after the upgrade is applied) add `this.reward('upgrade',{id,index});`.
In the key handler line in `create()` replace `:this.chooseUpgrade(i-1)` with `:(this.juice.since('upgrade')>=SurvivorScreens.LOCK_MS&&this.chooseUpgrade(i-1))`.

- [ ] **Step 4: `card` badge in `phaser-ui.js`**

Change the `card` signature to add `badge`, and after the icon line add:

```js
      if (icon && badge) this.image(badge,x+26,y+(height-32)/2+20,14,14,{frame:[3,3,32,32]});
```

(`{detail,icon,iconFrame=[0,0,16,16],badge,color=DARK.text,size=9,align='left',id}={}`)

- [ ] **Step 5: Level-up screen deal-in, lock and icons in `survivor-screens.js`**

Replace `upgrade(w,h){...}` with:

```js
    upgrade(w,h){
      const s=this.s,ui=s.ui,cardH=58,{px,py,pw}=this.choicePanel(w,h,'LEVEL UP','Level '+s.level+' · combat paused',s.choices.length,cardH);
      const t=s.juice.since('upgrade');this.layout.cards=[];
      s.choices.forEach((c,i)=>{
        // Deal in: each card rises 14px and fades in, 70ms apart. Taps before LOCK_MS are ignored.
        const k=s.juice.reduced?1:Math.max(0,Math.min(1,(t-i*70)/180)),e=1-Math.pow(1-k,3),x=px+8,y=py+32+i*(cardH+6);
        ui.beginGroup('upcard'+i,{y:Math.round((1-e)*14)}).setAlpha(e);
        const owner=s.juice.ownerOf(c.id);
        ui.card((i+1)+'. '+c.name,x,y,pw-16,cardH,()=>{if(s.juice.since('upgrade')>=SurvivorScreens.LOCK_MS)s.chooseUpgrade(i);},
          {detail:c.detail,icon:'upgrade_'+c.id,badge:owner==='walker'?null:'face_'+owner,id:'up'+i});
        ui.endGroup();
        this.layout.cards.push({x,y,w:pw-16,h:cardH});
      });
    }
```

Add after the class body, before `window.SurvivorScreens = ...`: `SurvivorScreens.LOCK_MS = 370;`

- [ ] **Step 6: Juice handlers for level-up and upgrade in `survivor-juice.js`**

Add to the class:

```js
    ownerOf(id){
      if(/^mouse/.test(id))return 'mouse';if(/^mole/.test(id))return 'mole';if(/^bear/.test(id))return 'bear';
      if(/^fire|^comboFire/.test(id))return 'salamander';if(/^web|^comboWeb|^comboShield/.test(id))return 'spider';if(/^storm|^comboStorm/.test(id))return 'storm';
      if(['sweep','pull','claws'].includes(id))return 'cat';if(['marks','feather','split','owlPower','owlSpeed'].includes(id))return 'owl';
      if(/^beast|^slam$/.test(id))return 'beast';if(['bubble','frogPower','chorus'].includes(id))return 'frog';
      return 'walker';
    }
    slotPoint(type){const slots=this.s.hud.layout.slots,slot=slots.find(v=>v.type===type)||slots[0];return {x:slot.x+24,y:slot.y+26};}
    onLevelUp(e){
      this.aura={phase:'Ignite',start:this.now()};this.note('LevelUp_Aura_Ignite_Back');
      const p=this.s.toUI(this.s.player.x,this.s.player.y);this.popText('LEVEL '+e.level,p.x,p.y-40);
    }
    onUpgrade(e){
      const card=this.s.screens.layout.cards?.[e.index];if(!card)return;
      this.freeze(260);
      const to=this.slotPoint(this.ownerOf(e.id));
      this.flyTo('upgrade_'+e.id,{x:card.x+24,y:card.y+card.h/2},to,{onLand:p=>this.play('Slot_PowerUp',p.x,p.y,{ui:true,scale:1})});
    }
    // Aura: Ignite once, Loop while the level-up screen is up, then Fade once.
    updateAura(now){
      const a=this.aura;if(!a){this.auraSprites?.forEach(s=>s.setVisible(false));return;}
      const s=this.s,p=s.player,key=b=>'LevelUp_Aura_'+a.phase+'_'+b,t=now-a.start,m=this.meta(key('Back'));
      if(!m.loop&&t>=m.n/m.fps*1000){if(a.phase==='Ignite')this.aura={phase:'Loop',start:now};else if(a.phase==='Fade')this.aura=null;return this.updateAura(now);}
      if(a.phase==='Loop'&&s.mode!=='upgrade'){this.aura={phase:'Fade',start:now};return this.updateAura(now);}
      this.auraSprites??=[s.add.sprite(0,0,key('Back')),s.add.sprite(0,0,key('Front'))];
      ['Back','Front'].forEach((b,i)=>{const sp=this.auraSprites[i],k=key(b),mm=this.meta(k);
        sp.setVisible(this.enabled).setTexture(k,this.frameName(k,this.frameAt(k,t))).setOrigin(mm.ax/mm.fw,mm.ay/mm.fh).setScale(3).setPosition(p.x,p.y+24).setDepth(p.y+(i?21:19));});
    }
```

In the constructor after `this.handlers={};`: `this.handlers.levelup=e=>this.onLevelUp(e);this.handlers.upgrade=e=>this.onUpgrade(e);`.
In `reset()` add `this.aura=null;`.
In `update()` before `this.updateWorld?.(now);` add `this.updateAura(now);`.

- [ ] **Step 7: Run everything**

Run: `GAME_URL=http://127.0.0.1:5174/ node scripts/check-juice.cjs` → `PASS: juice`
Run: `npm run test:survivors 2>&1 | tail -1` → `19/19`
Look at `output/juice/levelup.png`: card icons with a small faceset badge on creature upgrades.

- [ ] **Step 8: Commit**

```bash
git add scripts/build-ui-assets.py survivor-fx-manifest.js assets/icons/upgrades phaser-ui.js survivors.js survivor-screens.js survivor-juice.js scripts/check-juice.cjs scripts/check-survivors.cjs scripts/check-ui-foundation.cjs
git commit -m "feat(juice): upgrade icons, level-up aura and deal-in, pick flights to party slots"
```

---

### Task 3: Capture rings, fill and capture burst

**Files:**
- Modify: `survivors.js:343-344`, `survivor-creatures.js:29`, `survivor-encounters.js:138`, `survivor-expedition.js:39-46,90-91`, `survivor-juice.js`
- Test: `scripts/check-juice.cjs`

**Interfaces:**
- Consumes: `play`, `freeze`, `flyTo`, `slotPoint`, `frameName`, `frameAt`.
- **Produces:**
  - `scene.reward('capture',{type,x,y})` when a body becomes an ally
  - `juice.rings[id] = {ring, fill}` (id = creature type or `'shrine'`)
  - `juice.ring(id, x, y, fill01, {tint, alpha})`, called per frame from `updateWorld`

- [ ] **Step 1: Write the failing capture checks**

Insert before `console.log('PASS: juice');`:

```js
    // --- capture: sheet ring + fill replace the drawn arc; completion bursts and flies the faceset home ---
    const cap = await open(browser, {width: 390, height: 844}, 'survivors.html?test', {mobile: true});
    const ring = await state(cap, () => { const s = __survivorTest.scene; s.start(); s.spawnTimer = 999;
      s.expedition.release('mouse', s.player.x + 20, s.player.y, false); advanceTime(1250); s.draw();
      const r = s.juice.rings.mouse; return r && {visible: r.ring.visible && r.fill.visible, fill: r.fill.frame.name, progress: s.creatures.allies.mouse.progress}; });
    assert(ring && ring.visible, 'A capture-ready creature shows the sheet ring and fill');
    assert.equal(ring.fill, 'f' + Math.round(ring.progress / 2.5 * 16), 'Fill frame follows capture progress');
    const done = await state(cap, () => { const s = __survivorTest.scene; advanceTime(1400); s.draw();
      return {state: s.creatures.allies.mouse.state, burst: s.juice.played.includes('Capture_Burst'), froze: s.juice.frozenUntil > 0, ringGone: !s.juice.rings.mouse?.ring.visible}; });
    assert.deepEqual(done, {state: 'ally', burst: true, froze: true, ringGone: true});
    await wait(1300);
    assert(await state(cap, () => __survivorTest.scene.juice.played.includes('Slot_PowerUp')), 'The faceset lands in the party bar');
    await cap.screenshot({path: 'output/juice/capture.png'});
    assert.deepEqual(cap.errors, []);
    await cap.close();
```

Run it. Expected: FAIL at `A capture-ready creature shows the sheet ring and fill` (`juice.rings.mouse` undefined).

- [ ] **Step 2: Remove the drawn capture rings and arcs**

Replace exactly:
- **`survivors.js`:**
  - `this.fx.lineStyle(3,o.state==='ally'?0x8ee0df:0xffd36b,.9).strokeCircle(o.x,o.y,o.state==='ready'?70:24);` becomes `if(o.state!=='ready')this.fx.lineStyle(3,o.state==='ally'?0x8ee0df:0xffd36b,.9).strokeCircle(o.x,o.y,24);`
  - Delete the next statement, `if(o.state==='ready'){this.fx.lineStyle(6,0x8ee0df,1).beginPath().arc(o.x,o.y,70,-Math.PI/2,-Math.PI/2+Math.PI*2*o.progress/2.5,false).strokePath();}`.
- **`survivor-creatures.js`:** `g.lineStyle(2,0x8ee0df,.8).strokeCircle(a.x,a.y,a.state==='ready'?70:25);if(a.state==='ready')g.lineStyle(5,0xffd36b).beginPath().arc(a.x,a.y,70,-Math.PI/2,-Math.PI/2+Math.PI*2*a.progress/2.5).strokePath();` becomes `if(a.state!=='ready')g.lineStyle(2,0x8ee0df,.8).strokeCircle(a.x,a.y,25);`
- **`survivor-encounters.js`:** `g.lineStyle(3,0x83d9ff).strokeCircle(b.x,b.y,b.state==='ready'?70:23);if(b.state==='ready')g.lineStyle(6,0xffd36b).beginPath().arc(b.x,b.y,70,-Math.PI/2,-Math.PI/2+Math.PI*2*b.progress/2.5,false).strokePath();` becomes `if(b.state!=='ready')g.lineStyle(3,0x83d9ff).strokeCircle(b.x,b.y,23);`
- **`survivor-expedition.js`:**
  - `g.lineStyle(2,0x8ce7ae).strokeCircle(f.x,f.y,f.state==='ready'?70:23);` becomes `if(f.state!=='ready')g.lineStyle(2,0x8ce7ae).strokeCircle(f.x,f.y,23);`
  - Delete `if(this.catCapture)g.lineStyle(3,0x8ce7ae).strokeCircle(this.catCapture.x,this.catCapture.y,70);`.

- [ ] **Step 3: Emit the capture**

In `survivor-expedition.js` `capture()`, at the end of the method (after `s.saveRun();`), add `s.reward('capture',{type,x:body.x,y:body.y});`.

- [ ] **Step 4: Rings and the capture handler in `survivor-juice.js`**

```js
    // Sheet ring + fill at 3x in the world. Ids not drawn this frame are hidden (mark and sweep).
    ring(id,x,y,fill01,{tint=0xffffff,alpha=1}={}){
      const now=this.now();let r=this.rings[id];
      if(!r){const m=this.meta('Capture_Ring');r=this.rings[id]={ring:this.s.add.sprite(0,0,'Capture_Ring',this.frameName('Capture_Ring',0)).setOrigin(m.ax/m.fw,m.ay/m.fh).setScale(3),
        fill:this.s.add.sprite(0,0,'Capture_Fill',this.frameName('Capture_Fill',0)).setOrigin(m.ax/m.fw,m.ay/m.fh).setScale(3)};}
      r.seen=true;
      r.ring.setVisible(true).setPosition(x,y).setDepth(y-3).setTint(tint).setAlpha(alpha).setFrame(this.frameName('Capture_Ring',this.frameAt('Capture_Ring',now,true)));
      r.fill.setVisible(fill01>0).setPosition(x,y).setDepth(y-2).setAlpha(alpha).setFrame(this.frameName('Capture_Fill',Math.round(clamp(fill01,0,1)*16)));
    }
    updateWorld(now){
      for(const r of Object.values(this.rings))r.seen=false;
      if(this.enabled)for(const type of ['cat','owl','beast','frog','mouse','mole','bear','salamander','spider','storm']){
        const b=this.s.expedition.captureBody(type);if(b?.state==='ready')this.ring(type,b.x,b.y,b.progress/2.5);}
      this.updateShrine?.(now);
      for(const r of Object.values(this.rings))if(!r.seen){r.ring.setVisible(false);r.fill.setVisible(false);}
    }
    onCapture(e){
      this.play('Capture_Burst',e.x,e.y+20,{depth:e.y+30});this.freeze(90);
      const p=this.s.toUI(e.x,e.y-30),face=this.s.add.image(p.x,p.y,'face_'+e.type).setDisplaySize(38,38);this.front.add(face);
      if(!this.reduced){face.setScale(face.scaleX*.3);this.s.tweens.add({targets:face,scaleX:face.scaleX/.3,scaleY:face.scaleY/.3,duration:260,ease:'Back.Out'});}
      this.s.time.delayedCall(500,()=>{if(!face.active)return;const from={x:face.x,y:face.y};face.destroy();
        this.flyTo('face_'+e.type,from,this.slotPoint(e.type),{size:32,onLand:q=>this.play('Slot_PowerUp',q.x,q.y,{ui:true,scale:1})});});
    }
```

`flyTo` with a faceset key uses `meta()`. Facesets are 38×38, so add the frame case: in `meta(key)`, before the 16×16 fallback, add `if(/^face_/.test(key))return {fw:38,fh:38,n:1,fps:1,loop:true,ax:19,ay:19};`.

In the constructor register `this.handlers.capture=e=>this.onCapture(e);`.

- [ ] **Step 5: Run everything**

Run: `GAME_URL=http://127.0.0.1:5174/ node scripts/check-juice.cjs` → `PASS: juice`
Run: `npm run test:survivors 2>&1 | tail -1` → `19/19`
Look at `output/juice/capture.png`.

- [ ] **Step 6: Commit**

```bash
git add survivors.js survivor-creatures.js survivor-encounters.js survivor-expedition.js survivor-juice.js scripts/check-juice.cjs
git commit -m "feat(juice): capture ring and fill sheets, capture burst and faceset flight"
```

---

### Task 4: Starter unlock screen

**Files:**
- Modify: `survivor-expedition.js:14` (`unlock` returns and emits), `survivor-juice.js`, `survivor-screens.js`, `survivors.js` (ENTER handler, screen routing)
- Test: `scripts/check-juice.cjs`

**Interfaces:**
- Consumes: `openUnlock`/`closeUnlock` (Task 1), `realtime()`, `since`, `frameRect`, `frameAt`.
- **Produces:**
  - `expedition.unlock(type) → bool` (true only when newly unlocked)
  - `scene.reward('unlock',{type})`
  - `screens.unlock(w,h)`
  - A `Continue` card that closes the screen after 900ms

- [ ] **Step 1: Write the failing unlock checks**

Insert before `console.log('PASS: juice');`:

```js
    // --- starter unlock: a newly unlocked creature stops the real-time game until Continue ---
    const un = await open(browser, {width: 390, height: 844}, 'survivors.html?test', {mobile: true, realtime: true, starters: ['cat']});
    await state(un, () => { const s = __survivorTest.scene; s.start(); s.spawnTimer = 999; s.player.inv = 999; s.expedition.release('mouse', s.player.x + 20, s.player.y, false); });
    await un.waitForFunction(() => __survivorTest.scene.mode === 'unlock', null, {timeout: 6000});
    assert.equal(await state(un, () => __survivorTest.scene.unlockType), 'mouse');
    const t0 = await state(un, () => __survivorTest.scene.elapsed); await wait(300);
    assert.equal(await state(un, () => __survivorTest.scene.elapsed), t0, 'The game is stopped behind the unlock screen');
    await state(un, () => window.dispatchEvent(new Event('blur')));
    assert.equal(await state(un, () => __survivorTest.scene.mode), 'unlock', 'Blur does not break the unlock screen');
    await wait(900);
    assert.deepEqual(await offscreenTexts(un), [], 'Unlock screen fits');
    await un.screenshot({path: 'output/juice/unlock.png'});
    const cont = await controlPoint(un, 'Continue');
    await un.touchscreen.tap(cont.x, cont.y);
    assert.equal(await state(un, () => __survivorTest.scene.mode), 'playing');
    assert.deepEqual(un.errors, []);
    await un.close();

    // --- an already-unlocked creature never opens the screen; a same-tick level-up shows first ---
    const known = await open(browser, {width: 1100, height: 760}, 'survivors.html?test', {realtime: true, starters: ['cat', 'mouse']});
    await state(known, () => { const s = __survivorTest.scene; s.start(); s.spawnTimer = 999; s.player.inv = 999; s.expedition.release('mouse', s.player.x + 20, s.player.y, false); });
    await wait(4000);
    assert.equal(await state(known, () => __survivorTest.scene.mode), 'playing', 'No unlock screen for an already-unlocked starter');
    await known.close();
    const both = await open(browser, {width: 1100, height: 760}, 'survivors.html?test', {realtime: true, starters: ['cat']});
    await state(both, () => { const s = __survivorTest.scene; s.start(); s.spawnTimer = 999; s.player.inv = 999; s.expedition.release('mouse', s.player.x + 20, s.player.y, false); s.creatures.allies.mouse.progress = 2.45; s.xp = s.xpNeeded() - 1; s.gainXP(5, false); });
    await both.waitForFunction(() => ['upgrade', 'unlock'].includes(__survivorTest.scene.mode), null, {timeout: 4000});
    assert.equal(await state(both, () => __survivorTest.scene.mode), 'upgrade', 'Level-up shows first');
    await wait(420); await state(both, () => __survivorTest.scene.chooseUpgrade(0));
    await both.waitForFunction(() => __survivorTest.scene.mode === 'unlock', null, {timeout: 4000});
    await both.close();
```

(`gainXP(amount, bonus)` is the existing XP entry point used by `completeShrine`; if it opens the level-up only on the next tick, the `waitForFunction` covers it.)

Run it. Expected: FAIL waiting for `mode === 'unlock'` (timeout).

- [ ] **Step 2: `unlock()` reports and emits**

In `survivor-expedition.js` replace `unlock(type){const s=this.s;if(s.unlocked.includes(type))return;` with `unlock(type){const s=this.s;if(s.unlocked.includes(type))return false;`, and at the end of that method (after the `logEvent`) add `s.reward('unlock',{type});return true;`.

- [ ] **Step 3: Queue in the juice**

In `survivor-juice.js` add `onUnlock(e){this.unlocks.push(e.type);this.unlockAt=this.now()+900;}` and register `this.handlers.unlock=e=>this.onUnlock(e);`. Disabled juice never queues, so it never opens the screen; the unlock itself (the starter list) already happened in the simulation.

- [ ] **Step 4: The screen**

`survivor-screens.js` `draw()` add `else if(s.mode==='unlock')this.unlock(w,h);`, and the method:

```js
    unlock(w,h){
      const s=this.s,ui=s.ui,j=s.juice,type=s.unlockType,t=j.since('unlock'),cx=w/2,cy=h/2-40;
      this.dim(w,h);ui.banner('NEW STARTER',cx,cy-150);
      ui.image('Unlock_Rays',cx-96,cy-96,192,192,{frame:j.frameRect('Unlock_Rays',j.frameAt('Unlock_Rays',t,true))});
      const fillAt=400,fillEnd=fillAt+j.meta('Unlock_Fill').n/j.meta('Unlock_Fill').fps*1000;
      const face=ui.image('face_'+type,cx-38,cy-38,76,76);if(face){if(t<fillEnd)face.setTint(0x2a2238);else face.clearTint();}
      if(t>=fillAt&&t<fillEnd)ui.image('Unlock_Fill',cx-48,cy-48,96,96,{frame:j.frameRect('Unlock_Fill',j.frameAt('Unlock_Fill',t-fillAt,false))});
      const name=type==='storm'?'STORM LIZARD':String(type).toUpperCase();
      ui.darkText(t<fillEnd?'???':name,cx,cy+64,{size:18,align:'center'});
      ui.darkText('Now available as a starter',cx,cy+86,{align:'center',color:ScrollUI.DARK.muted});
      if(t>=900)this.button('Continue',cx-60,cy+106,120,26,()=>s.closeUnlock(),'continue');
    }
```

`survivors.js`:
- In the screen routing list, add `'unlock'`: `['title','paused','won','lost','upgrade','relic','unlock']`.
- In the ENTER handler, add `else if(this.mode==='unlock')this.closeUnlock();`.

- [ ] **Step 5: Run everything**

Run: `GAME_URL=http://127.0.0.1:5174/ node scripts/check-juice.cjs` → `PASS: juice`
Run: `npm run test:survivors 2>&1 | tail -1` → `19/19`
Look at `output/juice/unlock.png`: rays behind the faceset, NEW STARTER banner, name, Continue.

- [ ] **Step 6: Commit**

```bash
git add survivor-expedition.js survivor-juice.js survivor-screens.js survivors.js scripts/check-juice.cjs
git commit -m "feat(juice): starter unlock screen with rays and faceset reveal"
```

---

### Task 5: Shrine states, crack and shatter

**Files:**
- Modify: `survivor-expedition.js:10,80-83,92-93`, `survivor-juice.js`
- Test: `scripts/check-juice.cjs`

**Interfaces:**
- Consumes: `ring`, `play`, `flashCopy`, `freeze`, `jitter`, `rand`, `frameName`.
- **Produces:**
  - `scene.reward('shrine',{tier,final,x,y})` from `completeShrine`
  - `expedition.shrineSprite` using `ShrineStates` with frame = completed
  - `juice.chunks`: the live shard and rubble count, for tests

- [ ] **Step 1: Write the failing shrine checks**

Insert before `console.log('PASS: juice');`:

```js
    // --- shrine: state frames, capture-ring placeholder, crack on clears 1-2, shatter on clear 3 ---
    const sh = await open(browser, {width: 1100, height: 760});
    const frames2 = await state(sh, () => { const s = __survivorTest.scene, e = s.expedition; s.start(); s.elapsed = 120; const out = [];
      for (let c = 0; c <= 3; c++) { e.shrine.completed = c; e.shrine.done = c === 3; s.draw(); out.push(e.shrineSprite.frame.name); }
      e.shrine.completed = 0; e.shrine.done = false; e.shrine.active = true; e.shrine.progress = 3; s.draw();
      return {out, ring: s.juice.rings.shrine?.fill.frame.name}; });
    assert.deepEqual(frames2.out, ['f0', 'f1', 'f2', 'f3'], 'ShrineStates frame = challenges completed');
    assert.equal(frames2.ring, 'f8', 'Shrine charge fill = round(progress/6*16)');
    const crack = await state(sh, () => { const s = __survivorTest.scene, e = s.expedition; s.juice.played.length = 0;
      e.shrine.inCombat = true; e.completeShrine({shrineTier: 1}); s.draw(); return {chunks: s.juice.chunks, spark: s.juice.played.includes('Spark_Light')}; });
    assert(crack.chunks >= 3 && crack.chunks <= 6 && !crack.spark, 'A first clear cracks with a few shards and no light burst');
    const shatter = await state(sh, () => { const s = __survivorTest.scene, e = s.expedition; e.shrine.completed = 2; e.shrine.inCombat = true; e.shrine.needsExit = false;
      e.completeShrine({shrineTier: 3}); s.draw(); return {chunks: s.juice.chunks, spark: s.juice.played.includes('Spark_Light'), frame: e.shrineSprite.frame.name, frozen: s.juice.frozenUntil > 0}; });
    assert(shatter.chunks >= 15 && shatter.spark && shatter.frame === 'f3' && shatter.frozen, 'The third clear shatters');
    await sh.screenshot({path: 'output/juice/shrine-shatter.png'});
    await wait(1600);
    assert.equal(await state(sh, () => __survivorTest.scene.juice.chunks), 0, 'Shards and rubble clean up');
    assert.deepEqual(sh.errors, []);
    await sh.close();
```

Run it. Expected: FAIL (`frame.name` is the old `shrineAltar` frame).

- [ ] **Step 2: The shrine sprite, ring and emit in `survivor-expedition.js`**

- **Constructor:** replace `this.shrineSprite=s.add.sprite(s.worldSize/2,s.worldSize*.2625-12,'dungeonProps','shrineAltar').setScale(3).setDepth(425).setVisible(false);` with `this.shrineSprite=s.add.sprite(s.worldSize/2,s.worldSize*.2625+30,'ShrineStates',s.juice.frameName('ShrineStates',0)).setOrigin(.5,31/32).setScale(3).setDepth(425).setVisible(false);`
- **`draw()`:**
  - Replace `this.shrineSprite.setVisible(s.isExpedition&&s.elapsed>=90).setTint(sh.done?0x66716e:sh.inCombat?0xffa066:0xffffff);` with `this.shrineSprite.setVisible(s.isExpedition&&s.elapsed>=90).setFrame(s.juice.frameName('ShrineStates',sh.completed)).setTint(sh.inCombat?0xffd8b0:0xffffff);`
  - Delete the whole `if(s.isExpedition&&s.elapsed>=90){g.lineStyle(3,...).strokeCircle(sh.x,sh.y,70);for(...)...fillCircle(...);if(sh.progress>0)...strokePath();}` block. The juice draws the ring and the sprite carries the state.
- **`completeShrine()`:** after the `logEvent('shrine_completed',...)` statement add `s.reward('shrine',{tier:sh.completed,final:sh.done,x:sh.x,y:sh.y});`.

- [ ] **Step 3: Shrine ring, crack and shatter in `survivor-juice.js`**

```js
    updateShrine(now){
      const s=this.s,sh=s.expedition.shrine;if(!this.enabled||!s.isExpedition||s.elapsed<90)return;
      this.ring('shrine',sh.x,sh.y,sh.done?0:sh.progress/6,{tint:sh.done?0x66716e:sh.inCombat?0xffa066:0xffffff,alpha:sh.done?.35:1});
    }
    // A pixel chunk flung on an arc, landing below its start, then blinking out. No rotation keeps it on the pixel grid.
    chunk(key,x,y,{dist=[50,130],lift=[40,90],sizes=[2,6]}={}){
      if(this.fx.length>=MAX_FX)return;
      const r=(a,b)=>a+this.rand()*(b-a),sp=this.s.add.sprite(x,y,key,this.frameName(key,Math.floor(r(sizes[0],sizes[1])))).setScale(3).setDepth(y+40).setFlipX(this.rand()<.5);
      const fx={sprite:sp,key:'flash',start:this.now(),loop:true};this.fx.push(fx);this.chunks++;
      const a=r(0,Math.PI*2),dx=Math.cos(a)*r(dist[0],dist[1]),land=r(8,26)+Math.max(0,Math.sin(a))*20,h=r(lift[0],lift[1]),dur=r(560,820);
      this.s.tweens.addCounter({from:0,to:1,duration:dur,onUpdate:tw=>{const t=tw.getValue(),k=Math.min(1,t/.75);sp.setPosition(x+dx*k,y-4*h*k*(1-k)+land*k);sp.setAlpha(t<.86?1:(Math.floor(t*25)%2?0:1));},
        onComplete:()=>{this.stop(fx);this.chunks--;}});
    }
    onShrine(e){
      const sp=this.s.expedition.shrineSprite,cx=e.x,cy=sp.y-60;
      this.flashCopy(sp,e.final?180:120);
      if(e.final){this.freeze(110);this.jitter(3,200);this.play('Spark_Light',cx,cy,{scale:1,depth:sp.depth+2});}
      for(let i=0;i<(e.final?14:4);i++)this.chunk('P_Shard',cx+(this.rand()*16-8),cy+(this.rand()*16-10),e.final?{sizes:i<4?[2,3]:[3,6]}:{dist:[24,56],lift:[20,40],sizes:[3,6]});
      if(e.final)for(let i=0;i<6;i++)this.chunk('P_Rock',cx+(this.rand()*24-12),sp.y-6,{dist:[30,80],lift:[16,40],sizes:[3,6]});
    }
```

Register `this.handlers.shrine=e=>this.onShrine(e);`. In `reset()` add `this.chunks=0;`.

- [ ] **Step 4: Run everything**

Run: `GAME_URL=http://127.0.0.1:5174/ node scripts/check-juice.cjs` → `PASS: juice`
Run: `npm run test:survivors 2>&1 | tail -1` → `19/19`. `check-expedition` covers the shrine flow.
Look at `output/juice/shrine-shatter.png`.

- [ ] **Step 5: Commit**

```bash
git add survivor-expedition.js survivor-juice.js scripts/check-juice.cjs
git commit -m "feat(juice): shrine state sprite, capture-ring placeholder, crack and shatter"
```

---

### Task 6: Live creature charge bars and robustness

**Files:**
- Modify: `survivor-hud.js` (`chargeOf`, slot `charge`)
- Test: `scripts/check-juice.cjs`

**Interfaces:**
- Consumes: HUD `layout.slots` (Phase 1), `juice.reset`, `juice.reduced`.
- **Produces:**
  - `hud.chargeOf(type) → 0..1`
  - `layout.slots[i].charge`

- [ ] **Step 1: Write the failing checks**

Insert before `console.log('PASS: juice');`:

```js
    // --- creature charge bars follow their attack timers ---
    const ch = await open(browser, {width: 390, height: 844}, 'survivors.html?test', {mobile: true});
    const charge = await state(ch, () => { const s = __survivorTest.scene; s.start(); s.cat.attack = .85; s.draw(); const a = s.hud.layout.slots[1].charge; s.cat.attack = 0; s.draw(); return [a, s.hud.layout.slots[1].charge]; });
    assert.deepEqual(charge, [0, 1], 'The cat slot empties after an attack and refills');
    // --- restart mid-effect clears everything ---
    const clean = await state(ch, () => { const s = __survivorTest.scene; s.xp = s.xpNeeded(); s.checkLevel(); s.draw(); s.juice.freeze(5000);
      s.juice.flyTo('relic_veil', {x: 0, y: 0}, {x: 100, y: 100}); s.juice.unlocks.push('mouse'); s.start(); s.draw();
      return {fx: s.juice.fx.length, flights: s.juice.flights.length, frozen: s.juice.frozen(), aura: s.juice.aura, unlocks: s.juice.unlocks.length}; });
    assert.deepEqual(clean, {fx: 0, flights: 0, frozen: false, aura: null, unlocks: 0}, 'Restart clears juice state');
    // --- reward spam stays bounded ---
    const spam = await state(ch, () => { const s = __survivorTest.scene; for (let i = 0; i < 40; i++) { s.reward('capture', {type: 'mouse', x: s.player.x, y: s.player.y}); s.reward('shrine', {tier: 3, final: true, x: s.player.x, y: s.player.y}); } s.draw(); return s.juice.fx.length; });
    assert(spam <= 60, `Live juice sprites stay bounded (${spam})`);
    await wait(2500);
    assert.equal(await state(ch, () => { const s = __survivorTest.scene; s.draw(); return s.juice.fx.length + s.juice.flights.length; }), 0, 'Everything cleans up');
    assert.deepEqual(ch.errors, []);
    await ch.close();
    // --- reduced motion: no freeze or shake, flows still complete ---
    const rm = await open(browser, {width: 1100, height: 760}, 'survivors.html?test', {realtime: true, reducedMotion: 'reduce', starters: ['cat']});
    await state(rm, () => { const s = __survivorTest.scene; s.start(); s.spawnTimer = 999; s.player.inv = 999; s.expedition.release('mouse', s.player.x + 20, s.player.y, false); });
    await rm.waitForFunction(() => __survivorTest.scene.mode === 'unlock', null, {timeout: 6000});
    assert.equal(await state(rm, () => __survivorTest.scene.juice.frozen()), false, 'Reduced motion never freezes');
    await state(rm, () => __survivorTest.scene.closeUnlock());
    assert.equal(await state(rm, () => __survivorTest.scene.mode), 'playing');
    await rm.close();
```

Run it. Expected: FAIL at `The cat slot empties after an attack and refills` (creature slots report a constant 1, and `charge` is undefined).

- [ ] **Step 2: `chargeOf` in `survivor-hud.js`**

Add the method:

```js
    // 0 right after an attack, 1 when ready. Reads timers only.
    chargeOf(type){
      const s=this.s,k=(t,i)=>i>0?1-clamp(t/i,0,1):1;
      if(type==='walker')return 1-clamp(s.expansion.cooldown/3,0,1);
      if(type==='cat')return k(s.cat.attack,.85);
      if(type==='owl')return s.owl?k(s.owl.attack,s.companionStats().owl.interval):1;
      if(type==='beast'){const b=s.encounters.beast;return b?k(b.attack,s.companionStats().beast.interval):1;}
      if(type==='frog'){const f=s.expedition.frog;return f?k(f.pulseClock,s.frogStats().shieldInterval):1;}
      const a=s.creatures.allies[type];return a?k(a.attack,s.creatures.stats(type).interval):1;
    }
```

In `partyBar`:
- Replace `const charge=i===0?1-clamp(s.expansion.cooldown/3,0,1):1,bh=Math.round(34*charge);` with `const charge=this.chargeOf(type),bh=Math.round(34*charge);this.layout.slots[i].charge=charge;`.
- Push the slot with `charge:0` before that (the existing `push({type,x,y,w,h})` stays; the assignment adds the field).

- [ ] **Step 3: Run everything**

Run: `GAME_URL=http://127.0.0.1:5174/ node scripts/check-juice.cjs` → `PASS: juice`
Run: `npm run test:survivors 2>&1 | tail -1` → `19/19`

- [ ] **Step 4: Commit**

```bash
git add survivor-hud.js scripts/check-juice.cjs
git commit -m "feat(juice): live creature charge bars; restart, reduced-motion and spam checks"
```

---

### Task 7: Docs and final verification

**Files:** `docs/superpowers/specs/2026-09-28-reward-juice-design.md`, `UI_STYLE_GUIDE.md`

- [ ] **Step 1: Spec wording.**
  - Rule 1: replace "Cosmetic randomness uses `Math.random()`, never the seeded `this.rand()`." with "Cosmetic randomness uses the juice module's own RNG. Never the seeded `this.rand()`, and never `Math.random()`, which the simulation itself uses for den, chest and nest placement. Never Phaser's `camera.shake()` either, which calls `Math.random()`."
  - Rule 3: replace "Hit-stop and reveal screens stop `tick()` the way the level-up screen does today." with "Hit-stop holds the real-time loop in `update()`; the starter unlock screen uses `mode='unlock'`, opened from the real-time loop. Neither affects `window.advanceTime`."
- [ ] **Step 2: `UI_STYLE_GUIDE.md`.** Add a `### Juice (survivor-juice.js)` section under Survivors with these rules:
  - Sheets come from `survivor-fx-manifest.js`, regenerated by `scripts/build-ui-assets.py`.
  - World effects draw at 3x, UI effects at 1x logical.
  - Rewards go through `scene.reward()`.
  - Never `Math.random()` or `camera.shake()`.
  - Reduced motion drops freeze, shake and flash.
  - Every upgrade icon is unique; add new ones to `UPGRADE_ICONS`.
- [ ] **Step 3: Verify.**
  - `npm run test:survivors 2>&1 | tail -1` → `19/19`.
  - `GAME_URL=http://127.0.0.1:5174/legacy.html npm run test:ui` → same pre-existing failure as `main` (`'combat' !== 'map'`).
  - Open every PNG in `output/juice/`.
- [ ] **Step 4: Commit.** `git add docs/superpowers/specs/2026-09-28-reward-juice-design.md UI_STYLE_GUIDE.md && git commit -m "docs: juice rules and Phase 2 spec wording"`
