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
    assert.deepEqual(strip.d, [8, 9, 10, 10], 'Ten 8x9 digit cells with an advance per digit');
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
    console.log('Damage numbers: all checks passed.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
