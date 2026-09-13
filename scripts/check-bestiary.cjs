const assert = require("node:assert/strict");
const fs = require("node:fs");
const { chromium } = require("playwright");

(async () => {
  fs.mkdirSync("output/type-essence", { recursive: true });
  const browser = await chromium.launch({ headless: true, args: [] });
  const page = await browser.newPage({ viewport: { width: 540, height: 900 } });
  const errors = [];
  page.on("pageerror", error => errors.push(String(error)));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("http://127.0.0.1:4173/?test=1", { waitUntil: "networkidle" });

  const read = () => page.evaluate(() => JSON.parse(window.render_game_to_text()));
  await page.evaluate(() => window.__scollTest.resetSave());
  let state = await read();
  assert.deepEqual(state.essence, { feral: 0, bloom: 0, arcane: 0 });
  assert.deepEqual(state.ownedCreatures, []);
  assert.equal(state.bestiary.find(creature => creature.id === "striker").gateUnlocked, true);
  assert.equal(state.bestiary.find(creature => creature.id === "healer").gateUnlocked, false);

  await page.evaluate(() => {
    window.__scollTest.setSave({ essence: { feral: 8, bloom: 12, arcane: 20 } });
    window.__scollTest.setMode("bestiary");
  });
  await page.mouse.click(425, 357);
  await page.mouse.click(425, 502);
  state = await read();
  assert.deepEqual(state.ownedCreatures, ["striker"]);
  assert.deepEqual(state.activeParty, ["striker"]);
  assert.equal(state.essence.feral, 0);
  assert.equal(state.essence.bloom, 12);

  await page.evaluate(() => {
    const save = window.__scollTest.getSave();
    window.__scollTest.setSave({ ...save, completed: [5, 10], unlockedStage: 10 });
  });
  await page.mouse.click(425, 502);
  await page.mouse.click(425, 647);
  state = await read();
  assert.deepEqual(state.ownedCreatures, ["striker", "healer", "aoe"]);
  assert.deepEqual(state.activeParty, ["striker", "healer", "aoe"]);
  assert.deepEqual(state.essence, { feral: 0, bloom: 0, arcane: 0 });

  await page.evaluate(() => window.__scollTest.toggleCreatureInParty("striker"));
  state = await read();
  assert.deepEqual(state.activeParty, ["healer", "aoe"]);
  await page.reload({ waitUntil: "networkidle" });
  state = await read();
  assert.deepEqual(state.activeParty, ["healer", "aoe"]);

  await page.evaluate(() => window.__scollTest.setMode("map"));
  await page.locator("canvas").screenshot({ path: "output/type-essence/map.png" });
  await page.evaluate(() => window.__scollTest.setMode("bestiary"));
  await page.locator("canvas").screenshot({ path: "output/type-essence/bestiary.png" });
  await page.evaluate(() => window.__scollTest.startStage(1));
  state = await read();
  assert.deepEqual(state.party.memberNames, ["Player", "Buttermant", "Tinmin"]);
  await page.locator("canvas").screenshot({ path: "output/type-essence/combat.png" });
  assert.deepEqual(errors, []);
  await browser.close();
  console.log("PASS: fresh affinity wallet, Fangle open gate, stage-locked recruits, party selection, persistence, and combat roster");
})().catch(error => { console.error(error); process.exitCode = 1; });
