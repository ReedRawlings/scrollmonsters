// Page-side autopilot for recording. Plays a plausible run: kites enemies, collects XP, dashes out of crowds,
// and answers menus after a short pause so viewers can read them.
(() => {
  const W = () => SurvivorWorld;
  const bot = window.__bot = {
    seed: 12345, rand() { bot.seed = (1664525 * bot.seed + 1013904223) >>> 0; return bot.seed / 4294967296; }, wander: 1.0, menuFrames: 0, stuck: 0, last: null, hpFloor: 0.55, goal: null,
    pick: {upgrade: 0, relic: 0, merge: 0},
    menuDelay: 70, // frames a menu stays visible before the bot answers (at 60 fps)
    near(p) { return W().near(__survivorTest.scene, p); },
    menus(s) {
      bot.menuFrames++;
      if (bot.menuFrames < bot.menuDelay) return;
      const m = s.mode;
      if (m === 'upgrade') s.chooseUpgrade(bot.choose(s.choices?.length || 3, 'upgrade'));
      else if (m === 'relic') s.relics.choose(bot.choose(s.relics.offers?.length || 3, 'relic'));
      else if (m === 'merge') { const ev = s.creatures.evolution, pv = ev.preview(); ev.choose(pv?.options?.[0]?.id || (pv?.canRecruit ? 'recruit' : 'leave')); }
      else if (m === 'unlock') s.closeUnlock();
      else if (m === 'evolved') s.closeEvolved();
      else if (m === 'pack') { if (bot.fast) s.packs.close(); else if (bot.menuFrames % 30 === 0) s.packs.act(); return; }
      else if (m === 'paused') s.pause();
      bot.menuFrames = bot.menuDelay - 20;
    },
    choose(n) { return Math.floor(bot.rand() * n); },
    step() {
      const s = __survivorTest.scene, p = s.player;
      s.joyGraphic.setVisible(false);
      if (s.mode !== 'playing') { s.joy = null; bot.menus(s); return; }
      bot.menuFrames = 0;
      if (p.hp < s.maxHp * bot.hpFloor) p.hp = Math.ceil(s.maxHp * bot.hpFloor);
      let rx = 0, ry = 0, ax = 0, ay = 0, nearest = null, nd = 1e9, crowd = 0;
      const targets = s.enemies.filter(e => e.hp > 0);
      if (s.encounters.boss?.hp > 0) targets.push(s.encounters.boss);
      for (const e0 of targets) {
        const e = bot.near(e0), dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1;
        if (d < nd) { nd = d; nearest = e; }
        const reach = 150 + (e0.r || 12) * 2;
        if (d < reach) { const w = Math.pow((reach - d) / reach, 2) * (e0.elite || e0.final ? 3 : 1); rx += dx / d * w; ry += dy / d * w; }
        if (d < 70) crowd++;
      }
      const hazards = [...s.creatures.strikes.filter(a => a.hostile), ...(s.creatures.elements.casts || []).filter(c => c.hostile), ...(s.creatures.elements.zones || []).filter(z => z.hostile)];
      for (const h0 of hazards) { const h = bot.near(h0), dx = p.x - h.x, dy = p.y - h.y, d = Math.hypot(dx, dy) || 1, reach = (h0.r || 40) + 50; if (d < reach) { rx += dx / d * 3; ry += dy / d * 3; } }
      for (const sh0 of s.encounters.bullets || []) { if (sh0.life !== undefined && sh0.life <= 0) continue; const sh = bot.near(sh0), dx = p.x - sh.x, dy = p.y - sh.y, d = Math.hypot(dx, dy) || 1; if (d < 90) { rx += dx / d * 1.5; ry += dy / d * 1.5; } }
      // Attraction: a scripted goal wins, then pickups and chests.
      let goal = bot.goal;
      if (!goal) {
        let best = null, bd = 380;
        for (const it of s.pickups) { if (it.life <= 0) continue; const q = bot.near(it), d = Math.hypot(q.x - p.x, q.y - p.y); if (d < bd) { bd = d; best = q; } }
        for (const c of s.expedition.chests) { if (c.opened) continue; const q = bot.near(c), d = Math.hypot(q.x - p.x, q.y - p.y) * 0.6; if (d < bd) { bd = d; best = q; } }
        goal = best;
      }
      if (goal) { const g = goal.x !== undefined && goal.world ? goal : (goal.ref ? bot.near(goal.ref) : goal); const dx = g.x - p.x, dy = g.y - p.y, d = Math.hypot(dx, dy) || 1; ax = dx / d * (bot.goal ? 1.6 : 1); ay = dy / d * (bot.goal ? 1.6 : 1); if (bot.goal && d < (bot.goal.stopAt || 10)) { ax = ay = 0; } if (bot.goal && d < 70) { rx *= 0.1; ry *= 0.1; } }
      bot.wander += (bot.rand() - 0.5) * 0.06;
      const wx = Math.cos(bot.wander) * 0.45, wy = Math.sin(bot.wander) * 0.45;
      const repel = bot.goal ? 1.2 : 2.4;
      let mx = ax + rx * repel + (goal ? 0 : wx), my = ay + ry * repel + (goal ? 0 : wy);
      // Orbit: when kiting, add a tangential slide so the player circles the horde instead of backing into a wall.
      if (Math.hypot(rx, ry) > 0.3) { mx += -ry * 0.8; my += rx * 0.8; }
      const m = Math.hypot(mx, my);
      if (bot.hold) { s.joy = null; }
      else if (m > 0.05) s.joy = {id: -7, x: 0, y: 0, dx: mx / m * 48, dy: my / m * 48, touch: false, started: 0};
      else s.joy = null;
      // Unstick from trees.
      if (bot.last && Math.hypot(p.x - bot.last.x, p.y - bot.last.y) < 0.6 && m > 0.05) { if (++bot.stuck > 12) { bot.wander += Math.PI / 2; bot.stuck = 0; } } else bot.stuck = 0;
      bot.last = {x: p.x, y: p.y};
      if (bot.wanderFlip-- <= 0) { bot.wanderFlip = 200 + bot.rand() * 200; }
      // Aim at the nearest threat with a little lead; aim is in camera space.
      const cam = s.cameras.main;
      if (bot.aimAt) { const t = bot.near(bot.aimAt); s.mouseAim = {x: t.x - cam.scrollX, y: t.y - cam.scrollY}; }
      else if (nearest) s.mouseAim = {x: nearest.x - cam.scrollX, y: nearest.y - cam.scrollY};
      // Dash out of a crowd.
      if (bot.allowDash !== false && crowd >= 3 && s.expansion.cooldown <= 0 && Math.hypot(rx, ry) > 0.2) { const d = Math.hypot(mx, my) || 1; s.expansion.dash({x: mx / d, y: my / d}); }
    },
    // Fast simulation with no rendering, used to reach a later point in a run.
    simulate(seconds) {
      const s = __survivorTest.scene, delay = bot.menuDelay; bot.menuDelay = 1; bot.fast = true;
      for (let i = 0; i < seconds * 60; i++) { bot.step(); if (s.mode === 'playing') s.tick(1 / 60); }
      bot.menuDelay = delay; bot.fast = false; s.draw();
    }
  };
})();
