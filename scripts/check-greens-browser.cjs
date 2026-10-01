const assert = require('node:assert/strict');
const {run} = require('./survivor-test-utils.cjs');

run('procedural Greens field: tilemap, dens, breakables and hidden treasure', async page => {
  const map = await page.evaluate(() => {
    const s = __survivorTest.scene; s.start(); s.spawnTimer = 999;
    const g = s.greens, layer = g.ground, m = g.map;
    let tiles = 0; layer.forEachTile(t => { if (t.index >= 0) tiles++; });
    const solids = m.blockers.length + m.breakables.length + (m.scarecrow ? 1 : 0), obstacles = s.obstacles.length, layerKey = layer.tileset[0].image.key;
    const densFor = seed => { s.seed = seed; s.resetState(); return JSON.stringify(s.greens.map.dens); };
    const a = densFor(11), b = densFor(12), again = densFor(11);
    return {tiles, expected: m.size ** 2, obstacles, solids, differs: a !== b, repeats: a === again, layerKey};
  });
  assert.equal(map.tiles, map.expected, 'every dual-grid display cell has a tile');
  assert.equal(map.layerKey, 'greensTiles');
  assert.equal(map.obstacles, map.solids, 'only Greens props are obstacles (fixed trees are gone)');
  assert(map.differs && map.repeats, 'new seed gives a new map, same seed repeats it');

  const dens = await page.evaluate(() => {
    const s = __survivorTest.scene; s.seed = 4242; s.resetState(); s.mode = 'playing'; s.spawnTimer = 999; s.player.inv = 999;
    const spots = s.greens.map.dens.map(d => Math.round(d.x) + ',' + Math.round(d.y)), at = n => Math.round(n.x) + ',' + Math.round(n.y);
    s.elapsed = 30; s.encounters.update(0); s.draw();
    const first = s.encounters.nests.map(at), art = s.encounters.nestSprites[0].base.texture.key;
    s.elapsed = 150; s.expedition.update(0);
    return {spots, first, all: s.encounters.nests.map(at), art};
  });
  assert.equal(dens.first.length, 2);
  assert(dens.all.length === 4 && dens.all.every(n => dens.spots.includes(n)), 'all four nests sit on the map den spots');
  assert.equal(new Set(dens.all).size, 4, 'no two nests share a den');
  assert.equal(dens.art, 'greensDen');

  const props = await page.evaluate(() => {
    const s = __survivorTest.scene; s.seed = 4242; s.resetState(); s.mode = 'playing'; s.spawnTimer = 999; s.player.inv = 999;
    const g = s.greens, [a, b, c] = g.props;
    // Never an aim target, even alone next to the player.
    Object.assign(s.player, {x: a.x - 60, y: a.y}); const aimed = s.target(s.player, 400);
    const pickups = s.pickups.length, realRand = s.rand;
    s.rand = () => .1; s.hit(a, 99, 'player', s.player); const dropped = s.pickups.length - pickups;
    s.rand = () => .5; const before = s.pickups.length; s.hit(b, 99, 'cat', s.cat); const noDrop = s.pickups.length === before; s.rand = realRand;
    const cleared = !s.obstacles.some(o => o.prop === a || o.prop === b);
    // Dash into the third breakable.
    Object.assign(s.player, {x: c.x - c.r - 30, y: c.y}); s.expansion.facing = {x: 1, y: 0}; s.expansion.cooldown = 0; s.expansion.dash(); advanceTime(100);
    for (let i = 0; i < 20; i++) s.greens.update(.05); s.draw();
    return {aimed: aimed ? aimed.kind : null, broken: [a.broken, b.broken, c.broken], dropped, noDrop, cleared, hidden: !a.sprite.visible,
      events: s.run.events.filter(e => e.type === 'prop_broken').length};
  });
  assert.equal(props.aimed, null, 'breakables are not auto-aim targets');
  assert.deepEqual(props.broken, [true, true, true], 'hits and dashes smash breakables');
  assert(props.dropped >= 1 && props.noDrop, 'drop only on the 15% roll');
  assert(props.cleared && props.hidden);
  assert.equal(props.events, 3);

  for (const reward of ['xp', 'relic']) {
    const t = await page.evaluate(reward => {
      const s = __survivorTest.scene; s.seed = 4242; s.resetState(); s.mode = 'playing'; s.spawnTimer = 999; s.player.inv = 999;
      const g = s.greens, t = g.treasure, logged = s.run.events.length; t.reward = reward;
      s.elapsed = t.revealAt - 1; g.update(0); const early = t.revealed;
      s.elapsed = t.revealAt; g.update(0); const colliders = g.slabColliders.every(c => s.obstacles.includes(c));
      const xp = s.totalXp; Object.assign(s.player, {x:t.x+220,y:t.y});g.update(0);const sideClosed=!t.opened;
      Object.assign(s.player, {x:t.x,y:t.y-180});g.update(0);const backClosed=!t.opened;
      Object.assign(s.player, {x:t.x,y:t.y+220});g.update(0);const approachClosed=!t.opened;
      // Walk up the steps using collision-aware movement, not a teleport onto the trigger.
      for(let i=0;i<60&&!t.opened;i++){s.move(s.player,0,-3);g.update(1/60);}
      const reachedSteps=s.player.y<t.y+100;s.draw();g.update(0);g.openTreasure();
      return {sideClosed,backClosed,approachClosed,reachedSteps,early, revealed: t.revealed, colliders, opened: t.opened, xp: s.totalXp - xp, queue: [...s.relics.queue],
        visible: g.chestSprite.visible, events: s.run.events.slice(logged).filter(e => e.type.startsWith('treasure_')).map(e => e.type)};
    }, reward);
    assert(!t.early && t.revealed && t.colliders, reward + ': reveals on time with a solid slab');
    assert(t.sideClosed&&t.backClosed&&t.approachClosed&&t.reachedSteps, reward+': only front-step approach opens treasure');
    assert(t.opened && t.visible, reward + ': opens when the player reaches it');
    assert.deepEqual(t.events, ['treasure_revealed', 'treasure_opened']);
    if (reward === 'xp') assert(t.xp > 0 && t.queue.length === 0); else assert.deepEqual(t.queue, ['hidden_treasure']);
  }

  // Snapshot for eyeballing: start fresh and show the field around a revealed treasure.
  await page.evaluate(() => {
    const s = __survivorTest.scene; s.seed = 4242; s.resetState(); s.mode = 'playing'; s.spawnTimer = 999;
    const t = s.greens.treasure; s.elapsed = t.revealAt; s.greens.update(0); Object.assign(s.player, {x: t.x - 330, y: t.y + 60}); advanceTime(20);
  });
  await page.screenshot({path: 'output/greens-treasure.png'});
  await page.evaluate(() => { const s = __survivorTest.scene; const p = s.greens.props[0]; Object.assign(s.player, {x: p.x - 120, y: p.y}); advanceTime(20); });
  await page.screenshot({path: 'output/greens-props.png'});
}).catch(error => { console.error(error); process.exitCode = 1; });
