(() => {
  'use strict';
  const UI = 2, MAX_FX = 60;
  const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
  // Presentation only: reads scene state, never writes simulation state. Never call scene.rand(),
  // Math.random() (the sim uses it for dens and chests), scene.burst() or camera.shake() (uses Math.random).
  class SurvivorJuice {
    constructor(s){
      this.s=s;this.enabled=true;this.reduced=s.ui.reducedMotion;this.seed=(Date.now()>>>0)||1;
      this.front=s.add.container(0,0).setScrollFactor(0).setDepth(10002).setScale(UI); // logical UI space, above the HUD
      this.handlers={};this.played=[];
      this.reset();
      s.events.on('reward',e=>{if(this.enabled)this.handlers[e.kind]?.(e);});
    }
    reset(){
      for(const f of this.fx||[])f.sprite.destroy();for(const f of this.flights||[])f.im.destroy();
      for(const r of Object.values(this.rings||{})){r.ring.destroy();r.fill.destroy();}
      this.fx=[];this.flights=[];this.rings={};this.frozenUntil=0;this.jitterUntil=0;this.unlocks=[];this.unlockAt=0;
      this.mode=this.s.mode;this.modeAt=this.now();this.s.cameras.main.setFollowOffset(0,0);
    }
    rand(){let t=this.seed=(this.seed+0x6D2B79F5)|0;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;}
    now(){return this.s.time.now;}
    observe(){if(this.s.mode!==this.mode){this.mode=this.s.mode;this.modeAt=this.now();}}
    since(mode){return this.mode===mode?this.now()-this.modeAt:Infinity;}
    meta(key){const m=FX_SHEETS[key];if(m)return m;const t=this.s.textures.get(key).getSourceImage();return {fw:16,fh:16,n:Math.max(1,Math.floor(t.width/16)),fps:12,loop:true,ax:8,ay:8};}
    // Sheets load as plain images; frames are cut on demand so sprites and NativeView.image share them.
    frameName(key,i){const m=this.meta(key),n=clamp(Math.floor(i),0,m.n-1),name='f'+n,t=this.s.textures.get(key);if(!t.has(name))t.add(name,0,n*m.fw,0,m.fw,m.fh);return name;}
    frameRect(key,i){const m=this.meta(key),n=clamp(Math.floor(i),0,m.n-1);return [n*m.fw,0,m.fw,m.fh];}
    frameAt(key,ms,loop=this.meta(key).loop){const m=this.meta(key),f=Math.floor(Math.max(0,ms)/1000*m.fps);return loop?f%m.n:Math.min(f,m.n-1);}
    play(key,x,y,{scale=3,ui=false,loop=false,depth=2900,tint,onDone}={}){
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
      const t=this.s.add.text(x,y,text,{fontFamily:'NovelMix',fontSize:size,color}).setOrigin(.5).setStroke('#120a1a',2);this.front.add(t);
      if(!this.reduced){t.setScale(.4);this.s.tweens.add({targets:t,scale:1,duration:220,ease:'Back.Out'});}
      this.s.tweens.add({targets:t,y:y-14,alpha:0,delay:700,duration:300,onComplete:()=>t.destroy()});
      return t;
    }
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
      if(now<this.jitterUntil){const p=this.jitterPx;cam.setFollowOffset((this.rand()*2-1)*p,(this.rand()*2-1)*p);}else cam.setFollowOffset(0,0);
      this.updateWorld?.(now);
    }
    // Called from scene.update() only while the real-time sim runs (never from advanceTime).
    realtime(){
      if(this.s.mode==='playing'&&this.unlocks.length&&this.now()>=this.unlockAt&&!this.frozen())this.s.openUnlock(this.unlocks.shift());
    }
  }
  window.SurvivorJuice = SurvivorJuice;
})();
