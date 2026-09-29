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
    console.log('PASS: juice');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
