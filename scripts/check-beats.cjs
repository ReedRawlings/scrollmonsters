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
      s.tick(1 / 60); s.draw(); const start = j.gemOffset(gem); for (let i = 0; i < 4; i++) s.tick(1 / 60); s.draw(); const mid = j.gemOffset(gem); // halfway to the 38px pickup
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

    // --- damage numbers: drift, 4x crits with "!" that never merge, 4x red hurts that jolt the HP bar, green "+N" heals ---
    const dn = await open(browser);
    const d = await state(dn, async () => { const s = __survivorTest.scene, j = s.juice, n = j.numbers, out = {}; s.start(); s.spawnTimer = 999;
      const glyphs = e => e.digits.filter(im => im.visible).map(im => +im.frame.name.slice(1));
      const live = () => n.pool.filter(v => v.live);
      const t = {x: s.player.x + 60, y: s.player.y, r: 10};
      j.damage(t, 7, 1.3); j.damage(t, 7, 1.3); out.crits = live().map(v => [v.crit, v.box.scaleX >= 4]);
      out.bang = glyphs(live()[0]).at(-1); j.damage(t, 2); out.after = live().map(v => [v.value, v.crit]);
      out.shake = j.jitterUntil > j.now();
      n.reset(); s.player.inv = 0; s.shield = false; s.encounters.damage(5, 'test'); const hurt = live()[0]; out.hurt = [hurt.hurt, hurt.box.scaleX >= 4]; s.draw(); out.jolt = s.hud.layout.hpJolt !== 0;
      n.reset(); j.heal(8); const heal = live()[0]; out.heal = [heal.heal, heal.value, glyphs(heal)[0], heal.digits[0].tintTopLeft];
      n.reset(); j.damage(t, 3); const one = live()[0], x0 = one.box.x; await new Promise(r => setTimeout(r, 300)); n.update(j.now()); out.drift = Math.abs(one.box.x - x0) > 1;
      return out; });
    assert.deepEqual(d.crits, [[true, true], [true, true]], 'Two crits on one target stay two 4x numbers (crits never merge)');
    assert.equal(d.bang, 11, 'Crits end in "!"');
    assert.deepEqual(d.after, [[7, true], [7, true], [2, false]], 'A plain hit after a crit starts its own white number');
    assert.equal(d.shake, true, 'A crit gives a quick shake');
    assert.deepEqual(d.hurt, [true, true], 'Hits on the player are 4x'); assert.equal(d.jolt, true, 'and jolt the HP bar');
    assert.deepEqual(d.heal.slice(0, 3), [true, 8, 10], 'Heals show "+N"'); assert.equal(d.heal[3], 0x4ac56b, 'in green');
    assert.equal(d.drift, true, 'Numbers drift sideways as they rise');
    await dn.screenshot({path: 'output/beats/damage.png'});
    assert.deepEqual(dn.errors, []);
    await dn.close();

    // --- packs: tumble out on the drop, jump to the centre on pickup, the next card nudges up ---
    const pp = await open(browser, {width: 390, height: 844}, {mobile: true});
    const pk1 = await state(pp, async () => { const s = __survivorTest.scene, j = s.juice, out = {}; s.start(); s.spawnTimer = 999;
      const item = s.packs.drop(s.player.x + 300, s.player.y, 'test'); s.draw(); await new Promise(r => setTimeout(r, 100)); s.draw();
      out.mid = [Math.round(item.sprite.x - item.x), Math.round(item.sprite.y - item.y), item.sprite.rotation !== 0];
      await new Promise(r => setTimeout(r, 650)); s.draw(); out.rest = [Math.round(item.sprite.x - item.x), Math.round(item.sprite.y - item.y), item.sprite.rotation];
      item.size = 3; item.cards = s.packs.draw(s.upgradePool(), 3).map(u => u.id); s.player.x = item.x; s.player.y = item.y; s.tick(1 / 60); s.draw();
      const f = j.flights.find(f => /^Pack_Drop_/.test(f.key)); out.jump = f && [Math.round(f.to.x), Math.round(f.to.y)]; out.center = [s.uiSize().w / 2, s.screens.layout.packCard];
      const r = s.packs.reveal; r.start -= 5000; s.packs.act(); r.flippedAt -= 500; s.packs.act(); s.draw(); await new Promise(r => setTimeout(r, 60)); s.draw(); out.nudge = s.screens.layout.topNudge;
      return out; });
    assert(Math.abs(pk1.mid[0]) + Math.abs(pk1.mid[1]) > 4 && pk1.mid[2], 'The pack tumbles out: ' + JSON.stringify(pk1.mid));
    assert.deepEqual(pk1.rest, [0, 0, 0], 'and settles exactly where the sim put it');
    assert.deepEqual(pk1.jump, pk1.center.map(Math.round), 'On pickup the pack jumps to the centre of the screen');
    assert(pk1.nudge > 0, 'The next card nudges up after one is filed');
    assert.deepEqual(pp.errors, []);
    await pp.context().close();
    // --- relic: press and drop-away like upgrades, the flight leaves the chosen card even when a level-up opens next, the HUD icon bumps ---
    const rp = await open(browser, {width: 390, height: 844}, {mobile: true});
    const rl = await state(rp, async () => { const s = __survivorTest.scene, j = s.juice, out = {}; s.start(); s.spawnTimer = 999;
      s.relics.reward('shrine_challenge'); s.xp = s.xpNeeded(); s.checkLevel(); s.draw(); j.modeAt -= 1000; const card = {...s.screens.layout.cards[1]}, id = s.relics.offers[1].id;
      s.relics.choose(1); out.mode = s.mode; s.draw();
      const f = j.flights.find(f => f.key === 'relic_' + id); out.from = f && f.from; out.card = card; out.icon = j.picked?.icon; out.others = j.picked?.others.length;
      for (let n = 0; n < 40; n++) { await new Promise(r => setTimeout(r, 25)); s.draw(); const c = s.hud.layout.relics.find(r => r.id === id); if (c?.bump > 0) { out.bump = c.bump; break; } }
      return out; });
    assert.equal(rl.mode, 'upgrade', 'test setup: a level-up opens right after the relic pick');
    assert(rl.from && rl.from.x >= rl.card.x && rl.from.x <= rl.card.x + rl.card.w && rl.from.y >= rl.card.y && rl.from.y <= rl.card.y + rl.card.h, 'The relic flies from the card that was chosen: ' + JSON.stringify(rl));
    assert(/^relic_/.test(rl.icon) && rl.others === 2, 'The relic card presses and the other two drop away');
    assert(rl.bump > 0, 'The HUD relic icon bumps when the relic lands');
    assert.deepEqual(rp.errors, []);
    await rp.context().close();

    // --- capture: trembles harder each quarter, flashes and shakes at the snap, the new slot's charge bar fills up ---
    const cp = await open(browser);
    const cap = await state(cp, async () => { const s = __survivorTest.scene, j = s.juice, out = {}; s.start(); s.spawnTimer = 999;
      s.expedition.release('mouse', s.player.x + 200, s.player.y, false); const b = s.expedition.captureBody('mouse'); b.state = 'ready';
      const off = () => { s.draw(); return Math.round(Math.hypot(b.sprite.x - b.x, b.sprite.y - b.y) * 10) / 10; };
      b.progress = 0; out.calm = off(); b.progress = 2.2; let big = 0; for (let i = 0; i < 12; i++) big = Math.max(big, off()); out.shaking = big;
      s.reward('capture', {type: 'mouse', x: b.x, y: b.y}); out.flash = j.fx.some(f => f.key === 'flash'); out.shake = j.jitterUntil > j.now();
      b.state = 'ally'; s.expedition.release('mouse', b.x, b.y, true);
      let fills = []; for (let n = 0; n < 60; n++) { await new Promise(r => setTimeout(r, 25)); s.draw(); const sl = s.hud.layout.slots.find(v => v.type === 'mouse'); if (sl) fills.push(sl.charge); }
      out.filling = fills.some(c => c < .2); out.full = Math.abs(fills.at(-1) - s.hud.chargeOf('mouse')) < 1e-6; return out; });
    assert.equal(cap.calm, 0, 'No tremble at zero progress'); assert(cap.shaking >= 1, 'The creature trembles near a full ring: ' + cap.shaking);
    assert.deepEqual([cap.flash, cap.shake], [true, true], 'The snap flashes the creature and shakes the view');
    assert(cap.filling && cap.full, 'The new slot charge bar fills up from empty to the creature\'s own charge');
    assert.deepEqual(cp.errors, []);
    await cp.close();
    // --- starter unlock: panel scales in, flash and sparks at the fill, NEW STARTER stamps with a shake, Continue after the reveal ---
    const up = await open(browser, {width: 390, height: 844}, {mobile: true});
    const un = await state(up, () => { const s = __survivorTest.scene, j = s.juice, out = {}; s.start(); s.openUnlock('owl');
      const at = t => { j.modeAt = j.now() - t; s.played = j.played.length; s.draw(); return {...s.screens.layout.unlock}; };
      out.t100 = at(100); out.t1100 = at(1100); out.t1300 = at(1300); out.t1800 = at(1800);
      out.sparks = j.played.filter(k => k === 'Reward_Trail').length; return out; });
    assert(un.t100.scale < 1, 'The panel scales in'); assert(un.t1100.stamp > 1 && un.t1100.shake !== 0, 'NEW STARTER stamps down and the panel shakes');
    assert(un.sparks >= 6, 'Sparks burst when the colour fills in');
    assert.equal(un.t1300.continue, false, 'Continue waits for the reveal'); assert.equal(un.t1800.continue, true, 'then appears');
    await up.screenshot({path: 'output/beats/unlock.png'});
    assert.deepEqual(up.errors, []);
    await up.context().close();

    // --- title: wake from black, a live panning field with wandering creatures and fireflies, logo slam and bob,
    //     faces pop in 45ms apart, NEW on unseen unlocks, an iris on BEGIN ---
    const tp = await open(browser, {width: 1100, height: 760}, {init: () => { localStorage.setItem('scrollmonsters-starters-v1', JSON.stringify(['owl'])); localStorage.setItem('scrollmonsters-seen-starters-v1', JSON.stringify(['cat'])); }});
    const ti = await state(tp, async () => { const s = __survivorTest.scene, j = s.juice, out = {}; const at = t => { j.modeAt = j.now() - t; s.draw(); return {...s.screens.layout.titleFx}; };
      out.t100 = at(100); out.t450 = at(450); out.t900 = at(900); out.t2000 = at(2000);
      out.critters = j.titleCritters.length; const c0 = j.titleCritters.map(c => c.x); await new Promise(r => setTimeout(r, 300)); s.draw(); out.walked = j.titleCritters.some((c, i) => Math.abs(c.x - c0[i]) > .5);
      out.fireflies = j.fireflies; out.pan = (() => { const o = []; for (const t of [1000, 4000, 7000]) { j.modeAt = j.now() - t; s.draw(); j.update(); o.push(Math.round(s.cameras.main.followOffset.x)); } return o; })();
      out.newBadge = s.screens.layout.newFaces; return out; });
    assert(ti.t100.wake > 0 && ti.t450.wake === 0, 'The title wakes from black');
    assert(ti.t450.logo > 1 && Math.abs(ti.t2000.logo - 1) < 1e-9, 'The logo slams in, then settles');
    assert(ti.t2000.bob !== undefined, 'and bobs');
    assert(ti.t900.faces[0] === 1 && ti.t900.faces.at(-1) < 1 && ti.t2000.faces.every(f => f === 1), 'Faces pop in one after another');
    assert.equal(ti.critters, 2, 'Unlocked creatures wander the field'); assert.equal(ti.walked, true);
    assert.equal(ti.fireflies, 16, 'Fireflies drift'); assert(new Set(ti.pan).size > 1, 'The view pans slowly: ' + ti.pan);
    assert.deepEqual(ti.newBadge, ['owl'], 'A new unlock wears NEW');
    const after = await state(tp, () => { const s = __survivorTest.scene; s.chooseStarter('owl'); s.screens.markSeen?.('owl'); s.draw(); return {badge: s.screens.layout.newFaces, saved: JSON.parse(localStorage.getItem('scrollmonsters-seen-starters-v1'))}; });
    assert.deepEqual(after.badge, [], 'Choosing it clears NEW'); assert(after.saved.includes('owl'));
    await tp.screenshot({path: 'output/beats/title.png'});
    const begin = await controlPoint(tp, 'BEGIN'); await tp.mouse.click(begin.x, begin.y); await wait(60);
    const ir = await state(tp, () => { const s = __survivorTest.scene, j = s.juice; j.update(); return {mode: s.mode, critters: j.titleCritters.length, iris: j.irisRadius()}; });
    assert.equal(ir.mode, 'playing'); assert.equal(ir.critters, 0, 'Title critters leave with the menu'); assert(ir.iris > 0 && ir.iris < 1, 'An iris closes on BEGIN');
    assert.deepEqual(tp.errors, []);
    await tp.close();
    const firstRun = await open(browser);
    assert.deepEqual(await state(firstRun, () => { const s = __survivorTest.scene; s.draw(); return s.screens.layout.newFaces; }), [], 'A first visit shows no NEW badges');
    await firstRun.close();

    // --- desktop at Normal (720x480): the pack reveal and the title sit centred vertically ---
    const cv = await open(browser);
    const ctr = await state(cv, () => { const s = __survivorTest.scene, {w, h} = s.uiSize(), out = {h};
      s.draw(); const b = s.screens.layout.begin, faces = s.screens.layout.faces; out.title = [Math.min(...faces.map(f => f.y)) - 40, b[1] + b[3] + 32];
      s.start(); s.spawnTimer = 999; const p = s.packs.drop(s.player.x, s.player.y, 'test'); p.size = 5; p.cards = s.packs.draw(s.upgradePool(), 5).map(u => u.id); s.tick(1 / 60); s.packs.reveal.start -= 5000; s.draw();
      out.pack = s.screens.layout.packCard; return out; });
    const mid = ([a, b]) => (a + b) / 2;
    assert(Math.abs(mid(ctr.title) - ctr.h / 2) <= 24, 'The title sits centred: ' + JSON.stringify(ctr));
    assert(Math.abs(ctr.pack - ctr.h / 2) <= 24, 'The pack card sits centred: ' + JSON.stringify(ctr));
    await cv.close();

    // --- review fixes ---
    const rf = await open(browser);
    const cam = await state(rf, () => { const s = __survivorTest.scene, c = s.cameras.main; s.start(); s.spawnTimer = 999; c.setFollowOffset(0, 0); c.preRender(); const a = s.viewScroll(), sx = c.scrollX;
      const e = {x: a.x + 25, y: s.player.y}, before = SurvivorEnemies.visible(s, e); c.setFollowOffset(3, -3); c.preRender(); const b = s.viewScroll();
      return {moved: Math.round(c.scrollX - sx), same: Math.abs(a.x - b.x) < .01 && Math.abs(a.y - b.y) < .01, visible: [before, SurvivorEnemies.visible(s, e)]}; });
    assert.equal(cam.moved, -3, 'test setup: the shake offset moves the rendered camera');
    assert.equal(cam.same, true, 'The sim view ignores camera shake'); assert.deepEqual(cam.visible, [true, true], 'so enemy visibility never flips during a shake');
    await rf.close();

    const calm = await open(browser, {width: 1100, height: 760}, {reducedMotion: 'reduce'});
    const rm = await state(calm, () => { const s = __survivorTest.scene, j = s.juice, now = j.now(); s.start();
      j.xpFlashAt = j.hpFlashAt = now; j.slotFlashAt.walker = now; j.relicBumpAt.veil = now; return [j.xpFlash(), j.hpFlash(), j.slotFlash('walker'), j.relicBump('veil')]; });
    assert.deepEqual(rm, [0, 0, 0, 0], 'Reduced motion: no XP/HP/slot flashes, no relic bump');
    await calm.close();
    const rf2 = await open(browser);
    const gemEnd = await state(rf2, () => { const s = __survivorTest.scene, j = s.juice, p = s.player; s.start(); s.spawnTimer = 999;
      const g = {x: p.x + 90, y: p.y, type: 'xp'}; j.gemOffset(g); g.x = p.x + 39; const o = j.gemOffset(g); return Math.round(Math.hypot(o.x, o.y) * 10) / 10; });
    assert(gemEnd < 3, 'A gem lands on the player at the pickup radius, not mid-arc (1px out: ' + gemEnd + ')');
    const slot = await state(rf2, () => { const s = __survivorTest.scene, j = s.juice; s.start(); s.spawnTimer = 999;
      s.expedition.release('mouse', s.player.x + 60, s.player.y, true); s.reward('capture', {type: 'mouse', x: s.player.x + 60, y: s.player.y}); s.draw();
      return s.hud.layout.slots.find(v => v.type === 'mouse')?.charge; });
    assert.equal(slot, 0, 'A just-captured creature\'s bar stays empty until its face lands');
    const iris = await state(rf2, () => { const s = __survivorTest.scene, j = s.juice; s.mode = 'title'; s.draw(); s.start(); return [s.mode, j.irisRadius()]; });
    assert.deepEqual(iris, ['playing', 0], 'BEGIN starts the run behind a closed iris, which then opens');
    const hideHeal = await state(rf2, () => { const s = __survivorTest.scene, j = s.juice; s.start(); s.spawnTimer = 999; s.player.hp = 10; j.numbers.reset(); s.grantUpgrade('hide'); return j.numbers.list().filter(n => n.heal).map(n => n.value); });
    assert.deepEqual(hideHeal, [80], 'Tough Hide shows its +80 heal');
    await rf2.close();
    console.log('Beats: all checks passed.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
