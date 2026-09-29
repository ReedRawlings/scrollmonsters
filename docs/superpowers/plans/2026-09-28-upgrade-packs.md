# Upgrade Packs and Relic Sources Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elites and caches drop luck-sized upgrade packs (1/3/5 cards) whose cards all apply on pickup, with a tap-to-flip reveal. Relics come only from the shrine, and the relic choice gets its DarkMode finish (NEW badge, stack roll-up, flight to the HUD relic row).

**Architecture:**
- **`survivor-packs.js` (`SurvivorPacks`, owned by the scene as `this.packs`, rebuilt in `resetState()` like `relics`):**
  - **Sim side:** `drop()` rolls the size and cards with `scene.rand()`. The ground pickup calls `open()`, which grants every card through a new `scene.grantUpgrade(id)` shared with `chooseUpgrade`, then sets `mode='pack'`.
  - **Reveal side:** a real-time state (`reveal`) advanced by `act()` (tap or key) and `realtime()` (called from the scene's real-time loop like `juice.realtime()`). It calls `close()` after the last card is filed.
- **Drawing:** `survivor-screens.js#pack()` draws the reveal.
- **Juice:** `survivor-juice.js` handles the `pack`, `packflip`, `packapply` and `relic` reward events.

**Tech Stack:** Phaser 4.2.1, plain browser JS modules on `window`, Python/Pillow asset build, Playwright checks run by `node scripts/test-survivors.cjs`.

**Spec:** `docs/superpowers/specs/2026-09-28-reward-juice-design.md` (Phase 4; the Upgrade packs and Relics rows; Modes; Drop sources; the Pack drop, Pack pickup and Relic choice rows; Testing → Phase 4). Reference prototype, Moment 5: https://claude.ai/artifact/VgjShiA626rZqRpsRNAAYL

## Global Constraints

- Presentation never changes the simulation. Juice code reads state only and uses `juice.rand()`, never `Math.random()`, `camera.shake()` or new `Text` per event. The sim rolls with `this.rand()`.
- Logic first: "Captures, unlocks, upgrades and pack cards apply on the tick they happen." Every pack card is granted inside `open()`, before any animation.
- Pauses never stretch time. `mode='pack'` pauses `tick()` exactly like `'upgrade'`. Nothing touches `STEP`, `elapsed` or `advanceTime`.
- Reduced motion: no shake, freezes, flashes or squash; fades stay.
- "Size by luck: 1 card 82%, 3 cards 17%, 5 cards 2%. Cards are drawn from the active team's upgrade pool and all are granted. Tap flips a card; a tap, a swipe or a one-second wait files it. No on-screen prompts."
- "Relics … come **only** from completing the interactive shrine, and elites and caches no longer drop them."
- "A queued level-up opens after an unlock, pack or relic screen closes."
- Rarity by size: 1 = Common (`#5ed5f2`), 3 = Rare (`#b58cff`), 5 = Legendary (`#ffd36b`), as in the prototype.
- This is the only phase allowed to change balance numbers. Every existing check that changes is changed deliberately, with a ledger line naming the file and the old → new contract.
- Log event names already in run history (`relic_cache_appeared`, `relic_hunter_appeared`, `upgrade_chosen`) keep their names and payloads. Only the player-facing announce text changes.
- Never `git add -A`. The user has unrelated uncommitted art (`assets/MapAssets/…`).

## Review Focus

1. **Stale cards at pickup.** A card rolled at the drop can stop being offerable before pickup: a once-only upgrade (`pull`, `marks`, `split`, `slam`) taken meanwhile, or a creature that has left the party. Expect it redrawn from the current pool, never granted a second time or granted to an absent creature. Test: Task 1, `stale card is redrawn`.
2. **Level-up and pickup on the same tick.** `checkLevel()` runs at the end of every tick. It must not open a level-up or relic screen over an open pack, and the queued level must open after the pack closes. Test: Task 1, `level-up waits for the pack`.
3. **Restart or run end mid-reveal.** `start()` rebuilds `packs`. Nothing from an old reveal may survive: ground sprites, reveal state, hand icons. Test: Task 1, `restart clears packs`.
4. **Taps during the deal-in.** The first 90ms × cards + 120ms (at least 300ms) ignore input, so a stray tap can't flip a card the player never saw. Test: Task 3, `deal-in lock`.
5. **Two packs picked up back to back,** for example two caches' packs overlapping. Only one opens per tick. The second opens on a later tick after the first closes, and neither is lost. Test: Task 1, `two packs, one at a time`.

---

## File Structure

| File | Change | Responsibility |
|---|---|---|
| `survivor-packs.js` | Create | `SurvivorPacks`: roll, drop, ground sprites, pickup, grant, reveal state, input, close. |
| `survivors.js` | Modify | `grantUpgrade(id)`. `chooseUpgrade` uses it. `packs` in `resetState()`/tick/update. `checkLevel` skips while a pack is open. Pointer, ENTER and SPACE act on the pack. Elite pack drop. |
| `survivor-relics.js` | Modify | Caches and hunters drop packs, not relics. Announce text. `reward('relic')` on equip. |
| `survivor-expedition.js` | Modify | The roaming elite drops a pack. Announce text. |
| `survivor-screens.js` | Modify | `pack(w,h)` reveal. Relic choice: NEW badge, count roll-up, `layout.cards` for flights. |
| `survivor-juice.js` | Modify | `onPack` (Pack_Open), `onPackFlip` (Pack_Flip), `onPackApply` (flights), `onRelic` (flight to the HUD relic row). |
| `survivor-hud.js` | Modify | `layout.relics` gains `cx, cy` centres for flights (already has `x, y`). |
| `scripts/build-ui-assets.py`, `survivor-fx-manifest.js` | Modify / regenerate | Add the Pack_* sheets. |
| `survivors.html` | Modify | Load `survivor-packs.js`. Bump `?v=`. |
| `scripts/check-upgrade-packs.cjs` | Create | Spec's Phase 4 checks plus this plan's Review Focus. |
| `scripts/check-*.cjs` (policies) | Modify | Policy loops close packs. Relic-source assertions move to the new contract. |
| `UI_STYLE_GUIDE.md`, spec, `assets/fx/VFX_REQUESTS.md` | Modify | Document packs and relic sources. Mark the pack art as delivered placeholders. |

---

### Task 1: Pack sim (roll, drop, pickup, grant, `mode='pack'`)

**Files:**
- Create: `survivor-packs.js`
- Modify: `survivors.js` (`resetState`, `tick`, `checkLevel`, `chooseUpgrade`, new `grantUpgrade`), `survivors.html`
- Modify: `scripts/build-ui-assets.py` (add Pack sheets), regenerate `survivor-fx-manifest.js`
- Create: `scripts/check-upgrade-packs.cjs`. Modify: `scripts/test-survivors.cjs:4`

**Interfaces:**
- Produces:
  - `SurvivorPacks.size(r:number) → 1|3|5`, where `r` is uniform in [0,1).
  - `SurvivorPacks.rarity(n) → 'Common'|'Rare'|'Legendary'`.
  - `SurvivorPacks.COLORS = {1:'#5ed5f2',3:'#b58cff',5:'#ffd36b'}`.
  - `s.packs.drop(x, y, source) → item {x,y,size,cards:string[],source,sprite}`.
  - `s.packs.items`.
  - `s.packs.open(item)`, called by the pickup and by tests.
  - `s.packs.close()`.
  - `s.packs.reveal = {size, cards:[{id,name,detail}], x, y, start, kept:0, flippedAt:null, doneAt:null}`, or `null`.
  - `s.packs.opened`.
  - `s.grantUpgrade(id)`.
  - `s.reward('pack', {size, cards:string[], x, y})`.
  - Log events: `pack_dropped {source,size,cards,x,y}` and `pack_opened {source,size,cards}`.

- [ ] **Step 1: Add the Pack sheets to the manifest**

In `scripts/build-ui-assets.py`, extend `FX_FROM_JSON` with:

```python
    'Pack_Drop_Common', 'Pack_Drop_Rare', 'Pack_Drop_Legendary', 'Pack_Open_Common', 'Pack_Open_Rare', 'Pack_Open_Legendary',
    'Pack_CardBack', 'Pack_Flip', 'Pack_Sheen',
```

Run: `python3 scripts/build-ui-assets.py && git diff --stat`
Expected: only `survivor-fx-manifest.js` (and the build script) differ. `grep -o '"Pack_[A-Za-z_]*"' survivor-fx-manifest.js | wc -l` prints `9`.

- [ ] **Step 2: Write the failing check**

Create `scripts/check-upgrade-packs.cjs`:

```js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {chromium} = require('playwright');
const {gameURL, launchOptions} = require('./survivor-test-utils.cjs');

async function open(browser, viewport = {width: 1100, height: 760}, {mobile = false, reducedMotion = 'no-preference'} = {}) {
  const context = await browser.newContext({viewport, isMobile: mobile, hasTouch: mobile, reducedMotion});
  const page = await context.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.addInitScript(() => window.__vt_pending = true);
  await page.goto(gameURL('survivors.html?test'));
  await page.waitForFunction(() => window.__phaserReady);
  page.errors = errors;
  return page;
}
const state = (page, fn, arg) => page.evaluate(fn, arg);
const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  fs.mkdirSync('output/upgrade-packs', {recursive: true});
  const browser = await chromium.launch(launchOptions);
  try {
    // --- odds: 82 / 17 / 2 over many seeded rolls ---
    const page = await open(browser);
    const odds = await state(page, () => { const s = __survivorTest.scene; s.start(); const c = {1: 0, 3: 0, 5: 0};
      for (let i = 0; i < 40000; i++) c[SurvivorPacks.size(s.rand())]++; return c; });
    assert(Math.abs(odds[1] / 40000 - .82) < .01 && Math.abs(odds[3] / 40000 - .17) < .01 && Math.abs(odds[5] / 40000 - .02) < .004, 'Pack sizes follow 82/17/2: ' + JSON.stringify(odds));
    assert.deepEqual(await state(page, () => [SurvivorPacks.size(0), SurvivorPacks.size(.8199), SurvivorPacks.size(.82), SurvivorPacks.size(.9899), SurvivorPacks.size(.99)]), [1, 1, 3, 3, 5]);

    // --- cards come from the active team's pool; every card is granted on pickup; combat pauses ---
    const r = await state(page, () => { const s = __survivorTest.scene, out = {}; s.start(); s.spawnTimer = 999;
      const teamIds = new Set(s.upgradePool().map(u => u.id)), drops = [];
      for (let i = 0; i < 200; i++) { const item = s.packs.drop(s.player.x + 300, s.player.y, 'test'); drops.push(...item.cards); }
      out.outside = drops.filter(id => !teamIds.has(id));
      out.sizes = [...new Set(s.packs.items.map(p => p.size))].sort();
      s.packs.items.forEach(p => p.sprite.destroy()); s.packs.items.length = 0;
      const item = s.packs.drop(s.player.x + 300, s.player.y, 'test'); item.cards = ['hide', 'feet', 'hide']; item.size = 3;
      const before = {hide: s.upgrades.hide, feet: s.upgrades.feet, maxHp: s.maxHp};
      s.player.x = item.x; s.player.y = item.y; s.tick(1 / 60);
      out.mode = s.mode; out.granted = [s.upgrades.hide - before.hide, s.upgrades.feet - before.feet, s.maxHp - before.maxHp];
      out.left = s.packs.items.length; out.reveal = s.packs.reveal?.cards.map(c => c.id);
      const t = s.elapsed; s.tick(1); out.paused = s.elapsed === t;
      out.events = s.run.events.filter(e => e.type === 'pack_opened').map(e => e.cards);
      s.packs.close(); out.after = s.mode; out.revealAfter = s.packs.reveal;
      return out; });
    assert.deepEqual(r.outside, [], 'Cards come only from the active team pool');
    assert.deepEqual(r.mode, 'pack'); assert.deepEqual(r.granted, [2, 1, 16], 'Every card applies on pickup, hide twice (+16 max HP)');
    assert.equal(r.left, 0); assert.deepEqual(r.reveal, ['hide', 'feet', 'hide']);
    assert.equal(r.paused, true, 'mode=pack pauses the sim'); assert.deepEqual(r.events, [['hide', 'feet', 'hide']]);
    assert.equal(r.after, 'playing'); assert.equal(r.revealAfter, null);

    // --- review focus: stale cards, level-up ordering, two packs, restart ---
    const f = await state(page, () => { const s = __survivorTest.scene, out = {}; s.start(); s.spawnTimer = 999;
      s.upgrades.pull = 1; const stale = s.packs.drop(s.player.x, s.player.y, 'test'); stale.cards = ['pull']; s.packs.open(stale);
      out.stale = [s.upgrades.pull, s.packs.reveal.cards[0].id !== 'pull']; s.packs.close();
      s.xp = s.xpNeeded(); const lv = s.level, a = s.packs.drop(s.player.x, s.player.y, 'test'), b = s.packs.drop(s.player.x + 1, s.player.y, 'test');
      s.tick(1 / 60); out.first = [s.mode, s.level, s.packs.items.length];
      s.packs.close(); out.levelAfter = [s.mode, s.level === lv + 1]; s.chooseUpgrade(0);
      s.tick(1 / 60); out.second = [s.mode, s.packs.items.length]; s.packs.close();
      s.packs.drop(s.player.x + 200, s.player.y, 'test'); s.start(); out.restart = [s.packs.items.length, s.packs.reveal, s.children.list.filter(o => /^Pack_Drop/.test(o.texture?.key) && o.active).length];
      return out; });
    assert.deepEqual(f.stale, [1, true], 'stale card is redrawn: a once-only upgrade is never granted twice');
    assert.deepEqual(f.first, ['pack', f.first[1], 1], 'two packs, one at a time: the first opens, the second waits');
    assert.deepEqual(f.levelAfter, ['upgrade', true], 'level-up waits for the pack, then opens');
    assert.deepEqual(f.second, ['pack', 0], 'The second pack opens after the first closes');
    assert.deepEqual(f.restart, [0, null, 0], 'restart clears packs');
    assert.deepEqual(page.errors, []);
    await page.close();
    console.log('Upgrade packs: all checks passed.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
```

In `scripts/test-survivors.cjs` line 4, append `'upgrade-packs'` after `'damage-numbers'`.

- [ ] **Step 3: Run it and watch it fail**

Run:

```bash
cd /Users/reedrawlings/Desktop/ScrollMonsters && (python3 -m http.server 5174 --bind 127.0.0.1 >/dev/null 2>&1 &); sleep 1; GAME_URL=http://127.0.0.1:5174/ node scripts/check-upgrade-packs.cjs 2>&1 | head -5
```

Expected: FAIL with `SurvivorPacks is not defined`. Leave the server running for later steps.

- [ ] **Step 4: Create `survivor-packs.js` (sim side)**

```js
(() => {
  'use strict';
  const RARITY = {1:'Common',3:'Rare',5:'Legendary'}, COLORS = {1:'#5ed5f2',3:'#b58cff',5:'#ffd36b'}, PICKUP = 38;
  const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  // Upgrade packs. Sim side: size and cards are rolled with scene.rand() at the drop, and every card is granted
  // on pickup. The reveal that follows is presentation only: it never changes what was granted.
  class SurvivorPacks {
    static size(r){return r<.82?1:r<.99?3:5;}
    static rarity(n){return RARITY[n];}
    constructor(s){this.s=s;this.items=[];this.opened=0;this.reveal=null;}
    destroy(){for(const p of this.items)p.sprite.destroy();this.items=[];this.reveal=null;}
    // Without repeats while the pool lasts; a pool smaller than the pack refills.
    draw(pool,n){const out=[];let left=[...pool];while(out.length<n){if(!left.length)left=[...pool];out.push(left.splice(Math.floor(this.s.rand()*left.length),1)[0]);}return out;}
    drop(x,y,source){
      const s=this.s,size=SurvivorPacks.size(s.rand()),cards=this.draw(s.upgradePool(),size).map(u=>u.id),key='Pack_Drop_'+RARITY[size];
      const sprite=s.add.sprite(x,y,key,s.juice.frameName(key,0)).setOrigin(.5,19/20).setScale(3).setDepth(y);
      const item={x,y,size,cards,source,sprite};this.items.push(item);
      s.logEvent('pack_dropped',{source,size,cards,x:Math.round(x),y:Math.round(y)});return item;
    }
    // One pickup per tick, so overlapping packs open one after another.
    update(){const s=this.s;if(s.mode!=='playing')return;const item=this.items.find(p=>dist(p,s.player)<PICKUP);if(item)this.open(item);}
    open(item){
      const s=this.s;this.items=this.items.filter(p=>p!==item);item.sprite.destroy();
      const pool=s.upgradePool(),byId=new Map(pool.map(u=>[u.id,u]));
      // A card that stopped being offerable since the drop (once-only taken, creature gone) is redrawn from today's pool.
      const cards=item.cards.map(id=>byId.get(id)||this.draw(pool,1)[0]).map(u=>({id:u.id,name:u.name,detail:u.detail}));
      for(const c of cards)s.grantUpgrade(c.id);
      this.opened++;s.logEvent('pack_opened',{source:item.source,size:item.size,cards:cards.map(c=>c.id)});
      this.reveal={size:item.size,cards,x:item.x,y:item.y,start:s.juice.now(),kept:0,flippedAt:null,doneAt:null};
      s.mode='pack';s.joy=null;s.input.keyboard.resetKeys();s.accumulator=0;
      s.reward('pack',{size:item.size,cards:cards.map(c=>c.id),x:item.x,y:item.y});
    }
    close(){const s=this.s;if(s.mode!=='pack')return;this.reveal=null;s.mode='playing';s.joy=null;s.input.keyboard.resetKeys();s.checkLevel();s.saveRun();}
    // Ground packs bob through their idle sheet (presentation only).
    drawWorld(){const j=this.s.juice;for(const p of this.items){const key=p.sprite.texture.key;p.sprite.setFrame(j.frameName(key,j.frameAt(key,j.now(),true)));}}
  }
  SurvivorPacks.COLORS = COLORS;
  window.SurvivorPacks = SurvivorPacks;
})();
```

- [ ] **Step 5: Wire it into the scene**

In `survivors.js`:

1. In `resetState()`, replace `this.relics?.destroy();this.relics=new SurvivorRelics(this);` with `this.relics?.destroy();this.relics=new SurvivorRelics(this);this.packs?.destroy();this.packs=new SurvivorPacks(this);`.
2. In `tick()`, replace `this.relics.update(dt);this.updateSupplies();` with `this.relics.update(dt);this.packs.update();this.updateSupplies();`.
3. In `draw()`, call `this.packs?.drawWorld();` at the same place other world sprites update. Put it immediately after `this.juice.observe();` at the start of `draw()`.
4. Replace `checkLevel(){\n      if(this.mode==='relic')return;` with `checkLevel(){\n      if(this.mode==='relic'||this.mode==='pack')return;`.
5. Add `grantUpgrade` above `chooseUpgrade`, and use it:

```js
    grantUpgrade(id){this.upgrades[id]++;if(id==='hide'){this.maxHp+=8;this.player.hp=Math.min(this.maxHp,this.player.hp+8);}}
```

   In `chooseUpgrade`, replace `const id=this.choices[index].id;this.upgrades[id]++;this.logEvent('upgrade_chosen',{upgrade:id,rank:this.upgrades[id]});\n      if(id==='hide'){this.maxHp+=8;this.player.hp=Math.min(this.maxHp,this.player.hp+8);}` with `const id=this.choices[index].id;this.grantUpgrade(id);this.logEvent('upgrade_chosen',{upgrade:id,rank:this.upgrades[id]});`. The payload and order of logged fields are unchanged.

In `survivors.html`, add `<script src="survivor-packs.js?v=30"></script>` directly before the `survivor-relics.js` tag. Bump every `?v=29` to `?v=30`, and `survivors.js?v=30` to `?v=31`.

- [ ] **Step 6: Run it and watch it pass**

Run: `GAME_URL=http://127.0.0.1:5174/ node scripts/check-upgrade-packs.cjs 2>&1 | head -5`
Expected: `Upgrade packs: all checks passed.`

If the `pull` stale test shows `pull` is not in `upgradePool()` even at rank 0 (for example the cat isn't active), the redraw still yields a non-`pull` card and `s.upgrades.pull` stays 1, so the assertion holds either way. Do not weaken it.

- [ ] **Step 7: Full suite and commit**

Run: `node scripts/test-survivors.cjs > .superpowers/sdd/2026-09-28-upgrade-packs/suite-t1.log 2>&1; tail -3 .superpowers/sdd/2026-09-28-upgrade-packs/suite-t1.log`
Expected: `Survivors: 22/22 checks passed.` Nothing drops packs yet, and `grantUpgrade` leaves every existing log identical.

```bash
git add survivor-packs.js survivors.js survivors.html scripts/build-ui-assets.py survivor-fx-manifest.js scripts/check-upgrade-packs.cjs scripts/test-survivors.cjs
git commit -m "feat(packs): upgrade pack sim — seeded 82/17/2 roll, team-pool cards, grant on pickup, mode=pack"
```

---

### Task 2: Drop sources — packs from elites and caches, relics from the shrine only

**Files:**
- Modify: `survivors.js` (the `hit()` kill branch), `survivor-relics.js` (hunter spawn, cache claim, announces), `survivor-expedition.js` (roaming elite)
- Modify: `scripts/check-upgrade-packs.cjs`
- Modify: every policy loop and relic-source assertion the suite flags (listed in Step 5)

**Interfaces:**
- Consumes: `s.packs.drop(x,y,source)`, `s.packs.close()` from Task 1.
- Produces:
  - Enemy flag `packReward` (renamed from `relicReward`).
  - Pack sources `'elite'`, `'guarded_cache'`, `'buried_cache'`.
  - `relics.reward()` is called only by `completeShrine`.

- [ ] **Step 1: Write the failing checks**

In `scripts/check-upgrade-packs.cjs`, insert before `console.log('Upgrade packs: all checks passed.');`:

```js
    // --- sources: elites and caches drop packs; relics only after a shrine completion ---
    const src = await open(browser);
    const d = await state(src, () => { const s = __survivorTest.scene, out = {}; s.start(); s.spawnTimer = 999;
      s.elapsed = 330; s.relics.update(0); const hunter = s.enemies.find(e => e.packReward); out.hunterFlag = !!hunter;
      s.hit(hunter, 9999, 'player', s.player); out.hunter = [s.packs.items.length, s.relics.queue.length];
      s.start(); s.elapsed = 45; s.relics.update(0); const cache = s.relics.cache; s.player.x = cache.x; s.player.y = cache.y;
      for (let i = 0; i < 3; i++) s.relics.update(0); for (const g of s.enemies.filter(e => e.cacheGuard)) s.hit(g, 9999, 'player', s.player); s.relics.update(0);
      out.cache = [s.packs.items.length, s.relics.queue.length, s.packs.items[0]?.source];
      return out; });
    assert.equal(d.hunterFlag, true, 'Hunters still spawn, now carrying a pack');
    assert.deepEqual(d.hunter, [1, 0], 'An elite kill drops a pack and queues no relic');
    assert.deepEqual(d.cache.slice(0, 2), [1, 0], 'A claimed cache drops a pack and queues no relic'); assert(/_cache$/.test(d.cache[2]));
    // A full 600s policy run: every relic offer follows a shrine completion, and packs actually open.
    const run = await state(src, () => { const s = __survivorTest.scene; s.start(); let steps = 0;
      while (s.elapsed < 601 && steps++ < 60000) { if (s.mode === 'relic') s.relics.choose(0); else if (s.mode === 'upgrade') s.chooseUpgrade(0); else if (s.mode === 'pack') s.packs.close(); else if (s.mode === 'unlock') s.closeUnlock(); else if (s.mode !== 'playing') break;
        s.player.inv = 2; s.tick(1 / 60); }
      return s.run.events.filter(e => ['relic_offered', 'shrine_completed', 'pack_dropped', 'pack_opened'].includes(e.type)).map(e => e.type); });
    let shrines = 0, offers = 0; for (const t of run) { if (t === 'shrine_completed') shrines++; if (t === 'relic_offered') { offers++; assert(offers <= shrines, 'relics are offered only after a shrine completion'); } }
    assert(run.includes('pack_dropped'), 'The policy run drops packs');
    console.log('policy run:', {shrines, offers, dropped: run.filter(t => t === 'pack_dropped').length, opened: run.filter(t => t === 'pack_opened').length});
    assert.deepEqual(src.errors, []);
    await src.close();
```

- [ ] **Step 2: Run it and watch it fail**

Run: `GAME_URL=http://127.0.0.1:5174/ node scripts/check-upgrade-packs.cjs 2>&1 | head -5`
Expected: FAIL on `Hunters still spawn, now carrying a pack` (`false !== true`).

- [ ] **Step 3: Rewire the sources**

`survivors.js` (`hit()` kill branch): replace `if(e.relicReward)this.relics.reward('roaming_elite');` with `if(e.packReward)this.packs.drop(e.x,e.y,'elite');`.

`survivor-expedition.js` (roaming elite, about line 56): replace `e.relicReward=true;` with `e.packReward=true;`. Replace the announce `'Roaming elite! Defeat it for a relic.'` with `'Roaming elite! Defeat it for an upgrade pack.'`.

`survivor-relics.js`:
- In the hunter spawn, replace `e.relicReward=true;` with `e.packReward=true;`, and `s.announce('Relic hunter approaching!')` with `s.announce('Pack hunter approaching!')`. The log name `relic_hunter_appeared` stays.
- In the cache announce, replace `'Buried relic cache revealed!':'Guarded relic cache discovered!'` with `'Buried supply cache revealed!':'Guarded supply cache discovered!'`.
- In the cache claim, replace `this.reward(s.field==='desert'?'buried_cache':'guarded_cache');` with `s.packs.drop(c.x,c.y,s.field==='desert'?'buried_cache':'guarded_cache');`.

Then confirm nothing else calls `relics.reward`: `grep -n "relics.reward\|this.reward(" survivors.js survivor-*.js | grep -v "s.reward('\|this.reward('\(levelup\|upgrade\|unlock\|capture\|shrine\|pack\)"`.
Expected: only `survivor-expedition.js` `completeShrine`'s `s.relics.reward(sh.done?'final_shrine':'shrine_challenge')`.

- [ ] **Step 4: Run the new check and watch it pass**

Run: `GAME_URL=http://127.0.0.1:5174/ node scripts/check-upgrade-packs.cjs 2>&1 | tail -3`
Expected: a `policy run:` line with `offers <= 3` and `dropped >= 1`, then `Upgrade packs: all checks passed.`

- [ ] **Step 5: Move the existing checks to the new contract, deliberately**

Run the suite: `node scripts/test-survivors.cjs > .superpowers/sdd/2026-09-28-upgrade-packs/suite-t2.log 2>&1; grep -n "^\[Survivors\]\|Error\|FAIL\|passed" .superpowers/sdd/2026-09-28-upgrade-packs/suite-t2.log | tail -40`

For each failing check, apply exactly these kinds of change, and ledger one `Task 2: Ruling:` line per file (old contract → new):
- **Policy loops stall in `mode='pack'`** (`check-determinism.cjs`, `check-expedition.cjs`, `check-relic-growth.cjs`, `check-relics.cjs`, `check-juice.cjs`, and any other loop matching `grep -ln "mode==='upgrade'\|mode === 'upgrade'" scripts/check-*.cjs`): add a `pack` branch next to the `upgrade` branch, in the loop's own style. For example, change `if(s.mode==='upgrade')s.chooseUpgrade(0);` to `if(s.mode==='upgrade')s.chooseUpgrade(0);else if(s.mode==='pack')s.packs.close();`. For `else if (s.mode !== 'playing') break;` loops, add `else if (s.mode === 'pack') s.packs.close();` before it.
- **Assertions that an elite or cache queues a relic** (for example `check-relic-growth.cjs:10-11` and `check-relics.cjs:5`, `relicReward` / `queue.includes('roaming_elite')` / cache relic): rewrite them to assert a pack dropped (`s.packs.items.length === 1`, and `s.relics.queue.length === 0`). Rename `relicReward` → `packReward`.
- **Relic-count or balance numbers pinned from the old economy** (equipped counts, relic totals, DPS or time-to-kill numbers in a long policy run): replace each with the value the new run produces. Record the old and new value in the ruling line. This is the spec's "existing relic-count checks are updated deliberately".
- **Announce-text assertions** mentioning the old strings: update them to the new strings.

A failure that is none of these four kinds is a real regression. Debug it (superpowers:systematic-debugging); don't edit the check.

Re-run until: `Survivors: 22/22 checks passed.`

- [ ] **Step 6: Commit**

```bash
git add survivors.js survivor-relics.js survivor-expedition.js scripts/check-upgrade-packs.cjs scripts/check-*.cjs
git commit -m "feat(packs): elites and caches drop upgrade packs; relics come only from the shrine"
```

(`git add scripts/check-*.cjs` stages only tracked check files this task changed. Run `git status --short` first and make sure nothing unrelated is staged.)

---

### Task 3: The pack reveal (stack, flip, keep, apply)

**Files:**
- Modify: `survivor-packs.js` (reveal methods)
- Modify: `survivor-screens.js` (`pack(w,h)` and its dispatch)
- Modify: `survivor-juice.js` (`onPack`, `onPackFlip`, `onPackApply`)
- Modify: `survivors.js` (pointer, ENTER and SPACE in pack mode; `packs.realtime()` in `update()`)
- Test: `scripts/check-upgrade-packs.cjs`

**Interfaces:**
- Consumes: `s.packs.reveal`, `s.packs.close()`, `SurvivorPacks.COLORS`, `SurvivorPacks.rarity` from Task 1. `juice.flyTo`, `juice.play`, `juice.slotPoint`, `juice.ownerOf`, `juice.frameRect`, `juice.frameAt`.
- Produces:
  - `SurvivorPacks.LOCK(n) → ms`, which is `Math.max(300, 90*n+120)`.
  - `SurvivorPacks.FLIP_MS = 180`, `KEEP_MS = 1000`, `APPLY_MS = 250`.
  - `s.packs.act()`: flips the top card, or files a flipped one.
  - `s.packs.realtime()`: auto-files after 1s, and closes 250ms after the last card is filed.
  - `s.screens.layout.hand = [{x,y}]`: logical centres of the hand slots.
  - Reward events `packflip {index,size}` and `packapply {cards:string[]}`.

- [ ] **Step 1: Write the failing checks**

In `scripts/check-upgrade-packs.cjs`, insert before the final `console.log`:

```js
    // --- reveal: deal-in lock, tap flips, tap or 1s files, then icons fly and combat resumes ---
    const rv = await open(browser, {width: 390, height: 844}, {mobile: true});
    await state(rv, () => { const s = __survivorTest.scene; s.start(); s.spawnTimer = 999; const p = s.packs.drop(s.player.x, s.player.y, 'test'); p.size = 3; p.cards = p.cards.concat(s.packs.draw(s.upgradePool(), 2).map(u => u.id)).slice(0, 3); s.tick(1 / 60); s.draw(); });
    const R = () => state(rv, () => { const s = __survivorTest.scene, r = s.packs.reveal; s.packs.realtime(); s.draw(); return r ? {kept: r.kept, flipped: r.flippedAt !== null, mode: s.mode} : {mode: s.mode, flights: s.juice.flights.length}; });
    await rv.touchscreen.tap(195, 420);
    assert.deepEqual(await R(), {kept: 0, flipped: false, mode: 'pack'}, 'deal-in lock: an early tap does nothing');
    await wait(600); await rv.screenshot({path: 'output/upgrade-packs/stack.png'});
    await rv.touchscreen.tap(195, 420); await wait(250);
    assert.deepEqual(await R(), {kept: 0, flipped: true, mode: 'pack'}, 'A tap flips the top card');
    assert(await state(rv, () => __survivorTest.scene.juice.played.includes('Pack_Flip')), 'The flip flashes');
    await rv.screenshot({path: 'output/upgrade-packs/flipped.png'});
    await rv.touchscreen.tap(195, 420);
    assert.deepEqual(await R(), {kept: 1, flipped: false, mode: 'pack'}, 'A second tap files it into the hand');
    await rv.touchscreen.tap(195, 420); await wait(1150);
    assert.deepEqual(await R(), {kept: 2, flipped: false, mode: 'pack'}, 'A flipped card files itself after one second');
    await rv.keyboard.press('Enter'); await wait(250); await rv.keyboard.press('Enter');
    let end = await R(); assert.equal(end.mode, 'pack', 'Still showing the full hand for a moment');
    await rv.screenshot({path: 'output/upgrade-packs/hand.png'});
    await wait(300); end = await R();
    assert.deepEqual(end, {mode: 'playing', flights: 3}, 'After the last card, each icon flies to its slot and combat resumes');
    assert.deepEqual(rv.errors, []);
    await rv.context().close();
    // Landscape and reduced motion: the whole reveal fits, and no flip flash plays.
    const calm = await open(browser, {width: 1100, height: 760}, {reducedMotion: 'reduce'});
    const c = await state(calm, () => { const s = __survivorTest.scene; s.start(); s.spawnTimer = 999; const p = s.packs.drop(s.player.x, s.player.y, 'test'); p.size = 5; p.cards = s.packs.draw(s.upgradePool(), 5).map(u => u.id); s.tick(1 / 60); s.packs.reveal.start -= 1000; s.juice.played.length = 0; s.packs.act(); s.draw(); return {flash: s.juice.played.includes('Pack_Flip'), hand: s.screens.layout.hand.length}; });
    assert.deepEqual(c, {flash: false, hand: 5}, 'Reduced motion: no flip flash; five hand slots');
    await calm.screenshot({path: 'output/upgrade-packs/landscape-legendary.png'});
    assert.deepEqual(calm.errors, []);
    await calm.close();
```

- [ ] **Step 2: Run it and watch it fail**

Run: `GAME_URL=http://127.0.0.1:5174/ node scripts/check-upgrade-packs.cjs 2>&1 | head -5`
Expected: FAIL with `s.packs.realtime is not a function`.

- [ ] **Step 3: Reveal logic in `survivor-packs.js`**

Add these methods inside the class, after `close()`:

```js
    // --- reveal (real time; presentation state only) ---
    act(){
      const r=this.reveal,now=this.s.juice.now();if(!r||this.s.mode!=='pack'||now-r.start<SurvivorPacks.LOCK(r.cards.length)||r.doneAt!==null)return;
      if(r.flippedAt===null){r.flippedAt=now;this.s.reward('packflip',{index:r.kept,size:r.size});}
      else if(now-r.flippedAt>=SurvivorPacks.FLIP_MS)this.keep(now);
    }
    keep(now){const r=this.reveal;r.kept++;r.flippedAt=null;if(r.kept>=r.cards.length)r.doneAt=now;}
    // Called from the scene's real-time loop (and by tests): auto-file after a second, then apply and resume.
    realtime(){
      const r=this.reveal;if(!r||this.s.mode!=='pack')return;const now=this.s.juice.now();
      if(r.flippedAt!==null&&now-r.flippedAt>=SurvivorPacks.KEEP_MS)this.keep(now);
      if(r.doneAt!==null&&now-r.doneAt>=SurvivorPacks.APPLY_MS){const cards=r.cards.map(c=>c.id);this.s.reward('packapply',{cards});this.close();}
    }
```

Below the class, next to `SurvivorPacks.COLORS = COLORS;`, add:

```js
  SurvivorPacks.LOCK = n => Math.max(300, 90 * n + 120);
  Object.assign(SurvivorPacks, {FLIP_MS: 180, KEEP_MS: 1000, APPLY_MS: 250});
```

- [ ] **Step 4: Input and real-time hooks in `survivors.js`**

- Pointer: replace `this.input.on('pointerdown',(p,over)=>{if(this.mode==='playing'&&!over.length&&!this.joy)` with `this.input.on('pointerdown',(p,over)=>{if(this.mode==='pack'){this.packs.act();return;}if(this.mode==='playing'&&!over.length&&!this.joy)`. A swipe starts with a pointerdown, so a swipe files the card exactly like a tap.
- ENTER: in the `keydown-ENTER` handler, append `else if(this.mode==='pack')this.packs.act();`.
- SPACE: replace `this.input.keyboard.on('keydown-SPACE',()=>this.expansion.dash());` with `this.input.keyboard.on('keydown-SPACE',()=>{if(this.mode==='pack')this.packs.act();else this.expansion.dash();});`.
- In `update()`, replace `this.juice.realtime();` with `this.juice.realtime();this.packs.realtime();`.

- [ ] **Step 5: Draw the reveal in `survivor-screens.js`**

In the mode dispatch (next to `else if(s.mode==='relic')this.relic(w,h);`), add `else if(s.mode==='pack')this.pack(w,h);`. Then add:

```js
    // Upgrade pack reveal (prototype Moment 5). Cards are 120x170 logical: Pack_CardBack at 2x face down,
    // a DarkMode panel with the rarity strip, spinning icon, name, detail and owner face up.
    pack(w,h){
      const s=this.s,ui=s.ui,j=s.juice,r=s.packs.reveal;if(!r)return;this.dim(w,h);
      const now=j.now(),t=now-r.start,n=r.cards.length,ri={1:0,3:1,5:2}[r.size],color=SurvivorPacks.COLORS[r.size],land=r.size===1?1:1;
      const cw=120,ch=170,cx=Math.round((w-cw)/2),top=h>w?96:40,cy=h>w?top+36:top+30;
      ui.banner(SurvivorPacks.rarity(r.size).toUpperCase()+' PACK',w/2,top-8);
      ui.darkText(n===1?'1 card':n+' cards',w/2,top+30,{align:'center',color});
      // Face-down pile: the cards still to reveal, each landing 90ms apart during the deal-in.
      for(let i=n-1;i>r.kept;i--){if(!j.reduced&&t<(n-1-i)*90)continue;const off=(i-r.kept)*3;
        ui.image('Pack_CardBack',cx+off,cy+off,cw,ch,{frame:j.frameRect('Pack_CardBack',ri)});}
      if(r.kept<n&&(j.reduced||t>=(n-1-r.kept)*90)){
        const card=r.cards[r.kept],since=r.flippedAt===null?-1:now-r.flippedAt;
        // Flip: squash the back to nothing over 90ms, then open the face over the next 90ms.
        const k=since<0?1:j.reduced?1:since<90?1-since/90:Math.min(1,(since-90)/90),face=since>=(j.reduced?0:90),dw=Math.max(2,Math.round(cw*k)),dx=cx+Math.round((cw-dw)/2);
        if(!face)ui.image('Pack_CardBack',dx,cy,dw,ch,{frame:j.frameRect('Pack_CardBack',ri)});
        else{ui.darkPanel(dx,cy,dw,ch);ui.rect(dx+6,cy+6,Math.max(0,dw-12),4,color);
          if(k>=1){const owner=j.ownerOf(card.id),key='upgrade_'+card.id;
            if(s.textures.exists(key))ui.image(key,cx+36,cy+18,48,48,{frame:j.frameRect(key,j.frameAt(key,now,true))});
            ui.darkText(card.name,cx+cw/2,cy+80,{align:'center',wrap:cw-16});
            ui.darkText(card.detail,cx+cw/2,cy+100,{align:'center',color:ScrollUI.DARK.muted,wrap:cw-16}).setOrigin(.5,0);
            ui.darkText(owner==='walker'?'WHOLE TEAM':owner.toUpperCase(),cx+cw/2,cy+ch-14,{align:'center',color});}}
        if(r.size>1&&!j.reduced&&!face)ui.image('Pack_Sheen',cx+((t%1800)/1800)*(cw-48),cy,48,ch,{frame:j.frameRect('Pack_Sheen',j.frameAt('Pack_Sheen',now,true)),alpha:.5});
      }
      // Hand row: one slot per card; filled slots show the kept icon.
      const hy=cy+ch+18;this.layout.hand=[];
      for(let i=0;i<n;i++){const x=Math.round(w/2+(i-(n-1)/2)*38-17);this.layout.hand.push({x:x+17,y:hy+17});ui.darkPanel(x,hy,34,34);
        if(i<r.kept){const key='upgrade_'+r.cards[i].id;if(s.textures.exists(key))ui.image(key,x+1,hy+1,32,32,{frame:[0,0,16,16]});}}
    }
```

Before using `ui.image(..., {alpha})` and `ui.rect(...)`, check their option names: `grep -n "    image(\|    rect(" phaser-ui.js`. If `image` takes no `alpha` option, drop `alpha:.5` and call `.setAlpha(.5)` on the returned image instead. Ledger any such adaptation. Remove the unused `land` variable.

- [ ] **Step 6: Juice for the reveal**

In `survivor-juice.js`:

1. In the constructor's handler line, add `this.handlers.pack=e=>this.onPack(e);this.handlers.packflip=e=>this.onPackFlip(e);this.handlers.packapply=e=>this.onPackApply(e);`.
2. Add these methods after `onUpgrade(e){…}`:

```js
    onPack(e){this.play('Pack_Open_'+SurvivorPacks.rarity(e.size),e.x,e.y,{scale:3,depth:e.y+30});}
    onPackFlip(e){if(this.reduced)return;const h=this.s.screens.layout.hand,w=this.s.uiSize().w,c=h?.[0];
      this.play('Pack_Flip',w/2,(c?c.y-17-18-85:200),{ui:true,scale:3,tint:parseInt(SurvivorPacks.COLORS[e.size].slice(1),16)});}
    onPackApply(e){const hand=this.s.screens.layout.hand||[];
      e.cards.forEach((id,i)=>{const from=hand[i];if(from)this.flyTo('upgrade_'+id,from,this.slotPoint(this.ownerOf(id)),{onLand:p=>this.play('Slot_PowerUp',p.x,p.y,{ui:true,scale:1})});});}
```

Check that `this.s.uiSize()` returns `{w,h}`: `grep -n "uiSize()" survivors.js`. If it returns another shape, adapt and ledger it. The flip flash sits at the card centre: the card top is 85 logical px above the card's centre and 18px above the hand row.

- [ ] **Step 7: Run it, watch it pass, look at the screenshots**

Run: `GAME_URL=http://127.0.0.1:5174/ node scripts/check-upgrade-packs.cjs 2>&1 | tail -3`
Expected: `Upgrade packs: all checks passed.`

Open `output/upgrade-packs/stack.png`, `flipped.png`, `hand.png` and `landscape-legendary.png` with the Read tool. Check that:
- In portrait, the banner, count, card and hand row all fit and don't overlap.
- The card text stays inside the card.
- The landscape 5-card hand fits 320 logical px in height.

If a layout spills, adjust `top`/`cy` for that orientation only, re-run, and ledger it.

- [ ] **Step 8: Full suite and commit**

Run: `node scripts/test-survivors.cjs > .superpowers/sdd/2026-09-28-upgrade-packs/suite-t3.log 2>&1; tail -2 .superpowers/sdd/2026-09-28-upgrade-packs/suite-t3.log`
Expected: `Survivors: 22/22 checks passed.`

```bash
git add survivor-packs.js survivor-screens.js survivor-juice.js survivors.js scripts/check-upgrade-packs.cjs
git commit -m "feat(packs): tap-to-flip pack reveal with hand row, auto-file, and flights to the party bar"
```

---

### Task 4: Relic choice finish — NEW badge, stack roll-up, flight to the relic row

**Files:**
- Modify: `survivor-screens.js` (`relic(w,h)`)
- Modify: `survivor-relics.js` (`equip` emits `reward('relic')`)
- Modify: `survivor-juice.js` (`onRelic`)
- Modify: `survivor-hud.js` (nothing new if `layout.relics` entries already carry `x, y`; the flight targets `x+10, y+10`)
- Test: `scripts/check-upgrade-packs.cjs`

**Interfaces:**
- Consumes: `s.relics.offers`, `s.relics.count(id)`, `s.hud.layout.relics = [{id,count,x,y}]`, `juice.since('relic')`, `juice.flyTo`.
- Produces:
  - `s.reward('relic', {id, index})` from `equip`.
  - `s.screens.layout.cards` (relic cards, same shape as the upgrade screen: `{x,y,w,h}`).
  - Card badge text: `NEW` for unowned; `×N` rolling to `×N+1` 400ms after the screen opens for owned.

- [ ] **Step 1: Write the failing checks**

In `scripts/check-upgrade-packs.cjs`, insert before the final `console.log`:

```js
    // --- relic choice: NEW badge, stack roll-up, and the pick flies to the HUD relic row ---
    const rl = await open(browser, {width: 390, height: 844}, {mobile: true});
    const texts = () => state(rl, () => { const s = __survivorTest.scene, out = []; s.draw(); s.ui.walk(o => { if (o.type === 'Text' && o.visible && /^(NEW|×\d+)$/.test(o.text)) out.push(o.text); }); return out.sort(); });
    await state(rl, () => { const s = __survivorTest.scene; s.start(); s.spawnTimer = 999; s.relics.equipped = ['veil', 'veil'];
      s.relics.reward('shrine_challenge'); s.relics.open(); s.relics.offers = [s.relics.offers.find(o => o.id !== 'veil'), SurvivorRelics.items.find(o => o.id === 'veil'), s.relics.offers.find(o => o.id !== 'veil' && o !== s.relics.offers[0]) || SurvivorRelics.items.find(o => o.id === 'boots')].filter(Boolean).slice(0, 3); s.draw(); });
    const early = await texts();
    assert(early.includes('NEW') && early.includes('×2'), 'Unowned relics show NEW; an owned stack shows its current count: ' + early);
    await wait(500); const later = await texts();
    assert(later.includes('×3') && !later.includes('×2'), 'The owned stack rolls up 2 → 3: ' + later);
    await rl.screenshot({path: 'output/upgrade-packs/relic-choice.png'});
    const fly = await state(rl, () => { const s = __survivorTest.scene; s.relics.choose(1); s.draw(); const f = s.juice.flights.find(f => f.key === 'relic_veil'), cell = s.hud.layout.relics.find(r => r.id === 'veil');
      return {mode: s.mode, flight: !!f, to: f && [Math.round(f.to.x), Math.round(f.to.y)], cell: cell && [cell.x + 10, cell.y + 10]}; });
    assert.equal(fly.mode, 'playing'); assert.equal(fly.flight, true, 'The chosen relic flies');
    assert.deepEqual(fly.to, fly.cell, 'It flies to its cell in the HUD relic row');
    assert.deepEqual(rl.errors, []);
    await rl.context().close();
```

Before running, confirm the relic list export name: `grep -n "window.SurvivorRelics\|SurvivorRelics.items" survivor-relics.js | head -3`. If `items` lives elsewhere, use it and ledger it.

- [ ] **Step 2: Run it and watch it fail**

Run: `GAME_URL=http://127.0.0.1:5174/ node scripts/check-upgrade-packs.cjs 2>&1 | head -5`
Expected: FAIL on `Unowned relics show NEW…`. Today the tag is part of the card label, not its own text.

- [ ] **Step 3: Restyle the relic cards**

In `survivor-screens.js`, replace the body of `relic(w,h)`'s `r.offers.forEach(...)` call with:

```js
      const t=s.juice.since('relic');this.layout.cards=[];
      r.offers.forEach((item,i)=>{const owned=r.count(item.id),y=py+32+i*(cardH+6);this.layout.cards.push({x:px+8,y,w:pw-16,h:cardH});
        ui.card((i+1)+'. '+item.name,px+8,y,pw-16,cardH,()=>r.choose(i),{detail:item.detail+' '+item.extra,icon:'relic_'+item.id,id:'relic'+i});
        const bx=px+pw-14,by=y+10;
        if(!owned){const glow=s.juice.reduced?1:.65+.35*Math.sin(t/160);ui.darkText('NEW',bx,by,{align:'right',color:ScrollUI.DARK.gold}).setAlpha(glow);}
        else{const rolled=t>=400,label=ui.darkText('×'+(rolled?owned+1:owned),bx,by,{align:'right',color:rolled?ScrollUI.DARK.gold:ScrollUI.DARK.text});
          if(rolled&&!s.juice.reduced&&t<520)label.setScale(1+.4*(1-(t-400)/120));}});
```

Check that `ScrollUI.DARK.gold` and `.text` exist: `grep -n "gold\|muted" phaser-ui.js | head -5`. The HUD uses `D().gold` and `D().teal`, which is `ScrollUI.DARK`.

- [ ] **Step 4: Emit and fly**

`survivor-relics.js` `equip(item)`: replace `this.s.logEvent('relic_equipped',{relic:item.id,stack:this.count(item.id),source:this.source});this.close();` with `this.s.logEvent('relic_equipped',{relic:item.id,stack:this.count(item.id),source:this.source});const index=this.offers.indexOf(item);this.close();this.s.reward('relic',{id:item.id,index});`.

`survivor-juice.js`: add `this.handlers.relic=e=>this.onRelic(e);` to the handler line. Add:

```js
    // The chosen relic flies from its card to its cell in the HUD relic row (the row is laid out on the next draw).
    onRelic(e){const card=this.s.screens.layout.cards?.[e.index];if(!card)return;this.s.draw();
      const cell=this.s.hud.layout.relics.find(r=>r.id===e.id);if(!cell)return;
      this.flyTo('relic_'+e.id,{x:card.x+24,y:card.y+card.h/2},{x:cell.x+10,y:cell.y+10},{size:24,onLand:p=>this.play('Slot_PowerUp',p.x,p.y,{ui:true,scale:1})});}
```

`onRelic` calls `this.s.draw()` once so `hud.layout.relics` includes the new relic. `draw()` is presentation-only and already runs every frame. If the re-entrant draw causes a page error (the `reward` fires inside `close()` → `checkLevel()` → possibly a new screen), move the flight target lookup into `advanceFlights` instead, and ledger it.

- [ ] **Step 5: Run it, watch it pass, look at the screenshot**

Run: `GAME_URL=http://127.0.0.1:5174/ node scripts/check-upgrade-packs.cjs 2>&1 | tail -3`
Expected: `Upgrade packs: all checks passed.`

Open `output/upgrade-packs/relic-choice.png` and check that the NEW and ×N badges sit at each card's top-right without covering the name. If the name runs under the badge, shorten the label wrap (`card` options) or move the badge to the bottom-right. Ledger the change.

- [ ] **Step 6: Full suite and commit**

Run: `node scripts/test-survivors.cjs > .superpowers/sdd/2026-09-28-upgrade-packs/suite-t4.log 2>&1; tail -2 .superpowers/sdd/2026-09-28-upgrade-packs/suite-t4.log`
Expected: `Survivors: 22/22 checks passed.` If `check-ui-foundation.cjs` pinned the old label with the ` · NEW` suffix, update it to the new label and ledger it.

```bash
git add survivor-screens.js survivor-relics.js survivor-juice.js scripts/check-upgrade-packs.cjs
git commit -m "feat(relics): NEW badge, stack roll-up, and the chosen relic flies to the HUD relic row"
```

---

### Task 5: Docs

**Files:** `UI_STYLE_GUIDE.md`, `docs/superpowers/specs/2026-09-28-reward-juice-design.md`, `assets/fx/VFX_REQUESTS.md`

- [ ] **Step 1: Update the docs**

`UI_STYLE_GUIDE.md`: add this before `### Assets`:

```markdown
### Upgrade packs (`survivor-packs.js`)
- Dropped by roaming elites, pack hunters and claimed caches. Size by luck (seeded): 1 card Common 82% (`#5ed5f2`), 3 cards Rare 17% (`#b58cff`), 5 cards Legendary 2% (`#ffd36b`). Cards come from the active team's pool and are all granted the moment the pack is picked up.
- Reveal (`mode='pack'`, combat paused): banner and count, a face-down pile dealt 90ms apart (input locked for max(300, 90×cards+120) ms), tap/ENTER/SPACE flips the top card (`Pack_Flip`), and another tap, a swipe or 1s files it into the hand row. 250ms after the last card, each icon flies to its creature's party slot and combat resumes. No on-screen prompts.
- Relics come only from shrine clears. The relic choice shows a pulsing gold NEW on unowned relics, rolls an owned stack up (×2 → ×3) 400ms in, and flies the chosen icon to its HUD relic cell.
```

Spec: in the Upgrade packs row of "Decisions already made", append ` Shrine clears keep giving a relic, since there are no shrine waves; packs come from elites and caches.`

`VFX_REQUESTS.md`: under Pack_Drop, Pack_Open and Pack_CardBack, add `**Status:** placeholder art delivered and in use; final art still wanted.`

- [ ] **Step 2: Commit**

```bash
git add UI_STYLE_GUIDE.md docs/superpowers/specs/2026-09-28-reward-juice-design.md assets/fx/VFX_REQUESTS.md
git commit -m "docs: upgrade packs, relic sources, and pack art status"
```
