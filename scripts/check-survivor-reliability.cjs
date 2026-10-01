const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { gameURL, launchOptions, listControls } = require('./survivor-test-utils.cjs');

const historyKey = 'scrollmonsters-survivor-runs-v1';

(async () => {
  const browser = await chromium.launch(launchOptions);
  const errors = [];
  fs.mkdirSync('output/reliability-v26', { recursive: true });
  try {
    for (const mobile of [false, true]) {
      const page = await browser.newPage({
        viewport: mobile ? { width: 390, height: 844 } : { width: 1100, height: 760 },
        isMobile: mobile, hasTouch: mobile
      });
      page.on('pageerror', error => errors.push(error.message));
      await page.addInitScript(() => window.__vt_pending = true);
      await page.goto(gameURL('survivors.html?test'));
      await page.waitForFunction(() => window.__phaserReady);
      const controls = () => listControls(page);
      const click = async (x, y) => { if (mobile) await page.touchscreen.tap(x, y); else await page.mouse.click(x, y, { delay: 60 }); };
      await page.evaluate(() => { const s = __survivorTest.scene; s.start(); s.pause(); });
      const historyBefore = (await controls()).find(button => button.label === 'Run history / export');
      assert(historyBefore, 'Pause shows Run history / export');
      await page.evaluate(() => {
        const s = __survivorTest.scene;
        s.relics.equipped = ['boots', 'stone', 'ricochet', 'repulsion', 'slipstream', 'bloodroot', 'pack', 'resonance', 'echo', 'drum', 'hunter', 'spite', 'veil'];
        s.draw();
      });
      const buttons = await controls();
      assert.deepEqual(buttons.map(button => button.label), mobile ? ['Resume', 'Damage numbers: On', 'Music: On'] : ['Resume', 'Damage numbers: On', 'UI size: Normal', 'Music: On']);
      const url = page.url();
      await click(historyBefore.x, historyBefore.y); // where the history button was before the relic screen covered it
      await page.waitForTimeout(100);
      assert.equal(page.url(), url, 'covered history button must not navigate');
      assert.equal(await page.evaluate(() => { advanceTime(1000); return __survivorTest.scene.mode; }), 'paused');
      await page.screenshot({ path: `output/reliability-v26/inventory-${mobile ? 'mobile' : 'desktop'}.png` });
      await click(buttons[0].x, buttons[0].y);
      assert.equal(await page.evaluate(() => __survivorTest.scene.mode), 'playing');
      await page.keyboard.press('p');
      assert.equal(await page.evaluate(() => __survivorTest.scene.mode), 'paused');
      await page.keyboard.press('Enter');
      assert.equal(await page.evaluate(() => __survivorTest.scene.mode), 'playing');
      await page.close();
    }

    const page = await browser.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => window.__vt_pending = true);
    await page.goto(gameURL('survivors.html?test'));
    await page.waitForFunction(() => window.__phaserReady);
    const budget = await page.evaluate(key => {
      const s = __survivorTest.scene;
      s.start();
      localStorage.setItem('scrollmonsters-starters-v1', JSON.stringify(['cat', 'storm']));
      const older = Array.from({ length: 30 }, (_, i) => ({ id: `older-${i}`, events: [{ time: 0, type: 'fixture', note: 'x'.repeat(40000) }] }));
      localStorage.setItem(key, JSON.stringify(older));
      s.saveRun();
      const stored = localStorage.getItem(key), history = JSON.parse(stored);
      return { bytes: stored.length * 2, count: history.length, newest: history[0].id === s.run.id, second: history[1].id, oldest: history.at(-1).id, unlocks: JSON.parse(localStorage.getItem('scrollmonsters-starters-v1')), error: s.logStorageError };
    }, historyKey);
    assert(budget.bytes <= 2 * 1024 * 1024);
    assert(budget.count > 1 && budget.count < 31);
    assert(budget.newest && !budget.error);
    assert.equal(budget.second, 'older-0');
    assert.notEqual(budget.oldest, 'older-29');
    assert.deepEqual(budget.unlocks, ['cat', 'storm']);

    const quota = await page.evaluate(key => {
      const s = __survivorTest.scene;
      const original = Storage.prototype.setItem;
      let attempts = 0;
      try {
        Storage.prototype.setItem = function (name, value) {
          if (name === key) {
            attempts++;
            if (value.length > 70000) throw new DOMException('Simulated quota', 'QuotaExceededError');
          }
          return original.call(this, name, value);
        };
        s.saveRun();
      } finally { Storage.prototype.setItem = original; }
      const history = JSON.parse(localStorage.getItem(key));
      return { attempts, count: history.length, latest: history[0].id === s.run.id, error: s.logStorageError };
    }, historyKey);
    assert(quota.attempts > 1 && quota.latest && !quota.error);
    assert(quota.count < budget.count);

    const longRun = await page.evaluate(key => {
      const s = __survivorTest.scene;
      localStorage.removeItem(key);
      s.run.events = Array.from({ length: 60 }, (_, i) => ({ time: i, type: 'fixture', note: 'x'.repeat(40000) }));
      s.run.samples = [{ seconds: 0 }];
      s.saveRun();
      const stored = localStorage.getItem(key), saved = JSON.parse(stored)[0];
      return { bytes: stored.length * 2, omitted: saved.telemetryOmitted, summary: saved.summary.seconds, liveEvents: s.run.events.length, error: s.logStorageError };
    }, historyKey);
    assert(longRun.bytes <= 2 * 1024 * 1024 && longRun.omitted.events > 0 && !longRun.error);
    assert.equal(longRun.liveEvents, 60, 'storage compaction must not mutate the live telemetry');
    assert.equal(longRun.summary, 0);

    const failure = await page.evaluate(key => {
      const s = __survivorTest.scene;
      const before = localStorage.getItem(key), original = Storage.prototype.setItem;
      let attempts = 0;
      try {
        Storage.prototype.setItem = function (name, value) {
          if (name === key) { attempts++; throw new DOMException('Storage unavailable', 'SecurityError'); }
          return original.call(this, name, value);
        };
        s.saveRun();
      } finally { Storage.prototype.setItem = original; }
      const result = { attempts, error: s.logStorageError, unchanged: before === localStorage.getItem(key) };
      s.saveRun();
      result.recovered = !s.logStorageError;
      return result;
    }, historyKey);
    assert.deepEqual(failure, { attempts: 1, error: true, unchanged: true, recovered: true });

    const exhausted = await page.evaluate(key => {
      const s = __survivorTest.scene, before = localStorage.getItem(key), original = Storage.prototype.setItem;
      let attempts = 0;
      try {
        Storage.prototype.setItem = function (name, value) {
          if (name === key) { attempts++; throw new DOMException('No storage available', 'QuotaExceededError'); }
          return original.call(this, name, value);
        };
        s.saveRun();
      } finally { Storage.prototype.setItem = original; }
      return { attempts, error: s.logStorageError, unchanged: before === localStorage.getItem(key) };
    }, historyKey);
    assert(exhausted.error && exhausted.unchanged && exhausted.attempts > 1 && exhausted.attempts < 20);

    const countLimit = await page.evaluate(key => {
      const s = __survivorTest.scene;
      s.run.events = [];
      s.run.samples = [];
      localStorage.setItem(key, JSON.stringify(Array.from({ length: 55 }, (_, i) => ({ id: `tiny-${i}` }))));
      s.saveRun();
      const saved = JSON.parse(localStorage.getItem(key));
      return { count: saved.length, oldest: saved.at(-1).id, error: s.logStorageError };
    }, historyKey);
    assert.deepEqual(countLimit, { count: 50, oldest: 'tiny-48', error: false });
    await page.evaluate(key => localStorage.removeItem(key), historyKey);

    const compact = await page.evaluate(key => {
      const s = __survivorTest.scene;
      s.start();
      for (let i = 0; i <= 120; i++) { s.elapsed = i * 5; s.sampleRun(); }
      s.finishRun('won');
      const saved = JSON.parse(localStorage.getItem(key))[0];
      return { size: JSON.stringify(saved).length, samples: saved.samples.length, sample: saved.samples[0], summary: saved.summary, status: saved.status, error: s.logStorageError };
    }, historyKey);
    assert.equal(compact.samples, 121);
    assert(compact.size < 100000, 'ten-minute checkpoint history should stay compact');
    assert.equal(compact.status, 'won');
    assert.equal(compact.summary.seconds, 600);
    assert(!compact.error && !('creatures' in compact.sample) && !('encounters' in compact.sample));
    assert.deepEqual(compact.sample.party, ['cat']);
    await page.goto(gameURL('survivor-runs.html'));
    assert((await page.locator('article').count()) > 0);
    const download = page.waitForEvent('download');
    await page.locator('#export').click();
    assert((await download).suggestedFilename().endsWith('.json'));
    assert.deepEqual(errors, []);
    console.log('PASS: desktop/touch pause input, history byte budget, quota retry, oversized run, storage failure/recovery, compact checkpoints, history/export');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
