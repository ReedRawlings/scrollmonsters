const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");

(async () => {
  fs.mkdirSync("output/party-sprites", { recursive: true });
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 540, height: 900 } });
    const errors = [];
    page.on("pageerror", error => errors.push(String(error)));
    await page.addInitScript(() => { window.__vt_pending = true; });
    await page.goto(process.env.GAME_URL || "http://127.0.0.1:4173");
    await page.waitForTimeout(300);
    await page.evaluate(() => window.advanceTime(250));
    await page.locator("canvas").screenshot({ path: "output/party-sprites/title.png" });

    await page.evaluate(() => {
      window.__scollTest.setSave({
        unlockedStage: 10,
        recruits: ["striker", "healer", "aoe"],
        upgrades: { autoTarget: 1, power: 2 },
        autoTargetEnabled: true
      });
      window.__scollTest.startStage(6);
      window.advanceTime(250);
    });
    const first = await page.evaluate(() => JSON.parse(window.render_game_to_text()));
    assert.deepEqual(first.party.memberNames, ["Player", "Fangle", "Buttermant", "Tinmin"]);
    assert.deepEqual(first.combat.companions.map(companion => companion.name), ["Fangle", "Buttermant", "Tinmin"]);
    const firstPlayerFrame = first.party.animationFrame;
    const firstPetFrame = first.combat.companions[0].animationFrame;
    await page.locator("canvas").screenshot({ path: "output/party-sprites/combat-a.png" });

    await page.evaluate(() => window.advanceTime(250));
    const second = await page.evaluate(() => JSON.parse(window.render_game_to_text()));
    assert.notEqual(second.party.animationFrame, firstPlayerFrame);
    assert.notEqual(second.combat.companions[0].animationFrame, firstPetFrame);
    await page.locator("canvas").screenshot({ path: "output/party-sprites/combat-b.png" });

    const save = await page.evaluate(() => window.__scollTest.getSave());
    await page.reload();
    assert.deepEqual(await page.evaluate(() => window.__scollTest.getSave()), save);
    assert.deepEqual(errors, []);
    console.log("PASS: player/pet animations, roster names, browser saving, and browser errors");
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exit(1);
});
