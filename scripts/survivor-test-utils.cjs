const assert = require('node:assert/strict');
const {chromium} = require('playwright');
const baseURL = process.env.GAME_URL || 'http://localhost:5174';
const gameURL = path => new URL(path, baseURL.endsWith('/') ? baseURL : baseURL + '/').href;
const launchOptions = {headless: true, args: process.platform === 'darwin' ? ['--use-gl=angle', '--use-angle=metal'] : []};
// Every UI control is found through its world transform, so scaled groups (the 2x UI) map correctly.
const BROWSER_HELPERS = `
  window.__uiShown = o => { for (let n = o; n; n = n.parentContainer) if (!n.visible) return false; return true; };
  window.__uiControls = () => {
    const s = __survivorTest.scene, out = [];
    s.ui.walk(o => {
      if (o.type === 'WoodButton' && o.input?.enabled && __uiShown(o)) {
        const p = o.getWorldTransformMatrix().transformPoint(0, 0);
        out.push({label: o.label.getData('label'), x: p.x, y: p.y});
      }
    });
    return {controls: out, width: s.scale.width, height: s.scale.height};
  };
  window.__uiTexts = () => {
    const s = __survivorTest.scene, out = [];
    s.ui.walk(o => {
      if (o.type !== 'Text' || !__uiShown(o) || !o.text) return;
      const m = o.getWorldTransformMatrix(), x0 = -o.originX * o.width, y0 = -o.originY * o.height;
      const a = m.transformPoint(x0, y0), b = m.transformPoint(x0 + o.width, y0 + o.height);
      out.push({text: o.text, left: Math.min(a.x, b.x), right: Math.max(a.x, b.x), top: Math.min(a.y, b.y), bottom: Math.max(a.y, b.y)});
    });
    return {texts: out, width: s.scale.width, height: s.scale.height};
  };`;
async function installHelpers(page) { await page.evaluate(BROWSER_HELPERS); }
async function toPage(page, point, size) {
  const c = await page.locator('canvas').boundingBox();
  return {x: c.x + point.x * c.width / size.width, y: c.y + point.y * c.height / size.height};
}
async function listControls(page) {
  await installHelpers(page);
  const {controls, width, height} = await page.evaluate(() => __uiControls());
  return Promise.all(controls.map(async c => ({label: c.label, ...(await toPage(page, c, {width, height}))})));
}
async function controlPoint(page, label) {
  const found = (await listControls(page)).find(c => c.label === label);
  if (!found) throw Error('Visible button missing: ' + label);
  return found;
}
async function clickButton(page, label, {touch = false} = {}) {
  const p = await controlPoint(page, label);
  if (touch) await page.touchscreen.tap(p.x, p.y); else await page.mouse.click(p.x, p.y, {delay: 30});
}
async function offscreenTexts(page) {
  await installHelpers(page);
  const {texts, width, height} = await page.evaluate(() => __uiTexts());
  return texts.filter(t => t.left < -0.5 || t.top < -0.5 || t.right > width + 0.5 || t.bottom > height + 0.5).map(t => t.text);
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
// Code points a TrueType font actually draws (cmap format 4), so tests can catch fallback glyphs.
function fontCodePoints(file) {
  const b = require('node:fs').readFileSync(file), u16 = o => b.readUInt16BE(o), i16 = o => b.readInt16BE(o), u32 = o => b.readUInt32BE(o);
  let cmap = 0; for (let i = 0, n = u16(4); i < n; i++) if (b.toString('latin1', 12 + i * 16, 16 + i * 16) === 'cmap') cmap = u32(20 + i * 16);
  const points = new Set();
  for (let i = 0, n = u16(cmap + 2); i < n; i++) {
    const t = cmap + u32(cmap + 8 + i * 8); if (u16(t) !== 4) continue;
    const seg = u16(t + 6) / 2, ends = t + 14, starts = ends + seg * 2 + 2, deltas = starts + seg * 2, ranges = deltas + seg * 2;
    for (let k = 0; k < seg; k++) {
      const end = u16(ends + k * 2), start = u16(starts + k * 2), delta = i16(deltas + k * 2), range = u16(ranges + k * 2);
      for (let c = start; c <= end && c !== 0xffff; c++) {
        const glyph = range ? u16(ranges + k * 2 + range + (c - start) * 2) : (c + delta) & 0xffff;
        if (glyph) points.add(c);
      }
    }
  }
  return points;
}
// Characters in visible NovelMix text that the font has no glyph for (the browser would draw a fallback).
async function missingGlyphs(page) {
  const points = fontCodePoints(require('node:path').join(__dirname, '../assets/ui/font_medium_9px.ttf'));
  const texts = await page.evaluate(() => { const out = []; __survivorTest.scene.ui.walk(o => {
    let shown = true; for (let n = o; n; n = n.parentContainer) if (!n.visible) shown = false;
    if (shown && o.type === 'Text' && o.style.fontFamily === 'NovelMix') out.push(o.text); }); return out; });
  const missing = new Set();
  for (const t of texts) for (const ch of t) if (!/\s/.test(ch) && !points.has(ch.codePointAt(0))) missing.add(ch);
  return [...missing];
}
module.exports = {missingGlyphs, gameURL, launchOptions, clickButton, controlPoint, listControls, offscreenTexts, run};
