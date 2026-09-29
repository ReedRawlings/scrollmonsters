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

    console.log('PASS: UI foundation');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
