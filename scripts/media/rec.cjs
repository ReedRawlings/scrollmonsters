// Shared recorder: loads the game with a fake clock and captures one PNG per 60 fps frame.
const {chromium} = require('playwright');
const fs = require('node:fs'), path = require('node:path');
const BOT = fs.readFileSync(path.join(__dirname, 'bot.js'), 'utf8');
const URL = (process.env.GAME_URL || 'http://localhost:5173') + '/survivors.html';
// Frames go to output/media (git-ignored).
const FRAMES = path.join(__dirname, '../../output/media');

async function open({seed = 7, viewport = {width: 1440, height: 960}, query = '', storage = null, early = false} = {}) {
  const browser = await chromium.launch({headless: true});
  const page = await browser.newPage({viewport});
  page.on('pageerror', e => console.log('PAGE ERROR', e.message));
  if (storage) await page.addInitScript(st => { if (!sessionStorage.getItem('__seeded')) { for (const [k, v] of Object.entries(st)) localStorage.setItem(k, JSON.stringify(v)); sessionStorage.setItem('__seeded', '1'); } }, storage);
  if (early) {
    // Fake clock from the first script so the title intro plays on camera.
    await page.clock.install();
    await page.clock.pauseAt(new Date(Date.now() + 1000));
    await page.goto(`${URL}?test&seed=${seed}${query}`);
    for (let i = 0; i < 400 && !(await page.evaluate(() => !!window.__phaserReady)); i++) { await page.clock.runFor(1000 / 60); await new Promise(r => setTimeout(r, 15)); }
  } else {
    await page.goto(`${URL}?test&seed=${seed}${query}`);
    await page.waitForFunction(() => window.__phaserReady);
    await page.evaluate(() => document.fonts.ready);
    await page.clock.install();
    await page.clock.pauseAt(new Date(Date.now() + 1000));
    await page.clock.runFor(200);
  }
  await page.evaluate(BOT);
  return {browser, page};
}

// Captures `frames` frames into dir starting at index `start`. `each(i)` runs in node before each frame.
async function record(page, dir, frames, {start = 0, bot = true, each} = {}) {
  fs.mkdirSync(dir, {recursive: true});
  for (let i = 0; i < frames; i++) {
    if (each) await each(i);
    if (bot) await page.evaluate(() => __bot.step());
    await page.clock.runFor(1000 / 60);
    await page.screenshot({path: path.join(dir, String(start + i).padStart(5, '0') + '.png')});
    if (i % 120 === 0) process.stdout.write(`  ${dir.split('/').pop()} ${i}/${frames}\n`);
  }
  return start + frames;
}
module.exports = {open, record, FRAMES};
