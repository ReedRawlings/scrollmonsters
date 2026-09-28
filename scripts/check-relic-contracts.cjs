const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { gameURL, launchOptions } = require('./survivor-test-utils.cjs');

(async () => {
  const browser = await chromium.launch(launchOptions);
  try {
    const page = await browser.newPage({ viewport: { width: 1100, height: 760 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => window.__vt_pending = true);
    await page.goto(gameURL('survivors.html?test'));
    await page.waitForFunction(() => window.__phaserReady);
    const result = await page.evaluate(() => {
      const s = __survivorTest.scene;
      const reset = () => { s.start(); s.obstacles = []; };
      const target = (x = 1000) => { const e = s.spawn('beast', x, 1000); e.hp = e.maxHp = 10000; return e; };
      reset();
      s.rand = () => 0;
      s.relics.equipped = ['echo', 'pack', 'resonance', 'hunter'];
      s.upgrades.partyDamage = 5;
      s.upgrades.frogPower = 2;
      s.upgrades.webWeaken = 2;
      s.expedition.release('frog', 1100, 1100, true);
      const e = target();
      e.markUntil = e.webUntil = 3;
      for (const source of ['owl', 'beast']) s.hit(e, 10, source, s.player);
      s.relics.echoes = [];
      const hp = e.hp;
      s.hit(e, 10, 'cat', s.player);
      const original = hp - e.hp;
      const hunterHits = e.hunterHits;
      const pending = s.relics.echoes.length;
      s.relics.update(.2);
      const echo = hp - e.hp - original;
      const echoState = { pending, remaining: s.relics.echoes.length, hunterHits, afterHunterHits: e.hunterHits };
      const shielded = target();
      shielded.enemyShield = true;
      s.hit(shielded, 10, 'cat', s.player);
      const shieldEchoes = s.relics.echoes.length;

      reset();
      s.relics.equipped = ['resonance', 'hunter'];
      const sequence = steps => {
        const enemy = target();
        return steps.map(([time, source]) => {
          s.elapsed = time;
          return s.relics.modifyHit(enemy, 10, source) / (1 + .03 * enemy.hunterHits);
        });
      };
      const expired = sequence([[0, 'cat'], [2, 'owl'], [4, 'beast']]);
      const boundary = sequence([[0, 'cat'], [1, 'owl'], [3, 'beast']]);
      const repeated = sequence([[0, 'cat'], [1, 'cat'], [2, 'owl'], [3.5, 'beast'], [4, 'cat']]);
      const refreshed = sequence([[0, 'cat'], [2, 'cat'], [3, 'owl'], [4, 'beast']]);
      const focused = target();
      for (const [time, source] of [[0, 'cat'], [2, 'owl'], [4, 'beast']]) {
        s.elapsed = time;
        s.relics.modifyHit(focused, 10, source);
      }
      const hunterBeforeIdle = focused.hunterHits;
      s.elapsed = 7.01;
      s.relics.modifyHit(focused, 10, 'cat');
      const hunterAfterIdle = focused.hunterHits;

      reset();
      const el = s.creatures.elements;
      s.upgrades.stormStrike = 1;
      const enemies = Array.from({ length: 6 }, (_, i) => target(1000 + i * 25));
      enemies[0].enemyShield = true;
      el.lightning(s.player, enemies[0], 4, 1);
      const shieldHits = el.stormHits;
      el.lightning(s.player, enemies[0], 4, 2);
      const afterTwo = { hits: el.stormHits, casts: el.casts.length };
      el.lightning(s.player, enemies[2], 4, 1);
      const afterThree = { hits: el.stormHits, casts: el.casts.length };
      el.lightning(s.player, enemies[3], 4, 3, 130, true);
      const afterSix = { hits: el.stormHits, casts: el.casts.length };
      el.update(.61);
      const afterStrikes = { hits: el.stormHits, casts: el.casts.length };
      s.relics.equipped = ['echo'];
      s.hit(enemies[0], 4, 'storm', s.player);
      s.relics.update(.2);
      const afterEcho = el.stormHits;
      enemies[0].hp = 1;
      el.lightning(s.player, enemies[0], 4, 1);
      const afterKillingHit = el.stormHits;
      reset();
      return { original, echo, echoState, shieldEchoes, expired, boundary, repeated, refreshed,
        hunterBeforeIdle, hunterAfterIdle, shieldHits, afterTwo, afterThree, afterSix,
        afterStrikes, afterEcho, afterKillingHit, resetHits: s.creatures.elements.stormHits };
    });
    const near = (actual, expected) => assert(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);
    near(result.original, 10 * 1.4 * 1.15 * 1.4 * 1.09 * 1.2 * 1.25 * 1.3);
    near(result.echo, result.original * .4);
    assert.deepEqual(result.echoState, { pending: 1, remaining: 0, hunterHits: 3, afterHunterHits: 3 });
    assert.equal(result.shieldEchoes, 0);
    for (const [name, expected] of Object.entries({ expired: [10, 10, 10], boundary: [10, 10, 14],
      repeated: [10, 10, 10, 14, 10], refreshed: [10, 10, 10, 14] })) {
      result[name].forEach((value, i) => near(value, expected[i]));
    }
    assert.equal(result.hunterBeforeIdle, 3);
    assert.equal(result.hunterAfterIdle, 1);
    assert.equal(result.shieldHits, 0);
    assert.deepEqual(result.afterTwo, { hits: 2, casts: 0 });
    assert.deepEqual(result.afterThree, { hits: 3, casts: 1 });
    assert.deepEqual(result.afterSix, { hits: 6, casts: 2 });
    assert.deepEqual(result.afterStrikes, { hits: 6, casts: 0 });
    assert.equal(result.afterEcho, 6);
    assert.equal(result.afterKillingHit, 7);
    assert.equal(result.resetHits, 0);
    assert.deepEqual(errors, []);
    console.log('PASS: finalized Echo damage; rolling Resonance window; global Thunderhead thresholds without recursive procs.', result);
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
