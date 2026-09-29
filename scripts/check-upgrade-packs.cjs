const assert = require('node:assert/strict');
const fs = require('node:fs');
const {chromium} = require('playwright');
const {gameURL, launchOptions} = require('./survivor-test-utils.cjs');

async function open(browser, viewport = {width: 1100, height: 760}, {mobile = false, reducedMotion = 'no-preference'} = {}) {
  const context = await browser.newContext({viewport, isMobile: mobile, hasTouch: mobile, reducedMotion});
  const page = await context.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.addInitScript(() => window.__vt_pending = true);
  await page.goto(gameURL('survivors.html?test'));
  await page.waitForFunction(() => window.__phaserReady);
  page.errors = errors;
  return page;
}
const state = (page, fn, arg) => page.evaluate(fn, arg);
const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  fs.mkdirSync('output/upgrade-packs', {recursive: true});
  const browser = await chromium.launch(launchOptions);
  try {
    // --- odds: 81 / 17 / 2 over many seeded rolls (the spec's 82/17/2 sums to 101%) ---
    const page = await open(browser);
    const odds = await state(page, () => { const s = __survivorTest.scene; s.start(); const c = {1: 0, 3: 0, 5: 0};
      for (let i = 0; i < 40000; i++) c[SurvivorPacks.size(s.rand())]++; return c; });
    assert(Math.abs(odds[1] / 40000 - .81) < .01 && Math.abs(odds[3] / 40000 - .17) < .01 && Math.abs(odds[5] / 40000 - .02) < .004, 'Pack sizes follow 81/17/2: ' + JSON.stringify(odds));
    assert.deepEqual(await state(page, () => [SurvivorPacks.size(0), SurvivorPacks.size(.8099), SurvivorPacks.size(.81), SurvivorPacks.size(.9799), SurvivorPacks.size(.98)]), [1, 1, 3, 3, 5]);

    // --- cards come from the active team's pool; every card is granted on pickup; combat pauses ---
    const r = await state(page, () => { const s = __survivorTest.scene, out = {}; s.start(); s.spawnTimer = 999;
      const teamIds = new Set(s.upgradePool().map(u => u.id)), drops = [];
      for (let i = 0; i < 200; i++) { const item = s.packs.drop(s.player.x + 300, s.player.y, 'test'); drops.push(...item.cards); }
      out.outside = drops.filter(id => !teamIds.has(id));
      out.sizes = [...new Set(s.packs.items.map(p => p.size))].sort();
      s.packs.items.forEach(p => p.sprite.destroy()); s.packs.items.length = 0;
      const item = s.packs.drop(s.player.x + 300, s.player.y, 'test'); item.cards = ['hide', 'feet', 'hide']; item.size = 3;
      const before = {hide: s.upgrades.hide, feet: s.upgrades.feet, maxHp: s.maxHp};
      s.player.x = item.x; s.player.y = item.y; s.tick(1 / 60);
      out.mode = s.mode; out.granted = [s.upgrades.hide - before.hide, s.upgrades.feet - before.feet, s.maxHp - before.maxHp];
      out.left = s.packs.items.length; out.reveal = s.packs.reveal?.cards.map(c => c.id);
      const t = s.elapsed; s.tick(1); out.paused = s.elapsed === t;
      out.events = s.run.events.filter(e => e.type === 'pack_opened').map(e => e.cards);
      s.packs.close(); out.after = s.mode; out.revealAfter = s.packs.reveal;
      return out; });
    assert.deepEqual(r.outside, [], 'Cards come only from the active team pool');
    assert.deepEqual(r.mode, 'pack'); assert.deepEqual(r.granted, [2, 1, 16], 'Every card applies on pickup, hide twice (+16 max HP)');
    assert.equal(r.left, 0); assert.deepEqual(r.reveal, ['hide', 'feet', 'hide']);
    assert.equal(r.paused, true, 'mode=pack pauses the sim'); assert.deepEqual(r.events, [['hide', 'feet', 'hide']]);
    assert.equal(r.after, 'playing'); assert.equal(r.revealAfter, null);

    // --- review focus: stale cards, level-up ordering, two packs, restart ---
    const f = await state(page, () => { const s = __survivorTest.scene, out = {}; s.start(); s.spawnTimer = 999;
      s.upgrades.pull = 1; const stale = s.packs.drop(s.player.x, s.player.y, 'test'); stale.cards = ['pull']; s.packs.open(stale);
      out.stale = [s.upgrades.pull, s.packs.reveal.cards[0].id !== 'pull']; s.packs.close();
      s.xp = s.xpNeeded(); const lv = s.level, a = s.packs.drop(s.player.x, s.player.y, 'test'), b = s.packs.drop(s.player.x + 1, s.player.y, 'test');
      s.tick(1 / 60); out.first = [s.mode, s.level, s.packs.items.length];
      s.packs.close(); out.levelAfter = [s.mode, s.level === lv + 1]; s.chooseUpgrade(0);
      s.tick(1 / 60); out.second = [s.mode, s.packs.items.length]; s.packs.close();
      s.packs.drop(s.player.x + 200, s.player.y, 'test'); s.start(); out.restart = [s.packs.items.length, s.packs.reveal, s.children.list.filter(o => /^Pack_Drop/.test(o.texture?.key) && o.active).length];
      return out; });
    assert.deepEqual(f.stale, [1, true], 'stale card is redrawn: a once-only upgrade is never granted twice');
    assert.deepEqual(f.first, ['pack', f.first[1], 1], 'two packs, one at a time: the first opens, the second waits');
    assert.deepEqual(f.levelAfter, ['upgrade', true], 'level-up waits for the pack, then opens');
    assert.deepEqual(f.second, ['pack', 0], 'The second pack opens after the first closes');
    assert.deepEqual(f.restart, [0, null, 0], 'restart clears packs');
    assert.deepEqual(page.errors, []);
    await page.close();
    console.log('Upgrade packs: all checks passed.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
