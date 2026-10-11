const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");

(async () => {
  fs.mkdirSync("output/earth-fx", { recursive: true });
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 540, height: 900 } });
    const errors = [];
    page.on("pageerror", error => errors.push(String(error)));
    await page.addInitScript(() => { window.__vt_pending = true; });
    await page.goto(process.env.GAME_URL || "http://127.0.0.1:4173");
    await page.evaluate(() => {
      window.__scollTest.setSave({ upgrades: { autoTarget: 1, power: 3 }, autoTargetEnabled: true });
      window.__scollTest.startStage(1);
    });

    let capturedProjectile = false;
    let capturedImpact = false;
    for (let step = 0; step < 200 && !capturedImpact; step += 1) {
      await page.evaluate(() => window.advanceTime(50));
      const state = await page.evaluate(() => JSON.parse(window.render_game_to_text()));
      if (!capturedProjectile && state.combat?.projectiles.some(projectile => projectile.source === "player" && projectile.animationFrame > 0)) {
        await page.locator("canvas").screenshot({ path: "output/earth-fx/projectile.png" });
        capturedProjectile = true;
      }
      if (state.combat?.effects.some(effect => effect.type === "earthImpact")) {
        await page.evaluate(() => window.advanceTime(100));
        await page.locator("canvas").screenshot({ path: "output/earth-fx/impact.png" });
        capturedImpact = true;
      }
    }

    assert(capturedProjectile, "Animated earth projectile was not observed");
    assert(capturedImpact, "Animated earth impact was not observed");
    assert.deepEqual(errors, []);
    console.log("PASS: earth projectile and enemy impact animate without browser errors");
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exit(1);
});
