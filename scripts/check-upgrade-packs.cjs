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
    // --- sources: elites and caches drop packs; relics only after a shrine completion ---
    const src = await open(browser);
    const d = await state(src, () => { const s = __survivorTest.scene, out = {}; s.start(); s.spawnTimer = 999;
      s.elapsed = 330; s.relics.update(0); const hunter = s.enemies.find(e => e.packReward); out.hunterFlag = !!hunter;
      s.hit(hunter, 9999, 'player', s.player); out.hunter = [s.packs.items.length, s.relics.queue.length];
      s.start(); s.elapsed = 45; s.relics.update(0); const cache = s.relics.cache; s.player.x = cache.x; s.player.y = cache.y;
      for (let i = 0; i < 3; i++) s.relics.update(0); for (const g of s.enemies.filter(e => e.cacheGuard)) s.hit(g, 9999, 'player', s.player); s.relics.update(0);
      out.cache = [s.packs.items.length, s.relics.queue.length, s.packs.items[0]?.source];
      return out; });
    assert.equal(d.hunterFlag, true, 'Hunters still spawn, now carrying a pack');
    assert.deepEqual(d.hunter, [1, 0], 'An elite kill drops a pack and queues no relic');
    assert.deepEqual(d.cache.slice(0, 2), [1, 0], 'A claimed cache drops a pack and queues no relic'); assert(/_cache$/.test(d.cache[2]));
    // A full 600s policy run: every relic offer follows a shrine completion, and packs actually open.
    const run = await state(src, () => { const s = __survivorTest.scene; s.start(); let steps = 0;
      while (s.elapsed < 601 && steps++ < 60000) { if (s.mode === 'relic') s.relics.choose(0); else if (s.mode === 'upgrade') s.chooseUpgrade(0); else if (s.mode === 'pack') s.packs.close(); else if (s.mode === 'unlock') s.closeUnlock(); else if (s.mode !== 'playing') break;
        const sh = s.expedition.shrine; if (s.elapsed >= 100 + 60 * sh.completed && sh.completed < 3 && !sh.inCombat) { sh.inCombat = true; s.expedition.completeShrine({shrineTier: sh.completed + 1}); }
        s.player.inv = 2; s.tick(1 / 60); }
      return s.run.events.filter(e => ['relic_offered', 'shrine_completed', 'pack_dropped', 'pack_opened'].includes(e.type)).map(e => e.type); });
    let shrines = 0, offers = 0; for (const t of run) { if (t === 'shrine_completed') shrines++; if (t === 'relic_offered') { offers++; assert(offers <= shrines, 'relics are offered only after a shrine completion'); } }
    assert(run.includes('pack_dropped'), 'The policy run drops packs');
    assert.equal(shrines, 3); assert(offers >= 1, 'Shrine clears still offer relics');
    console.log('policy run:', {shrines, offers, dropped: run.filter(t => t === 'pack_dropped').length, opened: run.filter(t => t === 'pack_opened').length});
    assert.deepEqual(src.errors, []);
    await src.close();
    // --- reveal: deal-in lock, tap flips, tap or 1s files, then icons fly and combat resumes ---
    const rv = await open(browser, {width: 390, height: 844}, {mobile: true});
    await state(rv, () => { const s = __survivorTest.scene; s.start(); s.spawnTimer = 999; const p = s.packs.drop(s.player.x, s.player.y, 'test'); p.size = 3; p.cards = p.cards.concat(s.packs.draw(s.upgradePool(), 2).map(u => u.id)).slice(0, 3); s.tick(1 / 60); s.draw(); });
    const R = () => state(rv, () => { const s = __survivorTest.scene; s.packs.realtime(); s.draw(); const r = s.packs.reveal; return r ? {kept: r.kept, flipped: r.flippedAt !== null, mode: s.mode} : {mode: s.mode, flights: s.juice.flights.length}; });
    await rv.touchscreen.tap(195, 420);
    assert.deepEqual(await R(), {kept: 0, flipped: false, mode: 'pack'}, 'deal-in lock: an early tap does nothing');
    await wait(600); await rv.screenshot({path: 'output/upgrade-packs/stack.png'});
    await rv.touchscreen.tap(195, 420); await wait(250);
    assert.deepEqual(await R(), {kept: 0, flipped: true, mode: 'pack'}, 'A tap flips the top card');
    assert(await state(rv, () => __survivorTest.scene.juice.played.includes('Pack_Flip')), 'The flip flashes');
    await rv.screenshot({path: 'output/upgrade-packs/flipped.png'});
    await rv.touchscreen.tap(195, 420);
    assert.deepEqual(await R(), {kept: 1, flipped: false, mode: 'pack'}, 'A second tap files it into the hand');
    await rv.touchscreen.tap(195, 420); await wait(1150);
    assert.deepEqual(await R(), {kept: 2, flipped: false, mode: 'pack'}, 'A flipped card files itself after one second');
    await rv.keyboard.press('Enter'); await wait(250); await rv.keyboard.press('Enter');
    let end = await R(); assert.equal(end.mode, 'pack', 'Still showing the full hand for a moment');
    await rv.screenshot({path: 'output/upgrade-packs/hand.png'});
    await wait(300); end = await R();
    assert.deepEqual(end, {mode: 'playing', flights: 3}, 'After the last card, each icon flies to its slot and combat resumes');
    assert.deepEqual(rv.errors, []);
    await rv.context().close();
    // Landscape and reduced motion: the whole reveal fits, and no flip flash plays.
    const calm = await open(browser, {width: 1100, height: 760}, {reducedMotion: 'reduce'});
    const c = await state(calm, () => { const s = __survivorTest.scene; s.start(); s.spawnTimer = 999; const p = s.packs.drop(s.player.x, s.player.y, 'test'); p.size = 5; p.cards = s.packs.draw(s.upgradePool(), 5).map(u => u.id); s.tick(1 / 60); s.packs.reveal.start -= 1000; s.juice.played.length = 0; s.packs.act(); s.draw(); return {flash: s.juice.played.includes('Pack_Flip'), hand: s.screens.layout.hand.length}; });
    assert.deepEqual(c, {flash: false, hand: 5}, 'Reduced motion: no flip flash; five hand slots');
    await calm.screenshot({path: 'output/upgrade-packs/landscape-legendary.png'});
    assert.deepEqual(calm.errors, []);
    await calm.close();
    console.log('Upgrade packs: all checks passed.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
