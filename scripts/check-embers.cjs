const assert = require('node:assert/strict');
const {run, gameURL} = require('./survivor-test-utils.cjs');

// Embers: coins from dens, elites, shrines, the hidden treasure and guardians, plus 1 per two minutes survived,
// banked only when a full expedition is completed (won or lost); restarting forfeits. The demo and the trial never award them.
run('Embers drop, collect and bank across runs', async page => {
  const r = await page.evaluate(() => {
    const s = __survivorTest.scene, out = {}; localStorage.removeItem(SurvivorEmbers.KEY);
    // Shrines, the treasure and gems open choice screens that pause the sim; dismiss them so walking over coins works.
    const collectAll = () => { for (const item of s.pickups.filter(p => p.type === 'ember' && p.life > 0)) { s.mode = 'playing'; s.player.x = item.x; s.player.y = item.y; s.tick(1 / 60); } s.mode = 'playing'; };
    const before = () => s.embers.dropped;
    s.nestDeckOverride = ['owl', 'beast', 'cat', 'mouse', 'mole', 'bear']; s.start(); s.spawnTimer = 999; s.player.inv = 999; s.obstacles = [];
    out.enabled = s.embers.enabled;

    // dens: 3, then 4 after 6 minutes, 5 after 12
    s.elapsed = 30; s.encounters.update(0); let d = before(); s.hit(s.encounters.nests[0], 99990, 'player', s.player); out.den = s.embers.dropped - d;
    out.pickups = s.pickups.filter(p => p.type === 'ember' && p.life > 0).length;
    collectAll(); out.found = s.embers.found;
    const den = (t) => { const n = s.encounters.nests[0]; n.destroyed = false; n.hp = n.maxHp || 1000; s.elapsed = t; const b = before(); s.hit(n, 99990, 'player', s.player); return s.embers.dropped - b; };
    out.denMid = den(400); out.denLate = den(800);

    // elites: pack hunters pay 2, other elites 1
    const elite = pack => { const e = s.spawn('beast', s.player.x + 120, s.player.y); Object.assign(e, {elite: true, packReward: pack, hp: 10}); const b = before(); s.hit(e, 9999, 'player', s.player); return s.embers.dropped - b; };
    out.hunter = elite(true); out.elite = elite(false);

    // guardian 10, Ancient Guardian 20
    s.encounters.spawnBoss(false); let b = before(); s.hit(s.encounters.boss, 999999, 'player', s.player); out.guardian = s.embers.dropped - b;

    // hidden treasure 10
    const t = s.greens.treasure; t.revealed = true; b = before(); s.greens.openTreasure(); out.treasure = s.embers.dropped - b;

    // shrine challenge 3
    s.elapsed = 90; s.player.hp = 150; const sh = s.expedition.shrine; Object.assign(s.player, {x: sh.x, y: sh.y});
    for (let i = 0; i < 361; i++) s.expedition.updateShrine(1 / 60);
    const shrineElite = s.enemies.find(e => e.shrineTier); b = before();
    for (const e of s.enemies.filter(e => e !== shrineElite && e.hp > 0 && e.shrineWave === shrineElite.shrineWave)) s.hit(e, 99990, 'player', s.player);
    s.hit(shrineElite, 99990, 'player', s.player); out.shrine = s.embers.dropped - b;

    collectAll(); out.foundAll = s.embers.found; out.droppedAll = s.embers.dropped;
    s.draw(); out.hud = s.hud.layout.embers;

    // bank on a loss: found + 1 per two full minutes
    s.elapsed = 605; s.player.hp = 0; s.tick(1 / 60); out.mode = s.mode;
    out.banked = s.embers.banked; out.saved = SurvivorEmbers.read();
    s.finishRun('lost'); out.bankedOnce = SurvivorEmbers.read().total;
    s.draw(); out.endLine = (() => { const lines = []; s.ui.walk(o => { if (o.type === 'Text' && o.visible && /^Embers \+/.test(o.text)) lines.push(o.text); }); return lines; })();

    // a new run starts empty and the total persists; a restart also banks
    s.start(); out.fresh = s.embers.found; s.elapsed = 250; s.start(); out.afterRestart = SurvivorEmbers.read().total;
    out.events = s.run ? null : null;
    return out;
  });
  assert.equal(r.enabled, true, 'Embers are on in the full expedition');
  assert.equal(r.den, 3); assert.equal(r.pickups, 3, 'A den spills 3 coins');
  assert.equal(r.found, 3, 'Walking over coins collects them');
  assert.equal(r.denMid, 4); assert.equal(r.denLate, 5);
  assert.equal(r.hunter, 2); assert.equal(r.elite, 1);
  assert.equal(r.guardian, 10); assert.equal(r.treasure, 10); assert.equal(r.shrine, 3);
  assert.equal(r.foundAll, r.droppedAll, 'Every dropped coin can be collected');
  assert.equal(r.hud.count, r.foundAll, 'The HUD shows the coins found this run');
  assert.equal(r.mode, 'lost');
  assert.deepEqual(r.banked, {found: r.foundAll, survival: 5, earned: r.foundAll + 5, total: r.foundAll + 5, stored: true}, 'A loss keeps everything found plus 1 per two minutes');
  assert.equal(r.saved.total, r.foundAll + 5); assert.equal(r.bankedOnce, r.foundAll + 5, 'Banking happens once per run');
  assert.deepEqual(r.endLine, [`Embers +${r.foundAll + 5} · ${r.foundAll + 5} saved`]);
  assert.equal(r.fresh, 0, 'A new run starts with no coins found');
  assert.equal(r.afterRestart, r.foundAll + 5, 'Restarting mid-run forfeits that run\'s Embers');

  // the Ancient Guardian pays 20 and ends the run as a win, which also banks
  const w = await page.evaluate(() => { const s = __survivorTest.scene; localStorage.removeItem(SurvivorEmbers.KEY); s.start(); s.spawnTimer = 999; s.player.inv = 999;
    s.elapsed = 1200; s.encounters.spawnBoss(true); const b = s.embers.dropped; s.hit(s.encounters.boss, 9999999, 'player', s.player); const ancient = s.embers.dropped - b;
    s.tick(1 / 60); return {ancient, mode: s.mode, banked: s.embers.banked}; });
  assert.equal(w.ancient, 20); assert.equal(w.mode, 'won'); assert.deepEqual(w.banked, {found: 0, survival: 10, earned: 10, total: 10, stored: true});

  // demo and trial award nothing
  for (const path of ['survivors.html?test&demo', 'survivors.html?test&trial']) {
    await page.goto(gameURL(path)); await page.waitForFunction(() => window.__phaserReady);
    const off = await page.evaluate(() => { const s = __survivorTest.scene; localStorage.removeItem(SurvivorEmbers.KEY); s.start(); s.spawnTimer = 999; s.player.inv = 999;
      s.elapsed = s.isDemo ? 70 : 40; s.encounters.update(0); const n = s.encounters.nests[0]; if (n) s.hit(n, 99990, 'player', s.player);
      s.elapsed = 300; s.finishRun('lost'); s.draw();
      return {enabled: s.embers.enabled, dropped: s.embers.dropped, coins: s.pickups.filter(p => p.type === 'ember').length, banked: s.embers.banked, saved: localStorage.getItem(SurvivorEmbers.KEY), hud: s.hud.layout.embers || null}; });
    assert.deepEqual(off, {enabled: false, dropped: 0, coins: 0, banked: null, saved: null, hud: null}, path + ' awards no Embers');
  }
});
