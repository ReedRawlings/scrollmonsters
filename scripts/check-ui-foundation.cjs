const assert = require('node:assert/strict');
const fs = require('node:fs');
const {chromium} = require('playwright');
const {gameURL, launchOptions, controlPoint, listControls, offscreenTexts, missingGlyphs} = require('./survivor-test-utils.cjs');

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
// Card descriptions that spill past the bottom of their own card, in canvas pixels.
const spilledDetails = page => page.evaluate(() => { const s = __survivorTest.scene, out = [];
  const shown = o => { for (let n = o; n; n = n.parentContainer) if (!n.visible) return false; return true; };
  s.ui.walk(o => { const d = o.detailText; if (o.type !== 'WoodButton' || !d || !shown(o) || !shown(d)) return;
    const cardBottom = o.getWorldTransformMatrix().transformPoint(0, o.height / 2).y;
    const m = d.getWorldTransformMatrix(), y0 = -d.originY * d.height, textBottom = Math.max(m.transformPoint(0, y0).y, m.transformPoint(0, y0 + d.height).y);
    if (textBottom > cardBottom + 1) out.push(d.text); });
  return out; });
// Theme Wood belongs to the legacy game only; any wood nine-slice in the survivors UI is a regression.
const woodInUse = page => page.evaluate(() => { const s = __survivorTest.scene, found = [];
  s.ui.walk(o => { const key = o.background?.texture?.key || o.panel?.background?.texture?.key; let shown = true; for (let n = o; n; n = n.parentContainer) if (!n.visible) shown = false; if (shown && /^wood/.test(key || '')) found.push(key); });
  return found; });

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

    // --- canvas size and HUD layout ---
    const tall = await open(browser, {width: 390, height: 844}, 'survivors.html?test', true);
    assert.deepEqual(await state(tall, () => ({w: __survivorTest.scene.scale.width, h: __survivorTest.scene.scale.height})), {w: 540, h: 960});
    await state(tall, () => { const s = __survivorTest.scene; s.start(); s.spawnTimer = 999; s.draw(); });
    let hud = await state(tall, () => __survivorTest.scene.hud.layout);
    assert.equal(hud.slots.length, 4, 'Party bar always has 4 slots');
    assert.equal(hud.slots[0].type, 'walker', 'Player is the first slot');
    assert.equal(hud.slots[1].type, 'cat', 'Starter follows the player');
    assert.equal(hud.sockets, undefined, 'The HUD draws no shrine sockets; the shrine sprite shows challenges left');
    // 13 relic stacks wrap inside the screen
    await state(tall, () => { const s = __survivorTest.scene; s.relics.equipped = ['boots','stone','ricochet','repulsion','slipstream','bloodroot','pack','resonance','echo','drum','hunter','spite','veil','veil']; s.draw(); });
    hud = await state(tall, () => __survivorTest.scene.hud.layout);
    assert.equal(hud.relics.length, 13);
    assert(hud.relics.every(r => r.x >= 0 && r.x + 20 <= 270), 'Relic row stays inside 270 logical px');
    assert.equal(hud.relics.find(r => r.id === 'veil').count, 2);
    // long notices wrap inside the screen; a party member without a faceset falls back
    await state(tall, () => { const s = __survivorTest.scene; s.announce('Bonus upgrade earned! Leave the circle before the next challenge.'); const party = s.expedition.party; s.expedition.party = () => ['cat', 'nofaceset']; s.draw(); s.expedition.party = party; });
    assert.deepEqual(await offscreenTexts(tall), [], 'No HUD text leaves the canvas (portrait)');
    // tapping the player slot does nothing; the Dash pill dashes; neither starts movement
    const slot = await state(tall, () => { const s = __survivorTest.scene, r = s.hud.layout.slots[0], c = s.game.canvas.getBoundingClientRect(); return {x: c.left + (r.x + r.w / 2) * 2 * c.width / s.scale.width, y: c.top + (r.y + r.h / 2) * 2 * c.height / s.scale.height}; });
    await tall.touchscreen.tap(slot.x, slot.y);
    assert.equal(await state(tall, () => __survivorTest.scene.expansion.cooldown), 0, 'The player slot is not a dash control');
    await state(tall, () => { __survivorTest.scene.joy = null; });
    const dash = await controlPoint(tall, 'Dash');
    // Hold the press: a leaked joystick would be live until release, which a plain tap would hide.
    const touch = await tall.context().newCDPSession(tall);
    await touch.send('Input.dispatchTouchEvent', {type: 'touchStart', touchPoints: [{x: dash.x, y: dash.y}]});
    await tall.waitForTimeout(80);
    assert.equal(await state(tall, () => __survivorTest.scene.joy), null, 'Pressing the Dash pill does not start movement');
    await touch.send('Input.dispatchTouchEvent', {type: 'touchEnd', touchPoints: []});
    await tall.waitForTimeout(80);
    assert(await state(tall, () => __survivorTest.scene.expansion.cooldown > 0), 'The Dash pill dashes');
    assert.equal(await state(tall, () => __survivorTest.scene.joy), null, 'The Dash pill does not start movement');
    await tall.screenshot({path: 'output/ui-foundation/hud-portrait.png'});
    assert.deepEqual(tall.errors, []);
    await tall.close();

    const land = await open(browser, {width: 1100, height: 760});
    assert.deepEqual(await state(land, () => ({w: __survivorTest.scene.scale.width, h: __survivorTest.scene.scale.height})), {w: 960, h: 640});
    await state(land, () => { const s = __survivorTest.scene; s.start(); s.announce('Shrine challenge 1/3! Defeat the elite for an upgrade.'); s.draw(); });
    assert.deepEqual(await offscreenTexts(land), [], 'No HUD text leaves the canvas (landscape)');
    await land.screenshot({path: 'output/ui-foundation/hud-landscape.png'});
    await land.close();

    const narrow = await open(browser, {width: 360, height: 900}, 'survivors.html?test', true);
    await state(narrow, () => { const s = __survivorTest.scene; s.start(); s.draw(); });
    await narrow.screenshot({path: 'output/ui-foundation/hud-tall-phone.png'});
    await narrow.close();

    // --- title, pause and end screens fit in both orientations ---
    for (const [name, viewport, mobile] of [['portrait', {width: 390, height: 844}, true], ['landscape', {width: 1100, height: 760}, false]]) {
      const page = await open(browser, viewport, 'survivors.html?test', mobile);
      await state(page, () => localStorage.setItem('scrollmonsters-starters-v1', JSON.stringify(['cat', 'owl', 'storm'])));
      await page.reload(); await page.waitForFunction(() => window.__phaserReady);
      const labels = (await listControls(page)).map(c => c.label);
      assert(labels.includes('BEGIN') && labels.includes('History'), 'Title shows BEGIN and History');
      assert(!labels.includes('Legacy') && !labels.some(l => /trial|expedition/i.test(l)), 'Legacy and trial switch are gone');
      assert.deepEqual(await offscreenTexts(page), [], `Title fits (${name})`);
      await page.screenshot({path: `output/ui-foundation/title-${name}.png`});
      await state(page, () => { const s = __survivorTest.scene; s.start(); s.pause(); });
      assert.deepEqual(await offscreenTexts(page), [], `Pause fits (${name})`);
      await state(page, () => { const s = __survivorTest.scene; s.relics.equipped = ['boots','stone','ricochet','repulsion','slipstream','bloodroot','pack','resonance','echo','drum','hunter','spite','veil']; s.draw(); });
      assert.deepEqual(await offscreenTexts(page), [], `Pause with 13 relics fits (${name})`);
      await page.screenshot({path: `output/ui-foundation/pause-relics-${name}.png`});
      await state(page, () => { const s = __survivorTest.scene; s.mode = 'lost'; s.draw(); });
      assert.deepEqual(await offscreenTexts(page), [], `End screen fits (${name})`);
      await page.screenshot({path: `output/ui-foundation/lost-${name}.png`});
      assert.deepEqual(page.errors, []);
      await page.close();
    }

    // --- level-up and relic choice fit and respond in both orientations ---
    for (const [name, viewport, mobile] of [['portrait', {width: 390, height: 844}, true], ['landscape', {width: 1100, height: 760}, false]]) {
      const page = await open(browser, viewport, 'survivors.html?test', mobile);
      const pick = await state(page, () => { const s = __survivorTest.scene; s.start(); s.xp = s.xpNeeded(); s.checkLevel(); s.draw(); return {id: s.choices[0].id, label: '1. ' + s.choices[0].name, mode: s.mode}; });
      assert.equal(pick.mode, 'upgrade');
      assert.deepEqual(await offscreenTexts(page), [], `Level-up fits (${name})`);
      assert.deepEqual(await woodInUse(page), [], `Level-up uses DarkMode (${name})`);
      assert.deepEqual(await spilledDetails(page), [], `Level-up descriptions fit their cards (${name})`);
      await page.screenshot({path: `output/ui-foundation/levelup-${name}.png`});
      const p = await controlPoint(page, pick.label);
      if (mobile) await page.touchscreen.tap(p.x, p.y); else await page.mouse.click(p.x, p.y, {delay: 30});
      assert.equal(await state(page, () => __survivorTest.scene.mode), 'playing');
      await state(page, () => { const s = __survivorTest.scene; s.relics.reward('shrine_challenge'); s.relics.open(); s.draw(); });
      assert.equal(await state(page, () => __survivorTest.scene.mode), 'relic');
      const labels = (await listControls(page)).map(c => c.label);
      assert(labels.some(l => l.startsWith('1. ')) && labels.includes('Leave reward'));
      assert.deepEqual(await offscreenTexts(page), [], `Relic choice fits (${name})`);
      assert.deepEqual(await woodInUse(page), [], `Relic choice uses DarkMode (${name})`);
      assert.deepEqual(await spilledDetails(page), [], `Relic descriptions fit their cards (${name})`);
      await page.screenshot({path: `output/ui-foundation/relic-${name}.png`});
      assert.deepEqual(page.errors, []);
      await page.close();
    }

    // --- every upgrade and every relic text fits its card and uses glyphs NovelMix has ---
    for (const [name, viewport, mobile] of [['portrait', {width: 390, height: 844}, true], ['landscape', {width: 1100, height: 760}, false]]) {
      const page = await open(browser, viewport, 'survivors.html?test', mobile);
      const counts = await state(page, () => { const s = __survivorTest.scene; s.start();
        for (const t of ['salamander','spider','storm']) s.expedition.release(t, s.player.x + 60, s.player.y, true);
        for (const t of ['mouse','mole','bear']) s.creatures.release(t, s.player.x - 60, s.player.y, true);
        for (const k of Object.keys(s.upgrades)) if (typeof s.upgrades[k] === 'number') s.upgrades[k] = 9; // long rank numbers
        window.__allUpgrades = s.upgradePool(); window.__allRelics = SurvivorRelics.items;
        return {upgrades: __allUpgrades.length, relics: __allRelics.length}; });
      assert(counts.upgrades >= 8 && counts.relics === 13, `Pool is broad enough (${JSON.stringify(counts)})`);
      for (let i = 0; i < counts.upgrades; i += 3) {
        await state(page, i => { const s = __survivorTest.scene; s.choices = __allUpgrades.slice(i, i + 3); s.mode = 'upgrade'; s.draw(); }, i);
        assert.deepEqual(await spilledDetails(page), [], `Upgrade details fit (${name}, from ${i})`);
        assert.deepEqual(await missingGlyphs(page), [], `Upgrade text uses NovelMix glyphs (${name}, from ${i})`);
      }
      for (let i = 0; i < counts.relics; i += 3) {
        await state(page, i => { const s = __survivorTest.scene; s.relics.offers = __allRelics.slice(i, i + 3); s.relics.equipped = s.relics.offers.map(r => r.id); s.mode = 'relic'; s.draw(); }, i);
        assert.deepEqual(await spilledDetails(page), [], `Relic details fit (${name}, from ${i})`);
        assert.deepEqual(await missingGlyphs(page), [], `Relic text uses NovelMix glyphs (${name}, from ${i})`);
        assert.deepEqual(await offscreenTexts(page), [], `Relic choice fits (${name}, from ${i})`);
      }
      assert.deepEqual(page.errors, []);
      await page.close();
    }

    // --- centred multi-line labels centre every line (capture label, wrapped notice) ---
    const align = await open(browser, {width: 390, height: 844}, 'survivors.html?test', true);
    const ragged = await state(align, () => { const s = __survivorTest.scene; s.start(); s.spawnTimer = 999;
      s.creatures.release('mouse', s.player.x + 80, s.player.y, false); // a capture-ready creature shows a two-line label
      s.announce('Bonus upgrade earned! Leave the circle before the next challenge.'); s.draw();
      const out = []; s.ui.walk(o => { if (o.type === 'Text' && o.visible && o.originX === 0.5 && o.style.fontFamily === 'NovelMix' && o.getWrappedText(o.text).length > 1 && o.style.align !== 'center') out.push(o.text); });
      return out; });
    assert.deepEqual(ragged, [], 'Centred multi-line labels are centre-aligned');
    await align.close();

    // --- the pause control has a thumb-sized target around the small II pill ---
    const thumb = await open(browser, {width: 390, height: 844}, 'survivors.html?trial&test', true);
    await state(thumb, () => { const s = __survivorTest.scene; s.start(); s.spawnTimer = 999; s.draw(); });
    const ii = await controlPoint(thumb, 'II');
    const perLogical = await state(thumb, () => { const s = __survivorTest.scene; return 2 * s.game.canvas.getBoundingClientRect().width / s.scale.width; });
    await thumb.touchscreen.tap(ii.x - 13 * perLogical, ii.y + 11 * perLogical); // just outside the drawn pill
    assert.equal(await state(thumb, () => __survivorTest.scene.mode), 'paused', 'A near miss on the pause pill still pauses');
    assert.equal(await state(thumb, () => __survivorTest.scene.joy), null);
    await thumb.close();

    console.log('PASS: UI foundation');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
