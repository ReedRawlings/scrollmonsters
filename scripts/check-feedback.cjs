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

    // --- capture zone 2x: radius 140, ring and fill at 6x (shrine circle unchanged) ---
    const cz = await open(browser);
    const c = await state(cz, () => { const s = __survivorTest.scene, out = {}; s.start(); s.spawnTimer = 999;
      s.expedition.release('mouse', s.player.x + 200, s.player.y, false); const b = s.expedition.captureBody('mouse') || s.creatures.allies.mouse;
      if (!b) return {missing: true}; b.state = 'ready'; b.progress = 0;
      const at = d => { b.x = s.player.x + d; b.y = s.player.y; const before = b.progress; s.expedition.capture(b, 'mouse', 1 / 60); return b.progress > before; };
      out.in = at(120); b.progress = .5; out.out = !at(150) ; s.draw();
      const r = s.juice.rings.mouse; out.ring = r && [r.ring.scaleX, r.fill.scaleX];
      s.elapsed = 100; const sh = s.expedition.shrine; sh.active = true; s.draw(); out.shrine = s.juice.rings.shrine?.ring.scaleX;
      return out; });
    assert.notEqual(c.missing, true, 'test setup: a ready mouse capture');
    assert.equal(c.in, true, 'Standing 120px away charges the capture'); assert.equal(c.out, true, 'Standing 150px away does not');
    assert.deepEqual(c.ring, [6, 6], 'The capture ring and fill draw at 6x'); assert.equal(c.shrine, 3, 'The shrine circle stays at 3x');
    await cz.screenshot({path: 'output/feedback/capture-ring.png'});
    assert.deepEqual(cz.errors, []);
    await cz.close();

    // --- the picked upgrade card lingers for the 260ms hold and its icon lifts off it ---
    const pk = await open(browser);
    await state(pk, () => { const s = __survivorTest.scene; s.start(); s.spawnTimer = 999; s.xp = s.xpNeeded(); s.checkLevel(); s.draw(); });
    await wait(450);
    const names = await state(pk, () => __survivorTest.scene.choices.map((c, i) => (i + 1) + '. ' + c.name));
    const cp = await controlPoint(pk, names[0]); await pk.mouse.click(cp.x, cp.y); await wait(80);
    const mid = await state(pk, names => { const s = __survivorTest.scene; s.draw(); const shown = []; s.ui.walk(o => { if (o.type === 'Text' && o.visible && names.includes(o.text) && o.alpha > 0.05) { let a = o.alpha; for (let n = o.parentContainer; n; n = n.parentContainer) a *= n.alpha; if (a > 0.05) shown.push(o.text); } });
      const f = s.juice.flights[0], c = s.juice.picked?.card; return {shown, from: f && f.from, card: c}; }, names);
    await pk.screenshot({path: 'output/feedback/pick-dismiss.png'});
    assert.deepEqual(mid.shown, [names[0]], 'Only the picked card stays on screen during the hold');
    assert(mid.card && mid.from.x >= mid.card.x && mid.from.x <= mid.card.x + mid.card.w && mid.from.y >= mid.card.y && mid.from.y <= mid.card.y + mid.card.h, 'The icon lifts off the picked card');
    await wait(350);
    const late = await state(pk, names => { const s = __survivorTest.scene; s.draw(); const shown = []; s.ui.walk(o => { if (o.type === 'Text' && o.visible && names.includes(o.text)) shown.push(o.text); }); return shown; }, names);
    assert.deepEqual(late, [], 'The picked card is gone after the hold');
    assert.deepEqual(pk.errors, []);
    await pk.close();
    console.log('Feedback: all checks passed.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
