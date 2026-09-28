const assert = require('node:assert/strict');
const {run, clickButton} = require('./survivor-test-utils.cjs');
run('root redirect, query preservation, and Legacy navigation', async page => {
  assert(page.url().endsWith('survivors.html?field=desert&test'));
  assert.equal(await page.evaluate(() => JSON.parse(render_game_to_text()).field), 'desert');
  // Verify the current-game link without loading or asserting the legacy game.
  let navigated = false;
  await page.route('**/legacy.html', route => {navigated = true; return route.fulfill({contentType: 'text/html', body: '<title>Legacy destination</title>'});});
  await Promise.all([page.waitForURL('**/legacy.html'), clickButton(page, 'Legacy')]);
  assert(navigated, 'Legacy button navigates to its separate entrypoint');
}, '?field=desert&test').catch(error => {console.error(error);process.exitCode = 1;});
