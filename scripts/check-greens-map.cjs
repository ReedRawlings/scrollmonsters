const assert = require('node:assert/strict');
const G = require('../survivor-map.js');

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const flat = m => JSON.stringify(m, (k, v) => v instanceof Uint8Array ? Array.from(v) : v);
const grassAt = (m, p) => m.grid[Math.floor(p.y / m.cell) * m.size + Math.floor(p.x / m.cell)] === 1;
const styles = new Set();

for (let seed = 1; seed <= 200; seed++) {
  const m = G.generate(seed * 7919);
  assert.equal(flat(m), flat(G.generate(seed * 7919)), `seed ${seed} is not deterministic`);
  styles.add(m.info.paths);

  // Every one of the 16 dual-grid tiles resolves for every display cell.
  for (let j = 0; j <= m.size; j++) for (let i = 0; i <= m.size; i++) assert(Number.isInteger(G.tileAt(m, i, j)), `seed ${seed} tile ${i},${j}`);

  assert.equal(m.dens.length, 4, `seed ${seed} dens`);
  for (const [i, d] of m.dens.entries()) {
    assert(grassAt(m, d), `seed ${seed} den ${i} on dirt`);
    assert(dist(d, G.SPAWN) >= 300, `seed ${seed} den ${i} too close to spawn`);
    assert(dist(d, m.shrine) >= 180, `seed ${seed} den ${i} too close to shrine`);
    for (const o of m.dens.slice(i + 1)) assert(dist(d, o) > 320, `seed ${seed} dens too close`);
  }
  assert(grassAt(m, m.slab) && dist(m.slab, G.SPAWN) >= 380 && dist(m.slab, m.shrine) >= 280, `seed ${seed} slab placement`);
  assert(m.treasure.revealAt >= 170 && m.treasure.revealAt <= 420 && ['xp', 'relic'].includes(m.treasure.reward), `seed ${seed} treasure`);

  assert(m.blockers.length >= 16 && m.blockers.length <= 24, `seed ${seed} has ${m.blockers.length} blockers`);
  const solids = [...m.blockers, ...m.breakables, ...(m.scarecrow ? [m.scarecrow] : [])];
  for (const s of solids) {
    assert(grassAt(m, s), `seed ${seed} ${s.kind} on dirt`);
    assert(dist(s, G.SPAWN) > 150 && dist(s, m.shrine) > 130 && dist(s, m.slab) > 130, `seed ${seed} ${s.kind} crowds a key spot`);
    for (const d of m.dens) assert(dist(s, d) > 80, `seed ${seed} ${s.kind} crowds a den`);
  }
  assert(m.breakables.length >= 2, `seed ${seed} has ${m.breakables.length} breakables`);

  // Reachability: flood the world on a 16px grid, treating solids (plus player radius) as walls.
  const step = 16, n = Math.ceil(G.WORLD / step), wall = new Uint8Array(n * n);
  for (const s of solids) for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (Math.hypot(x * step + 8 - s.x, y * step + 8 - s.y) < s.r + 12) wall[y * n + x] = 1;
  const seen = new Uint8Array(n * n), q = [Math.floor(G.SPAWN.y / step) * n + Math.floor(G.SPAWN.x / step)]; seen[q[0]] = 1;
  while (q.length) { const c = q.pop(), x = c % n, y = (c - x) / n; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy, k = Y * n + X; if (X >= 1 && Y >= 1 && X < n - 1 && Y < n - 1 && !seen[k] && !wall[k]) { seen[k] = 1; q.push(k); } } }
  for (const p of [m.slab, ...m.dens]) {
    const near = [[0, 90], [0, -90], [90, 0], [-90, 0]].some(([dx, dy]) => seen[Math.floor((p.y + dy) / step) * n + Math.floor((p.x + dx) / step)]);
    assert(near, `seed ${seed} cannot reach ${p === m.slab ? 'slab' : 'den'}`);
  }
}
assert.deepEqual([...styles].sort(), ['chain', 'hub', 'none', 'pair'], 'all path structures appear across seeds');
console.log('greens map: 200 seeds ok');
