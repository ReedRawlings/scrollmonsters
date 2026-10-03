// Field Binder (bestiary) screen, Dune Ledger version (2026-10-03). Opened from the title.
// One creature per page: desktop shows the open binder (two pages, 480x320 frame), a phone shows one page (270x480).
// Presentation only: reads SurvivorBestiary and the juice clock, never writes simulation state.
(() => {
  'use strict';
  const PAL = {cover:'#c4995c', paper:0xf7f1e3, rule:0x22384f, ruleS:'#22384f', accent:0x2a8f8c, onAccent:'#f7f1e3', gild:0xb8862a, gildS:'#b8862a',
    thumb:0xf7f1e3, thumbFusion:0xe3ecea, thumbFoe:0xf1e1c8, sil:[34,56,79]};
  const FRAMES = {desktop:{w:480, h:320, pages:[[8,8,226,276],[246,8,226,276]], strip:[8,290,464,26]},
    phone:{w:270, h:480, pages:[[18,6,246,438]], strip:[6,450,258,26]}};
  const NOTCH = 78, HALF = 190, CHAR_MS = 14, STAMP = {seen:'', caught:'CAUGHT', fusion:'MERGED', foe:'DEFEATED'};
  const SPRITE = {shaman:['shamanYellow',16,16], guardian:['guardian',50,50], ancient:['ancientGuardian',50,50]};
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const easeIn = k => k * k, easeOut = k => 1 - (1 - k) * (1 - k);
  const E = () => SurvivorBestiary.entries;

  class SurvivorBinder {
    constructor(s) {
      this.s = s; this.sel = 0; this.turn = null; this.openAt = -1e9; this.shownKey = null; this.shownAt = {}; this.reveals = {};
      this.cryAt = {}; this.picks = {}; this.br = null; this.layout = {}; this.flown = new Set();
      this.makeTextures();
    }
    // ------------------------------------------------------------------ textures (built once from loaded art)
    makeTextures() {
      const tx = this.s.textures, add = (key, c) => { if (tx.exists(key)) tx.remove(key); tx.addCanvas(key, c); };
      const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
      const bitmap = (rows, paint) => { const c = canvas(rows[0].length, rows.length), g = c.getContext('2d');
        rows.forEach((r, y) => [...r].forEach((ch, x) => { if (paint[ch]) { g.fillStyle = paint[ch]; g.fillRect(x, y, 1, 1); } })); return c; };
      const GLYPH = {claw:['#.#.#','#.#.#','#.#.#','#.#.#','.#.#.'], wing:['#....','##...','###..','.###.','..###'], rush:['#.#..','.#.#.','..#.#','.#.#.','#.#..'],
        ward:['#####','#####','#####','.###.','..#..'], swarm:['##.##','##.##','.....','.##..','.##..'], earth:['..#..','.###.','.###.','#####','#####'],
        fire:['..#..','.##..','.###.','#####','.###.'], web:['#.#.#','.###.','##.##','.###.','#.#.#'], storm:['..##.','.##..','####.','..##.','.##..'],
        ink:['..#..','..#..','.###.','#####','.###.']};
      for (const [t, [, col]] of Object.entries(SurvivorBestiary.types)) {
        const rows = []; for (let y = 0; y < 9; y++) { let r = ''; for (let x = 0; x < 9; x++) {
          const edge = x === 0 || y === 0 || x === 8 || y === 8, corner = (x === 0 || x === 8) && (y === 0 || y === 8);
          r += corner ? '.' : edge ? 'k' : x >= 2 && x <= 6 && y >= 2 && y <= 6 && GLYPH[t][y - 2][x - 2] === '#' ? 'w' : 'c'; } rows.push(r); }
        add('bx_t_' + t, bitmap(rows, {k:'#101018', c:col, w:'#ffffff'}));
      }
      const RING = ['..###..','.#...#.','#..#..#','#.###.#','#..#..#','.#...#.','..###..'], STAR = ['...#...','...#...','..###..','#######','..###..','...#...','...#...'];
      add('bx_ring', bitmap(RING, {'#':'#1a1a22'})); add('bx_star', bitmap(STAR, {'#':PAL.gildS})); add('bx_starO', bitmap(STAR, {'#':'#c9bc98'}));
      add('bx_starW', bitmap(STAR, {'#':'#ffffff'}));
      add('bx_tri', bitmap(['#....','##...','###..','####.','###..','##...','#....'], {'#':'#1a1a22'}));
      add('bx_triL', bitmap(['....#','...##','..###','.####','..###','...##','....#'], {'#':'#1a1a22'}));
      add('bx_note', bitmap(['..###','..#.#','..#.#','..#.#','###.#','###..','###..'], {'#':'#ffc41b'}));
      const [sr, sg, sb] = PAL.sil, silFill = `rgb(${sr},${sg},${sb})`;
      // Facesets share one flat background (#141b1b): flood-fill it from the edges to get each creature's outline.
      for (const e of E()) {
        const key = 'face_' + e.id; if (!tx.exists(key) || e.kind === 'boss') continue;
        const src = tx.get(key).getSourceImage(), c = canvas(38, 38), g = c.getContext('2d'); g.drawImage(src, 0, 0);
        const im = g.getImageData(0, 0, 38, 38), p = im.data, bg = i => p[i*4] === 20 && p[i*4+1] === 27 && p[i*4+2] === 27;
        if (!bg(0)) continue;
        const out = new Uint8Array(38 * 38), stack = [];
        for (let k = 0; k < 38; k++) stack.push(k, 37 * 38 + k, k * 38, k * 38 + 37);
        while (stack.length) { const i = stack.pop(); if (out[i] || !bg(i)) continue; out[i] = 1; const x = i % 38, y = (i / 38) | 0;
          if (x > 0) stack.push(i - 1); if (x < 37) stack.push(i + 1); if (y > 0) stack.push(i - 38); if (y < 37) stack.push(i + 38); }
        for (let i = 0; i < 38 * 38; i++) { if (out[i]) p[i*4+3] = 0; else { p[i*4] = sr; p[i*4+1] = sg; p[i*4+2] = sb; p[i*4+3] = 255; } }
        g.putImageData(im, 0, 0); add('bx_sil_' + e.id, c);
      }
      // 16px strip icons (first frame of each walk sheet) and sprite silhouettes for foes without a usable faceset.
      for (const e of E()) {
        const [key, fw, fh] = SPRITE[e.id] || [e.id, 16, 16]; if (!tx.exists(key)) continue;
        const src = tx.get(key).getSourceImage(), sx = Math.max(0, (fw - 16) / 2), sy = Math.max(0, (fh - 16) / 2);
        const mini = canvas(16, 16); mini.getContext('2d').drawImage(src, sx, sy, 16, 16, 0, 0, 16, 16); add('bx_mini_' + e.id, mini);
        const sil = canvas(16, 16), g = sil.getContext('2d'); g.drawImage(mini, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = silFill; g.fillRect(0, 0, 16, 16); add('bx_minis_' + e.id, sil);
        if (SPRITE[e.id]) { const whole = canvas(fw, fh), w2 = whole.getContext('2d'); w2.drawImage(src, 0, 0, fw, fh, 0, 0, fw, fh); add('bx_spr_' + e.id, whole);
          const ws = canvas(fw, fh), w3 = ws.getContext('2d'); w3.drawImage(whole, 0, 0); w3.globalCompositeOperation = 'source-in'; w3.fillStyle = silFill; w3.fillRect(0, 0, fw, fh); add('bx_sprs_' + e.id, ws); }
      }
      // Covers: tan leather, dotted grain, stitching; the desktop cover has a centre spine, the phone a left spine.
      for (const [name, f] of Object.entries(FRAMES)) {
        const c = canvas(f.w, f.h), g = c.getContext('2d');
        g.fillStyle = PAL.cover; g.fillRect(0, 0, f.w, f.h);
        for (let y = 0; y < f.h; y += 5) for (let x = 0; x < f.w; x += 5) { g.fillStyle = 'rgba(255,255,255,.10)'; g.fillRect(x, y, 1, 1); }
        for (let y = 3; y < f.h; y += 7) for (let x = 2; x < f.w; x += 7) { g.fillStyle = 'rgba(90,58,26,.10)'; g.fillRect(x, y, 1, 1); }
        g.fillStyle = 'rgba(255,243,210,.6)';
        for (let x = 6; x < f.w - 6; x += 4) { g.fillRect(x, 3, 2, 1); g.fillRect(x, f.h - 4, 2, 1); }
        for (let y = 6; y < f.h - 6; y += 4) { g.fillRect(3, y, 1, 2); g.fillRect(f.w - 4, y, 1, 2); }
        const sp = name === 'desktop' ? [234, 0, 12, f.h] : [0, 0, 14, f.h];
        g.fillStyle = '#a8803f'; g.fillRect(...sp); g.fillStyle = '#7d5c2c'; g.fillRect(sp[0] + 3, 0, 6, f.h);
        for (const y of name === 'desktop' ? [36, 110, 190, 264] : [60, 170, 290, 400]) { g.fillStyle = '#3a2812'; g.fillRect(sp[0] + 1, y - 7, sp[2] - 2, 14); g.fillStyle = '#6a4a26'; g.fillRect(sp[0] + 2, y - 6, sp[2] - 4, 12); }
        add('bx_cover_' + name, c);
      }
    }
    // ------------------------------------------------------------------ navigation
    entries() { return E(); }
    phone() { const s = this.s; return s.scale.width < s.scale.height; }
    key(i = this.sel, P = this.phone()) { return P ? i : Math.floor(i / 2); }
    shown(P = this.phone(), i = this.sel) { const k = this.key(i, P); return P ? [E()[k]] : [E()[k * 2], E()[k * 2 + 1]]; }
    open() {
      const s = this.s, unseen = s.bestiary.unseen(); this.reveals = {}; this.turn = null; this.shownKey = null; this.cryAt = {}; this.flown.clear();
      if (unseen.length) this.sel = E().findIndex(e => e.id === unseen[0]);
      this.openAt = s.juice.now(); this.br = null;
    }
    goTo(i, dir) {
      const P = this.phone(), n = E().length; i = (i + n) % n;
      const before = this.shown(P), oldKey = this.key(this.sel, P); this.sel = i;
      if (this.key(i, P) === oldKey) return;
      this.reveals = {}; this.cryAt = {};
      this.turn = this.s.juice.reduced ? null : {at:this.s.juice.now(), dir:dir ?? Math.sign(this.key(i, P) - oldKey), from:before, to:this.shown(P)};
      this.shownKey = null;
    }
    step(d) { const P = this.phone(), base = P ? this.sel : this.sel - this.sel % 2; this.goTo(base + d * (P ? 1 : 2), d); }
    pick(id) { const i = E().findIndex(e => e.id === id); if (i >= 0) this.goTo(i); }
    // Pages that just came into view type their text and play their reveal once.
    arrive(now) {
      const B = this.s.bestiary;
      for (const m of this.shown()) { const was = B.view(m.id), st = B.state(m.id);
        // A capture reveal types its text from the moment the colour art replaces the silhouette.
        this.shownAt[m.id] = now + (st >= 2 && was < 2 && !this.s.juice.reduced ? 670 : 0);
        if (st > was) this.reveals[m.id] = {from:was, to:st, at:now}; }
    }
    cry(id) { this.cryAt[id] = this.s.juice.now(); }
    // State a page shows right now: a reveal shows the old state until its swap moment.
    shownState(m, now) {
      const B = this.s.bestiary, st = B.state(m.id), r = this.reveals[m.id]; if (!r || this.s.juice.reduced) return st;
      const t = now - r.at, capt = r.to >= 2 && r.from < 2, mast = r.to === 3;
      if (capt && t < 670) return r.from;
      if (mast && t < (capt ? 1600 : 0) + 460) return 2;
      return st;
    }
    // ------------------------------------------------------------------ drawing helpers (local to the current group)
    txt(value, x, top, o = {}) {
      const size = o.size || 9;
      return this.s.ui.darkText(value, x, top + (size === 18 ? 9 : 6), {size, color:o.color || PAL.ruleS, align:o.align || 'left', outline:false, wrap:o.wrap || 0});
    }
    dbl(g, x, y, w, h) { g.fillStyle(PAL.rule).fillRect(x, y, w, h).fillStyle(PAL.paper).fillRect(x + 2, y + 2, w - 4, h - 4)
      .fillStyle(PAL.rule).fillRect(x + 3, y + 3, w - 6, h - 6).fillStyle(PAL.paper).fillRect(x + 4, y + 4, w - 8, h - 8); }
    outline(w, h) { const n = w - NOTCH; return [{x:1, y:1}, {x:n, y:1}, {x:n + 12, y:13}, {x:w - 1, y:13}, {x:w - 1, y:h - 1}, {x:1, y:h - 1}]; }
    fxFrame(key, x, y, ms, {scale = 1, loop = false, alpha = 1, crop} = {}) {
      const j = this.s.juice, m = j.meta(key), i = j.frameAt(key, ms, loop); if (ms < 0 || (!loop && ms >= m.n / m.fps * 1000)) return;
      const r = j.frameRect(key, i), f = crop ? crop(r) : r; if (!f) return;
      this.s.ui.image(key, x - (crop ? 0 : m.fw * scale / 2), y - (crop ? 0 : m.fh * scale / 2), f[2] * scale, f[3] * scale, {frame:f, alpha});
    }
    // Faceset (caught), faceset silhouette (seen) or ?. Foes without a faceset, or bosses not yet defeated, use their sprite.
    face(m, x, y, n, st, alpha = 1) {
      const ui = this.s.ui, tx = this.s.textures;
      if (st === 0) { this.txt('?', x + n / 2, y + n / 2 - 9, {size:18, align:'center'}).setAlpha(alpha); return; }
      const key = st === 1 ? 'bx_sil_' + m.id : 'face_' + m.id;
      if (tx.exists(key)) { ui.image(key, x, y, n, n, {alpha}); return; }
      if (SPRITE[m.id]) { const [, fw, fh] = SPRITE[m.id], sc = Math.max(1, Math.floor((n - 4) / Math.max(fw, fh)));
        ui.image((st === 1 ? 'bx_sprs_' : 'bx_spr_') + m.id, x + (n - fw * sc) / 2, y + (n - fh * sc) / 2, fw * sc, fh * sc, {alpha}); }
    }
    // ------------------------------------------------------------------ one creature page, drawn at (0,0) of the current group
    pageContent(m, w, h, P, now, o = {}) {
      const s = this.s, ui = s.ui, B = s.bestiary, foe = SurvivorBestiary.isFoe(m), red = s.juice.reduced;
      const st = o.state ?? this.shownState(m, now), known = st >= 1, own = st >= 2, r = this.reveals[m.id];
      const chars = o.chars ?? Infinity, type = t => t.slice(0, Math.max(0, chars));
      const g = ui.graphics(), pts = this.outline(w, h), gilded = st === 3;
      g.fillStyle(PAL.paper).fillPoints(pts, true).lineStyle(2, gilded ? PAL.gild : PAL.rule).strokePoints(pts, true);
      // Mastered reveal: a gold line traces the edge in 16 steps before the border stays gold.
      if (r && r.to === 3 && !red) { const t0 = r.from < 2 ? 1600 : 0, k = clamp((now - r.at - t0) / 460, 0, 1);
        if (k > 0 && k < 1) this.trace(ui.graphics(), pts, Math.ceil(k * 16) / 16); }
      const notch = w - NOTCH, nm = known ? m.name.toUpperCase() : '???', big = nm.length * 12.8 <= notch - 16;
      const pop = r && r.to === 1 && !red ? easeOut(clamp((now - r.at) / 240, 0, 1)) : 1;
      const name = this.txt(nm, 10, 7, {size:big ? 18 : 9}); if (pop < 1) name.setScale(pop);
      if (r) { const bx = 10 + name.width * name.scaleX + 5, a = red ? 1 : .65 + .35 * Math.sin(now / 160);
        ui.rect(bx, 9, 23, 11, PAL.accent); this.txt('NEW', bx + 2, 9, {color:PAL.onAccent}).setAlpha(a); }
      // Number, capture ring and mastery star (empty until mastered).
      this.txt('No.' + m.no, w - 27, 17, {align:'right'});
      if (own) { ui.image('bx_ring', w - 25, 19, 7, 7); ui.image(st === 3 ? 'bx_star' : 'bx_starO', w - 16, 19, 7, 7); }
      // Portrait: faceset, faceset silhouette, or ?
      const ps = P ? 120 : 84, fs = P ? 114 : 76, idx = 9 + ps + (P ? 6 : 8), line = 28 + ps + 7;
      const cryT = now - (this.cryAt[m.id] ?? -1e9), shake = r && r.to >= 2 && r.from < 2 && !red && now - r.at < 520 ? Math.round(Math.sin((now - r.at) / 18) * (1 + (now - r.at) / 200)) : 0;
      const pg = ui.beginGroup('portrait', {x:9 + ps / 2 + shake, y:28 + ps / 2});
      if (!red && cryT < 300) { const k = cryT / 300; pg.setScale(k < .3 ? 1 + .1 * k / .3 : k < .6 ? 1.1 - .16 * (k - .3) / .3 : .94 + .06 * (k - .6) / .4, k < .3 ? 1 - .14 * k / .3 : k < .6 ? .86 + .22 * (k - .3) / .3 : 1.08 - .08 * (k - .6) / .4); }
      this.dbl(ui.graphics(), -ps / 2, -ps / 2, ps, ps);
      const seenIn = r && r.to === 1 && !red ? Math.floor(clamp((now - r.at) / 360, 0, 1) * 4) / 4 : 1;
      if (seenIn > 0) this.face(m, -fs / 2, -fs / 2, fs, st, seenIn);
      ui.endGroup();
      ui.hitArea(9, 28, ps, ps, () => { s.binder.cry(m.id); }, 'cry:' + (o.slot ?? 0));
      // ID column: species, type, attack, dash (foes: status).
      const atk = own ? m.atk[0] : '???', dash = foe ? (known ? (st >= 2 ? (st === 3 ? 'MASTERED' : 'DEFEATED') : 'SEEN') : '???') : own ? m.dash : '???';
      const groups = [11, 23, 23, 23], spare = ps - 80; let ty = 28;
      this.txt(known ? m.sp : '?????', idx, ty); ty += groups[0] + spare / 3;
      this.txt('TYPE:', idx, ty);
      if (known) { let tx = idx; m.t.forEach((t, i) => { if (i) { this.txt('/', tx, ty + 12); tx += 6; } ui.image('bx_t_' + t, tx, ty + 13, 9, 9);
        const [label, col] = SurvivorBestiary.types[t], tt = this.txt(label, tx + 11, ty + 12, {color:col}); tx += 11 + tt.width + 2; }); }
      else this.txt('???', idx, ty + 12);
      ty += groups[1] + spare / 3; this.txt('ATTACK:', idx, ty); this.txt(type(atk), w - 9, ty + 12, {align:'right'});
      ty += groups[2] + spare / 3; this.txt(foe ? 'STATUS:' : 'DASH:', idx, ty); this.txt(type(dash), w - 9, ty + 12, {align:'right'});
      // HP and where to find it.
      const recipe = SurvivorEvolution.recipes.find(v => v.id === m.id);
      const hp = m.kind === 'fusion' ? '+' + recipe.hp : m.hp, found = m.kind === 'fusion' ? 'FUSION ONLY' : m.when || 'WOODS/DESERT';
      this.txt('HP ' + (known ? hp : '???'), 9, line); this.txt('FOUND: ' + (known ? found : '???'), w - 9, line, {align:'right'});
      // Bottom stack, built upwards: records (phone, mastered), bonus line, chain, then the DEX box takes the rest.
      const rs = B.recipes(m.id), pick = (this.picks[m.id] || 0) % Math.max(1, rs.length), rc = rs[pick];
      let bottom = h - 8;
      const rec = B.data.c[m.id] || {}, f = B.data.f[m.id] || {};
      if (P && st === 3) { ui.image('bx_star', 9, bottom - 9, 7, 7);
        this.txt(foe ? 'DEFEATED ' + (f.defeated || 0) : `CAUGHT ${rec.caught || 0}  WINS ${rec.wins || 0}  BEST ${rec.best || 0}`, 21, bottom - 11); bottom -= 15; }
      const chainH = 44; let chainY = bottom - chainH;
      const showChain = known && !foe && rc;
      if (showChain) {
        const rk = B.caught(rc.id), ready = B.ready(rc);
        const bonus = rk ? `+${rc.hp} HP. ${E().find(e => e.id === rc.id).bonus.toUpperCase()}` : ready ? 'MERGE THEM IN A RUN' : 'FIND BOTH PARENTS';
        chainY = bottom - 11 - 4 - chainH;
        if (ready && !rk) { ui.rect(9, bottom - 11, 34, 11, PAL.accent); this.txt('READY', 11, bottom - 11, {color:PAL.onAccent}); this.txt(bonus, 47, bottom - 11); }
        else this.txt(bonus, 9, bottom - 11);
        if (rs.length > 1) { this.txt(`${pick + 1}/${rs.length}`, w - 18, bottom - 11, {align:'right'}); ui.image('bx_tri', w - 15, bottom - 9, 5, 7);
          ui.hitArea(w - 42, bottom - 13, 34, 14, () => { this.picks[m.id] = pick + 1; }, 'recipe:' + (o.slot ?? 0)); }
        this.chain(m, rc, 9, chainY, w - 18, now, o.slot ?? 0);
      } else if (!known) { const cg = ui.graphics(); this.dbl(cg, 9, chainY, 44, 44); this.txt('?', 31, chainY + 13, {size:18, align:'center'}); this.txt('???', 61, chainY + 17); }
      else if (foe) this.txt('CANNOT BE CAPTURED', w / 2, chainY + 17, {align:'center'});
      else { const cg = ui.graphics(); this.dbl(cg, 9, chainY, 44, 44); ui.image('face_' + m.id, 12, chainY + 3, 38, 38); this.txt('NO FUSION FOUND YET', 61, chainY + 17); }
      // DEX box with its legend on the top rule.
      const dexTop = line + 14, dexH = chainY - 4 - dexTop, dg = ui.graphics();
      dg.fillStyle(PAL.rule).fillRect(9, dexTop + 4, w - 18, dexH - 4).fillStyle(PAL.paper).fillRect(10, dexTop + 5, w - 20, dexH - 6)
        .fillStyle(PAL.rule).fillRect(11, dexTop + 6, w - 22, dexH - 8).fillStyle(PAL.paper).fillRect(12, dexTop + 7, w - 24, dexH - 10).fillRect(13, dexTop, 30, 9);
      this.txt('DEX:', 16, dexTop - 1);
      const dex = !known ? 'No data. Find it in the field.' : !own ? (foe ? 'Defeat one to learn more.' : 'Capture one to learn more.')
        : m.dex + (P ? '\n\nIN BATTLE: ' + m.atk[1] : '') + (P ? '\n\n' : '\n') + (st === 3 ? 'NOTE: ' + m.note : 'MASTERY: ' + B.goal(m.id));
      this.txt(type(dex), 16, dexTop + 8, {wrap:w - 32}).setOrigin(0, 0).setLineSpacing(-1); // 11px lines, as in the mock-up
      // Selected-page ribbon on the open binder.
      if (o.ribbon) ui.graphics().fillStyle(PAL.accent).fillPoints([{x:w - 34, y:h - 3}, {x:w - 26, y:h - 3}, {x:w - 26, y:h + 9}, {x:w - 30, y:h + 5}, {x:w - 34, y:h + 9}], true);
      this.revealFx(m, w, h, P, now, {ps, fs, dexTop, dexH, slot:o.slot ?? 0});
    }
    chain(m, rc, x, y, W, now, slot) {
      const s = this.s, ui = s.ui, B = s.bestiary, [a, b] = rc.parents, rk = B.caught(rc.id), link = (W - 132) / 2;
      const boxes = [[a, x], [b, x + 44 + link], [rk ? rc.id : null, x + 88 + 2 * link]];
      const g = ui.graphics();
      for (const [i, lx] of [[0, x + 44], [1, x + 88 + link]]) { g.fillStyle(PAL.rule).fillRect(lx, y + 20, link, 5).fillStyle(PAL.paper).fillRect(lx, y + 21, link, 3);
        g.fillStyle(PAL.paper).fillRect(lx + link / 2 - 5, y + 17, 10, 11); this.txt(i ? '=' : '+', lx + link / 2, y + 17, {align:'center'}); }
      boxes.forEach(([id, bx], i) => {
        this.dbl(g, bx, y, 44, 44);
        const e = id && E().find(v => v.id === id), st = e ? B.state(id) : 0;
        if (e && st >= 1) { this.face(e, bx + 3, y + 3, 38, st); ui.hitArea(bx, y, 44, 44, () => this.pick(id), `chain:${slot}:${i}`); }
        else this.txt('?', bx + 22, y + 13, {size:18, align:'center'});
        if (id === m.id) this.bracket(ui.graphics(), bx, y, 44, 44, PAL.rule);
      });
      // Ready to fuse: the recipe circle loops around the ? box.
      if (!rk && B.ready(rc)) this.fxFrame('Recipe_Discovered', boxes[2][1] + 22, y + 22, now, {loop:true});
    }
    bracket(g, x, y, w, h, col) {
      g.fillStyle(col);
      for (const [cx, cy, dx, dy] of [[x - 4, y - 4, 1, 1], [x + w + 4, y - 4, -1, 1], [x - 4, y + h + 4, 1, -1], [x + w + 4, y + h + 4, -1, -1]]) {
        g.fillRect(dx > 0 ? cx : cx - 6, dy > 0 ? cy : cy - 2, 6, 2); g.fillRect(dx > 0 ? cx : cx - 2, dy > 0 ? cy : cy - 6, 2, 6);
      }
    }
    trace(g, pts, k) {
      const seg = pts.map((p, i) => [p, pts[(i + 1) % pts.length]]), total = seg.reduce((n, [p, q]) => n + Math.hypot(q.x - p.x, q.y - p.y), 0);
      let left = total * k; g.lineStyle(3, PAL.gild);
      for (const [p, q] of seg) { const L = Math.hypot(q.x - p.x, q.y - p.y); if (left <= 0) break; const f = Math.min(1, left / L);
        g.lineBetween(p.x, p.y, p.x + (q.x - p.x) * f, p.y + (q.y - p.y) * f); left -= L; }
    }
    // Reveal effects drawn over the page, all computed from the reveal's start time.
    revealFx(m, w, h, P, now, {ps, fs, dexTop, dexH}) {
      const s = this.s, ui = s.ui, r = this.reveals[m.id], red = s.juice.reduced; if (!r) return;
      const t = now - r.at, capt = r.to >= 2 && r.from < 2, cx = 9 + ps / 2, cy = 28 + ps / 2;
      if (capt) {
        if (!red && t >= 520) this.fxFrame('Unlock_Fill', cx, cy, t - 520, {scale:2});
        const word = SurvivorBestiary.isFoe(m) ? STAMP.foe : m.kind === 'fusion' ? STAMP.fusion : STAMP.caught;
        const st0 = red ? 0 : 790, k = clamp((t - st0) / 160, 0, 1), fade = clamp((t - 2200) / 300, 0, 1);
        if (t >= st0 && fade < 1) {
          const sg = ui.beginGroup('stamp', {x:w / 2, y:dexTop + dexH / 2}); sg.setRotation(-0.14 - (red ? 0 : .17 * (1 - k))).setScale(red ? 1 : 2.4 - 1.4 * Math.floor(k * 4) / 4).setAlpha((red ? 1 : Math.floor(k * 4) / 4) * (1 - fade));
          const tw = word.length * 12.8 + 16, g = ui.graphics();
          g.fillStyle(PAL.paper, .85).fillRect(-tw / 2, -14, tw, 28).lineStyle(1, PAL.rule).strokeRect(-tw / 2, -14, tw, 28).strokeRect(-tw / 2 + 2, -12, tw - 4, 24);
          this.txt(word, 0, -9, {size:18, align:'center'}); ui.endGroup();
          if (!red) { this.fxFrame('Damage_Crit', w / 2 - tw / 2, dexTop + dexH / 2 - 10, t - st0 - 150, {scale:2}); this.fxFrame('Damage_Crit', w / 2 + tw / 2, dexTop + dexH / 2 + 8, t - st0 - 150, {scale:2}); }
        }
      }
      if (r.to === 3 && !red) {
        const t3 = t - (capt ? 1600 : 0) - 460; if (t3 < 0) return;
        for (const [i, [x, y]] of [[2, 2], [w - 2, 14], [w - 2, h - 2], [2, h - 2]].entries()) this.fxFrame('Reward_Trail', x, y, t3 - i * 60, {scale:2});
        // Sheen across the portrait, cropped to the portrait like on pack cards.
        const ts = t3 - 120; if (ts >= 0 && ts < 420) { const sx = -24 + (fs + 24) * easeIn(ts / 420) * 1.0, left = 9 + (ps - fs) / 2, top = 28 + (ps - fs) / 2;
          this.fxFrame('Pack_Sheen', left + Math.max(0, sx), top, ts, {loop:true, crop:rr => { const x0 = Math.max(0, -sx), x1 = Math.min(24, fs - sx); return x1 > x0 ? [rr[0] + x0, rr[1], x1 - x0, Math.min(85, fs)] : null; }}); }
        const tb = t3 - 140; if (tb >= 0 && tb < 1800) { const k = easeOut(clamp(tb / 240, 0, 1)), fade = clamp((tb - 1500) / 300, 0, 1), bw = 70;
          const bg = ui.beginGroup('ribbon', {x:cx, y:28 + ps - 6}); bg.setScale(k).setAlpha(1 - fade);
          ui.graphics().fillStyle(PAL.gild).fillPoints([{x:-bw / 2, y:-7}, {x:bw / 2, y:-7}, {x:bw / 2 - 4, y:0}, {x:bw / 2, y:7}, {x:-bw / 2, y:7}, {x:-bw / 2 + 4, y:0}], true);
          ui.image('bx_starW', -bw / 2 + 7, -4, 7, 7); s.ui.darkText('MASTERED', 4, 0, {align:'center'}); ui.endGroup(); }
      }
    }
    // ------------------------------------------------------------------ screen
    draw(w, h) {
      const s = this.s, ui = s.ui, j = s.juice, now = j.now(), red = j.reduced, P = h > w, F = P ? FRAMES.phone : FRAMES.desktop;
      const ox = P ? 0 : Math.round((w - F.w) / 2), oy = P ? 0 : Math.round((h - F.h) / 2), shown = this.shown(P);
      ui.rect(0, 0, w, h, '#0b0710c0'); ui.hitArea(0, 0, w, h, () => {}, 'modal-blocker');
      ui.beginGroup('binder', {x:ox, y:oy});
      ui.image('bx_cover_' + (P ? 'phone' : 'desktop'), 0, 0, F.w, F.h);
      const tOpen = red ? 1e9 : now - this.openAt, openDur = P ? 560 : 680, opening = tOpen < openDur;
      const turning = this.turn && now - this.turn.at < 2 * HALF;
      if (!this.turn || !turning) this.turn = null;
      const pageDraw = (slot, m, b, extra = {}) => { const [x, y, pw, ph] = b, rv = this.reveals[m.id], ts = rv ? now - rv.at - 940 : -1;
        const jolt = !red && !extra.static && rv && rv.to >= 2 && rv.from < 2 && ts >= 0 && ts < 160 ? [1, -1, 1, 0][Math.floor(ts / 40)] : 0;
        const g = ui.beginGroup('pg:' + slot, {x:x + jolt, y});
        if (extra.sx != null) { g.setScale(Math.max(.001, extra.sx), 1); if (extra.right) g.x = x + pw * (1 - extra.sx); }
        const chars = extra.static ? Infinity : Math.floor((now - (this.shownAt[m.id] ?? -1e9)) / CHAR_MS);
        this.pageContent(m, pw, ph, P, now, {slot, chars, ribbon:extra.ribbon, state:extra.state});
        if (extra.dark) ui.rect(0, 0, pw, ph, '#000000' + Math.round(extra.dark * 255).toString(16).padStart(2, '0'));
        ui.endGroup(); return g; };
      const shade = (b, side, a) => { if (a <= 0) return; const [x, y, pw, ph] = b, g = ui.graphics();
        if (side === 'r') g.fillGradientStyle(0, 0, 0, 0, a, 0, a, 0).fillRect(x, y, pw * .75, ph);
        else g.fillGradientStyle(0, 0, 0, 0, 0, a, 0, a).fillRect(x + pw * .25, y, pw * .75, ph); };
      if (opening) {
        // Closed binder: the cover holds, then turns over like one page and the first page lands on its back.
        const cv = P ? F.pages[0] : F.pages[1];
        if (P) pageDraw(0, shown[0], F.pages[0], {static:true});
        else { pageDraw(1, shown[1], F.pages[1], {static:true});
          const k2 = clamp((tOpen - 300 - HALF) / HALF, 0, 1); if (k2 > 0) { shade(F.pages[0], 'l', .5 * (1 - k2)); pageDraw(0, shown[0], F.pages[0], {static:true, sx:Math.cos((1 - easeOut(k2)) * Math.PI / 2), right:true, dark:.18 * (1 - k2)}); } }
        const k1 = clamp((tOpen - 300) / (P ? 260 : HALF), 0, 1), sx = Math.cos(easeIn(k1) * Math.PI / 2), bob = tOpen < 300 ? Math.round(-4 * (1 - tOpen / 300)) : 0;
        if (k1 < 1) this.cover(cv, sx, bob, P);
      } else if (turning) {
        const t = now - this.turn.at, {dir, from, to} = this.turn, [lp, rp] = F.pages;
        if (P) { pageDraw(0, to[0], F.pages[0], {static:true}); const k = clamp(t / 170, 0, 1);
          if (k < 1) { const [x, y, pw, ph] = F.pages[0], g = ui.beginGroup('sheet', {x, y}); g.setScale(Math.max(.001, Math.cos(easeIn(k) * Math.PI / 2)), 1);
            ui.graphics().fillStyle(PAL.paper).fillPoints(this.outline(pw, ph), true).lineStyle(2, PAL.rule).strokePoints(this.outline(pw, ph), true); ui.rect(0, 0, pw, ph, '#000000' + Math.round(k * 50).toString(16).padStart(2, '0')); ui.endGroup();
            this.fxFrame('Pack_Flip', x + pw - 6, y + 14, t); } }
        else {
          const k1 = clamp(t / HALF, 0, 1), k2 = clamp((t - HALF) / HALF, 0, 1), fwd = dir > 0;
          // Underneath: the page the sheet will cover stays until it lands; the page it reveals starts in shadow.
          pageDraw(0, fwd ? from[0] : to[0], lp, {static:true}); pageDraw(1, fwd ? to[1] : from[1], rp, {static:true});
          shade(fwd ? rp : lp, fwd ? 'r' : 'l', .6 * (1 - k1));
          if (k2 > 0) shade(fwd ? lp : rp, fwd ? 'l' : 'r', .5 * k2);
          if (k1 < 1) pageDraw(2, fwd ? from[1] : from[0], fwd ? rp : lp, {static:true, sx:Math.cos(easeIn(k1) * Math.PI / 2), right:!fwd, dark:.18 * k1});
          else pageDraw(3, fwd ? to[0] : to[1], fwd ? lp : rp, {static:true, sx:Math.cos((1 - easeOut(k2)) * Math.PI / 2), right:fwd, dark:.18 * (1 - k2)});
        }
      } else {
        const key = this.key(this.sel, P) + (P ? 'p' : 'd');
        if (this.shownKey !== key) { this.shownKey = key; this.arrive(now); }
        shown.forEach((m, k) => pageDraw(k, m, F.pages[k], {ribbon:!P && k === (this.sel % 2)}));
        // Captured: sparkles fly from the portrait to the strip icon once.
        for (const m of shown) { const r = this.reveals[m.id]; if (r && r.to >= 2 && r.from < 2 && !this.flown.has(m.id) && now - r.at > 1000) { this.flown.add(m.id); this.fly(m, P, F, ox, oy, shown.indexOf(m)); } }
        // Cry: a ring pops on the portrait and three notes rise.
        shown.forEach((m, k) => { const c = now - (this.cryAt[m.id] ?? -1e9), [x, y] = F.pages[k], ps = P ? 120 : 84, cx = x + 9 + ps / 2, cy = y + 28 + ps / 2;
          if (c < 700 && s.bestiary.state(m.id) >= 2) { this.fxFrame('Slot_PowerUp', cx, cy, c, {scale:3});
            for (let i = 0; i < 3; i++) { const tn = c - i * 90; if (tn < 0 || tn > 600) continue; const kk = tn / 600;
              ui.image('bx_note', cx - ps / 4 + i * ps / 4 + (i - 1) * 6 * kk - 2, cy - ps / 2 + 6 - 26 * kk, 5, 7, {alpha:1 - kk}); } } });
      }
      this.strip(P, F, now, red ? 1e9 : tOpen - 400, shown);
      ui.endGroup();
      this.layout = {frame:P ? 'phone' : 'desktop', ox, oy, sel:E()[this.sel].id, shown:shown.map(m => m.id), turning:!!turning, opening,
        reveals:Object.keys(this.reveals), pages:shown.map((m, k) => { const [x, y, pw, ph] = F.pages[k]; return {id:m.id, state:s.bestiary.state(m.id), x:x + ox, y:y + oy, w:pw, h:ph}; }),
        ...this.stripLayout};
      for (const k of Object.keys(this.stripLayout)) { const v = this.layout[k]; if (Array.isArray(v) && typeof v[0] === 'number') this.layout[k] = [v[0] + ox, v[1] + oy, v[2], v[3]]; }
      this.layout.thumbs = this.layout.thumbs.map(t => ({...t, x:t.x + ox, y:t.y + oy}));
    }
    cover([x, y, pw, ph], sx, bob, P) {
      const ui = this.s.ui, c = this.s.bestiary.counts(), g0 = ui.beginGroup('cover', {x:x - 2, y:y - 2 + bob}); g0.setScale(Math.max(.001, sx), 1);
      const W = pw + 4, H = ph + 4;
      ui.image('bx_cover_' + (P ? 'phone' : 'desktop'), 0, 0, W, H, {frame:P ? [16, 4, W, H] : [248, 6, W, H]});
      const g = ui.graphics(); g.lineStyle(2, 0x7d5c2c).strokeRect(1, 1, W - 2, H - 2).lineStyle(2, 0xa8803f).strokeRect(4, 4, W - 8, H - 8);
      for (const [cx, cy] of [[7, 7], [W - 19, 7], [7, H - 19], [W - 19, H - 19]]) g.fillStyle(0x3a2812).fillRect(cx, cy, 12, 12).fillStyle(0x6a4a26).fillRect(cx + 1, cy + 1, 10, 10);
      const py = H / 2 - 40; g.lineStyle(1, PAL.rule).strokeRect(W / 2 - 52, py, 104, 50).strokeRect(W / 2 - 50, py + 2, 100, 46);
      this.txt('FIELD', W / 2, py + 7, {size:18, align:'center'}); this.txt('BINDER', W / 2, py + 25, {size:18, align:'center'});
      this.txt('SCROLLMONSTERS', W / 2, py + 62, {align:'center'}); this.txt(`${c.own}/${c.total} CAUGHT`, W / 2, py + 76, {align:'center'});
      if (sx < 1) ui.rect(0, 0, W, H, '#000000' + Math.round((1 - sx) * 90).toString(16).padStart(2, '0'));
      ui.endGroup();
    }
    fly(m, P, F, ox, oy, k) {
      const t = this.stripLayout?.thumbs?.find(v => v.id === m.id); if (!t) return;
      const [x, y] = F.pages[k], ps = P ? 120 : 84, from = {x:ox + x + 9 + ps / 2, y:oy + y + 28 + ps / 2}, to = {x:ox + t.x + 9, y:oy + t.y + 9};
      for (let i = 0; i < 3; i++) this.s.time.delayedCall(i * 60, () => this.s.juice.flyTo('Reward_Trail', {x:from.x + (i - 1) * 12, y:from.y}, to, {size:8}));
    }
    // Strip: arrows, every entry as a 16px icon, a bracket that slides to the open page(s), counts and Back.
    strip(P, F, now, popT, shown) {
      const s = this.s, ui = s.ui, [sx, sy, sw, sh] = F.strip, list = E(), n = list.length, B = s.bestiary;
      const arrow = (x, key, act, id) => { const g = ui.graphics(); g.fillStyle(PAL.rule).fillRect(x, sy + 3, 20, 20).fillStyle(PAL.paper).fillRect(x + 2, sy + 5, 16, 16);
        ui.image(key, x + 8, sy + 9, 5, 7); ui.hitArea(x, sy + 3, 20, 20, act, id); return [x, sy + 3, 20, 20]; };
      const lay = {thumbs:[]};
      lay.prev = arrow(sx, 'bx_triL', () => this.step(-1), 'binder-prev');
      const vis = P ? 8 : n, first = P ? clamp(this.sel - 3, 0, n - vis) : 0, tx0 = sx + 24, nextX = P ? tx0 + vis * 20 + 2 : tx0 + n * 20 + 2;
      for (let i = first; i < first + vis; i++) {
        const e = list[i], x = tx0 + (i - first) * 20, y = sy + 4, st = B.state(e.id), pop = popT < 1e8 ? easeOut(clamp((popT - i * 25) / 200, 0, 1)) : 1;
        if (pop <= 0) continue;
        const g = ui.beginGroup('thumb:' + (i - first), {x:x + 9, y:y + 9}); g.setScale(pop);
        ui.graphics().fillStyle(PAL.rule).fillRect(-9, -9, 18, 18).fillStyle(e.kind === 'fusion' ? PAL.thumbFusion : SurvivorBestiary.isFoe(e) ? PAL.thumbFoe : PAL.thumb).fillRect(-8, -8, 16, 16);
        if (st >= 1) ui.image((st === 1 ? 'bx_minis_' : 'bx_mini_') + e.id, -8, -8, 16, 16); else this.txt('?', 0, -6, {align:'center'});
        ui.endGroup();
        ui.hitArea(x, y, 18, 18, () => this.pick(e.id), 'thumb:' + e.id);
        lay.thumbs.push({id:e.id, x, y, w:18, h:18, state:st});
      }
      // The bracket slides 150ms between positions, as on the title screen.
      const i0 = list.indexOf(shown[0]), target = tx0 + (i0 - first) * 20, width = shown.length * 20 - 2;
      if (!this.br || this.br.to !== target) this.br = {from:this.br ? this.br.x ?? target : target, to:target, at:now};
      const kb = s.juice.reduced ? 1 : easeOut(clamp((now - this.br.at) / 150, 0, 1)); this.br.x = this.br.from + (this.br.to - this.br.from) * kb;
      this.bracket(ui.graphics(), this.br.x, sy + 4, width, 18, PAL.rule);
      lay.next = arrow(nextX, 'bx_tri', () => this.step(1), 'binder-next');
      const bx = nextX + 24, bw = sx + sw - bx;
      if (!P) { const c = B.counts(); ui.darkText(`OWN ${c.own}/${c.total}`, bx + bw / 2, sy + 4, {align:'center'}); }
      ui.pill('Back', bx, P ? sy + 4 : sy + 10, bw, P ? 18 : 16, () => s.closeBestiary(), {id:'bestiary-back'});
      lay.back = [bx, P ? sy + 4 : sy + 10, bw, P ? 18 : 16];
      this.stripLayout = lay;
    }
  }
  window.SurvivorBinder = SurvivorBinder;
})();
