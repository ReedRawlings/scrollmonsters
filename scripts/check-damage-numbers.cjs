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
    console.log('Damage numbers: all checks passed.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
