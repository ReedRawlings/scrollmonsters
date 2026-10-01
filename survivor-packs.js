(() => {
  'use strict';
  const RARITY = {1:'Common',3:'Rare',5:'Legendary'}, COLORS = {1:'#5ed5f2',3:'#b58cff',5:'#ffd36b'}, PICKUP = 38;
  const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  // Upgrade packs. Sim side: size and cards are rolled with scene.rand() at the drop, and every card is granted
  // on pickup. The reveal that follows is presentation only: it never changes what was granted.
  class SurvivorPacks {
    // Spec odds 82/17/2 sum to 101%; common gives up the extra point: 81 / 17 / 2.
    static size(r){return r<.81?1:r<.98?3:5;}
    static rarity(n){return RARITY[n];}
    constructor(s){this.s=s;this.items=[];this.opened=0;this.reveal=null;}
    destroy(){for(const p of this.items)p.sprite.destroy();this.items=[];this.reveal=null;}
    // Without repeats while the pool lasts; a pool smaller than the pack refills.
    draw(pool,n){const out=[];let left=[...pool];while(out.length<n){if(!left.length)left=[...pool];out.push(left.splice(Math.floor(this.s.rand()*left.length),1)[0]);}return out;}
    drop(x,y,source){
      const s=this.s,size=SurvivorPacks.size(s.rand()),cards=this.draw(s.upgradePool(),size).map(u=>u.id),key='Pack_Drop_'+RARITY[size];
      const sprite=s.add.sprite(x,y,key,s.juice.frameName(key,0)).setOrigin(.5,19/20).setScale(3).setDepth(y);
      const item={x,y,size,cards,source,sprite};this.items.push(item);
      s.logEvent('pack_dropped',{source,size,cards,x:Math.round(x),y:Math.round(y)});return item;
    }
    // One pickup per tick, so overlapping packs open one after another.
    update(){const s=this.s;if(s.mode!=='playing')return;const item=this.items.find(p=>dist(p,s.player)<PICKUP);if(item)this.open(item);}
    open(item){
      const s=this.s;this.items=this.items.filter(p=>p!==item);item.sprite.destroy();
      // Grant card by card against a fresh pool: a card that stopped being offerable (a once-only already taken,
      // here or earlier; a creature gone) is redrawn, and each copy shows its own rank step.
      const cards=item.cards.map(id=>{const pool=s.upgradePool(),u=pool.find(v=>v.id===id)||this.draw(pool,1)[0];s.grantUpgrade(u.id);return {id:u.id,name:u.name,detail:u.detail};});
      this.opened++;s.logEvent('pack_opened',{source:item.source,size:item.size,cards:cards.map(c=>c.id)});
      this.reveal={size:item.size,cards,x:item.x,y:item.y,start:s.juice.now(),kept:0,flippedAt:null,doneAt:null};
      s.mode='pack';s.joy=null;s.input.keyboard.resetKeys();s.accumulator=0;
      s.reward('pack',{size:item.size,cards:cards.map(c=>c.id),x:item.x,y:item.y});
    }
    // A reveal that ends while the window is out of focus lands on pause, never on unattended combat.
    close(){const s=this.s;if(s.mode!=='pack')return;this.reveal=null;s.joy=null;s.input.keyboard.resetKeys();
      if(this.blurred){this.blurred=false;s.mode='paused';}else{s.mode='playing';s.checkLevel();}s.saveRun();}
    // --- reveal (real time; presentation state only) ---
    act(){
      const r=this.reveal,now=this.s.juice.now();if(!r||this.s.mode!=='pack'||now-r.start<SurvivorPacks.LOCK(r.cards.length)||r.doneAt!==null)return;
      if(r.flippedAt===null){r.flippedAt=now;this.s.reward('packflip',{index:r.kept,size:r.size});}
      else if(now-r.flippedAt>=SurvivorPacks.FLIP_MS)this.keep(now);
    }
    keep(now){const r=this.reveal;r.kept++;r.keptAt=now;r.flippedAt=null;if(r.kept>=r.cards.length)r.doneAt=now;}
    // Called from the scene's real-time loop (and by tests): auto-file after a second, then apply and resume.
    realtime(){
      const r=this.reveal;if(!r||this.s.mode!=='pack')return;const now=this.s.juice.now();
      if(r.flippedAt!==null&&now-r.flippedAt>=SurvivorPacks.KEEP_MS)this.keep(now);
      if(r.doneAt!==null&&now-r.doneAt>=SurvivorPacks.APPLY_MS){const cards=r.cards.map(c=>c.id);this.s.reward('packapply',{cards});this.close();}
    }
    // Ground packs bob through their idle sheet (presentation only).
    drawWorld(){const j=this.s.juice;for(const p of this.items){const key=p.sprite.texture.key,o=j.packOffset(p);p.sprite.setFrame(j.frameName(key,j.frameAt(key,j.now(),true))).setPosition(p.x+o.x,p.y+o.y).setRotation(o.rot);}}
  }
  SurvivorPacks.COLORS = COLORS;
  SurvivorPacks.LOCK = n => Math.max(300, 90 * n + 120);
  Object.assign(SurvivorPacks, {FLIP_MS: 180, KEEP_MS: 1000, APPLY_MS: 250});
  window.SurvivorPacks = SurvivorPacks;
})();
