(() => {
  'use strict';
  // Presentation only. Collections belong to the sim; all animation ages use its clock.
  const LIMITS={ground:32,links:64,warnings:8,sweeps:32,rings:16,rally:1,shots:36,sparks:12};
  const SHEETS=['Ink_Splat','Ink_Pool_Start','Ink_Pool_Loop','Ink_Pool_End','Tentacle_Sweep','Ink_Hit','Charge_Kick','Fire_Pool_Start','Fire_Pool_Loop','Fire_Pool_End','Bite_Impact','Fire_Detonate','Tengu_Feather','Lightning_Link','Zap_Spark','Thunder_Warning','Bubble_Pulse','Bubble_Break','Rally_Motes'];
  const EVENTS={ink:['Ink_Splat',false],inked:['Ink_Hit',true],charge:['Charge_Kick',false],bite:['Bite_Impact',false],detonate:['Fire_Detonate',false],spark:['Zap_Spark',true],strike:['elementThunder',false],shield:['Bubble_Pulse',false],rosterimpact:['fxEarth',false],rosterrush:['fxDust',false]};
  class SurvivorEvolutionFx {
    static sheets=SHEETS;
    constructor(s){this.s=s;this.enabled=true;this.pools={};this.geometry=[];this.reset();this.onReward=e=>{if(e.kind==='abilityfx')this.receive(e);};s.events.on('reward',this.onReward);s.events.once('shutdown',()=>this.destroy());}
    reset(){for(const g of this.geometry||[])g.setVisible(false);for(const pool of Object.values(this.pools||{}))for(const sp of pool)sp.setVisible(false);this.oneShots=[];this.contacts=new WeakMap();this.nearContacts=[];this.ev=this.s.creatures?.evolution;this.rallyAt=null;this.lastHaste=0;this.counts={};}
    has(key){return this.enabled&&this.s.juice.enabled&&this.s.textures.exists(key)&&(!!FX_SHEETS[key]||['elementThunder','fxEarth','fxDust'].includes(key));}
    coversZone(type){return this.has((type==='fire'?'Fire_Pool_':'Ink_Pool_')+'Loop');}
    meta(key){if(FX_SHEETS[key])return FX_SHEETS[key];const t=this.s.textures.get(key),f=t.get(0);return {fw:f.width,fh:f.height,n:t.frameTotal-1,fps:12,ax:f.width/2,ay:f.height/2,visible_w:f.width};}
    duration(key){const m=this.meta(key);return m.n/m.fps;}
    frame(key,age,loop=false){const m=this.meta(key),f=Math.floor(Math.max(0,age)*m.fps);return FX_SHEETS[key]?this.s.juice.frameName(key,loop?f%m.n:Math.min(m.n-1,f)):loop?f%m.n:Math.min(m.n-1,f);}
    sprite(group,key,age,{x,y,scale=1,rotation=0,alpha=1,tint=0xffffff,depth=y+40,loop=false}={}){
      if(!this.has(key))return null;const i=this.counts[group]||0;if(i>=LIMITS[group])return null;this.counts[group]=i+1;
      const pool=this.pools[group]||(this.pools[group]=[]),sp=pool[i]||(pool[i]=this.s.add.sprite(0,0,key)),m=this.meta(key);
      sp.setTexture(key,this.frame(key,age,loop)).setOrigin(m.ax/m.fw,m.ay/m.fh).setPosition(x,y).setScale(scale).setRotation(rotation).setTint(tint).setAlpha(alpha).setDepth(depth).setVisible(true);return sp;
    }
    radiusScale(key,r){const m=this.meta(key);return 2*r/(m.visible_w||m.fw);}
    receive(e){if(this.ev!==this.s.creatures?.evolution)this.reset();if(!this.enabled||!this.s.juice.enabled)return;
      if(e.effect==='rally'){this.rallyAt=this.s.elapsed;return;}
      const config=EVENTS[e.effect];if(!config)return;const [key,contact]=config;if(!this.has(key))return;
      const red=this.s.juice.reduced;if(red&&e.effect!=='ink')return;
      const now=this.s.elapsed;this.oneShots=this.oneShots.filter(f=>now-f.at<this.duration(f.key));
      if(contact){
        if(this.oneShots.filter(f=>f.contact).length>=12)return;
        if(e.target&&typeof e.target==='object'){const last=this.contacts.get(e.target);if(last!=null&&now-last<.1)return;this.contacts.set(e.target,now);}
        else {this.nearContacts=this.nearContacts.filter(v=>now-v.at<.1);if(this.nearContacts.some(v=>Math.hypot(v.x-e.x,v.y-e.y)<12))return;this.nearContacts.push({x:e.x,y:e.y,at:now});}
      }else if(this.oneShots.filter(f=>!f.contact).length>=36)return;
      const scale=e.radius?this.radiusScale(key,e.radius):key==='Charge_Kick'?3*(e.followup?.7:1):key==='elementThunder'?4:3;
      this.oneShots.push({key,x:e.x,y:e.y,at:now,scale,rotation:e.angle||0,contact,ground:e.effect==='ink'||e.effect==='charge',tint:e.tint??(key==='Zap_Spark'||key==='elementThunder'?0x9beaff:key==='Bubble_Pulse'?0xa1dbef:0xffffff),soft:red});
    }
    draw(){const s=this.s,ev=s.creatures?.evolution;if(this.ev!==ev)this.reset();this.counts={};for(const g of this.geometry)g.setVisible(false);for(const pool of Object.values(this.pools))for(const sp of pool)sp.setVisible(false);if(!ev)return;
      // Disabling the renderer never writes gameplay state or consumes gameplay randomness.
      if(!this.enabled||!s.juice.enabled){this.oneShots=[];return;}
      const red=s.juice.reduced,now=s.elapsed;
      for(const z of ev.zones){if(!this.coversZone(z.type))continue;const age=z.total-z.life,prefix=z.type==='fire'?'Fire_Pool_':'Ink_Pool_';
        const preferred=red?'Loop':z.life<.25?'End':age<.2?'Start':'Loop',phase=this.has(prefix+preferred)?preferred:'Loop',key=prefix+phase;
        const phaseAge=phase==='End'?(.25-z.life)*this.duration(key)/.25:phase==='Start'?age*this.duration(key)/.2:age;
        this.sprite('ground',key,phaseAge,{x:z.x,y:z.y,scale:this.radiusScale(key,z.r),depth:z.y-3,loop:phase==='Loop',alpha:red?Math.min(1,age/.15,z.life/.25):1});
      }
      this.drawRoster(ev.roster,red);
      // The sim owns projectile positions/lifetimes; only texture and appearance change here.
      for(const p of ev.projectiles){if(!this.has('Tengu_Feather'))continue;const key='Tengu_Feather',m=this.meta(key);p.sprite.setTexture(key,this.frame(key,now,true)).setOrigin(m.ax/m.fw,m.ay/m.fh).setScale(p.split?1:1.7).setTint(0x9ce9ff).setRotation(Math.atan2(p.dy,p.dx)).setDepth(p.y+25);}
      for(const l of ev.links){const key='Lightning_Link';if(!this.has(key))continue;const dx=l.tx-l.x,dy=l.ty-l.y,d=Math.hypot(dx,dy),sp=this.sprite('links',key,red?0:.25-l.life,{x:l.x,y:l.y,rotation:Math.atan2(dy,dx),tint:0x9beaff,depth:800000000,loop:true,alpha:Math.max(0,l.life/.25)*(red?.55:1)});sp?.setOrigin(0,.5).setScale(d/this.meta(key).fw,2);}
      for(const c of ev.casts){const key='Thunder_Warning';if(this.has(key))this.sprite('warnings',key,red?0:.65-c.time,{x:c.x,y:c.y,scale:this.radiusScale(key,c.r),tint:0x9beaff,depth:c.y-3,loop:true,alpha:red?.6:1});}
      for(const f of ev.fx){const key=f.type==='sweep'?'Tentacle_Sweep':f.type==='ring'?'Bubble_Break':null;if(!key||!this.has(key))continue;
        const age=red?this.duration(key)/2:(f.total-f.life)*this.duration(key)/f.total,scale=f.type==='sweep'?f.r/(this.meta(key).visible_w||this.meta(key).fw):this.radiusScale(key,f.r);
        for(const offset of f.type==='sweep'&&f.rear?[0,Math.PI]:[0])this.sprite(f.type==='sweep'?'sweeps':'rings',key,age,{x:f.x,y:f.y,scale,rotation:(f.angle||0)+offset,tint:f.type==='sweep'?0xccafff:0xa1dbef,depth:f.y+(f.type==='sweep'?40:-3),alpha:red?Math.max(0,f.life/f.total)*.65:1});
      }
      this.oneShots=this.oneShots.filter(f=>now-f.at<this.duration(f.key));
      for(const f of this.oneShots){if(red&&!f.soft)continue;const p=SurvivorWorld.near(s,f),age=now-f.at;this.sprite(f.contact?'sparks':'shots',f.key,f.soft?this.duration(f.key)/2:age,{...f,x:p.x,y:p.y,depth:p.y+(f.ground?-3:40),alpha:f.soft?Math.max(0,1-age/this.duration(f.key)):.95});}
      if(ev.haste>0&&this.has('Rally_Motes')){if(this.lastHaste<=0)this.rallyAt=now;this.sprite('rally','Rally_Motes',red?0:now-(this.rallyAt??now),{x:s.player.x,y:s.player.y,scale:3,depth:s.player.y+25,loop:true,tint:0xf7b750,alpha:Math.min(1,ev.haste/.3)*(red?.5:1)});}this.lastHaste=ev.haste;
    }
    drawRoster(roster,red){if(!roster)return;let index=0;
      for(const [items,warning] of [[roster.fields,false],[roster.blasts,true]])for(const f of items){if(index>=112)break;const g=this.geometry[index]||(this.geometry[index]=this.s.add.graphics());index++;const tint=SurvivorEvolutionRoster.tints[f.source],life=warning?f.time:f.life,alpha=warning?.15:Math.min(.5,life/.4);g.clear().setVisible(true).setDepth(f.y-3).setAlpha(red?alpha*.8:alpha);
        g.fillStyle(tint,1);g.lineStyle(2,tint,1);
        if(f.shape==='line'){const angle=f.angle||0,c=Math.cos(angle),si=Math.sin(angle),half=f.width/2;const points=[{x:f.x-si*half,y:f.y+c*half},{x:f.x+c*f.r-si*half,y:f.y+si*f.r+c*half},{x:f.x+c*f.r+si*half,y:f.y+si*f.r-c*half},{x:f.x+si*half,y:f.y-c*half}];g.fillPoints(points,true);if(!warning)for(let n=0;n<8;n++){const d=f.r*n/7,x=f.x+c*d,y=f.y+si*d;g.fillTriangle(x-5,y+3,x,y-8,x+5,y+3);}}
        else if(f.shape==='cross'){g.fillRect(f.x-f.r,f.y-f.width/2,f.r*2,f.width).fillRect(f.x-f.width/2,f.y-f.r,f.width,f.r*2);if(!warning)for(const sign of [-1,1])for(let n=1;n<=6;n++){const d=sign*f.r*n/6;g.fillTriangle(f.x+d-5,f.y+4,f.x+d,f.y-9,f.x+d+5,f.y+4);g.fillTriangle(f.x-5,f.y+d+4,f.x,f.y+d-9,f.x+5,f.y+d+4);}}
        else if(f.shape==='cleave'){g.slice(f.x,f.y,f.r,f.angle-f.arc,f.angle+f.arc,false);g.fillPath();}
        else {g.fillCircle(f.x,f.y,f.r);if(!warning&&f.kind==='silk'){for(let n=0;n<6;n++){const a=n*Math.PI/3;g.lineBetween(f.x,f.y,f.x+Math.cos(a)*f.r,f.y+Math.sin(a)*f.r);}g.strokeCircle(f.x,f.y,f.r*.55);}else if(!warning&&f.kind==='spores'){for(let n=0;n<10;n++){const a=n*2.4,r=f.r*(.25+.06*n);g.fillCircle(f.x+Math.cos(a)*r,f.y+Math.sin(a)*r,3);}}}
        if(!warning&&f.kind==='fire'&&this.coversZone('fire'))this.sprite('ground','Fire_Pool_Loop',f.total-f.life,{x:f.x,y:f.y,scale:this.radiusScale('Fire_Pool_Loop',f.r),depth:f.y-2,loop:true,alpha:.8});
      }
    }
    summary(){return {missing:SHEETS.filter(key=>!FX_SHEETS[key]||!this.s.textures.exists(key)),pools:{...Object.fromEntries(Object.entries(this.pools).map(([k,v])=>[k,v.length])),geometry:this.geometry.length},visible:Object.values(this.pools).flat().filter(sp=>sp.visible).map(sp=>({key:sp.texture.key,frame:sp.frame.name,depth:sp.depth})),oneShots:this.oneShots.length};}
    destroy(){for(const g of this.geometry)g.destroy();this.geometry=[];this.s.events.off('reward',this.onReward);for(const pool of Object.values(this.pools))for(const sp of pool)sp.destroy();this.pools={};this.oneShots=[];}
  }
  window.SurvivorEvolutionFx=SurvivorEvolutionFx;
})();
