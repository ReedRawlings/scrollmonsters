const assert = require('node:assert/strict');
const {run, listControls} = require('./survivor-test-utils.cjs');
run('root redirect, query preservation, and Legacy entrypoint', async page => {
  assert(page.url().endsWith('survivors.html?field=desert&test'));
  assert.equal(await page.evaluate(() => JSON.parse(render_game_to_text()).field), 'desert');
  const labels = (await listControls(page)).map(c => c.label);
  assert(!labels.includes('Legacy'), 'Legacy is no longer on the survivors title');
  const legacy = await page.request.get(page.url().replace(/survivors\.html.*$/, 'legacy.html'));
  assert.equal(legacy.status(), 200, 'legacy.html is still served on its own entrypoint');
}, '?field=desert&test').catch(error => {console.error(error);process.exitCode = 1;});
