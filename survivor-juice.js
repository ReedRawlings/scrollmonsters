(() => {
  'use strict';
  const UI = 2, MAX_FX = 60;
  const SETTINGS_KEY = 'scrollmonsters-survivor-settings-v1';
  const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
  // Presentation only: reads scene state, never writes simulation state. Never call scene.rand(),
  // Math.random() (the sim uses it for dens and chests), scene.burst() or camera.shake() (uses Math.random).
  class SurvivorJuice {
    constructor(s){
      this.s=s;this.enabled=true;this.reduced=s.ui.reducedMotion;this.seed=(Date.now()>>>0)||1;
      this.front=s.add.container(0,0).setScrollFactor(0).setDepth(1000000002).setScale(UI); // logical UI space, above the HUD
      this.handlers={};this.played=[];
      // Creating a Phaser Text draws from Math.random (texture keys), so pop texts are made once here and reused.
      this.texts=[0,1,2,3].map(()=>{const t=s.add.text(0,0,'',{fontFamily:'NovelMix',fontSize:18}).setOrigin(.5).setStroke('#120a1a',2).setVisible(false);this.front.add(t);return t;});this.nextText=0;
      this.handlers.levelup=e=>this.onLevelUp(e);this.handlers.capture=e=>this.onCapture(e);this.handlers.unlock=e=>this.onUnlock(e);this.handlers.shrine=e=>this.onShrine(e);this.handlers.upgrade=e=>this.onUpgrade(e);this.handlers.pack=e=>this.onPack(e);this.handlers.relic=e=>this.onRelic(e);this.handlers.relicoffer=()=>{this.mode='relic';this.modeAt=this.now();};/* arms the deal-in clock: a relic can open without a draw */this.handlers.packflip=e=>this.onPackFlip(e);this.handlers.packapply=e=>this.onPackApply(e);
      this.numbers=new SurvivorDamageNumbers(this);
      let saved={};try{saved=JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}')||{};}catch{}
      this.numbersOn=saved.damageNumbers!==false;
      this.reset();
      s.events.on('reward',e=>{if(this.enabled)this.handlers[e.kind]?.(e);});
    }
    reset(){
      for(const f of this.fx||[])f.sprite.destroy();for(const f of this.flights||[])f.im.destroy();
      for(const r of Object.values(this.rings||{})){r.ring.destroy();r.fill.destroy();}
      for(const t of this.texts||[]){this.s.tweens.killTweensOf(t);t.setVisible(false);}
      for(const f of this.faces||[]){f.timer.remove(false);this.s.tweens.killTweensOf(f.face);f.face.destroy();}
      this.faces=[];this.fx=[];this.flights=[];this.rings={};this.frozenUntil=0;this.jitterUntil=0;this.unlocks=[];this.unlockAt=0;this.aura=null;this.chunks=0;
      this.mode=this.s.mode;this.modeAt=this.now();this.s.cameras.main.setFollowOffset(0,0);this.numbers?.reset();
    }
    rand(){let t=this.seed=(this.seed+0x6D2B79F5)|0;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;}
    now(){return this.s.time.now;}
    observe(){if(this.s.mode!==this.mode){this.mode=this.s.mode;this.modeAt=this.now();}}
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
    hurt(amount){if(this.enabled&&this.numbersOn&&amount>0)this.numbers.show(this.s.player,amount,{hurt:true});}
    setNumbers(on){this.numbersOn=!!on;if(!on)this.numbers.reset();try{localStorage.setItem(SETTINGS_KEY,JSON.stringify({damageNumbers:this.numbersOn}));}catch{}}
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
      const now=this.now(),cam=this.s.cameras.main;
      for(const f of [...this.fx]){if(f.key==='flash')continue;const t=now-f.start,m=this.meta(f.key);
        if(!f.loop&&t>=m.n/m.fps*1000){this.stop(f);f.onDone?.();continue;}
        f.sprite.setFrame(this.frameName(f.key,this.frameAt(f.key,t,f.loop)));}
      this.advanceFlights(now);
      this.numbers.update(now);
      if(now<this.jitterUntil){const p=this.jitterPx;cam.setFollowOffset((this.rand()*2-1)*p,(this.rand()*2-1)*p);}else cam.setFollowOffset(0,0);
      this.updateAura(now);
      this.updateWorld?.(now);
    }
    // Called from scene.update() only while the real-time sim runs (never from advanceTime).
    realtime(){
      if(this.s.mode==='playing'&&this.unlocks.length&&this.now()>=this.unlockAt&&!this.frozen())this.s.openUnlock(this.unlocks.shift());
    }
    ownerOf(id){
      if(/^mouse/.test(id))return 'mouse';if(/^mole/.test(id))return 'mole';if(/^bear/.test(id))return 'bear';
      if(/^fire|^comboFire/.test(id))return 'salamander';if(/^web|^comboWeb|^comboShield/.test(id))return 'spider';if(/^storm|^comboStorm/.test(id))return 'storm';
      if(['sweep','pull','claws'].includes(id))return 'cat';if(['marks','feather','split','owlPower','owlSpeed'].includes(id))return 'owl';
      if(/^beast|^slam$/.test(id))return 'beast';if(['bubble','frogPower','chorus'].includes(id))return 'frog';
      return 'walker';
    }
    slotPoint(type){const slots=this.s.hud.layout.slots,slot=slots.find(v=>v.type===type)||slots[0];return {x:slot.x+24,y:slot.y+26};}
    onLevelUp(e){
      // A level-up chained straight after a pick never passes through a draw, so re-arm the deal-in clock here.
      this.mode='upgrade';this.modeAt=this.now();
      this.aura={phase:'Ignite',start:this.now()};this.note('LevelUp_Aura_Ignite_Back');
    }
    onUpgrade(e){
      const card=this.s.screens.layout.cards?.[e.index];if(!card)return;
      this.freeze(260);
      const to=this.slotPoint(this.ownerOf(e.id));
      this.flyTo('upgrade_'+e.id,{x:card.x+24,y:card.y+card.h/2},to,{onLand:p=>this.play('Slot_PowerUp',p.x,p.y,{ui:true,scale:1})});
    }
    onPack(e){this.play('Pack_Open_'+SurvivorPacks.rarity(e.size),e.x,e.y,{scale:3,depth:e.y+30});}
    onPackFlip(e){if(this.reduced)return;const w=this.s.uiSize().w;
      this.play('Pack_Flip',w/2,this.s.screens.layout.packCard??200,{ui:true,scale:3,tint:parseInt(SurvivorPacks.COLORS[e.size].slice(1),16)});}
    onPackApply(e){const hand=this.s.screens.layout.hand||[];
      e.cards.forEach((id,i)=>{const from=hand[i];if(from)this.flyTo('upgrade_'+id,from,this.slotPoint(this.ownerOf(id)),{onLand:p=>this.play('Slot_PowerUp',p.x,p.y,{ui:true,scale:1})});});}
    // The chosen relic flies from its card to its cell in the HUD relic row (the row is laid out on the next draw).
    onRelic(e){const card=this.s.screens.layout.cards?.[e.index];if(!card)return;this.s.draw();
      const cell=this.s.hud.layout.relics.find(r=>r.id===e.id);if(!cell)return;
      this.flyTo('relic_'+e.id,{x:card.x+24,y:card.y+card.h/2},{x:cell.x+10,y:cell.y+10},{size:24,onLand:p=>this.play('Slot_PowerUp',p.x,p.y,{ui:true,scale:1})});}
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
      if(this.enabled)for(const type of ['cat','owl','beast','frog','mouse','mole','bear','salamander','spider','storm']){
        const b=this.s.expedition.captureBody(type);if(b?.state==='ready')this.ring(type,b.x,b.y,b.progress/2.5);}
      this.updateShrine?.(now);
      for(const r of Object.values(this.rings))if(!r.seen){r.ring.setVisible(false);r.fill.setVisible(false);}
    }
    onUnlock(e){this.unlocks.push(e.type);this.unlockAt=this.now()+900;}
    onCapture(e){
      this.play('Capture_Burst',e.x,e.y+20,{depth:e.y+30});this.freeze(90);
      if(this.fx.length+this.faces.length>=MAX_FX)return;
      const p=this.s.toUI(e.x,e.y-30),face=this.s.add.image(p.x,p.y,'face_'+e.type).setDisplaySize(38,38);this.front.add(face);
      if(!this.reduced){face.setScale(face.scaleX*.3);this.s.tweens.add({targets:face,scaleX:face.scaleX/.3,scaleY:face.scaleY/.3,duration:260,ease:'Back.Out'});}
      // Tracked so reset() can cancel a pending flight when the run restarts.
      const entry={face};entry.timer=this.s.time.delayedCall(500,()=>{this.faces=this.faces.filter(f=>f!==entry);const from={x:face.x,y:face.y};face.destroy();
        this.flyTo('face_'+e.type,from,this.slotPoint(e.type),{size:32,onLand:q=>this.play('Slot_PowerUp',q.x,q.y,{ui:true,scale:1})});});
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
  }
  window.SurvivorJuice = SurvivorJuice;
})();
