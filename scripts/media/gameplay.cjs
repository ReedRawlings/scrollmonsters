// 20-second gameplay clip: a mid-run expedition with a full party, captured at 60 fps.
const {open, record, FRAMES} = require('./rec.cjs');
const seed = Number(process.argv[2] || 7), simSeconds = Number(process.argv[3] || 230), frames = Number(process.argv[4] || 1200);
const out = process.argv[5] || FRAMES + '/gameplay';
(async () => {
  const {browser, page} = await open({seed});
  const info = await page.evaluate(({simSeconds}) => {
    const s = __survivorTest.scene; s.starter = 'cat'; s.start();
    s.expedition.release('owl', s.player.x + 40, s.player.y, true);
    s.expedition.release('storm', s.player.x - 40, s.player.y, true);
    __bot.simulate(simSeconds);
    __bot.menuDelay = 50;
    return {elapsed: s.elapsed, lvl: s.level, party: s.expedition.party(), enemies: s.enemies.length, mode: s.mode, track: GAME_MUSIC.combat[s.run.seed % GAME_MUSIC.combat.length]};
  }, {simSeconds});
  console.log(JSON.stringify(info));
  await record(page, out, frames);
  await browser.close();
})();
