const assert = require('node:assert/strict');
const fs = require('node:fs');
const {chromium} = require('playwright');
const {gameURL, launchOptions, controlPoint, listControls, offscreenTexts} = require('./survivor-test-utils.cjs');

// Playtest feedback pass (2026-09-29): map text, capture zone, pick dismissal, title motion, desktop view and UI size.
async function open(browser, viewport = {width: 1100, height: 760}, {mobile = false, reducedMotion = 'no-preference', init} = {}) {
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
  fs.mkdirSync('output/feedback', {recursive: true});
  const browser = await chromium.launch(launchOptions);
  try {
    // --- map text: only the den header ---
    const page = await open(browser);
    const t = await state(page, () => { const s = __survivorTest.scene, out = {}; s.start(); s.spawnTimer = 999;
      s.announce('Elite defeated!'); s.announce('Shrine challenge 1/3!'); s.elapsed = 61; s.expedition.update(0); out.banner = s.noticeTime;
      s.headline('A den of monsters appears'); out.headline = [s.notice, s.noticeTime > 0]; s.noticeTime = 0;
      s.elapsed = 150; s.expedition.update(0); out.den = [s.notice, s.noticeTime > 0];
      s.noticeTime = 0; s.elapsed = 100; const sh = s.expedition.shrine; sh.active = true; sh.x = s.player.x + 80; sh.y = s.player.y;
      s.drop('haste', s.player.x + 40, s.player.y); s.drop('shield', s.player.x - 40, s.player.y);
      s.summonOwl(); s.owl.x = s.player.x; s.owl.y = s.player.y - 60; s.draw();
      const texts = []; s.ui.walk(o => { if (o.type === 'Text' && o.visible && o.text) texts.push(o.text); });
      out.world = texts.filter(x => /CAPTURE|WILD OWL|SHRINE|FRENZY|SHIELD|XP MAGNET|CLEANSE|\+8 HP/.test(x));
      return out; });
    assert.equal(t.banner, 0, 'No banner for elites, shrines or phase changes');
    assert.deepEqual(t.headline, ['A den of monsters appears', true], 'headline() shows the header');
    assert.deepEqual(t.den, ['A den of monsters appears', true], 'The real den path still shows its header');
    assert.deepEqual(t.world, [], 'No world-anchored text: ' + t.world);
    assert.deepEqual(page.errors, []);
    await page.close();
    console.log('Feedback: all checks passed.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
