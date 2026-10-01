const assert = require('node:assert/strict');
const fs = require('node:fs');
const {chromium} = require('playwright');
const {gameURL, launchOptions, controlPoint} = require('./survivor-test-utils.cjs');

async function open(browser, viewport, {mobile = false, reducedMotion = 'no-preference', init} = {}) {
  const context = await browser.newContext({viewport, isMobile: mobile, hasTouch: mobile, reducedMotion});
  const page = await context.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.addInitScript(() => window.__vt_pending = true);
  if (init) await page.addInitScript(init);
  await page.goto(gameURL('survivors.html?test'));
  await page.waitForFunction(() => window.__phaserReady);
  page.errors = errors;
  return page;
}
const state = (page, fn, arg) => page.evaluate(fn, arg);
const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  fs.mkdirSync('output/damage-numbers', {recursive: true});
  const browser = await chromium.launch(launchOptions);
  try {
    // --- strip and manifest ---
    const core = await open(browser, {width: 1100, height: 760});
    const strip = await state(core, () => { const s = __survivorTest.scene, d = FX_SHEETS.Damage_Digits, c = FX_SHEETS.Damage_Crit;
      return {d: d && [d.fw, d.fh, d.n, d.adv.length], narrowOne: d && d.adv[1] < d.adv[0], crit: c && [c.fw, c.fh, c.n], loaded: s.textures.exists('Damage_Digits') && s.textures.exists('Damage_Crit')}; });
    assert.deepEqual(strip.d, [8, 9, 12, 12], 'Twelve 8x9 cells (0-9, "+", "!") with an advance per glyph');
    assert.equal(strip.narrowOne, true, '"1" advances less than "0" (proportional, like the font)');
    assert.deepEqual(strip.crit, [24, 24, 5]);
    assert.equal(strip.loaded, true);
    assert.deepEqual(core.errors, []);
    await core.close();

    // --- pool: spawn, merge, crit, cap, recycle, expire, reset ---
    const pool = await open(browser, {width: 1100, height: 760});
    const r = await state(pool, () => { const s = __survivorTest.scene, j = s.juice; s.start(); s.spawnTimer = 999;
      const a = {x: s.player.x + 40, y: s.player.y, r: 10}, b = {x: s.player.x - 40, y: s.player.y, r: 10}, out = {};
      j.damage(a, 3); out.one = j.numbers.list();
      j.damage(a, 2.4); out.merged = j.numbers.list();                      // same target inside 150ms: one number, 5
      j.damage(b, 4, 1.25); out.crit = j.numbers.list().find(n => n.crit); out.critFx = j.played.includes('Damage_Crit');
      j.damage(b, 1, 1.2); out.critStays = j.numbers.list().filter(n => n.crit).length; // merging a normal hit keeps it gold
      j.numbers.reset(); j.damage(a, 0.3); j.damage(b, 123456); out.small = j.numbers.list().map(n => n.value);
      j.numbers.reset(); j.damage(a, 0); out.zero = j.numbers.list().length;
      j.numbers.reset(); const many = Array.from({length: 45}, (_, i) => ({x: 100 + i * 10, y: 300, r: 8}));
      for (const t of many) j.damage(t, 1); out.capped = j.numbers.list().length;
      j.damage(many[0], 7); out.recycled = j.numbers.list().filter(n => n.value === 7).length; // many[0] was recycled: fresh 7, never 8
      out.depth = Math.max(...j.numbers.list().map(n => n.depth)); out.uiDepth = s.ui.root.depth;
      s.start(); out.afterRestart = j.numbers.list().length;
      return out; });
    assert.equal(r.one.length, 1); assert.equal(r.one[0].value, 3); assert.equal(r.one[0].crit, false);
    assert.deepEqual(r.merged.map(n => n.value), [5], 'Hits within 150ms on one target merge into one number');
    assert.equal(r.crit?.value, 4, 'A 1.25x combo-boosted hit is a crit'); assert.equal(r.critFx, true, 'Crits play Damage_Crit');
    assert(r.crit.scale > r.one[0].scale, 'Crits draw bigger');
    assert.equal(r.critStays, 1, 'A 1.2x hit is not a crit, and merging it keeps the crit gold');
    assert.deepEqual(r.small, [1, 99999], 'fractional and huge: at least 1, at most 5 digits');
    assert.equal(r.zero, 0, 'A zero-damage hit shows nothing');
    assert.equal(r.capped, 40, 'At most 40 numbers on screen');
    assert.equal(r.recycled, 1, 'recycle never merges into another target');
    assert(r.depth < r.uiDepth, 'depth below the UI: numbers draw under the 2x HUD');
    assert.equal(r.afterRestart, 0, 'reset clears: restart hides every number');
    await state(pool, () => { const s = __survivorTest.scene; s.juice.damage({x: s.player.x, y: s.player.y, r: 10}, 5); });
    await wait(1100);
    assert.equal(await state(pool, () => { const s = __survivorTest.scene; s.draw(); return s.juice.numbers.list().length; }), 0, 'Numbers expire on their own');
    const gated = await state(pool, () => { const s = __survivorTest.scene, j = s.juice, t = {x: 0, y: 0};
      j.enabled = false; j.damage(t, 5); j.hurt(5); const off = j.numbers.list().length; j.enabled = true; return off; });
    assert.equal(gated, 0, 'Disabled juice shows no numbers');
    assert.deepEqual(pool.errors, []);
    await pool.close();

    // --- real hits drive numbers; the crit rule is combo bonuses only ---
    const sim = await open(browser, {width: 1100, height: 760});
    const h = await state(sim, () => { const s = __survivorTest.scene, j = s.juice, out = {}; s.start(); s.spawnTimer = 999;
      const foe = () => { s.enemies.length = 0; s.spawn('bear', s.player.x + 60, s.player.y); const e = s.enemies.at(-1); e.hp = e.maxHp = 999; e.enemyShield = false; return e; };
      let e = foe(); j.numbers.reset(); s.hit(e, 3, 'cat', s.player); out.plain = j.numbers.list().map(n => [n.value, n.crit]);
      e = foe(); j.numbers.reset(); e.markUntil = s.elapsed + 3; s.hit(e, 4, 'cat', s.player); out.marked = j.numbers.list().map(n => [n.value, n.crit]);
      e = foe(); j.numbers.reset(); s.upgrades.partyDamage = 10; s.hit(e, 4, 'cat', s.player); s.upgrades.partyDamage = 0; out.flatBoost = j.numbers.list().map(n => n.crit);
      e = foe(); j.numbers.reset(); e.enemyShield = true; s.hit(e, 4, 'cat', s.player); out.shielded = j.numbers.list().length;
      j.numbers.reset(); s.player.inv = 0; s.shield = false; const hp = s.player.hp; s.encounters.damage(4, 'test'); out.hurt = j.numbers.list().map(n => [n.hurt, n.value]); out.taken = Math.round(hp - s.player.hp);
      j.numbers.reset(); s.player.inv = 0; s.shield = true; s.encounters.damage(4, 'test'); out.blocked = j.numbers.list().length;
      j.numbers.reset(); s.player.inv = 0; s.shield = false; e = foe(); e.x = s.player.x; e.y = s.player.y; e.contactDamage = 5; s.tick(1 / 60); out.contact = j.numbers.list().filter(n => n.hurt).length;
      return out; });
    assert.deepEqual(h.plain, [[3, false]], 'A plain cat hit shows its damage in white');
    assert.deepEqual(h.marked, [[5, true]], 'An owl-marked hit (x1.25) is a gold crit');
    assert.deepEqual(h.flatBoost, [false], 'partyDamage raises damage but never makes a crit');
    assert.equal(h.shielded, 0, 'A hit eaten by an enemy shield shows nothing');
    assert.deepEqual(h.hurt, [[true, h.taken]], 'Hits on the player show the damage actually taken, in red');
    assert.equal(h.blocked, 0, 'A shield-blocked hit on the player shows nothing');
    assert.equal(h.contact, 1, 'Contact damage shows a red number');
    await sim.screenshot({path: 'output/damage-numbers/hits.png'});
    assert.deepEqual(sim.errors, []);
    await sim.close();

    // --- the pause toggle turns numbers off, persists, and survives storage that throws ---
    for (const [name, viewport, mobile, relics] of [['portrait', {width: 390, height: 844}, true, false], ['landscape', {width: 1100, height: 760}, false, true]]) {
      const page = await open(browser, viewport, {mobile});
      await state(page, relics => { const s = __survivorTest.scene; s.start(); s.spawnTimer = 999; if (relics) s.relics.equipped = ['boots', 'veil', 'veil']; s.pause(); s.draw(); }, relics);
      await page.screenshot({path: `output/damage-numbers/pause-${name}.png`});
      const p = await controlPoint(page, 'Damage numbers: On');
      if (mobile) await page.touchscreen.tap(p.x, p.y); else await page.mouse.click(p.x, p.y);
      const t = await state(page, () => { const s = __survivorTest.scene; s.draw(); s.juice.damage({x: 0, y: 0}, 5);
        return {on: s.juice.numbersOn, shown: s.juice.numbers.list().length, saved: localStorage.getItem('scrollmonsters-survivor-settings-v1')}; });
      assert.deepEqual(t, {on: false, shown: 0, saved: '{"damageNumbers":false,"uiLarge":false}'}, `${name}: the toggle turns numbers off and saves it`);
      await controlPoint(page, 'Damage numbers: Off');
      await page.reload(); await page.waitForFunction(() => window.__phaserReady);
      assert.equal(await state(page, () => __survivorTest.scene.juice.numbersOn), false, `${name}: off survives a reload`);
      assert.deepEqual(page.errors, []);
      await page.context().close();
    }
    const locked = await open(browser, {width: 1100, height: 760}, {init: () => { Storage.prototype.setItem = () => { throw new Error('blocked'); }; Storage.prototype.getItem = () => { throw new Error('blocked'); }; }});
    const ls = await state(locked, () => { const s = __survivorTest.scene; s.start(); s.juice.setNumbers(false); return s.juice.numbersOn; });
    assert.equal(ls, false, 'storage throws: the toggle still works for the session');
    assert.deepEqual(locked.errors, []);
    await locked.close();

    // --- reduced motion: no pop, no crit burst; rise and fade stay ---
    const calm = await open(browser, {width: 1100, height: 760}, {reducedMotion: 'reduce'});
    const c = await state(calm, () => { const s = __survivorTest.scene, j = s.juice; s.start(); j.played.length = 0; j.damage({x: 300, y: 300}, 4, 2);
      return {scale: j.numbers.list()[0].scale, burst: j.played.includes('Damage_Crit')}; });
    assert.deepEqual(c, {scale: 4, burst: false}, 'Reduced motion: crit at its resting 4x size, no Damage_Crit');
    await calm.close();

    // --- crit bursts never starve reward juice; a steadily hit target gets fresh numbers ---
    const busy = await open(browser, {width: 1100, height: 760});
    const b = await state(busy, () => { const s = __survivorTest.scene, j = s.juice; s.start(); j.fx.slice().forEach(f => j.stop(f));
      const one = {x: 200, y: 200}; for (let i = 0; i < 20; i++) j.damage(one, 1, 2);
      const merged = j.fx.filter(f => f.key === 'Damage_Crit').length;
      for (let i = 0; i < 80; i++) j.damage({x: 100 + i, y: 300}, 1, 2);
      return {merged, crits: j.fx.filter(f => f.key === 'Damage_Crit').length, capture: !!j.play('Capture_Burst', 300, 300)}; });
    assert(b.merged <= 8, `Crits never merge (prototype), but their bursts stay within the budget of 8 (got ${b.merged})`);
    assert(b.crits <= 8, `Crit bursts have their own small budget (got ${b.crits})`);
    assert.equal(b.capture, true, 'A crit-heavy fight still leaves room for capture juice');
    const steady = await state(busy, async () => { const j = __survivorTest.scene.juice, boss = {x: 400, y: 400}; j.numbers.reset(); const before = j.numbers.spawned;
      for (let i = 0; i < 10; i++) { j.damage(boss, 1); await new Promise(r => setTimeout(r, 100)); }
      return j.numbers.spawned - before; });
    assert(steady >= 2, `A target hit every 100ms for 1s gets fresh numbers, not one endless total (got ${steady})`);
    assert.deepEqual(busy.errors, []);
    await busy.close();
    console.log('Damage numbers: all checks passed.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
