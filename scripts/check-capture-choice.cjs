const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const { gameURL, launchOptions } = require('./survivor-test-utils.cjs');

(async () => {
  const browser = await chromium.launch(launchOptions);
  try {
    const page = await browser.newPage({ viewport: { width: 1100, height: 760 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => { window.__vt_pending = true; });
    for (const trial of [false, true]) {
      await page.goto(gameURL(`survivors.html?test${trial ? '&trial' : ''}`));
      await page.waitForFunction(() => window.__phaserReady);
      const results = await page.evaluate(trial => {
        const s = window.__survivorTest.scene;
        const expect = (value, message) => { if (!value) throw Error(message); };
        const prepare = (starter, deck) => {
          s.starter = starter;
          s.nestDeckOverride = deck;
          s.start();
          s.elapsed = 30;
          s.encounters.nestsActive = true;
          s.encounters.bossAppeared = true;
          s.spawnTimer = s.player.inv = s.player.fire = s.cat.attack = 1e6;
          s.creatures.swarmAt = s.expedition.chestClock = s.relics.nextCache = 1e6;
          s.expedition.extraEliteSpawned = true;
          s.encounters.nests.forEach(n => { n.clock = 1e6; });
        };
        const destroy = nest => s.hit(nest, 1e6, 'player', s.player);
        const body = type => s.expedition.captureBody(type);
        const advance = seconds => { for (let i = 0; i < Math.round(seconds * 60); i++) s.tick(1 / 60); };
        const channel = (type, seconds = 2.6) => {
          const target = body(type);
          expect(target?.state === 'ready', `${type} must be ready`);
          s.player.x = target.x;
          s.player.y = target.y;
          advance(seconds);
        };

        if (trial) {
          prepare('cat', ['owl', 'beast']);
          s.encounters.nests.forEach(destroy);
          expect(body('owl')?.state === 'ready' && body('beast')?.state === 'ready', 'Both trial options must be freed');
          expect(!s.encounters.stageChoices[0], 'Destruction must not choose trial companion');
          channel('beast');
          expect(s.encounters.stageChoices[0] === 'beast' && !body('owl'), 'Trial choice must remove alternative');
          expect(s.expedition.party().length === 2, 'Trial party limit');
          // Fixed trial dens may include the starter; clearing it must not consume the choice.
          prepare('owl', ['owl', 'beast']);
          destroy(s.encounters.nests[0]);
          expect(!s.encounters.stageChoices[0] && body('owl').state === 'ally', 'Owned Owl must leave the round open');
          destroy(s.encounters.nests[1]);
          channel('beast');
          expect(s.expedition.party().length === 2 && s.encounters.stageChoices[0] === 'beast', 'Other trial option remains capturable');
          return { trial: true, party: s.expedition.party() };
        }

        const species = ['cat', 'owl', 'beast', 'frog', 'mouse', 'mole', 'bear', 'salamander', 'spider', 'storm'];
        for (const [index, type] of species.entries()) {
          const starter = type === 'cat' ? 'frog' : 'cat';
          const alternative = species.slice(index + 1).concat(species).find(t => t !== type && t !== starter);
          prepare(starter, [type, alternative, ...species.filter(t => ![starter, type, alternative].includes(t))]);
          // Exercise the same outcome as an area attack destroying both dens together.
          s.encounters.nests.forEach(destroy);
          const losingBody = body(alternative);
          expect(body(type)?.state === 'ready' && losingBody?.state === 'ready', `${type}: both options should be ready`);
          expect(s.encounters.chosen === null && !s.encounters.stageChoices[0], `${type}: destruction must not commit`);
          channel(type, 1);
          const progress = body(type).progress;
          s.mode = 'paused';
          advance(3);
          expect(body(type).progress === progress, `${type}: pause must freeze capture`);
          s.mode = 'playing';
          s.player.x = 100;
          s.player.y = 100;
          advance(.2);
          expect(body(type).progress < progress, `${type}: leaving must decay progress`);
          channel(type);
          expect(s.encounters.stageChoices[0] === type && s.encounters.chosen === type, `${type}: completion must commit`);
          expect(!body(alternative) && losingBody.state === 'dismissed', `${type}: pending alternative must be removed`);
          expect(s.expedition.party().includes(type) && s.expedition.party().length === 2, `${type}: one recruit per round`);
          expect(s.unlocked.includes(type), `${type}: capture must unlock starter`);
          expect(s.run.events.filter(e => e.type === `${type}_captured`).length === 1, `${type}: one completion event`);
        }

        // A freed first round remains independent when the second round arrives.
        prepare('cat', ['owl', 'beast', 'mouse', 'mole', 'bear']);
        s.encounters.nests.forEach(destroy);
        s.elapsed = 150;
        s.expedition.update(0);
        const second = s.encounters.nests.filter(n => n.stage === 1);
        expect(second.length === 2 && second.every(n => !['owl', 'beast'].includes(n.type)), 'Pending first-round species must not repeat');
        second.forEach(n => { n.clock = 1e6; destroy(n); });
        channel(second[0].type);
        expect(!s.encounters.stageChoices[0] && body('owl')?.state === 'ready' && body('beast')?.state === 'ready', 'Second round must not consume delayed first round');
        channel('beast');
        expect(s.expedition.party().length === 3 && !body('owl'), 'Delayed first capture must complete three-member party');
        expect(Object.keys(s.encounters.stageChoices).length === 2, 'Each capture must commit its own round');

        // Unbroken first-round options also reserve their species, and direct duplicate
        // releases cannot overwrite a pending body's origin or progress.
        prepare('cat', ['owl', 'beast', 'mouse', 'mole', 'bear']);
        s.elapsed = 150;
        s.expedition.update(0);
        expect(s.encounters.nests.filter(n => n.stage === 1).every(n => !['owl', 'beast'].includes(n.type)), 'Unbroken first round must not duplicate second round');
        destroy(s.encounters.nests[0]);
        const original = body('owl');
        expect(s.expedition.release('owl', 300, 300, false, 1) === false && body('owl') === original && original.captureStage === 0, 'Duplicate release must preserve pending origin');
        channel('owl');
        destroy(s.encounters.nests[1]);
        expect(!body('beast'), 'Unbroken alternative cannot recruit after its round is chosen');
        return { trial: false, testedSpecies: species };
      }, trial);
      console.log('PASS capture choices:', results);
    }
    fs.mkdirSync('output/reliability-v26', { recursive: true });
    for (const mobile of [false, true]) {
      await page.setViewportSize(mobile ? { width: 390, height: 844 } : { width: 1100, height: 760 });
      await page.goto(gameURL('survivors.html?test'));
      await page.waitForFunction(() => window.__phaserReady);
      await page.evaluate(() => {
        const s = __survivorTest.scene;
        s.nestDeckOverride = ['storm', 'beast', 'owl', 'mouse'];
        s.start();
        s.elapsed = 30;
        s.encounters.nestsActive = true;
        s.spawnTimer = s.player.inv = s.player.fire = s.cat.attack = 999;
        s.expedition.chestClock = 999;
        s.encounters.nests.forEach((nest, i) => {
          nest.x = s.player.x + (i ? 160 : -160);
          nest.y = s.player.y;
          s.hit(nest, 9999, 'player', s.player);
        });
        s.draw();
      });
      await page.waitForTimeout(120);
      const labels = await page.evaluate(() => {
        const s = __survivorTest.scene, labels = [];
        s.ui.walk(object => {
          if (object.visible && object.type === 'Text' && object.text.includes('CHOOSE')) {
            const bounds = object.getBounds();
            labels.push({ left: bounds.left, right: bounds.right, width: s.scale.width });
          }
        });
        return labels;
      });
      assert.equal(labels.length, 2);
      assert(labels.every(label => label.left >= 0 && label.right <= label.width), 'Capture choices fit the viewport');
      await page.screenshot({ path: `output/reliability-v26/capture-options-${mobile ? 'mobile' : 'desktop'}.png` });
      const captured = await page.evaluate(() => {
        const s = __survivorTest.scene, body = s.creatures.allies.storm;
        s.player.x = body.x;
        s.player.y = body.y;
        advanceTime(2700);
        return { choice: s.encounters.stageChoices[0], party: s.expedition.party(), other: s.encounters.beast };
      });
      assert.equal(captured.choice, 'storm');
      assert.deepEqual(captured.party, ['cat', 'storm']);
      assert.equal(captured.other, null);
      await page.waitForTimeout(120);
      await page.screenshot({ path: `output/reliability-v26/capture-complete-${mobile ? 'mobile' : 'desktop'}.png` });
    }
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
