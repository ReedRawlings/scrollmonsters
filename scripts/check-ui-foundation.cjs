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

    console.log('PASS: UI foundation');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
