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
    // --- shrine: state frames, capture-ring placeholder, crack on clears 1-2, shatter on clear 3 ---
    const sh = await open(browser, {width: 1100, height: 760});
    const frames2 = await state(sh, () => { const s = __survivorTest.scene; s.start(); const e = s.expedition; s.elapsed = 120; const out = []; // start() builds a new expedition
      for (let c = 0; c <= 3; c++) { e.shrine.completed = c; e.shrine.done = c === 3; s.draw(); out.push(e.shrineSprite.frame.name); }
      e.shrine.completed = 0; e.shrine.done = false; e.shrine.active = true; e.shrine.progress = 3; s.draw();
      return {out, ring: s.juice.rings.shrine?.fill.frame.name}; });
    assert.deepEqual(frames2.out, ['f0', 'f1', 'f2', 'f3'], 'ShrineStates frame = challenges completed');
    assert.equal(frames2.ring, 'f8', 'Shrine charge fill = round(progress/6*16)');
    const crack = await state(sh, () => { const s = __survivorTest.scene, e = s.expedition; s.juice.played.length = 0;
      e.shrine.inCombat = true; e.completeShrine({shrineTier: 1}); s.draw(); return {chunks: s.juice.chunks, spark: s.juice.played.includes('Spark_Light')}; });
    assert(crack.chunks >= 3 && crack.chunks <= 6 && !crack.spark, 'A first clear cracks with a few shards and no light burst');
    const shatter = await state(sh, () => { const s = __survivorTest.scene, e = s.expedition; s.player.x = e.shrine.x; s.player.y = e.shrine.y + 150; e.shrine.completed = 2; e.shrine.inCombat = true; e.shrine.needsExit = false;
      e.completeShrine({shrineTier: 3}); s.draw(); return {chunks: s.juice.chunks, spark: s.juice.played.includes('Spark_Light'), frame: e.shrineSprite.frame.name, frozen: s.juice.frozenUntil > 0}; });
    assert(shatter.chunks >= 15 && shatter.spark && shatter.frame === 'f3' && shatter.frozen, 'The third clear shatters');
    await wait(180); // let the camera follow the player to the shrine and the burst develop
    await sh.screenshot({path: 'output/juice/shrine-shatter.png'});
    await wait(1600);
    assert.equal(await state(sh, () => __survivorTest.scene.juice.chunks), 0, 'Shards and rubble clean up');
    assert.deepEqual(sh.errors, []);
    await sh.close();
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
    console.log('PASS: juice');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
