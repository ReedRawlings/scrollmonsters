(() => {
  'use strict';
  // Draws and runs the procedural Greens field: dual-grid ground, props, breakables and the hidden treasure.
  const PATH = 'assets/MapAssets/Greens/', SCALE = 2;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const strip = (x, y, n, w = 32, h = 32) => Array.from({length: n}, (_, k) => [x + k * w, y, w, h]);
  // Atlas frames in garden_objects_atlas-export.png. Spikes, lever and gate are deliberately absent.
  const FRAMES = {
    chest: strip(128, 320, 5, 16, 16), bigChest: strip(0, 192, 6), scarecrow: strip(0, 128, 8),
    weedA: strip(0, 224, 4), crate: strip(128, 224, 4), weedB: strip(0, 256, 4), weedC: strip(128, 256, 4),
    bucket: strip(0, 288, 4), barrel: strip(128, 288, 4), weedD: strip(0, 320, 4),
    slab: [[160, 64, 96, 64]], wheelbarrow: [[224, 160, 32, 32]], wheel: [[192, 192, 32, 32]], rock: [[16, 368, 16, 16]], vine: [[0, 352, 16, 32]],
    pebble: [[16, 352, 16, 16]], stake: [[32, 352, 16, 16]], sprout: [[48, 352, 16, 16]], mushroom: [[64, 352, 16, 16]], pebbles: [[80, 352, 16, 16]],
    tulipPink: [[96, 352, 16, 16]], tulipBlue: [[112, 352, 16, 16]], bellBlue: [[128, 352, 16, 16]], leaf: [[32, 368, 16, 16]], shoot: [[48, 368, 16, 16]],
    mushroomFlat: [[64, 368, 16, 16]], twig: [[80, 368, 16, 16]], tulipOrange: [[96, 368, 16, 16]], blossomPink: [[112, 368, 16, 16]],
    twigCurl: [[128, 368, 16, 16]], flowerOrange: [[128, 336, 16, 16]], vineShort: [[240, 336, 16, 16]]
  };
  const DROPS = ['haste', 'shield', 'cleanse', 'magnet', 'heal', 'xp'], DROP_CHANCE = .15, PROP_HP = 6;
  // Landmarks drawn at double the ground scale.
  const BIG = new Set(['wheelbarrow', 'wheel', 'slab', 'bigChest']);

  class SurvivorGreens {
    static preload(scene) {
      scene.load.image('greensTiles', PATH + 'tilemap.png');
      scene.load.image('greensAtlas', PATH + 'garden_objects_atlas-export.png');
      scene.load.image('greensDen', PATH + 'MonsterDen.png');
    }
    static frame(scene, kind, i = 0) {
      const t = scene.textures.get('greensAtlas'), name = kind + i;
      if (!t.has(name)) t.add(name, 0, ...FRAMES[kind][i]);
      return name;
    }
    constructor(s) {
      this.s = s; this.map = GreensMap.generate(s.seed,{width:s.cameras.main.width,height:s.cameras.main.height}); this.sprites = []; this.usedDens = new Set();
      const t = this.map.treasure;
      this.treasure = {...this.map.slab, revealAt: t.revealAt, reward: t.reward, revealed: false, opened: false, openTime: 0};
      this.buildGround(); this.buildProps();
    }
    buildGround() {
      const m = this.map, n = m.size, s = this.s;
      this.tilemap = s.make.tilemap({tileWidth: 16, tileHeight: 16, width: n, height: n});
      const tiles = this.tilemap.addTilesetImage('greensTiles', 'greensTiles', 16, 16, 0, 0);
      // Display tiles sit on the corners of data cells, so the layer is offset half a cell.
      this.grounds=[];
      for(let y=-1;y<=1;y++)for(let x=-1;x<=1;x++){
        const layer=this.tilemap.createBlankLayer('ground'+x+','+y,tiles,x*s.worldSize-m.cell/2,y*s.worldSize-m.cell/2).setScale(m.cell/16).setDepth(-1000000000).setCullPadding(12,12);
        layer.loopX=x;layer.loopY=y;this.grounds.push(layer);
      }
      this.ground=this.grounds[4];
      // No per-tile flips: Phaser 4 tilemap layers draw flipped tiles incorrectly.
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) for(const layer of this.grounds)layer.putTileAt(GreensMap.tileAt(m, i, j), i, j);
    }
    positionGround(){const s=this.s,m=this.map,bx=Math.floor(s.player.x/s.worldSize)*s.worldSize,by=Math.floor(s.player.y/s.worldSize)*s.worldSize;
      for(const layer of this.grounds)layer.setPosition(bx+layer.loopX*s.worldSize-m.cell/2,by+layer.loopY*s.worldSize-m.cell/2);
    }
    sprite(kind, x, y, depth, origin = [.5, 1], i = 0) {
      const sp = this.s.add.sprite(x, y, 'greensAtlas', SurvivorGreens.frame(this.s, kind, i)).setOrigin(...origin).setScale(BIG.has(kind) ? SCALE * 2 : SCALE).setDepth(depth);
      this.sprites.push(sp); return sp;
    }
    buildProps() {
      const m = this.map, s = this.s, foot = o => o.y + o.r * .6;
      for (const d of m.decals) this.sprite(d.kind, d.x, d.y, -999999999, [.5, .5]);
      for (const b of m.blockers) { this.sprite(b.kind, b.x, foot(b), foot(b)); s.obstacles.push({x: b.x, y: b.y, r: b.r}); }
      if (m.scarecrow) { const c = m.scarecrow; this.scarecrow = this.sprite('scarecrow', c.x, foot(c) + 6, foot(c)); s.obstacles.push({x: c.x, y: c.y, r: c.r}); }
      this.props = m.breakables.map(b => {
        const e = {kind: 'prop', prop: b.kind, x: b.x, y: b.y, r: b.r, hp: PROP_HP, maxHp: PROP_HP, broken: false, shake: 0, breakTime: 0};
        e.sprite = this.sprite(b.kind, b.x, foot(b) + 8, foot(b)); e.obstacle = {x: b.x, y: b.y, r: b.r, prop: e}; s.obstacles.push(e.obstacle);
        return e;
      });
      const t = this.treasure;
      this.slabSprite = this.sprite('slab', t.x, t.y, -999999998, [.5, .5]).setVisible(false);
      this.chestSprite = this.sprite('bigChest', t.x, t.y - 16, t.y + 48, [.5, .5]).setVisible(false);
      // Side rubble and the back remain solid; the center front steps are walkable.
      this.slabColliders = [-1, 1].flatMap(k => [-44, 44].map(dy => ({x: t.x + k * 132, y: t.y + dy, r: 60})))
        .concat([{x:t.x,y:t.y-76,r:68},{x:t.x,y:t.y-16,r:50}]);
    }
    destroy() { for (const sp of this.sprites) sp.destroy(); this.tilemap.destroy(); }

    // Nests take the map's den spots in order; the second wave gets the spots the first left free.
    denSpot(existing) {
      const free = this.map.dens.filter((d, i) => !this.usedDens.has(i) && existing.every(n => SurvivorWorld.denApart(this.s,n,d)));
      const spot = free.find(d => dist(d, this.s.player) > 250) || free[0];
      if (!spot) return null;
      this.usedDens.add(this.map.dens.indexOf(spot)); return SurvivorWorld.near(this.s,spot);
    }

    // Breakables take hits from attacks that land on them but are never picked as aim targets.
    targets() { return this.props.filter(e => !e.broken); }
    damage(e, amount) {
      if (e.broken) return;
      e.hp -= amount; e.shake = .15;
      if (e.hp <= 0) this.smashProp(e);
    }
    smashProp(e) {
      const s = this.s; e.broken = true; e.hp = 0; e.breakTime = .6;
      s.obstacles = s.obstacles.filter(o => o !== e.obstacle);
      s.burst('fxDust', e.x, e.y, 1.2, .3);
      let drop = null;
      if (s.rand() < DROP_CHANCE) {
        drop = DROPS[Math.floor(s.rand() * DROPS.length)];
        if (drop === 'xp') for (let i = 0; i < 3; i++) s.drop('xp', e.x + (i - 1) * 10, e.y); else s.drop(drop, e.x, e.y);
      }
      s.logEvent('prop_broken', {prop: e.prop, drop, x: Math.round(e.x), y: Math.round(e.y)});
    }
    // Dashing through a breakable smashes it; returns true when something broke so the dash can continue.
    smash(x, y, r) {
      let any = false;
      for (const e of this.targets()) if (dist(e, {x, y}) < e.r + r) { this.smashProp(e); any = true; }
      return any;
    }

    update(dt) {
      const s = this.s, t = this.treasure;
      for (const e of this.props) { e.shake = Math.max(0, e.shake - dt); if (e.broken) e.breakTime = Math.max(0, e.breakTime - dt); }
      if (!s.isExpedition) return;
      if (!t.revealed && s.elapsed >= t.revealAt && SurvivorWorld.offscreen(s,t,200)) {
        t.revealed = true; s.obstacles.push(...this.slabColliders);
        s.logEvent('treasure_revealed', {x: Math.round(t.x), y: Math.round(t.y)}); s.announce('Hidden treasure revealed!');
      }
      const dx=SurvivorWorld.delta(s.player.x,t.x,s.worldSize),dy=SurvivorWorld.delta(s.player.y,t.y,s.worldSize);
      if (t.revealed && !t.opened && Math.abs(dx)<=40 && dy>=44 && dy<=76) this.openTreasure();
      if (t.opened) t.openTime += dt;
    }
    openTreasure() {
      const s = this.s, t = this.treasure; if(!t.revealed||t.opened)return; t.opened = true; t.openTime = 0;
      s.burst('fxHit', t.x, t.y - 8, 3, .6, 0xffd36b);
      if (t.reward === 'xp') { const earned = s.gainXP(s.xpNeeded(), false); t.earned = earned; s.announce('Hidden treasure! +' + earned + ' XP'); }
      else { s.relics.reward('hidden_treasure'); s.announce('Hidden treasure! Choose a relic.'); }
      s.logEvent('treasure_opened', {reward: t.reward, xp: t.earned || 0});
    }

    draw() {
      const s = this.s, t = this.treasure;
      if (this.scarecrow) this.scarecrow.setFrame(SurvivorGreens.frame(s, 'scarecrow', Math.floor(s.elapsed * 6) % 8));
      for (const e of this.props) {
        if (e.broken) {
          const frame = Math.min(3, 1 + Math.floor((.6 - e.breakTime) / .12));
          e.sprite.setFrame(SurvivorGreens.frame(s, e.prop, frame)).setAlpha(Math.min(1, e.breakTime / .25)).setX(e.x);
          if (e.breakTime <= 0) e.sprite.setVisible(false);
        } else e.sprite.setX(e.x + (e.shake > 0 ? Math.sin(e.shake * 90) * 2 : 0));
      }
      this.slabSprite.setVisible(t.revealed); this.chestSprite.setVisible(t.revealed);
      if (t.revealed) this.chestSprite.setFrame(SurvivorGreens.frame(s, 'bigChest', t.opened ? Math.min(5, 3 + Math.floor(t.openTime / .15)) : Math.floor(s.elapsed * 3) % 3));
    }
    summary() {
      const t = this.treasure;
      return {info: this.map.info, dens: this.map.dens, treasure: {x: Math.round(t.x), y: Math.round(t.y), revealAt: t.revealAt, reward: t.reward, revealed: t.revealed, opened: t.opened},
        blockers: this.map.blockers.length, breakables: this.props.length, broken: this.props.filter(e => e.broken).length};
    }
  }
  window.SurvivorGreens = SurvivorGreens;
})();
