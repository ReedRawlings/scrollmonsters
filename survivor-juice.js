(() => {
  'use strict';
  const GEM_PICKUP = 38, MAX_FX = 60, PARTY_WIDE = ['partyDamage', 'partySpeed'];
  // Each creature's element colour, matching the hit bursts the sim already uses for it.
  const ELEMENT_TINT = {...SurvivorEvolutionRoster.tints,cat:0xb5fff0,owl:0xa9f5ff,beast:0xffa080,frog:0x83d9ff,mouse:0xb0ffff,mole:0xbaffcb,bear:0xbaffcb,salamander:0xff8a3d,spider:0xb5faff,storm:0x9beaff,mollusc:0xc8a6ff,octopus:0xccafff,reptile:0xffb066,tengu:0x9ce9ff,axolotl:0xa1dbef};
  const SETTINGS_KEY = 'scrollmonsters-survivor-settings-v1';
  const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
  // Presentation only: reads scene state, never writes simulation state. Never call scene.rand(), Math.random(),
  // scene.burst() or camera.shake() (Math.random) from here; cosmetic randomness uses this.rand().
  class SurvivorJuice {
    constructor(s){
      this.s=s;this.enabled=true;this.reduced=s.ui.reducedMotion;this.seed=(Date.now()>>>0)||1;
      this.front=s.add.container(0,0).setScrollFactor(0).setDepth(1000000002).setScale(s.uiScale()); // logical UI space, above the HUD
      this.handlers={};this.played=[];
      // Creating a Phaser Text draws from Math.random (texture keys), so pop texts are made once here and reused.
      this.texts=[0,1,2,3].map(()=>{const t=s.add.text(0,0,'',{fontFamily:'NovelMix',fontSize:18}).setOrigin(.5).setStroke('#120a1a',2).setVisible(false);this.front.add(t);return t;});this.nextText=0;
      this.handlers.levelup=e=>this.onLevelUp(e);this.handlers.capture=e=>this.onCapture(e);this.handlers.unlock=e=>this.onUnlock(e);this.handlers.shrine=e=>this.onShrine(e);this.handlers.upgrade=e=>this.onUpgrade(e);this.handlers.pack=e=>this.onPack(e);this.handlers.relic=e=>this.onRelic(e);this.handlers.gem=e=>this.onGem(e);this.handlers.relicoffer=()=>{this.mode='relic';this.modeAt=this.now();};/* arms the deal-in clock: a relic can open without a draw */this.handlers.packflip=e=>this.onPackFlip(e);this.handlers.packapply=e=>this.onPackApply(e);this.handlers.mergeoffer=e=>this.onMergeOffer(e);this.handlers.merge=e=>this.onMerge(e);
      this.numbers=new SurvivorDamageNumbers(this);
      let saved={};try{saved=JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}')||{};}catch{}
      this.numbersOn=saved.damageNumbers!==false;this.uiLarge=saved.uiLarge===true;
      this.reset();
      s.events.on('reward',e=>{if(this.enabled)this.handlers[e.kind]?.(e);});
    }
    reset(){
      this.s.evoFx?.reset();
      for(const f of this.fx||[])f.sprite.destroy();for(const f of this.flights||[])f.im.destroy();
      for(const r of Object.values(this.rings||{})){r.ring.destroy();r.fill.destroy();}
      for(const t of this.texts||[]){this.s.tweens.killTweensOf(t);t.setVisible(false);}
      for(const c of this.titleCritters||[])c.sprite.destroy();this.endMergeGhosts();if(this.merging)this.restoreResult(this.merging);this.titleCritters=[];this.fireflyG?.clear();this.irisAt=null;
      for(const f of this.faces||[]){f.timer.remove(false);this.s.tweens.killTweensOf(f.face);f.face.destroy();}
      this.faces=[];this.fx=[];this.flights=[];this.rings={};this.frozenUntil=0;this.jitterUntil=0;this.unlocks=[];this.unlockAt=0;this.aura=null;this.chunks=0;this.picked=null;this.gems=new WeakMap();this.packSeen=new WeakMap();this.relicBumpAt={};this.slotFillAt={};this.slotFaceAt={};this.merging=null;this.mergeOffer=null;this.evolvedPending=null;this.offerSnapped=null;this.slotFlashAt={};this.hpFlashAt=-1e9;this.hpJoltAt=-1e9;this.xpFlashAt=-1e9;this.levelFlashAt=-1e9;this.lastSpark=-1e9;
      this.mode=this.s.mode;this.modeAt=this.now();this.s.cameras.main.setFollowOffset(0,0);this.numbers?.reset();
    }
    rand(){let t=this.seed=(this.seed+0x6D2B79F5)|0;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;}
    now(){return this.s.time.now;}
    observe(){if(this.s.mode!==this.mode){if(this.mode==='merge')this.offerSnapped=null;this.mode=this.s.mode;this.modeAt=this.now();}}
    since(mode){return this.mode===mode?this.now()-this.modeAt:Infinity;}
    meta(key){const m=FX_SHEETS[key];if(m)return m;if(/^face_/.test(key))return {fw:38,fh:38,n:1,fps:1,loop:true,ax:19,ay:19};const t=this.s.textures.get(key).getSourceImage();return {fw:16,fh:16,n:Math.max(1,Math.floor(t.width/16)),fps:12,loop:true,ax:8,ay:8};}
    // Sheets load as plain images; frames are cut on demand so sprites and NativeView.image share them.
    frameName(key,i){const m=this.meta(key),n=clamp(Math.floor(i),0,m.n-1),name='f'+n,t=this.s.textures.get(key);if(!t.has(name))t.add(name,0,n*m.fw,0,m.fw,m.fh);return name;}
    frameRect(key,i){const m=this.meta(key),n=clamp(Math.floor(i),0,m.n-1);return [n*m.fw,0,m.fw,m.fh];}
    frameAt(key,ms,loop=this.meta(key).loop){const m=this.meta(key),f=Math.floor(Math.max(0,ms)/1000*m.fps);return loop?f%m.n:Math.min(f,m.n-1);}
    play(key,x,y,{scale=3,ui=false,loop=false,depth=800000000,tint,onDone}={}){
      if(!this.enabled||this.fx.length>=MAX_FX)return null;
      const m=this.meta(key),sp=this.s.add.sprite(x,y,key,this.frameName(key,0)).setOrigin(m.ax/m.fw,m.ay/m.fh).setScale(scale);
      if(tint!==undefined)sp.setTint(tint);
      if(ui)this.front.add(sp);else sp.setDepth(depth);
      const fx={sprite:sp,key,start:this.now(),loop,onDone};this.fx.push(fx);this.note(key);
      return fx;
    }
    note(key){this.played.push(key);if(this.played.length>50)this.played.shift();} // test-visible history of started effects
    stop(fx){if(!fx)return;fx.sprite.destroy();this.fx=this.fx.filter(f=>f!==fx);}
    freeze(ms){if(!this.enabled||this.reduced)return;this.frozenUntil=Math.max(this.frozenUntil,this.now()+ms);}
    frozen(){return this.now()<this.frozenUntil;}
    jitter(px,ms){if(!this.enabled||this.reduced)return;this.jitterPx=px;this.jitterUntil=this.now()+ms;}
    flashCopy(obj,ms=120){
      if(!this.enabled||this.reduced||!obj?.active||this.fx.length>=MAX_FX)return;
      const c=this.s.add.sprite(obj.x,obj.y,obj.texture.key,obj.frame.name).setOrigin(obj.originX,obj.originY).setScale(obj.scaleX,obj.scaleY).setDepth(obj.depth+1).setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
      const fx={sprite:c,key:'flash',start:this.now(),loop:true};this.fx.push(fx);
      this.s.tweens.add({targets:c,alpha:0,duration:ms,onComplete:()=>this.stop(fx)});
    }
    popText(text,x,y,{size=18,color='#ffc41b'}={}){
      const t=this.texts[this.nextText++%this.texts.length];this.s.tweens.killTweensOf(t);
      t.setText(text).setFontSize(size).setColor(color).setPosition(x,y).setAlpha(1).setScale(1).setVisible(true);
      if(!this.reduced){t.setScale(.4);this.s.tweens.add({targets:t,scale:1,duration:220,ease:'Back.Out'});}
      this.s.tweens.add({targets:t,y:y-14,alpha:0,delay:700,duration:300,onComplete:()=>t.setVisible(false)});
      return t;
    }
    // Damage hooks from the sim. boost = product of the conditional multipliers on this hit; 25%+ reads as a crit.
    damage(target,amount,boost=1){if(this.enabled&&this.numbersOn&&amount>0)this.numbers.show(target,amount,{crit:boost>=1.25});}
    hurt(amount){if(!this.enabled||amount<=0)return;this.hpJoltAt=this.now();if(this.numbersOn)this.numbers.show(this.s.player,amount,{hurt:true});}
    heal(amount){if(this.enabled&&this.numbersOn&&amount>0)this.numbers.show(this.s.player,amount,{heal:true});}
    // The HP bar jolts sideways for 150ms when the player is hit.
    hpJolt(){const t=this.now()-this.hpJoltAt;return this.reduced||t>=150?0:Math.round(3*Math.sin(t/150*Math.PI*4)*(1-t/150))||1;}
    setNumbers(on){this.numbersOn=!!on;if(!on)this.numbers.reset();this.saveSettings();}
    setUiLarge(on){this.uiLarge=!!on;this.saveSettings();}
    saveSettings(){try{localStorage.setItem(SETTINGS_KEY,JSON.stringify({damageNumbers:this.numbersOn,uiLarge:this.uiLarge}));}catch{}}
    flyTo(key,from,to,{size=32,onLand}={}){
      if(!this.enabled)return null;
      const im=this.s.add.image(from.x,from.y,key,this.frameName(key,0)).setDisplaySize(size,size);this.front.add(im);
      const f={im,key,from,to,start:this.now(),dur:460,lift:40,lastTrail:0,onLand};this.flights.push(f);return f;
    }
    advanceFlights(now){
      for(const f of [...this.flights]){
        const k=clamp((now-f.start)/f.dur,0,1),e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;
        const x=f.from.x+(f.to.x-f.from.x)*e,y=f.from.y+(f.to.y-f.from.y)*e-f.lift*Math.sin(Math.PI*e);
        f.im.setPosition(x,y).setFrame(this.frameName(f.key,this.frameAt(f.key,now-f.start,true)));
        if(now-f.lastTrail>30){f.lastTrail=now;this.play('Reward_Trail',x,y,{ui:true,scale:1});}
        if(k>=1){f.im.destroy();this.flights=this.flights.filter(v=>v!==f);f.onLand?.(f.to);}
      }
    }
    // Called at the end of every draw().
    update(){
      const now=this.now(),cam=this.s.cameras.main;this.front.setScale(this.s.uiScale());
      for(const f of [...this.fx]){if(f.key==='flash')continue;const t=now-f.start,m=this.meta(f.key);
        if(!f.loop&&t>=m.n/m.fps*1000){this.stop(f);f.onDone?.();continue;}
        f.sprite.setFrame(this.frameName(f.key,this.frameAt(f.key,t,f.loop)));}
      this.advanceFlights(now);
      this.numbers.update(now);
      if(now<this.jitterUntil){const p=this.jitterPx;cam.setFollowOffset((this.rand()*2-1)*p,(this.rand()*2-1)*p);}else cam.setFollowOffset(...this.titlePan());
      this.updateTitle(now);this.drawIris();
      this.updateAura(now);
      this.updateWorld?.(now);
      this.updateMerge(now);
    }
    // Called from scene.update() only while the real-time sim runs (never from advanceTime).
    realtime(){
      if(this.s.mode==='playing'&&this.unlocks.length&&this.now()>=this.unlockAt&&!this.frozen())this.s.openUnlock(this.unlocks.shift());
      if(this.s.mode==='playing'&&this.evolvedPending&&!this.merging&&!this.frozen()){const type=this.evolvedPending;this.evolvedPending=null;this.s.openEvolved(type);}
    }
    ownerOf(id){const evolutionOwner=this.s.creatures?.evolution.ownerOf(id);if(evolutionOwner)return evolutionOwner;
      if(/^mouse/.test(id))return 'mouse';if(/^mole/.test(id))return 'mole';if(/^bear/.test(id))return 'bear';
      if(/^fire|^comboFire/.test(id))return 'salamander';if(/^web|^comboWeb|^comboShield/.test(id))return 'spider';if(/^storm|^comboStorm/.test(id))return 'storm';
      if(['sweep','pull','claws'].includes(id))return 'cat';if(['marks','feather','split','owlPower','owlSpeed'].includes(id))return 'owl';
      if(/^beast|^slam$/.test(id))return 'beast';if(['bubble','frogPower','chorus'].includes(id))return 'frog';
      return 'walker';
    }
    slotPoint(type){const slots=this.s.hud.layout.slots,slot=slots.find(v=>v.type===type)||slots[0];return {x:slot.x+24,y:slot.y+26};}
    // XP gems: the sim moves them in a straight line; this bends the drawn path into an arc that lands on the player.
    gemOffset(item){
      const p=this.s.player,dx=p.x-item.x,dy=p.y-item.y,d=Math.hypot(dx,dy)||1;
      if(!this.enabled||!(item.magnetized||d<100))return {x:0,y:0,scale:1};
      let g=this.gems.get(item);if(!g){g={d0:Math.max(d,1),side:this.rand()<.5?-1:1};this.gems.set(item,g);}
      // Progress runs to the pickup radius (38px), where the sim collects the gem, so the arc lands on the player.
      const t=g.d0<=GEM_PICKUP?1:clamp((g.d0-d)/(g.d0-GEM_PICKUP),0,1),a=Math.sin(t*Math.PI),amp=Math.min(22,g.d0*.3)*g.side;
      return {x:-dy/d*amp*a,y:dx/d*amp*a-14*a,scale:1-.4*t};
    }
    onGem(e){const now=this.now();this.xpFlashAt=now;
      if(now-this.lastSpark>60){this.lastSpark=now;const p=this.s.player;this.play('Reward_Trail',p.x+(this.rand()*2-1)*6,p.y-12,{scale:2,depth:p.y+40});}}
    // 0..1 brightness for the XP bar: a short flash per gem, a long one on level-up.
    xpFlash(){const now=this.now();if(!this.enabled||this.reduced)return 0;return Math.max(clamp(1-(now-this.xpFlashAt)/140,0,1)*.6,clamp(1-(now-this.levelFlashAt)/420,0,1));}
    onLevelUp(e){
      this.levelFlashAt=this.now();this.flashCopy(this.s.playerSprite,90);this.jitter(2,160);this.freeze(60);
      // A level-up chained straight after a pick never passes through a draw, so re-arm the deal-in clock here.
      this.mode='upgrade';this.modeAt=this.now();
      this.aura={phase:'Ignite',start:this.now()};this.note('LevelUp_Aura_Ignite_Back');
    }
    onUpgrade(e){
      const card=this.s.screens.layout.cards?.[e.index];if(!card)return;
      this.freeze(260);
      const choice=this.s.choices[e.index],cards=this.s.screens.layout.cards||[];
      this.picked={card:{...card},label:(e.index+1)+'. '+(choice?.name||''),detail:choice?.detail||'',id:e.id,at:this.now(),
        others:cards.map((c,i)=>i===e.index?null:{card:{...c},label:(i+1)+'. '+(this.s.choices[i]?.name||''),id:this.s.choices[i]?.id}).filter(Boolean)};
      this.travel(e.id,{x:card.x+24,y:card.y+card.h/2});
    }
    // Where an upgrade lands: party-wide upgrades visit every occupied slot, Tough Hide the HP bar, the rest their owner's slot.
    travel(id,from){
      const land=(type)=>p=>{this.play('Slot_PowerUp',p.x,p.y,{ui:true,scale:1});if(type==='hp')this.hpFlashAt=this.now();else this.slotFlashAt[type]=this.now();};
      if(id==='hide'){const hp=this.s.hud.layout.hp;if(hp)return this.flyTo('upgrade_'+id,from,{x:hp.x+hp.w/2,y:hp.y+hp.h/2},{onLand:land('hp')});}
      const types=PARTY_WIDE.includes(id)?this.s.hud.layout.slots.filter(v=>v.type).map(v=>v.type):[this.ownerOf(id)];
      for(const t of types)this.flyTo('upgrade_'+id,from,this.slotPoint(t),{onLand:land((this.s.hud.layout.slots.find(v=>v.type===t)||this.s.hud.layout.slots[0])?.type)});
    }
    slotFlash(type){if(this.reduced)return 0;return clamp(1-(this.now()-(this.slotFlashAt[type]??-1e9))/250,0,1);}
    hpFlash(){if(this.reduced)return 0;return clamp(1-(this.now()-this.hpFlashAt)/250,0,1);}
    // Pickup: the pack bursts open in the world and jumps to the centre of the screen as the reveal starts.
    onPack(e){const key='Pack_Drop_'+SurvivorPacks.rarity(e.size);this.play('Pack_Open_'+SurvivorPacks.rarity(e.size),e.x,e.y,{scale:3,depth:e.y+30});
      const {w,h}=this.s.uiSize();this.flyTo(key,this.s.toUI(e.x,e.y),{x:w/2,y:this.s.screens.packCardY(w,h)},{size:48});}
    onPackFlip(e){if(this.reduced)return;const w=this.s.uiSize().w;
      this.play('Pack_Flip',w/2,this.s.screens.layout.packCard??200,{ui:true,scale:3,tint:parseInt(SurvivorPacks.COLORS[e.size].slice(1),16)});}
    onPackApply(e){const hand=this.s.screens.layout.hand||[];
      e.cards.forEach((id,i)=>{const from=hand[i];if(from)this.travel(id,from);});}
    // The chosen relic flies from its card to its cell in the HUD relic row (the row is laid out on the next draw).
    // The relic card presses and the others drop away (screens.dismiss), then the relic flies to its HUD cell and the icon bumps.
    onRelic(e){const card=e.cards?.[e.index];if(!card)return;const R=this.s.relics,label=(i,id)=>(i+1)+'. '+R.name(id);
      this.freeze(260);
      this.picked={card,label:label(e.index,e.id),detail:'',id:e.id,icon:'relic_'+e.id,at:this.now(),
        others:e.ids.map((id,i)=>i===e.index||!e.cards[i]?null:{card:e.cards[i],label:label(i,id),id,icon:'relic_'+id}).filter(Boolean)};
      this.s.draw();const cell=this.s.hud.layout.relics.find(r=>r.id===e.id);if(!cell)return;
      this.flyTo('relic_'+e.id,{x:card.x+24,y:card.y+card.h/2},{x:cell.x+10,y:cell.y+10},{size:24,onLand:p=>{this.play('Slot_PowerUp',p.x,p.y,{ui:true,scale:1});this.relicBumpAt[e.id]=this.now();}});}
    relicBump(id){if(this.reduced)return 0;return clamp(1-(this.now()-(this.relicBumpAt[id]??-1e9))/220,0,1);}
    // Ground packs tumble out of the defeated enemy and land exactly on their sim position.
    packOffset(item){if(!this.enabled||this.reduced)return {x:0,y:0,rot:0};let t0=this.packSeen.get(item);if(t0==null){t0=this.now();this.packSeen.set(item,t0);}
      const t=clamp((this.now()-t0)/600,0,1),e=1-Math.pow(1-t,2);return t>=1?{x:0,y:0,rot:0}:{x:24*(1-e),y:-28*(1-e)-50*Math.sin(Math.PI*t),rot:-2*Math.PI*(1-e)};}
    // Aura: Ignite once, Loop while the level-up screen is up, then Fade once.
    updateAura(now){
      const a=this.aura;if(!a){this.auraSprites?.forEach(s=>s.setVisible(false));return;}
      const s=this.s,p=s.player,key=b=>'LevelUp_Aura_'+a.phase+'_'+b,t=now-a.start,m=this.meta(key('Back'));
      if(!m.loop&&t>=m.n/m.fps*1000){if(a.phase==='Ignite')this.aura={phase:'Loop',start:now};else if(a.phase==='Fade')this.aura=null;return this.updateAura(now);}
      if(a.phase==='Loop'&&s.mode!=='upgrade'){this.aura={phase:'Fade',start:now};return this.updateAura(now);}
      this.auraSprites??=[s.add.sprite(0,0,key('Back')),s.add.sprite(0,0,key('Front'))];
      ['Back','Front'].forEach((b,i)=>{const sp=this.auraSprites[i],k=key(b),mm=this.meta(k);
        sp.setVisible(this.enabled).setTexture(k,this.frameName(k,this.frameAt(k,t))).setOrigin(mm.ax/mm.fw,mm.ay/mm.fh).setScale(3).setPosition(p.x,p.y+24).setDepth(p.y+(i?21:19));});
    }
    // Sheet ring + fill at 3x in the world. Ids not drawn this frame are hidden (mark and sweep).
    ring(id,x,y,fill01,{tint=0xffffff,alpha=1,scale=3}={}){
      const now=this.now();let r=this.rings[id];
      if(!r){const m=this.meta('Capture_Ring');r=this.rings[id]={ring:this.s.add.sprite(0,0,'Capture_Ring',this.frameName('Capture_Ring',0)).setOrigin(m.ax/m.fw,m.ay/m.fh).setScale(3),
        fill:this.s.add.sprite(0,0,'Capture_Fill',this.frameName('Capture_Fill',0)).setOrigin(m.ax/m.fw,m.ay/m.fh).setScale(3)};}
      r.seen=true;
      r.ring.setScale(scale).setVisible(true).setPosition(x,y).setDepth(y-3).setTint(tint).setAlpha(alpha).setFrame(this.frameName('Capture_Ring',this.frameAt('Capture_Ring',now,true)));
      r.fill.setScale(scale).setVisible(fill01>0).setPosition(x,y).setDepth(y-2).setAlpha(alpha).setFrame(this.frameName('Capture_Fill',Math.round(clamp(fill01,0,1)*16)));
    }
    updateWorld(now){
      for(const r of Object.values(this.rings))r.seen=false;
      if(this.enabled)for(const type of ['cat','owl','beast','frog','mouse','mole','bear','salamander','spider','storm','mollusc','bamboo']){
        const b=this.s.expedition.captureBody(type);if(b?.state!=='ready')continue;this.ring(type,b.x,b.y,b.progress/2.5,{scale:6});
        // The creature trembles harder each quarter of the charge (drawn offset only; the sim position is untouched).
        const sp=this.captureSprite(type,b),q=Math.floor(clamp(b.progress/2.5,0,.999)*4);if(sp&&q&&!this.reduced){const a=q*.75;sp.setPosition(sp.x+(this.rand()*2-1)*a,sp.y+(this.rand()*2-1)*a);}}
      this.updateShrine?.(now);
      for(const r of Object.values(this.rings))if(!r.seen){r.ring.setVisible(false);r.fill.setVisible(false);}
    }
    onUnlock(e){this.unlocks.push(e.type);this.unlockAt=this.now()+900;}
    // Title field (presentation only): unlocked creatures wander, fireflies drift, the view pans slowly. Gone once a run starts.
    titlePan(){if(this.s.mode!=='title'||this.reduced||!this.enabled)return [0,0];const t=this.since('title')/12000*Math.PI*2;return [Math.round(16*Math.sin(t)),Math.round(-10*Math.sin(t*.7))];}
    updateTitle(now){
      const s=this.s,title=s.mode==='title'&&this.enabled;
      if(!title){if(this.titleCritters.length){for(const c of this.titleCritters)c.sprite.destroy();this.titleCritters=[];}this.fireflyG?.clear();this.fireflies=0;return;}
      const cam=s.cameras.main,cx=cam.midPoint.x,cy=cam.midPoint.y,vw=cam.width/2,vh=cam.height/2;
      if(!this.titleCritters.length)for(const type of s.unlocked.slice(0,6)){if(!s.textures.exists(type))continue;
        const x=cx+(this.rand()*2-1)*vw*.8,y=cy+(this.rand()*2-1)*vh*.8;this.titleCritters.push({type,x,y,vx:0,vy:0,next:0,sprite:s.add.sprite(x,y,type,0).setScale(3)});}
      const dt=Math.min(.05,(now-(this.titleLast??now))/1000);this.titleLast=now;
      for(const c of this.titleCritters){if(now>=c.next){const a=this.rand()*Math.PI*2,sp=this.rand()<.3?0:18+this.rand()*16;c.vx=Math.cos(a)*sp;c.vy=Math.sin(a)*sp;c.next=now+1400+this.rand()*1800;}
        c.x=clamp(c.x+c.vx*dt,cx-vw+24,cx+vw-24);c.y=clamp(c.y+c.vy*dt,cy-vh+40,cy+vh-40);
        const moving=Math.hypot(c.vx,c.vy)>1;c.sprite.setPosition(c.x,c.y).setDepth(c.y+20).setFlipX(c.vx<0).setFrame(moving?Math.floor(now/160)%4*4:0);}
      // 16 fireflies rise and fade on their own loops.
      const g=this.fireflyG??=s.add.graphics().setDepth(2990);g.clear();this.fireflies=16;
      for(let i=0;i<16;i++){const seed=Math.sin(i*12.9898)*43758.5453,f=seed-Math.floor(seed),period=2600+f*1600,k=((now+f*3000)%period)/period;
        const x=cx-vw+((f*7919)%1)*vw*2+Math.sin(k*6+i)*8,y=cy+vh-((f*104729)%1)*vh*2-k*60;g.fillStyle(0xffe680,Math.sin(k*Math.PI)).fillRect(Math.round(x),Math.round(y),3,3);}
    }
    // BEGIN closes an iris on the field and opens it on the run (0..1 = radius fraction; 1 = no iris).
    iris(){if(this.reduced||!this.enabled)return;this.irisAt=this.now();this.freeze(400);}
    irisRadius(){const t=this.now()-(this.irisAt??-1e9);return t>=400?1:1-Math.pow(1-t/400,2);}
    drawIris(){const r=this.irisRadius(),g=this.irisG??=this.s.add.graphics();if(g.parentContainer!==this.front)this.front.add(g);g.clear();if(r>=1)return;
      const {w,h}=this.s.uiSize(),R=Math.hypot(w,h)/2,rr=Math.max(0,r*R),thick=R*2;g.lineStyle(thick,0x000000,1).strokeCircle(w/2,h/2,rr+thick/2);}
    elementTint(type){return ELEMENT_TINT[type]??0xffffff;}
    captureSprite(type,b){const s=this.s;return b?.sprite||{cat:s.catSprite,owl:s.owlSprite,beast:s.encounters.beastSprite,frog:s.expedition.frogSprite}[type];}
    slotFill(type){const t0=this.slotFillAt[type];return t0==null?1:clamp((this.now()-t0)/300,0,1);}
    // A merged result's party face stays hidden until its portrait lands (reduced motion fades it in over 250ms).
    slotFace(type){const t0=this.slotFaceAt[type];return t0==null?1:clamp((this.now()-t0)/250,0,1);}
    onCapture(e){
      if(this.offerSnapped!==e.type){this.play('Capture_Burst',e.x,e.y+20,{depth:e.y+30});this.freeze(90);this.flashCopy(this.captureSprite(e.type,this.s.expedition.captureBody(e.type)),120);this.jitter(2,200);}this.offerSnapped=null;
      this.slotFillAt[e.type]=this.now()+960; // the bar stays empty through the 500ms hold and 460ms flight, then fills
      if(this.fx.length+this.faces.length>=MAX_FX)return;
      const p=this.s.toUI(e.x,e.y-30),face=this.s.add.image(p.x,p.y,'face_'+e.type).setDisplaySize(38,38);this.front.add(face);
      if(!this.reduced){face.setScale(face.scaleX*.3);this.s.tweens.add({targets:face,scaleX:face.scaleX/.3,scaleY:face.scaleY/.3,duration:260,ease:'Back.Out'});}
      // Tracked so reset() can cancel a pending flight when the run restarts.
      const entry={face};entry.timer=this.s.time.delayedCall(500,()=>{this.faces=this.faces.filter(f=>f!==entry);const from={x:face.x,y:face.y};face.destroy();
        this.flyTo('face_'+e.type,from,this.slotPoint(e.type),{size:32,onLand:q=>{this.play('Slot_PowerUp',q.x,q.y,{ui:true,scale:1});this.slotFillAt[e.type]=this.now();this.slotFlashAt[e.type]=this.now();}});});
      this.faces.push(entry);
    }
    updateShrine(now){
      const s=this.s,sh=s.expedition.shrine;if(!this.enabled||!s.isExpedition||s.elapsed<90)return;
      this.ring('shrine',sh.x,sh.y,sh.done?0:sh.progress/6,{scale:6,tint:sh.done?0x66716e:sh.inCombat?0xffa066:0xffffff,alpha:sh.done?.35:1});
    }
    // A pixel chunk flung on an arc, landing below its start, then blinking out. No rotation keeps it on the pixel grid.
    chunk(key,x,y,{dist=[50,130],lift=[40,90],sizes=[2,6]}={}){
      if(this.fx.length>=MAX_FX)return;
      const r=(a,b)=>a+this.rand()*(b-a),sp=this.s.add.sprite(x,y,key,this.frameName(key,Math.floor(r(sizes[0],sizes[1])))).setScale(3).setDepth(y+40).setFlipX(this.rand()<.5);
      const fx={sprite:sp,key:'flash',start:this.now(),loop:true};this.fx.push(fx);this.chunks++;
      const a=r(0,Math.PI*2),dx=Math.cos(a)*r(dist[0],dist[1]),land=r(8,26)+Math.max(0,Math.sin(a))*20,h=r(lift[0],lift[1]),dur=r(560,820);
      this.s.tweens.addCounter({from:0,to:1,duration:dur,onUpdate:tw=>{const t=tw.getValue(),k=Math.min(1,t/.75);sp.setPosition(x+dx*k,y-4*h*k*(1-k)+land*k);sp.setAlpha(t<.86?1:(Math.floor(t*25)%2?0:1));},
        onComplete:()=>{this.stop(fx);this.chunks--;}});
    }
    onShrine(e){
      const sp=this.s.expedition.shrineSprite,cx=e.x,cy=sp.y-120;
      this.flashCopy(sp,e.final?180:120);
      if(e.final){this.freeze(110);this.jitter(3,200);this.play('Spark_Light',cx,cy,{scale:1,depth:sp.depth+2});}
      for(let i=0;i<(e.final?14:4);i++)this.chunk('P_Shard',cx+(this.rand()*16-8),cy+(this.rand()*16-10),e.final?{sizes:i<4?[2,3]:[3,6]}:{dist:[24,56],lift:[20,40],sizes:[3,6]});
      if(e.final)for(let i=0;i<6;i++)this.chunk('P_Rock',cx+(this.rand()*24-12),sp.y-6,{dist:[30,80],lift:[16,40],sizes:[3,6]});
    }
    // ---- Evolution merge. The transaction is already committed when 'merge' arrives; this only shows it.
    // Timeline (ms): 0-150 the chosen card presses (screens.dismiss) · 150-450 both parents spiral together, trailing their colours ·
    // 450-650 cocoon core · 650 result reveal, burst and ground ring · 1000 result face flies to its party slot, which glows ·
    // 1500 done; a first discovery then opens the NEW EVOLUTION panel. Tap, Enter or Space skips to the end (the result is unchanged).
    partySprite(type){const s=this.s;return {cat:s.catSprite,owl:s.owlSprite,beast:s.encounters.beastSprite,frog:s.expedition.frogSprite}[type]||s.creatures.allies[type]?.sprite;}
    onMergeOffer(e){
      this.mode='merge';this.modeAt=this.now(); // arms the deal-in clock even if no draw happens between capture and offer
      // The capture still snaps (burst and white flash) before the choice; a Recruit from this panel then skips the second burst.
      const body=this.s.expedition.captureBody(e.captured);if(body){this.play('Capture_Burst',body.x,body.y+20,{depth:body.y+30});this.flashCopy(this.captureSprite(e.captured,body),120);this.jitter(2,200);}this.offerSnapped=e.captured;
      const ev=this.s.creatures.evolution,snap=sp=>sp?.active?{key:sp.texture.key,frame:sp.frame.name,x:sp.x,y:sp.y,sx:sp.scaleX,sy:sp.scaleY,flip:sp.flipX}:null;
      this.mergeOffer={captured:e.captured,known:new Set(ev.discovered),captureSnap:snap(this.captureSprite(e.captured,this.s.expedition.captureBody(e.captured))),
        partners:Object.fromEntries((e.options||[]).map(o=>[o.partner,snap(this.partySprite(o.partner))]))};
    }
    onMerge(e){
      const now=this.now(),offer=this.mergeOffer||{partners:{},slots:[],known:new Set()},captured=offer.captured??e.parents[1],partner=e.parents.find(t=>t!==captured)??e.parents[0];
      const L=this.s.screens.layout.merge,card=L?.options.find(o=>o.id===e.result);
      if(card){this.picked={card:{x:card.x,y:card.y,w:card.w,h:card.h},label:card.label,detail:'',id:e.result,icon:card.icon,iconFrame:[0,0,38,38],at:now,
        others:[...L.options.filter(o=>o!==card),...(L.recruit?[L.recruit]:[])].map(o=>({card:{x:o.x,y:o.y,w:o.w,h:o.h},label:o.label,id:o.id,icon:o.icon,iconFrame:[0,0,38,38]}))};}
      const m=this.merging={at:now,result:e.result,partner,captured,x:e.x,y:e.y,first:!offer.known.has(e.result),stage:0,ghosts:[],lastTrail:0,red:this.reduced};
      this.slotFillAt[e.result]=Infinity;this.slotFaceAt[e.result]=Infinity;this.mergeOffer=null;
      if(m.red){this.slotFillAt[e.result]=now;this.slotFaceAt[e.result]=now;return;}
      this.freeze(1500);
      for(const [type,sn] of [[partner,offer.partners[partner]],[captured,offer.captureSnap]]){if(!sn)continue;
        const g=this.s.add.sprite(sn.x,sn.y,sn.key,sn.frame).setScale(sn.sx,sn.sy).setFlipX(sn.flip).setDepth(sn.y+20);m.ghosts.push({g,type,x0:sn.x,y0:sn.y});}
    }
    endMergeGhosts(){for(const g of this.merging?.ghosts||[])g.g.destroy();if(this.merging)this.merging.ghosts=[];}
    restoreResult(m){const sp=this.s.creatures?.allies[m.result]?.sprite;if(sp?.active){sp.setAlpha(1);if(m.base)sp.setScale(m.base);}}
    skipMerge(){const m=this.merging;if(!m||m.red)return false;m.at=this.now()-1500;m.stage=3;this.frozenUntil=0;
      for(const f of [...this.flights])if(f.key==='face_'+m.result||f.key==='face_'+m.partner){f.im.destroy();this.flights=this.flights.filter(v=>v!==f);}
      this.endMergeGhosts();this.updateMerge(this.now());return true;}
    updateMerge(now){
      const m=this.merging;if(!m)return;const t=now-m.at,a=this.s.creatures.allies[m.result],sp=a?.sprite;
      if(sp?.active&&m.base==null)m.base=sp.scaleX;
      const done=()=>{this.restoreResult(m);this.slotFillAt[m.result]=Math.min(this.slotFillAt[m.result],now);this.slotFaceAt[m.result]=Math.min(this.slotFaceAt[m.result],now-250);
        if(m.first)this.evolvedPending=m.result;this.merging=null;};
      if(m.red){if(sp?.active)sp.setAlpha(clamp(t/250,0,1));if(t>=300)done();return;}
      const tint=this.elementTint(m.result);
      // Convergence: both parents spiral half a turn into the merge point.
      if(t<450&&m.ghosts.length){const k=clamp((t-150)/300,0,1),e=k*k*(3-2*k),ang=e*Math.PI;
        for(const g of m.ghosts){const dx=g.x0-m.x,dy=g.y0-m.y,x=m.x+(dx*Math.cos(ang)-dy*Math.sin(ang))*(1-e),y=m.y+(dx*Math.sin(ang)+dy*Math.cos(ang))*(1-e);g.g.setPosition(x,y).setDepth(y+20);
          if(k>0&&now-m.lastTrail>30)this.play('Merge_Trail',x,y,{scale:3,depth:y+21,tint:this.elementTint(g.type)});}
        if(k>0&&now-m.lastTrail>30)m.lastTrail=now;}
      if(m.stage<1&&t>=450){m.stage=1;this.endMergeGhosts();this.play('Merge_Core',m.x,m.y,{scale:3,depth:m.y+40,tint});}
      if(m.stage<2&&t>=650){m.stage=2;this.play('Merge_Reveal',m.x,m.y,{scale:3,depth:m.y+41,tint});this.play('Merge_Ring',m.x,m.y+14,{scale:3,depth:m.y-3,tint});
        if(sp?.active){sp.setAlpha(1);this.flashCopy(sp,140);}this.jitter(2,150);}
      if(sp?.active&&m.base!=null){if(t<650)sp.setAlpha(0);else{const k=clamp((t-650)/150,0,1);sp.setScale(m.base*(1.3-.3*k),m.base*(.7+.3*k));}}
      if(m.stage<3&&t>=1000){m.stage=3;const from=sp?.active?this.s.toUI(sp.x,sp.y-10):this.s.toUI(m.x,m.y);
        this.flyTo('face_'+m.result,from,this.slotPoint(m.result),{size:32,onLand:()=>{const slot=this.s.hud.layout.slots.find(v=>v.type===m.result);
          if(slot)this.play('Evolved_Slot_Glow',slot.x+slot.w/2,slot.y+slot.h/2,{ui:true,scale:2});this.slotFlashAt[m.result]=this.now();this.slotFillAt[m.result]=this.now();this.slotFaceAt[m.result]=this.now()-250;}});}
      if(t>=1500)done();
    }
  }
  window.SurvivorJuice = SurvivorJuice;
})();
