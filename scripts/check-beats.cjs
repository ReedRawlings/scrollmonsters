const assert = require('node:assert/strict');
const fs = require('node:fs');
const {chromium} = require('playwright');
const {gameURL, launchOptions, controlPoint, offscreenTexts} = require('./survivor-test-utils.cjs');

// Prototype beats (2026-09-30): XP gems, level-up, pick travel, damage finish, pack, relic, capture, unlock, title.
// No toasts by user decision: visuals and numbers only.
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
  fs.mkdirSync('output/beats', {recursive: true});
  const browser = await chromium.launch(launchOptions);
  try {
    // --- XP gems: a real gem sprite, an arc drawn on top of the straight sim path, and the XP bar flashes per gem ---
    const gp = await open(browser);
    const g = await state(gp, () => { const s = __survivorTest.scene, j = s.juice, out = {}; s.start(); s.spawnTimer = 999;
      const xp = s.totalXp; s.drop('xp', s.player.x + 90, s.player.y); const gem = s.pickups.at(-1); out.key = gem.sprite.texture.key;
      s.tick(1 / 60); s.draw(); const start = j.gemOffset(gem); for (let i = 0; i < 9; i++) s.tick(1 / 60); s.draw(); const mid = j.gemOffset(gem);
      out.start = Math.hypot(start.x, start.y); out.mid = Math.hypot(mid.x, mid.y); out.drawn = Math.round(Math.hypot(gem.sprite.x - gem.x, gem.sprite.y - gem.y));
      for (let i = 0; i < 60 && gem.life > 0; i++) s.tick(1 / 60); s.draw();
      out.collected = s.totalXp > xp; out.flash = s.hud.layout.xpFlash > 0; return out; });
    assert.equal(g.key, 'xpGem', 'XP drops use the gem sprite');
    assert(g.start < 1 && g.mid > 4, `The gem arcs in: offset ${g.start} at the start, ${g.mid} mid-flight`); assert(g.drawn > 4, 'The arc is drawn');
    assert.equal(g.collected, true); assert.equal(g.flash, true, 'Collecting a gem flashes the XP bar');
    // Level-up: the player flashes, a small shake, the XP bar flashes bright, and a 60ms freeze.
    const lv = await state(gp, () => { const s = __survivorTest.scene, j = s.juice; s.start(); s.spawnTimer = 999; s.xp = s.xpNeeded(); s.checkLevel(); s.draw();
      return {flash: j.fx.some(f => f.key === 'flash'), shake: j.jitterUntil > j.now(), bar: s.hud.layout.xpFlash > 0, frozen: j.frozen()}; });
    assert.deepEqual(lv, {flash: true, shake: true, bar: true, frozen: true}, 'Level-up flashes the player, shakes a little, flashes the bar and holds 60ms');
    await gp.screenshot({path: 'output/beats/levelup.png'});
    assert.deepEqual(gp.errors, []);
    await gp.close();

    // --- upgrade pick: press dip and grow, the other cards drop away, party-wide travel, HP bar travel, slot flash ---
    const pk = await open(browser);
    const pick = async (id) => state(pk, id => { const s = __survivorTest.scene; s.start(); s.spawnTimer = 999; s.xp = s.xpNeeded(); s.checkLevel();
      const u = s.upgradePool().find(v => v.id === id); s.choices = [u, ...s.choices.filter(c => c.id !== id)].slice(0, 3); s.draw(); s.juice.modeAt -= 1000; s.chooseUpgrade(0); s.draw();
      return {flights: s.juice.flights.map(f => [Math.round(f.to.x), Math.round(f.to.y)]), slots: s.hud.layout.slots.filter(v => v.type).map(v => [v.x + 24, v.y + 26]), hp: s.hud.layout.hp}; }, id);
    const party = await pick('partyDamage');
    assert.deepEqual(party.flights.sort().join(), party.slots.sort().join(), 'Party Power flies to every occupied party slot');
    const hide = await pick('hide');
    assert(hide.hp && hide.flights.length === 1 && hide.flights[0][0] >= hide.hp.x && hide.flights[0][0] <= hide.hp.x + hide.hp.w, 'Tough Hide flies to the HP bar: ' + JSON.stringify(hide));
    const beat = await state(pk, () => { const s = __survivorTest.scene, j = s.juice, at = t => { j.picked.at = j.now() - t; s.draw(); return {sc: s.ui.root.list.length && j.dismissState?.picked, others: j.dismissState?.others}; };
      s.start(); s.spawnTimer = 999; s.xp = s.xpNeeded(); s.checkLevel(); s.draw(); j.modeAt -= 1000; s.chooseUpgrade(1); return [at(30), at(90), at(80), at(200)]; });
    assert(beat[0].sc < 1 && beat[1].sc > 1, 'The picked card dips then grows: ' + JSON.stringify(beat));
    assert(beat[2].others.alpha < 1 && beat[2].others.alpha > 0 && beat[2].others.dy > 0, 'The other cards drop and fade');
    assert.equal(beat[3].others.alpha, 0, 'They are gone by 200ms');
    await wait(10);
    const land = await state(pk, async () => { const s = __survivorTest.scene, j = s.juice; s.start(); s.spawnTimer = 999; s.xp = s.xpNeeded(); s.checkLevel(); s.draw(); j.modeAt -= 1000;
      // A card bound for a single slot (not Tough Hide's HP bar, not a party-wide upgrade).
      const i = Math.max(0, s.choices.findIndex(c => !['hide', 'partyDamage', 'partySpeed'].includes(c.id))), id = s.choices[i].id, owner = j.ownerOf(id); s.chooseUpgrade(i);
      const slot = () => s.hud.layout.slots.find(v => v.type === owner) || s.hud.layout.slots[0];
      for (let n = 0; n < 40; n++) { await new Promise(r => setTimeout(r, 25)); s.draw(); if (slot().flash > 0) return slot().flash; } return 0; });
    assert(land > 0, 'The landing slot flashes its charge bar');
    assert.deepEqual(pk.errors, []);
    await pk.close();
    console.log('Beats: all checks passed.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
