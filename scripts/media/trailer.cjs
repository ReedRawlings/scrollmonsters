// Trailer shots. Usage: node trailer.cjs <shot> [frames]
const {open, record, FRAMES} = require('./rec.cjs');
const shot = process.argv[2], dirOf = name => FRAMES + '/shots/' + name;
const ALL = ['cat', 'owl', 'beast', 'frog', 'mouse', 'mole', 'bear', 'salamander', 'spider', 'storm', 'mollusc'];
const evalIn = (page, fn, arg) => page.evaluate(fn, arg);

const shots = {
  async title() {
    const {browser, page} = await open({seed: 11, early: true, storage: {'scrollmonsters-starters-v1': ALL, 'scrollmonsters-seen-starters-v1': ALL}});
    const order = {75: 'salamander', 115: 'owl', 155: 'storm', 195: 'bear'};
    await record(page, dirOf('title'), 230, {bot: false, each: async i => { if (order[i]) await evalIn(page, id => __survivorTest.scene.chooseStarter(id), order[i]); }});
    await browser.close();
  },
  async capture() {
    const {browser, page} = await open({seed: 21});
    await evalIn(page, () => {
      const s = __survivorTest.scene; s.nestDeckOverride = ['bear', 'spider', 'owl', 'beast', 'mole', 'storm']; s.starter = 'cat'; s.start();
      s.expedition.release('owl', s.player.x + 40, s.player.y, true);
      __bot.simulate(29); s.elapsed = 30; s.encounters.update(0);
      const nest = s.encounters.nests.find(n => n.type === 'bear') || s.encounters.nests[0];
      nest.hp = 14; s.spawnTimer = 3;
      Object.assign(s.player, {x: nest.x - 190, y: nest.y + 40}); s.cat.x = s.player.x - 30; s.cat.y = s.player.y + 20; s.trail = [];
      if (s.owl) { s.owl.x = s.player.x + 30; s.owl.y = s.player.y - 10; }
      __bot.nest = nest; __bot.goal = {ref: nest, stopAt: 120}; __bot.aimAt = nest; __bot.allowDash = false; __bot.menuDelay = 85;
      s.draw();
    });
    await record(page, dirOf('capture'), 420, {each: async () => evalIn(page, () => {
      const s = __survivorTest.scene, n = __bot.nest;
      if (n.destroyed || n.hp <= 0) { const b = s.expedition.captureBody(n.type); __bot.aimAt = null; __bot.goal = b && b.state === 'ready' ? {ref: b, stopAt: 6} : null; }
    })});
    await browser.close();
  },
  async party() {
    const {browser, page} = await open({seed: 33, query: '&field=desert'});
    await evalIn(page, () => {
      const s = __survivorTest.scene; s.starter = 'salamander'; s.start();
      s.expedition.release('storm', s.player.x + 40, s.player.y, true);
      s.expedition.release('spider', s.player.x - 40, s.player.y, true);
      __bot.simulate(170); __bot.menuDelay = 9999;
    });
    // Menus would interrupt this short shot; answer them off-camera.
    await record(page, dirOf('party'), 300, {each: async () => evalIn(page, () => { const s = __survivorTest.scene; if (s.mode !== 'playing') { __bot.menuDelay = 1; __bot.fast = true; __bot.step(); __bot.fast = false; __bot.menuDelay = 9999; } })});
    await browser.close();
  },
  async merge() {
    const {browser, page} = await open({seed: 44});
    await evalIn(page, () => {
      const s = __survivorTest.scene; s.starter = 'cat'; s.start();
      s.expedition.release('frog', s.player.x + 40, s.player.y, true);
      __bot.simulate(75); __bot.menuDelay = 9999;
      s.expedition.release('mollusc', s.player.x + 70, s.player.y + 10, false, 0);
      const b = s.expedition.captureBody('mollusc'); b.progress = 2.0; __bot.goal = {ref: b, stopAt: 4}; __bot.allowDash = false;
    });
    let opened = null;
    await record(page, dirOf('merge'), 420, {each: async i => {
      const st = await evalIn(page, () => { const s = __survivorTest.scene; return {mode: s.mode}; });
      if (st.mode === 'merge' && opened === null) opened = i;
      if (opened !== null && i === opened + 95) await evalIn(page, () => { __survivorTest.scene.creatures.evolution.choose('octopus'); __bot.goal = null; });
      if (st.mode === 'evolved') await evalIn(page, () => { __bot.menuDelay = 80; });
      if (st.mode !== 'merge' && st.mode !== 'evolved' && st.mode !== 'playing') await evalIn(page, () => { __bot.menuDelay = 1; __bot.step(); __bot.menuDelay = 9999; });
    }});
    await browser.close();
  },
  async boss() {
    const {browser, page} = await open({seed: 55});
    await evalIn(page, () => {
      const s = __survivorTest.scene; s.starter = 'owl'; s.start();
      s.expedition.release('beast', s.player.x + 40, s.player.y, true);
      s.expedition.release('storm', s.player.x - 40, s.player.y, true);
      __bot.simulate(240); __bot.menuDelay = 9999;
      s.encounters.spawnBoss(true); const b = s.encounters.boss; b.x = s.player.x + 300; b.y = s.player.y - 90;
      s.checkLevel = () => {}; __bot.hpFloor = 0.6; __bot.orbit = Math.atan2(s.player.y - b.y, s.player.x - b.x); __bot.allowDash = false;
    });
    const log = [];
    await record(page, dirOf('boss'), 330, {each: async i => log.push(i + ':' + await evalIn(page, () => { const s = __survivorTest.scene, m = s.mode; if (s.mode !== 'playing') { __bot.menuDelay = 1; __bot.fast = true; __bot.step(); __bot.fast = false; __bot.menuDelay = 9999; }
      const b = s.encounters.boss; if (b?.hp > 0) { __bot.orbit += 0.011; const nb = __bot.near(b); __bot.goal = {x: nb.x + Math.cos(__bot.orbit) * 250, y: nb.y + Math.sin(__bot.orbit) * 250, stopAt: 6}; __bot.aimAt = b; }
      return m + '/' + s.juice.irisRadius().toFixed(2) + '/' + s.elapsed.toFixed(2); }))});
    require('fs').writeFileSync(FRAMES + '/boss_log.txt', log.join('\n'));
    await browser.close();
  },
  async horde() {
    const {browser, page} = await open({seed: 66});
    await evalIn(page, () => {
      const s = __survivorTest.scene; s.starter = 'cat'; s.start();
      s.expedition.release('mouse', s.player.x + 40, s.player.y, true);
      s.expedition.release('salamander', s.player.x - 40, s.player.y, true);
      __bot.simulate(480); __bot.menuDelay = 9999;
    });
    await record(page, dirOf('horde'), 300, {each: async () => evalIn(page, () => { const s = __survivorTest.scene; if (s.mode !== 'playing') { __bot.menuDelay = 1; __bot.fast = true; __bot.step(); __bot.fast = false; __bot.menuDelay = 9999; } })});
    await browser.close();
  }
};
(async () => { const t = Date.now(); await shots[shot](); console.log(shot, 'done', ((Date.now() - t) / 1000).toFixed(0) + 's'); })();
