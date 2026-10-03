const assert = require('node:assert/strict');
const fs = require('node:fs');
const {chromium} = require('playwright');
const {gameURL, launchOptions, controlPoint, offscreenTexts} = require('./survivor-test-utils.cjs');

// Evolution presentation (2026-10-01): the capture choice panel, the merge sequence, the first-discovery panel and the bestiary.
// Undiscovered results stay ??? (silhouette, no ability) but show HP and role bonus. No toasts: stats appear only on panels.
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
const wait = ms => new Promise(r => setTimeout(r, ms));
// Starts a run with Cat (and optionally Frog), then completes a Mollusc capture so the choice panel opens.
const offer = (page, {frog = false} = {}) => page.evaluate(frog => {
  const s = __survivorTest.scene; s.starter = 'cat'; s.start(); s.spawnTimer = s.player.inv = 9999; s.encounters.nests.forEach(n => n.clock = 9999);
  if (frog) s.expedition.release('frog', s.player.x + 50, s.player.y, true);
  s.expedition.release('mollusc', s.player.x + 60, s.player.y + 20, false, 0); const b = s.expedition.captureBody('mollusc'); b.progress = 2.5; s.expedition.capture(b, 'mollusc', 0); s.draw();
  return {mode: s.mode, layout: s.screens.layout.merge};
}, frog);
async function clickLayout(page, rect, {touch = false} = {}) {
  const r = await page.evaluate(o => { const s = __survivorTest.scene, k = s.uiScale(); return {x: (o.x + o.w / 2) * k, y: (o.y + o.h / 2) * k, w: s.scale.width, h: s.scale.height}; }, rect);
  const c = await page.locator('canvas').boundingBox(), x = c.x + r.x * c.width / r.w, y = c.y + r.y * c.height / r.h;
  if (touch) await page.touchscreen.tap(x, y); else await page.mouse.click(x, y, {delay: 30});
}
const seq = page => page.evaluate(() => { const s = __survivorTest.scene, j = s.juice, m = j.merging, a = s.creatures.allies.octopus, slot = s.hud.layout.slots.find(v => v.type === 'octopus');
  return {merging: !!m, stage: m?.stage, ghosts: m?.ghosts.length || 0, frozen: j.frozen(), alpha: a?.sprite.alpha, face: slot?.face, charge: slot?.charge, pending: j.evolvedPending, played: [...j.played], picked: j.picked?.id, mode: s.mode}; });

(async () => {
  fs.mkdirSync('output/evolution-ui', {recursive: true});
  const browser = await chromium.launch(launchOptions);
  try {
    // --- Offer panel, first discovery: ??? silhouette, HP and bonus still shown, Escape and early keys do nothing ---
    const page = await open(browser);
    const o = await offer(page, {frog: true});
    assert.equal(o.mode, 'merge');
    assert.deepEqual(o.layout.options.map(v => [v.id, v.label, v.known]), [['octopus', '1. ???', false], ['axolotl', '2. ???', false]], 'Undiscovered results are hidden');
    assert.equal(o.layout.recruit.label, '3. Recruit Mollusc');
    await page.keyboard.press('1'); assert.equal(await page.evaluate(() => __survivorTest.scene.mode), 'merge', 'A key inside the 370ms lock does nothing');
    await page.keyboard.press('Escape'); assert.equal(await page.evaluate(() => __survivorTest.scene.mode), 'merge', 'Escape never selects or discards');
    await wait(450); assert.deepEqual(await offscreenTexts(page), []); await page.screenshot({path: 'output/evolution-ui/offer-undiscovered.png'});

    // --- The sequence: card press, ghosts spiral, core, reveal, face flight, slot glow; combat frozen meanwhile ---
    await clickLayout(page, o.layout.options[0]);
    const s0 = await seq(page);
    assert.equal(s0.mode, 'playing'); assert.equal(s0.merging, true); assert.equal(s0.ghosts, 2, 'Both parents converge'); assert.equal(s0.frozen, true, 'Combat holds through the sequence');
    assert.equal(s0.picked, 'octopus', 'The chosen card presses'); assert.equal(s0.alpha, 0, 'The result hides until the reveal'); assert.equal(s0.face, 0, 'Its party face waits for the flight');
    await wait(330); await page.screenshot({path: 'output/evolution-ui/seq-converge.png'});
    const s1 = await seq(page); assert(s1.played.includes('Merge_Trail'), 'Parents leave trails');
    await wait(400); await page.screenshot({path: 'output/evolution-ui/seq-reveal.png'});
    const s2 = await seq(page); assert(['Merge_Core', 'Merge_Reveal', 'Merge_Ring'].every(k => s2.played.includes(k)), s2.played.join()); assert.equal(s2.ghosts, 0); assert.equal(s2.alpha, 1);
    await wait(900);
    const s3 = await seq(page); assert.equal(s3.merging, false); assert.equal(s3.face, 1); assert(s3.played.includes('Evolved_Slot_Glow'), 'The slot glows when the face lands');
    assert.equal(s3.pending, 'octopus', 'A first discovery queues the reveal panel'); assert.equal(s3.frozen, false);
    await page.screenshot({path: 'output/evolution-ui/seq-landed.png'});

    // --- NEW EVOLUTION panel: opens from realtime, stamps, Continue after 1400ms, Enter closes ---
    // Capturing Mollusc also unlocked it as a starter: NEW STARTER shows first, then NEW EVOLUTION.
    assert.equal(await page.evaluate(() => { const s = __survivorTest.scene; s.juice.unlockAt = 0; s.juice.realtime(); return s.mode; }), 'unlock');
    assert.equal(await page.evaluate(() => { const s = __survivorTest.scene; s.closeUnlock(); s.juice.realtime(); s.draw(); return s.mode; }), 'evolved');
    await page.keyboard.press('Enter'); // Enter always closes; the panel only holds Continue back for taps
    assert.equal(await page.evaluate(() => __survivorTest.scene.mode), 'playing');
    await page.evaluate(() => { const s = __survivorTest.scene; s.openEvolved('octopus'); });
    await wait(500); const mid = await page.evaluate(() => __survivorTest.scene.screens.layout.evolved); assert.equal(mid.filled, true); assert.equal(mid.continue, false);
    await wait(1000); const ev = await page.evaluate(() => __survivorTest.scene.screens.layout.evolved); assert.equal(ev.stamp, 1); assert.equal(ev.continue, true);
    assert.deepEqual(await offscreenTexts(page), []); await page.screenshot({path: 'output/evolution-ui/evolved-panel.png'});
    await page.mouse.click(...await (async () => { const p = await controlPoint(page, 'Continue'); return [p.x, p.y]; })());
    assert.equal(await page.evaluate(() => __survivorTest.scene.mode), 'playing');

    // --- Repeat merge: the result is known, so its name shows and no reveal panel follows ---
    const o2 = await offer(page); assert.equal(o2.layout.options[0].label, '1. OCTOPUS'); assert.equal(o2.layout.recruit.label, '2. Recruit Mollusc');
    await wait(400); await page.screenshot({path: 'output/evolution-ui/offer-known.png'}); await page.keyboard.press('1');
    await wait(1650); const r2 = await seq(page); assert.equal(r2.merging, false); assert.equal(r2.pending, null, 'Repeat merges skip the panel');

    // --- Skip: a tap ends the sequence at once; the committed result and its slot are intact; the tap starts no joystick ---
    const o3 = await offer(page); await wait(400); await page.keyboard.press('1'); await wait(80);
    const c = await page.locator('canvas').boundingBox(); await page.mouse.click(c.x + c.width / 2, c.y + c.height / 2);
    const sk = await page.evaluate(() => { const s = __survivorTest.scene, j = s.juice, slot = s.hud.layout.slots.find(v => v.type === 'octopus'); s.draw();
      return {merging: !!j.merging, frozen: j.frozen(), face: s.hud.layout.slots.find(v => v.type === 'octopus')?.face, alpha: s.creatures.allies.octopus.sprite.alpha, scale: s.creatures.allies.octopus.sprite.scaleX, party: s.expedition.party(), joy: s.joy}; });
    assert.deepEqual([sk.merging, sk.frozen, sk.face, sk.alpha, sk.scale, sk.joy], [false, false, 1, 1, 3, null]); assert(sk.party.includes('octopus') && !sk.party.includes('cat'));
    await page.keyboard.press('Space'); // with no sequence running, Space still dashes
    assert(await page.evaluate(() => __survivorTest.scene.expansion.cooldown > 0), 'Space dashes when there is nothing to skip');

    // --- Restart mid-sequence clears ghosts and restores the sprite state ---
    await offer(page); await wait(400); await page.keyboard.press('1'); await wait(100);
    const rs = await page.evaluate(() => { const s = __survivorTest.scene, ghosts = s.juice.merging.ghosts.map(g => g.g); s.start(); return {merging: s.juice.merging, ghosts: ghosts.every(g => !g.active), pending: s.juice.evolvedPending}; });
    assert.deepEqual(rs, {merging: null, ghosts: true, pending: null});

    // --- Bestiary from the title: NEW for unseen discoveries, ? + ? = ? otherwise, selection marks seen, Escape/Enter close ---
    await page.evaluate(() => { localStorage.removeItem('scrollmonsters-seen-evolutions-v1'); const s = __survivorTest.scene; s.screens.seenEvo = null; s.mode = 'title'; s.run = null; s.draw(); });
    await wait(1200); const title = await page.evaluate(() => __survivorTest.scene.screens.layout); assert.equal(title.bestiaryNew, 1, 'The title flags an unseen discovery');
    await page.screenshot({path: 'output/evolution-ui/title-landscape.png'});
    const bp = await controlPoint(page, 'Bestiary'); await page.mouse.click(bp.x, bp.y);
    let b = await page.evaluate(() => { const s = __survivorTest.scene; return {open: s.bestiaryOpen, mode: s.mode, ...s.screens.layout.bestiary}; });
    assert.equal(b.open, true); assert.equal(b.mode, 'title'); assert.equal(b.faces.length, 12, 'All twelve base creatures');
    assert.deepEqual(b.evolutions.map(e => [e.id, e.known, e.fresh]), [['octopus', true, true], ['reptile', false, false], ['tengu', false, false], ['axolotl', false, false]]);
    assert.deepEqual(await offscreenTexts(page), []); await page.screenshot({path: 'output/evolution-ui/bestiary-landscape.png'});
    const row = b.evolutions[0]; await clickLayout(page, {x: row.x, y: row.y, w: 200, h: 28});
    b = await page.evaluate(() => __survivorTest.scene.screens.layout.bestiary); assert.deepEqual(b.sel, {kind: 'evo', id: 'octopus'}); assert.equal(b.evolutions[0].fresh, false, 'Viewing an entry clears NEW');
    await page.screenshot({path: 'output/evolution-ui/bestiary-octopus.png'});
    await page.keyboard.press('Escape'); assert.equal(await page.evaluate(() => __survivorTest.scene.bestiaryOpen), false);
    assert.equal(await page.evaluate(() => __survivorTest.scene.screens.layout.bestiaryNew), 0);
    await page.evaluate(() => __survivorTest.scene.openBestiary()); await page.keyboard.press('Enter');
    assert.deepEqual(await page.evaluate(() => [__survivorTest.scene.bestiaryOpen, __survivorTest.scene.mode]), [false, 'title'], 'Enter closes the bestiary instead of starting a run');
    assert.deepEqual(page.errors, []);

    // --- Phone: the panel fits, touch picks, the bestiary fits ---
    const phone = await open(browser, {width: 390, height: 844}, {mobile: true});
    const po = await offer(phone, {frog: true}); await wait(450); assert.deepEqual(await offscreenTexts(phone), []); await phone.screenshot({path: 'output/evolution-ui/offer-phone.png'});
    await clickLayout(phone, po.layout.options[1], {touch: true}); assert(await phone.evaluate(() => __survivorTest.scene.expedition.party().includes('axolotl')));
    assert.equal(await phone.evaluate(() => __survivorTest.scene.joy), null);
    await wait(1650); await phone.evaluate(() => { const s = __survivorTest.scene; s.juice.unlocks = []; s.juice.realtime(); s.draw(); }); await wait(1500);
    assert.deepEqual(await offscreenTexts(phone), []); await phone.screenshot({path: 'output/evolution-ui/evolved-phone.png'});
    await phone.evaluate(() => { const s = __survivorTest.scene; s.closeEvolved(); s.mode = 'title'; s.run = null; s.openBestiary(); }); await wait(200);
    assert.deepEqual(await offscreenTexts(phone), []); await phone.screenshot({path: 'output/evolution-ui/bestiary-phone.png'});
    assert.deepEqual(phone.errors, []);

    // --- Reduced motion: no ghosts or freeze; the result and its face fade in; the discovery panel still follows ---
    const rm = await open(browser, undefined, {reducedMotion: 'reduce'});
    await offer(rm); await wait(400); await rm.keyboard.press('1');
    const r0 = await seq(rm); assert.deepEqual([r0.ghosts, r0.frozen], [0, false]); assert(r0.alpha < 1);
    await wait(450); const r1 = await seq(rm); assert.deepEqual([r1.merging, r1.face, r1.alpha, r1.pending], [false, 1, 1, 'octopus']);
    assert.deepEqual(rm.errors, []);
    console.log('PASS: evolution UI — offer panel (hidden/known), merge sequence, skip, restart, discovery panel, bestiary, phone, reduced motion');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
