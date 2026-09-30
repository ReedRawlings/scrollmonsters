(() => {
  'use strict';
  // Procedural Greens field. Pure data, no Phaser, so Node checks can run it for any seed.
  // Exact 4500-unit repeating field; cells preserve approximately 2x pixel-art scale.
  const WORLD = 4500, N = 141, CELL = WORLD / N;
  const SPAWN = {x: WORLD / 2, y: WORLD / 2};

  // Dual-grid lookup: corner pattern TL,TR,BL,BR (1 = grass) -> tile index in tilemap.png (4x4, row-major).
  const LAYOUT = ['GGDD GDDD DGDG GGGD', 'DDGD DDDD DGDD GDDG', 'GDGD DDDG DDGG DGGG', 'GDGG DGGD GGDG GGGG'];
  const TILE = {};
  LAYOUT.forEach((line, r) => line.split(' ').forEach((key, c) => { TILE[key.replace(/G/g, '1').replace(/D/g, '0')] = r * 4 + c; }));

  // Collision radius (world px) per solid kind. Blockers are permanent; breakables clear when smashed.
  const BLOCKERS = {rock: 12, vine: 10, wheelbarrow: 44, wheel: 44};
  const BREAKABLES = {barrel: 13, crate: 13, bucket: 11, weedA: 12, weedB: 12, weedC: 12, weedD: 12};
  const DECALS = ['pebble', 'stake', 'sprout', 'mushroom', 'pebbles', 'tulipPink', 'tulipBlue', 'bellBlue',
    'leaf', 'shoot', 'mushroomFlat', 'twig', 'tulipOrange', 'blossomPink', 'twigCurl', 'flowerOrange', 'vineShort'];
  const FLOWERS = ['tulipPink', 'tulipBlue', 'bellBlue', 'tulipOrange', 'blossomPink', 'flowerOrange'];

  function rng(seed) {
    let a = seed >>> 0;
    return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  // Two rotated octaves of value noise so dirt patches don't line up with the grid.
  function noise(rand, scale) {
    const octave = sc => {
      const size = 64, g = Array.from({length: size * size}, rand), ang = rand() * Math.PI, ca = Math.cos(ang), sa = Math.sin(ang), ox = rand() * size, oy = rand() * size;
      const v = (i, j) => g[((j % size + size) % size) * size + ((i % size + size) % size)];
      return (x, y) => {
        const gx = (x * ca - y * sa) / sc + ox, gy = (x * sa + y * ca) / sc + oy, x0 = Math.floor(gx), y0 = Math.floor(gy);
        let tx = gx - x0, ty = gy - y0; tx = tx * tx * (3 - 2 * tx); ty = ty * ty * (3 - 2 * ty);
        const a = v(x0, y0) + (v(x0 + 1, y0) - v(x0, y0)) * tx, b = v(x0, y0 + 1) + (v(x0 + 1, y0 + 1) - v(x0, y0 + 1)) * tx;
        return a + (b - a) * ty;
      };
    };
    const o1 = octave(scale), o2 = octave(scale / 2.3);
    return (x, y) => .7 * o1(x, y) + .3 * o2(x, y);
  }

  function generate(seed, view={width:960,height:960}) {
    const rand = rng(seed ^ 0x9E3779B9), range = (a, b) => a + rand() * (b - a), int = (a, b) => Math.floor(range(a, b + 1)), pick = list => list[Math.floor(rand() * list.length)];
    const grid = new Uint8Array(N * N).fill(1), at = (x, y) => grid[y * N + x];
    const set = (x, y, v) => { if (x >= 0 && y >= 0 && x < N && y < N) grid[y * N + x] = v; };

    // 1. Landmarks first (cell units) so paths can lead to them.
    const c = N / 2;
    let shrineCell;
    do {shrineCell={x:range(8,N-8),y:range(8,N-8)};} while(dist(shrineCell,{x:c,y:c})<12);
    const shrine={x:shrineCell.x*CELL,y:shrineCell.y*CELL};
    const apart=(a,b)=>{const dx=Math.min(Math.abs(a.x-b.x),N-Math.abs(a.x-b.x))*CELL,dy=Math.min(Math.abs(a.y-b.y),N-Math.abs(a.y-b.y))*CELL;return dx>view.width+140||dy>view.height+140;};
    let slab = null;
    while (!slab) { const p = {x: range(9, N - 9), y: range(9, N - 9)}; if (dist(p, {x: c, y: c}) > 14 && dist(p, shrineCell) > 12) slab = p; }
    const dens = [];
    for (let i = 0; i < 600 && dens.length < 4; i++) {
      const p = {x: range(5, N - 5), y: range(5, N - 5)};
      if (dist(p, {x: c, y: c}) > 9.5 && dist(p, shrineCell) > 6 && dist(p, slab) > 11 && dens.every(d => apart(d,p))) dens.push(p);
    }

    // 2. Scattered dirt patches; density and size vary per run.
    const f = noise(rand, range(7, 14)), cut = range(.62, .76);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (f(x, y) > cut) set(x, y, 0);

    const blob = (cx, cy, r) => {
      const g = noise(rand, 5);
      for (let y = Math.floor(cy - r * 1.6); y <= cy + r * 1.6; y++) for (let x = Math.floor(cx - r * 1.6); x <= cx + r * 1.6; x++)
        if (Math.hypot(x - cx, y - cy) / r + (g(x, y) - .5) * .9 < 1) set(x, y, 0);
    };
    const carve = (a, b, width, stop = 2.5, wobble = .3) => {
      let x = a.x, y = a.y, ang = Math.atan2(b.y - y, b.x - x) + range(-.6, .6); const walked = [];
      for (let i = 0; i < 500; i++) {
        const want = Math.atan2(b.y - y, b.x - x), turn = ((want - ang + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
        ang += Math.max(-.25, Math.min(.25, turn)) + range(-wobble, wobble); x += Math.cos(ang); y += Math.sin(ang); walked.push({x, y});
        for (let dy = -width; dy <= width; dy++) for (let dx = -width; dx <= width; dx++) if (dx * dx + dy * dy <= width * width + 1) set(Math.floor(x) + dx, Math.floor(y) + dy, 0);
        if (Math.hypot(b.x - x, b.y - y) < stop) break;
      }
      return walked;
    };
    const edge = () => { const t = int(6, N - 7); return [{x: t, y: -1}, {x: N, y: t}, {x: t, y: N}, {x: -1, y: t}][int(0, 3)]; };
    const weighted = pairs => { let r = rand() * pairs.reduce((s, p) => s + p[1], 0); for (const [v, w] of pairs) if ((r -= w) < 0) return v; return pairs[0][0]; };

    // 3. Clearings: 0-2, anywhere, any size.
    const clearings = weighted([[0, 4], [1, 4], [2, 2]]);
    for (let i = 0; i < clearings; i++) blob(range(10, N - 10), range(10, N - 10), range(4, 9));

    // 4. One path structure, leading to landmarks.
    const targets = [slab, ...dens].map(p => ({...p}));
    for (let i = targets.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [targets[i], targets[j]] = [targets[j], targets[i]]; }
    const paths = weighted([['none', 2], ['chain', 4], ['hub', 3], ['pair', 2]]), width = () => pick([1, 1, 2]);
    let walked = [];
    if (paths === 'chain') {
      const pts = [edge(), ...targets.slice(0, int(1, 2))]; if (rand() < .7) pts.push(edge());
      const w = width(); for (let i = 1; i < pts.length; i++) walked = walked.concat(carve(pts[i - 1], pts[i], w));
    } else if (paths === 'hub') {
      const hub = {x: range(12, N - 12), y: range(12, N - 12)}, ends = targets.slice(0, int(2, 3));
      if (rand() < .5) ends[ends.length - 1] = edge();
      for (const e of ends) walked = walked.concat(carve(hub, e, width()));
      blob(hub.x, hub.y, range(2.5, 4));
    } else if (paths === 'pair') {
      for (const t of targets.slice(0, 2)) walked = walked.concat(carve(edge(), t, width()));
    }
    // 5. Dead-end spurs off the paths.
    const spurs = walked.length ? int(0, 2) : 0;
    for (let i = 0; i < spurs; i++) { const s = pick(walked), a = range(0, Math.PI * 2), l = range(5, 12); carve(s, {x: s.x + Math.cos(a) * l, y: s.y + Math.sin(a) * l}, 1, 1.5, .4); }

    // 6. Grass pads under landmarks, then drop lone specks so edges read as shapes.
    for (const [p, r] of [[slab, 7.5], ...dens.map(d => [d, 3.5])])
      for (let y = Math.floor(p.y - r) - 1; y <= p.y + r + 1; y++) for (let x = Math.floor(p.x - r) - 1; x <= p.x + r + 1; x++)
        if (Math.hypot(x + .5 - p.x, y + .5 - p.y) <= r) set(x, y, 1);
    for (let pass = 0; pass < 2; pass++) for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const v = at(x, y), cl = (i, j) => at(Math.min(N - 1, Math.max(0, i)), Math.min(N - 1, Math.max(0, j)));
      if ((cl(x + 1, y) === v) + (cl(x - 1, y) === v) + (cl(x, y + 1) === v) + (cl(x, y - 1) === v) <= 1) grid[y * N + x] = v ^ 1;
    }

    // Props, in world px. Solid things sit on grass and keep clear of each other and of the key spots.
    const world = p => ({x: p.x * CELL, y: p.y * CELL});
    const out = {seed, shrine, grid, size: N, cell: CELL, info: {paths, clearings, spurs}, dens: dens.map(world), slab: world(slab),
      treasure: {revealAt: Math.round(range(170, 420)), reward: rand() < .5 ? 'xp' : 'relic'}, blockers: [], breakables: [], decals: [], scarecrow: null};
    const solid = [{...SPAWN, r: 150}, {...shrine, r: 130}, {...out.slab, r: 250}, ...out.dens.map(d => ({...d, r: 120}))];
    const grass = (x, y, r) => {
      for (let j = Math.floor((y - r) / CELL); j <= Math.floor((y + r) / CELL); j++) for (let i = Math.floor((x - r) / CELL); i <= Math.floor((x + r) / CELL); i++)
        if (i < 0 || j < 0 || i >= N || j >= N || !at(i, j)) return false;
      return true;
    };
    const place = (r, gap = 14, margin = 60, extra = () => true) => {
      for (let i = 0; i < 300; i++) {
        const p = {x: range(margin, WORLD - margin), y: range(margin, WORLD - margin)};
        if (grass(p.x, p.y, r) && solid.every(o => dist(p, o) >= o.r + r + gap) && extra(p)) { p.r = r; solid.push(p); return p; }
      }
      return null;
    };
    const blockerCount = int(16, 24), placedBlockers = [];
    for (let i = 0; i < blockerCount; i++) {
      const kind = weighted([['rock', 4], ['vine', 3], ['wheelbarrow', 1], ['wheel', 1]]);
      const p = place(BLOCKERS[kind], 14, 60, q => placedBlockers.every(b => dist(b, q) > 150));
      if (p) { p.kind = kind; placedBlockers.push(p); out.blockers.push(p); }
    }
    const s = place(14, 14, 80); if (s) out.scarecrow = s;
    const groups = int(3, 5);
    for (let g = 0; g < groups; g++) {
      const centre = place(40, 30, 80); if (!centre) continue; solid.pop();
      const kinds = rand() < .5 ? ['barrel', 'crate', 'bucket'] : ['weedA', 'weedB', 'weedC', 'weedD'], count = int(2, 3);
      for (let k = 0, n = 0; k < 20 && n < count; k++) {
        const kind = pick(kinds), r = BREAKABLES[kind], p = {x: centre.x + range(-34, 34), y: centre.y + range(-26, 26)};
        if (grass(p.x, p.y, r) && solid.every(o => dist(p, o) >= o.r + r + 4)) { p.r = r; p.kind = kind; solid.push(p); out.breakables.push(p); n++; }
      }
    }
    // Walk-over decals: sparse, with flowers bunched in threes. They may sit on dirt.
    const clear = p => dist(p, out.slab) > 210 && out.dens.every(d => dist(d, p) > 80) && solid.every(o => dist(p, o) >= o.r + 6);
    for (let i = 0; i < 90; i++) { const p = {x: range(16, WORLD - 16), y: range(16, WORLD - 16)}; if (clear(p)) out.decals.push({...p, kind: pick(DECALS)}); }
    for (let i = 0; i < 12; i++) {
      const p = {x: range(40, WORLD - 40), y: range(40, WORLD - 40)}; if (!grass(p.x, p.y, 24)) continue;
      for (let k = 0; k < 3; k++) { const q = {x: p.x + range(-28, 28), y: p.y + range(-20, 20)}; if (clear(q)) out.decals.push({...q, kind: pick(FLOWERS)}); }
    }
    return out;
  }

  // Tile for display cell (i, j), which sits where data cells (i-1..i, j-1..j) meet. Edges wrap.
  function tileAt(map, i, j) {
    const n = map.size, g = (x, y) => map.grid[((y%n+n)%n) * n + ((x%n+n)%n)];
    return TILE['' + g(i - 1, j - 1) + g(i, j - 1) + g(i - 1, j) + g(i, j)];
  }

  const api = {generate, tileAt, CELL, N, WORLD, SPAWN, BLOCKERS, BREAKABLES};
  if (typeof module !== 'undefined') module.exports = api; else window.GreensMap = api;
})();
