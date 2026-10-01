(() => {
  const TYPES=['mouse','mole','bear','salamander','spider','storm'],dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  class SurvivorCreatures {
    constructor(s){this.s=s;this.allies={};this.elements=new SurvivorElements(s,this);this.helpers=[];this.helperPool=[];this.strikes=[];this.zones=[];this.damage={mouse:0,mole:0,bear:0,salamander:0,spider:0,storm:0};this.evolution=new SurvivorEvolution(s,this);this.swarmAt=35;this.swarmSize=6;this.waveCounts={mouse:0,mole:0,bear:0};}
    destroy(){this.elements.destroy();this.evolution.destroy();for(const a of Object.values(this.allies))a.sprite.destroy();for(const sp of this.helperPool)sp.destroy();}
    release(type,x,y,ally){const old=this.allies[type];old?.sprite.destroy();this.allies[type]={x,y,r:14,state:ally?'ally':'ready',progress:ally?2.5:0,attack:1,sprite:this.s.add.sprite(x,y,type).setScale(type==='bear'?3.5:3)};}
    stats(type){if(SurvivorEvolution.types.includes(type))return this.evolution.stats(type);if(['salamander','spider','storm'].includes(type))return this.elements.stats(type);const u=this.s.upgrades;if(type==='mouse')return {damage:2+u.mousePower,count:3+u.mouseCount,interval:2.8/(1+.2*u.mouseSpeed)};if(type==='mole')return {damage:8+2*u.molePower,radius:65+12*u.moleArea,interval:2.8/(1+.2*u.moleSpeed)};return {damage:10+2*u.bearPower,radius:180+30*u.bearArea,width:28,interval:2.1/(1+.2*u.bearSpeed)};}
    upgrades(){const entries=[...this.elements.upgrades(),...this.evolution.upgrades()];for(const type of TYPES)if(this.allies[type]?.state==='ally'){const u=this.s.upgrades;if(type==='mouse')entries.push({id:'mousePower',name:'Sharp Nibbles',detail:'Mouse helper damage +1'},{id:'mouseCount',name:'Growing Colony',detail:'Summon +1 temporary mouse'},{id:'mouseSpeed',name:'Scurrying Rhythm',detail:'Mouse summons 20% faster per rank'},...(!u.mouseJump?[{id:'mouseJump',name:'Feeding Frenzy',detail:'Helpers bite a second target after a kill'}]:[]));if(type==='mole')entries.push({id:'molePower',name:'Stonebreaker',detail:'Mole eruption damage +2'},{id:'moleArea',name:'Wide Eruption',detail:'Mole eruption radius +12'},{id:'moleSpeed',name:'Rapid Burrowing',detail:'Mole attacks 20% faster per rank'},...(!u.moleEcho?[{id:'moleEcho',name:'Aftershock',detail:'A second eruption follows the first'}]:[]),...(!u.moleSlow?[{id:'moleSlow',name:'Cracked Ground',detail:'Eruptions leave slowing ground for 2s'}]:[]));if(type==='bear')entries.push({id:'bearPower',name:'Heavy Paws',detail:'Cross damage +2 at center, +1 at tips'},{id:'bearArea',name:'Reaching Tremor',detail:'Cross travels +30 farther in each direction'},{id:'bearSpeed',name:'Steady Rhythm',detail:'Bear slams 20% faster per rank'},{id:'bearStun',name:'Staggering Roar',detail:'Bear slams stagger for +0.2s'},...(!u.bearGuard?[{id:'bearGuard',name:'Safe Ground',detail:'Near Bear: take 25% less damage'}]:[]));}return entries;}
    crossHits(a,e,reach,width){const dx=Math.abs(e.x-a.x),dy=Math.abs(e.y-a.y),r=e.r||0;
      return Math.hypot(Math.max(0,dx-reach),Math.max(0,dy-width/2))<=r||Math.hypot(Math.max(0,dx-width/2),Math.max(0,dy-reach))<=r;
    }
    protection(){const b=this.allies.bear;return this.evolution.protection()*(b?.state==='ally'&&this.s.upgrades.bearGuard&&dist(b,this.s.player)<100?.75:1);}
    follow(a,point,dt,speed=210){const d=dist(a,point)||1;if(d>5)this.s.move(a,(point.x-a.x)/d*Math.min(d,speed*dt),(point.y-a.y)/d*Math.min(d,speed*dt),false);}
    update(dt){const s=this.s;this.elements.update(dt);if(s.mode!=='playing')return;this.evolution.update(dt);if(s.mode!=='playing')return;
      for(const [type,a] of Object.entries(this.allies)){if(['salamander','spider','storm',...SurvivorEvolution.types].includes(type))continue;s.expedition.capture(a,type,dt);if(s.mode!=='playing')return;if(a.state!=='ally')continue;const stats=this.stats(type),targets=s.combatTargets().filter(e=>e.hp>0&&dist(e,s.player)<420);a.attack-=dt*s.attackRate();
        if(type==='bear'){const nearest=targets.filter(e=>!e.kind).sort((x,y)=>dist(x,s.player)-dist(y,s.player))[0],d=nearest?dist(nearest,s.player)||1:1;this.follow(a,nearest?{x:s.player.x+(nearest.x-s.player.x)/d*55,y:s.player.y+(nearest.y-s.player.y)/d*55}:{x:s.player.x-45,y:s.player.y+20},dt);if(a.attack<=0&&targets.some(e=>this.crossHits(a,e,stats.radius,stats.width))){a.attack=stats.interval;this.strikes.push({x:a.x,y:a.y,r:stats.radius,width:stats.width,time:.45,total:.45,source:'bear',damage:stats.damage,shape:'cross',hits:new Set()});}}
        else {if(dist(a,s.player)>65)this.follow(a,s.player,dt);if(a.attack<=0&&targets.length){a.attack=stats.interval;if(type==='mouse'){for(let i=0,count=Math.min(stats.count,24-this.helpers.length);i<count;i++){const t=targets[i%targets.length],sprite=s.pooled(this.helperPool,'mouse',1.7).setTint(0xb0ffff);this.helpers.push({x:a.x,y:a.y,r:8,target:t,life:2.5,damage:stats.damage,hits:new Set(),sprite});}}
          else {const best=targets.reduce((best,e)=>{const count=targets.filter(t=>dist(t,e)<stats.radius).length;return !best||count>best.count?{e,count}:best;},null).e;this.strikes.push({x:best.x,y:best.y,r:stats.radius,time:.7,total:.7,source:'mole',damage:stats.damage,echo:!!s.upgrades.moleEcho});}}
        }
      }
      for(const h of this.helpers){h.life-=dt;if(h.target.hp<=0){h.target=s.combatTargets().find(e=>e.hp>0&&!h.hits.has(e)&&dist(h,e)<220);if(!h.target){h.life=0;continue;}}const target=h.target;this.follow(h,target,dt,310);if(dist(h,target)<target.r+9){h.hits.add(target);s.hit(target,h.damage,'mouse',h);s.burst('fxHit',h.x,h.y,.8,.2,0xb0ffff);if(s.upgrades.mouseJump&&target.hp<=0&&h.hits.size===1){const next=s.combatTargets().find(e=>e.hp>0&&!h.hits.has(e)&&dist(h,e)<160);if(next)h.target=next;else h.life=0;}else h.life=0;}}
      this.helpers=this.helpers.filter(h=>{if(h.life>0)return true;h.sprite.setVisible(false);return false;});
      const echoes=[];for(const a of this.strikes){a.time-=dt;if(a.shape==='cross'){
        const reach=a.r*Math.min(1,1-a.time/a.total);
        for(const e of s.hitTargets())if(e.hp>0&&!a.hits.has(e)&&this.crossHits(a,e,reach,a.width)){
          a.hits.add(e);const falloff=1-.5*Math.min(1,dist(a,e)/a.r);s.hit(e,a.damage*falloff,'bear',a);
          if(!e.kind&&!s.unstoppable(e))e.stun=Math.max(e.stun||0,.35+.2*s.upgrades.bearStun);
          s.burst('fxEarth',e.x,e.y,1.2,.25,0xbaffcb);
        }continue;
      }if(a.time>0)continue;if(a.hostile){if(dist(a,s.player)<a.r+s.player.r)s.encounters.damage(a.damage,a.source);s.burst(a.source==='guardian_eruption'?'guardianBlast':'fxEarth',a.x,a.y,a.source==='guardian_eruption'?3:a.r/22,.45,0xffa080);}else{for(const e of s.hitTargets())if(e.hp>0&&dist(a,e)<a.r+e.r){s.hit(e,a.damage,a.source,a);if(a.source==='bear'&&!e.kind&&!s.unstoppable(e))e.stun=Math.max(e.stun||0,.35+.2*s.upgrades.bearStun);}s.burst('fxEarth',a.x,a.y,a.r/22,.45,0xbaffcb);if(a.source==='mole'&&s.upgrades.moleSlow)this.zones.push({x:a.x,y:a.y,r:a.r,life:2});if(a.echo)echoes.push({...a,time:.5,total:.5,echo:false});}}
      this.strikes=this.strikes.filter(a=>a.time>0).concat(echoes);for(const z of this.zones){z.life-=dt;for(const e of s.enemies)if(e.hp>0&&dist(z,e)<z.r)e.slowUntil=s.elapsed+.15;}this.zones=this.zones.filter(z=>z.life>0);
      if(s.isExpedition&&s.elapsed>=this.swarmAt&&s.elapsed<1140&&!s.encounters.bossPressure()){this.swarmAt=s.elapsed+22+8*s.rand();const requested=this.swarmSize++,first=s.enemies.length<s.enemyCap?s.spawn('mouse'):null;if(first){let count=1;for(let i=1;i<requested&&s.enemies.length<s.enemyCap;i++){for(let attempt=0;attempt<24;attempt++){const a=i*2.4+attempt,r=18*Math.sqrt(i)*(1-attempt/24),x=first.x+Math.cos(a)*r,y=first.y+Math.sin(a)*r;if(SurvivorWorld.offscreen(s,{x,y},32)&&!s.blocked(x,y,10)){const mouse=s.spawn('mouse',x,y);if(mouse){mouse.placedSpawn=false;count++;}break;}}}s.logEvent('mouse_swarm',{count,requested});}}
    }
    enemy(e,dt){if(this.evolution.enemy(e,dt)||this.elements.enemy(e,dt))return true;const s=this.s,p=s.player,d=dist(e,p)||1;
      if(e.type==='cat'){if(e.phase==='swipe'){if(e.clock<=0){if(dist(e,p)<70+p.r)s.encounters.damage(7,'cat_swipe');s.burst('fxWhirl',e.x,e.y,2,.3,0xffad80);e.phase='seek';e.clock=1.8;}}else if(d<85&&e.clock<=0){e.phase='swipe';e.clock=.65;}else if(d>45)s.move(e,(p.x-e.x)/d*e.speed*dt,(p.y-e.y)/d*e.speed*dt);if(d<e.r+p.r)s.encounters.damage(4,'cat_contact');return true;}
      if(e.type==='frog'){if(d>180)s.move(e,(p.x-e.x)/d*e.speed*dt,(p.y-e.y)/d*e.speed*dt);if(e.clock<=0){e.clock=6;const allies=s.enemies.filter(t=>t.hp>0&&!s.unstoppable(t)&&dist(e,t)<120).sort((a,b)=>dist(e,a)-dist(e,b)).slice(0,3);for(const t of allies)t.enemyShield=true;s.burst('fxWater',e.x,e.y,3,.45,0xffad80);}if(d<e.r+p.r)s.encounters.damage(4,'frog_contact');return true;}
      if(e.type==='bear'){
        if(e.phase==='slam'){if(e.clock<=0){e.phase='spin';e.clock=.7;e.spinHit=false;}}
        else if(e.phase==='spin'){if(e.clock<=0){e.phase='seek';e.clock=2.8;}}
        else if(d<115&&e.clock<=0){e.phase='slam';e.clock=1;}
        else if(d>65)s.move(e,(p.x-e.x)/d*e.speed*dt,(p.y-e.y)/d*e.speed*dt);
        if(e.phase==='spin'&&!e.spinHit&&d<85+p.r&&p.inv<=0){e.spinHit=true;s.encounters.damage(12,'gladiator_spin');}
        else if(e.phase!=='spin'&&d<e.r+p.r)s.encounters.damage(9,'gladiator_contact');return true;
      }
      if(e.type==='mole'){if(d>310)s.move(e,(p.x-e.x)/d*e.speed*dt,(p.y-e.y)/d*e.speed*dt);if(e.clock<=0&&d<550){if(this.elements.hostileCount()<4&&this.strikes.filter(a=>a.hostile&&a.source==='mole_eruption').length<3)this.strikes.push({x:p.x,y:p.y,r:58,time:1.25,total:1.25,hostile:true,source:'mole_eruption',damage:9});e.clock=s.elapsed>=570?6:4;s.logEvent('mole_targeted',{x:Math.round(p.x),y:Math.round(p.y)});}if(d<e.r+p.r)s.encounters.damage(6,'mole_contact');return true;}return false;}
    draw(){this.elements.draw();this.evolution.draw();const s=this.s,g=s.fx;for(const [type,a] of Object.entries(this.allies)){a.sprite.setPosition(a.x,a.y).setFrame(Math.floor(s.elapsed*6)%4*4).setDepth(a.y+20);if(type==='bear'&&a.state==='ally'&&s.upgrades.bearGuard)g.lineStyle(2,0x99eac1,.5).strokeCircle(a.x,a.y,100);}
      for(const h of this.helpers)h.sprite.setPosition(h.x,h.y).setFrame(Math.floor(s.elapsed*10)%4*4).setDepth(h.y+25);
      for(const e of s.enemies){if(e.enemyShield&&e.hp>0)g.lineStyle(2,0xffad80,.9).strokeCircle(e.x,e.y,e.r+7);if(e.type==='cat'&&e.hp>0&&e.phase==='swipe')g.lineStyle(3,0xff7c52).strokeCircle(e.x,e.y,70);}
      for(const e of s.enemies)if(e.type==='bear'&&e.hp>0&&e.phase==='slam')g.lineStyle(3,0xff7c52,.9).strokeCircle(e.x,e.y,85);
      for(const a of this.strikes){if(a.shape==='cross'){
        const reach=a.r*Math.min(1,1-a.time/a.total),half=a.width/2;
        g.fillStyle(0xbaffcb,.22).fillRect(a.x-reach,a.y-half,reach*2,a.width).fillRect(a.x-half,a.y-reach,a.width,reach*2);
        g.lineStyle(2,0xbaffcb,.9).strokeRect(a.x-reach,a.y-half,reach*2,a.width).strokeRect(a.x-half,a.y-reach,a.width,reach*2);
        g.lineStyle(4,0xffffff,.9);for(const sign of [-1,1]){g.lineBetween(a.x+sign*reach,a.y-half,a.x+sign*reach,a.y+half);g.lineBetween(a.x-half,a.y+sign*reach,a.x+half,a.y+sign*reach);}continue;
      }g.fillStyle(a.hostile?0xff673f:0x8ee0df,.12).fillCircle(a.x,a.y,a.r);g.lineStyle(3,a.hostile?0xff673f:0x8ee0df,.9).strokeCircle(a.x,a.y,a.r);g.lineStyle(4,a.hostile?0xffd36b:0xffffff).beginPath().arc(a.x,a.y,a.r,-Math.PI/2,-Math.PI/2+Math.PI*2*(1-a.time/a.total)).strokePath();}
      for(const z of this.zones)g.lineStyle(2,0xbbe19c,z.life/3).strokeCircle(z.x,z.y,z.r);
    }
    ui(w,h){}
    summary(){return {evolution:this.evolution.summary(),elements:this.elements.summary(),damage:{...this.damage},allies:Object.fromEntries(Object.entries(this.allies).map(([k,a])=>[k,{x:a.x,y:a.y,state:a.state,progress:a.progress,stats:this.stats(k)}])),helpers:this.helpers.length,strikes:this.strikes.map(({x,y,r,width,shape,time,source,hostile})=>({x,y,r,width,shape,time,source,hostile:!!hostile})),zones:this.zones.length,waves:{...this.waveCounts}};}
  }
  window.SurvivorCreatures=SurvivorCreatures;
})();
