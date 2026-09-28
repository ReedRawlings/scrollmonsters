const assert = require('node:assert/strict');
const {chromium} = require('playwright');
const baseURL = process.env.GAME_URL || 'http://localhost:5174';
const gameURL = path => new URL(path, baseURL.endsWith('/') ? baseURL : baseURL + '/').href;
const launchOptions = {headless: true, args: process.platform === 'darwin' ? ['--use-gl=angle', '--use-angle=metal'] : []};
async function clickButton(page, label) {
  const position = await page.evaluate(label => {
    const scene = __survivorTest.scene, found = [];
    const visit = object => {if(object.type === 'WoodButton' && object.label?.getData('label') === label) found.push(object); if(object.list) object.list.forEach(visit);};
    scene.children.list.forEach(visit);
    const button = found.find(object => object.visible && object.active);
    if (!button) throw Error('Visible button missing: ' + label);
    const bounds = button.getBounds();
    return {x: bounds.centerX, y: bounds.centerY, width: scene.scale.width, height: scene.scale.height};
  }, label);
  const canvas = await page.locator('canvas').boundingBox();
  await page.mouse.click(canvas.x + position.x * canvas.width / position.width, canvas.y + position.y * canvas.height / position.height, {delay: 30});
}
async function run(name, check, path = 'survivors.html?test') {
  const browser = await chromium.launch(launchOptions);
  try {
    const page = await browser.newPage({viewport: {width: 1100, height: 760}}), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {if(message.type() === 'error') errors.push(message.text());});
    await page.addInitScript(() => window.__vt_pending = true);
    await page.goto(gameURL(path));
    await page.waitForFunction(() => window.__phaserReady);
    await check(page, browser);
    assert.deepEqual(errors, [], 'No browser runtime or resource errors');
    console.log('PASS: ' + name);
  } finally {await browser.close();}
}
module.exports = {gameURL, launchOptions, clickButton, run};
