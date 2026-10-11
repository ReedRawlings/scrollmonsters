const assert = require('node:assert/strict');
const {run, gameURL} = require('./survivor-test-utils.cjs');

// Star Map: opened from the title (in Music's old slot; music moved behind the settings gear), bought with saved Embers.
// Vitality, Ferocity, Fleet Foot, Quick Roll and Magnet change full-expedition runs; the other stars say "Coming soon".
run('Star Map screen, purchases and run bonuses', async page => {
  const ui = await page.evaluate(() => {
    const s = __survivorTest.scene, out = {}; localStorage.setItem(SurvivorEmbers.KEY, JSON.stringify({total: 64, lifetime: 64})); localStorage.removeItem(SurvivorStarMap.KEY);
    s.mode = 'title'; s.draw();
    const labels = () => { const l = []; s.ui.walk(o => { if (o.type === 'WoodButton' && o.input?.enabled && (o => { for (let n = o; n; n = n.parentContainer) if (!n.visible) return false; return true; })(o)) l.push(o.label.getData('label')); }); return l; };
    out.title = labels();
    s.settingsOpen = true; s.draw(); out.settings = labels(); const music = s.musicEnabled; s.toggleMusic(); out.toggled = s.musicEnabled !== music; s.toggleMusic(); s.settingsOpen = false;
    s.starmap.open(); out.open = s.starMapOpen;
    out.states = Object.fromEntries(SurvivorStarMap.stars.map(n => [n.id, s.starmap.state(n.id)]));
    out.buyVitality = s.starmap.buy('vitality'); out.afterVitality = [SurvivorEmbers.read().total, s.starmap.rank('vitality')];
    out.buySoon = s.starmap.buy('second'); out.buyFaint = s.starmap.buy('twin');
    s.starmap.select('ferocity'); s.draw(); out.sel = s.starmap.sel; out.detail = labels();
    s.starmap.select(null); s.draw(); out.cleared = s.starmap.sel;
    localStorage.setItem(SurvivorEmbers.KEY, JSON.stringify({total: 10, lifetime: 64})); out.short = s.starmap.buy('ferocity'); out.shortTotal = SurvivorEmbers.read().total;
    s.starmap.close(); out.closed = s.starMapOpen;
    return out;
  });
  assert(ui.title.includes('Star Map') && ui.title.includes('Bestiary') && !ui.title.some(l => /^Music/.test(l)), 'Star Map replaces Music on the title: ' + ui.title);
  assert(ui.settings.includes('Music: On') && ui.settings.includes('Close'), 'The gear opens settings with Music: ' + ui.settings); assert(ui.toggled);
  assert.equal(ui.open, true);
  assert.equal(ui.states.core, 'lit'); for (const id of ['vitality', 'ferocity', 'fleet']) assert.equal(ui.states[id], 'open', id);
  for (const id of ['magnet', 'second', 'reroll', 'lucky', 'quick', 'compass']) assert.equal(ui.states[id], 'faint', id);
  assert.equal(ui.buyVitality, true); assert.deepEqual(ui.afterVitality, [49, 1], 'Vitality costs 15');
  assert.equal(ui.buySoon, false, 'Coming-soon stars cannot be bought'); assert.equal(ui.buyFaint, false, 'Unrevealed stars cannot be bought');
  assert.equal(ui.sel, 'ferocity'); assert(ui.detail.some(l => /^Light/.test(l)), 'The detail panel offers Light'); assert.equal(ui.cleared, null);
  assert.equal(ui.short, false); assert.equal(ui.shortTotal, 10, 'A short purchase spends nothing');
  assert.equal(ui.closed, false);

  // bonuses apply to the next full-expedition run
  const run = await page.evaluate(() => {
    const s = __survivorTest.scene, out = {};
    const measure = () => { s.start(); s.spawnTimer = 999; s.obstacles = [];
      const e = s.spawn('beast', s.player.x + 200, s.player.y); Object.assign(e, {hp: 100000, maxHp: 100000, speed: 0}); const hp = e.hp; s.hit(e, 20, 'player', s.player);
      s.expansion.cooldown = 0; s.expansion.dash({x: 1, y: 0});
      s.drop('xp', s.player.x + 110, s.player.y); const gem = s.pickups.at(-1), gx = gem.x; s.tick(1 / 60);
      return {maxHp: s.maxHp, hp: s.player.hp, dmg: hp - e.hp, cooldown: Math.round(s.expansion.cooldownMax * 1000) / 1000, gemMoved: gem.x !== gx, meta: s.meta, logged: s.run.events.some(e => e.type === 'stars_applied')}; };
    localStorage.removeItem(SurvivorStarMap.KEY); out.base = measure();
    localStorage.setItem(SurvivorStarMap.KEY, JSON.stringify({ranks: {vitality: 2, ferocity: 3, fleet: 1, quick: 2, magnet: 1, second: 1}})); out.stars = measure();
    return out;
  });
  assert.equal(run.base.maxHp, 400); assert.equal(run.base.cooldown, 3); assert.equal(run.base.gemMoved, false); assert.equal(run.base.logged, false);
  assert.equal(run.stars.maxHp, 480); assert.equal(run.stars.hp, 480, 'Vitality 2 starts runs at +80 HP, full');
  assert(Math.abs(run.stars.dmg / run.base.dmg - 1.15) < 1e-9, 'Ferocity 3 adds 15% damage: ' + run.stars.dmg + ' vs ' + run.base.dmg);
  assert.equal(run.stars.cooldown, 2.4, 'Quick Roll 2 cuts the dash cooldown by 20%');
  assert.equal(run.stars.gemMoved, true, 'Magnet 1 pulls a gem from 110 px (range 120)');
  assert.equal(run.stars.meta.speed, .04); assert.equal(run.stars.logged, true);

  // the demo has no Star Map and no bonuses
  await page.goto(gameURL('survivors.html?test&demo')); await page.waitForFunction(() => window.__phaserReady);
  const demo = await page.evaluate(() => { const s = __survivorTest.scene; s.mode = 'title'; s.draw(); const l = []; s.ui.walk(o => { if (o.type === 'WoodButton' && o.input?.enabled && (o => { for (let n = o; n; n = n.parentContainer) if (!n.visible) return false; return true; })(o)) l.push(o.label.getData('label')); });
    s.starmap.open(); const opened = !!s.starMapOpen; s.start(); return {labels: l, opened, maxHp: s.maxHp, active: s.meta.active}; });
  assert(!demo.labels.includes('Star Map')); assert.equal(demo.opened, false); assert.equal(demo.maxHp, 400); assert.equal(demo.active, false);
});
