(() => {
  const TYPES=['salamander','spider','storm'],DASH_TYPES=['cat','owl','beast','frog','mouse','mole','bear',...TYPES],dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  class SurvivorElements {
    constructor(s,owner){this.s=s;this.owner=owner;this.zones=[];this.casts=[];this.links=[];this.slow=0;this.comboClock=0;this.trailClock=0;this.dashStyle='normal';this.dashOrigin=null;this.proc=false;this.stormHits=0;
      for(const id of ['firePower','fireSpeed','fireLife','fireArea','fireSpread','webWeaken','webPower','webSpeed','webCount','webArea','webBurst','stormPower','stormSpeed','stormJumps','stormRange','stormStrike','comboFire','comboWeb','comboStorm','comboShield'])s.upgrades[id]=0;
    }
    has(t){return this.owner.allies[t]?.state==='ally';}
    stats(t){const u=this.s.upgrades;if(t==='salamander')return {damage:3+u.firePower,interval:2.6/(1+.2*u.fireSpeed),radius:Math.min(60,36+6*u.fireArea),life:Math.min(6,3+.5*u.fireLife)};
      if(t==='spider')return {damage:4+u.webPower,tickDamage:1,tickInterval:1,vulnerability:.2+.05*u.webWeaken,interval:3.4/(1+.2*u.webSpeed),radius:Math.min(65,42+5*u.webArea),count:Math.min(4,2+u.webCount)};
      return {damage:4+u.stormPower,interval:2/(1+.2*u.stormSpeed),jumps:Math.min(8,3+u.stormJumps),range:Math.min(240,130+20*u.stormRange)};
    }
    upgrades(){const u=this.s.upgrades,result=[];const add=(id,name,detail,once=false)=>{if(!once||!u[id])result.push({id,name,detail});};
      if(this.has('salamander')){add('firePower','Hot Embers','Burn damage +1');add('fireSpeed','Quick Spit','Fire attacks 20% faster per rank');if(u.fireLife<6)add('fireLife','Lasting Embers','Burning patches last +0.5s');if(u.fireArea<4)add('fireArea','Fire Pool','Patch radius +6');add('fireSpread','Wildfire','Burning kills spread one small fire patch',true);}
      if(this.has('spider')){add('webWeaken','Brittle Silk','Webbed enemies take +5% creature damage');add('webSpeed','Quick Weaver','Web placement 20% faster per rank');if(u.webCount<2)add('webCount','More Silk','Maintain one additional web');if(u.webArea<5)add('webArea','Wide Web','Web radius +5');add('webBurst','Tension Trap','Three enemies in a web trigger a burst',true);}
      if(this.has('storm')){add('stormPower','Charged Scales','Lightning damage +1');add('stormSpeed','Rapid Discharge','Lightning attacks 20% faster per rank');if(u.stormJumps<5)add('stormJumps','Forked Lightning','Lightning hits one additional enemy');if(u.stormRange<6)add('stormRange','Long Arc','Lightning jump range +20');add('stormStrike','Thunderhead','Every third lightning hit calls a strike',true);}
      if(this.has('salamander')&&this.s.encounters.beast?.state==='ally')add('comboFire','Blazing Charge','Salamander + Beast: charge leaves fire',true);
      if(this.has('spider')&&this.s.catActive)add('comboWeb','Silk Ripper','Spider + Cat: swipes burst nearby webs',true);
      if(this.has('storm')&&this.s.owl?.state==='ally')add('comboStorm','Conductive Feathers','Storm + Owl: feather chains lightning (1s CD)',true);
      if(this.has('spider')&&this.s.expedition.frog?.state==='ally')add('comboShield','Sheltering Silk','Spider + Frog: shield blocks leave a web',true);
      return result;
    }
    hostileCount(){return this.zones.filter(z=>z.hostile).length+this.casts.filter(z=>z.hostile).length+this.owner.strikes.filter(z=>z.hostile).length;}
    zone(type,x,y,hostile=false,spread=false){const s=this.s,stats=this.stats(type==='fire'?'salamander':'spider'),same=this.zones.filter(z=>z.type===type&&z.hostile===hostile);
      if(hostile&&(same.length>=2||this.hostileCount()>=4))return false;
      const cap=type==='fire'?6:stats.count;if(!hostile&&same.length>=cap){const old=same[0];this.removeZone(old);}
      if(s.blocked(x,y,hostile?26:12))return false;
      const life=hostile?2.5:type==='fire'?stats.life:4,z={type,x,y,r:hostile?30:stats.radius,hostile,life,total:life,tick:0,spread,sprite:null};
      if(type==='fire')z.sprite=s.add.sprite(x,y,'elementFire').setScale(hostile?3:3.5).setDepth(y+1).setTint(hostile?0xff9955:0xffda88);
      this.zones.push(z);return true;
    }
    removeZone(z){z.sprite?.destroy();this.zones=this.zones.filter(v=>v!==z);}
    cast(type,from,target,hostile=false){if(hostile&&this.hostileCount()>=4)return false;if(this.casts.length>=16)return false;this.casts.push({type,x:target.x,y:target.y,from:{x:from.x,y:from.y},hostile,time:hostile?1.1:.45,total:hostile?1.1:.45,r:hostile?30:36});return true;}
    lightning(from,first,damage=this.stats('storm').damage,count=this.stats('storm').jumps,range=this.stats('storm').range,combo=false){const s=this.s,seen=new Set();let target=first,origin=from;for(let i=0;i<count&&target?.hp>0;i++){seen.add(target);this.links.push({x:origin.x,y:origin.y,tx:target.x,ty:target.y,life:.38,combo});s.burst('elementThunder',target.x,target.y,2.8,.38,combo?0xffdf80:0xa9eeff);const hpBefore=target.hp;this.proc=true;try{s.hit(target,damage,'storm',origin);}finally{this.proc=false;}if(s.upgrades.stormStrike&&target.hp<hpBefore){this.stormHits++;if(this.stormHits%3===0&&this.casts.length<16)this.casts.push({type:'strike',x:target.x,y:target.y,r:36,hostile:false,time:.6,total:.6,from:origin});}origin=target;target=s.combatTargets().filter(t=>t.hp>0&&!seen.has(t)&&dist(origin,t)<range).sort((a,b)=>dist(origin,a)-dist(origin,b))[0];}this.links=this.links.slice(-64);}
    burstWeb(z){const s=this.s;this.removeZone(z);s.burst('fxWhirl',z.x,z.y,2,.35,0xb5faff);for(const e of s.hitTargets())if(e.hp>0&&dist(e,z)<z.r+e.r)s.hit(e,this.stats('spider').damage,'spider',z);}
    catSwipe(from,angle,radius,arc){if(!this.s.upgrades.comboWeb)return;for(const z of [...this.zones]){const a=Math.atan2(z.y-from.y,z.x-from.x),delta=Math.atan2(Math.sin(a-angle),Math.cos(a-angle));if(!z.hostile&&z.type==='web'&&dist(z,from)<radius+z.r&&Math.abs(delta)<arc)this.burstWeb(z);}}
    shieldBlock(){if(this.has('spider')&&this.s.upgrades.comboShield)this.zone('web',this.s.player.x,this.s.player.y);}
    hit(e,source){if(this.proc)return;if(source==='owl'&&this.has('storm')&&this.s.upgrades.comboStorm&&this.comboClock<=0){this.comboClock=1;const target=this.s.combatTargets().filter(t=>t!==e&&t.hp>0&&dist(t,e)<this.stats('storm').range).sort((a,b)=>dist(e,a)-dist(e,b))[0];if(target){this.s.burst('fxHit',e.x,e.y,2.8,.4,0xffdf80);this.lightning(e,target,this.stats('storm').damage,2,this.stats('storm').range,true);}}}
    killed(e){if(this.has('salamander')&&this.s.upgrades.fireSpread&&e.burningUntil>this.s.elapsed&&!e.spreadBurn)this.zone('fire',e.x,e.y,false,true);}
    enemy(e,dt){if(!TYPES.includes(e.type))return false;const s=this.s,p=s.player,d=dist(e,p)||1;
      // Habitat defenders remain local; their attacks are not part of ambient waves.
      const home=s.encounters.nests.find(n=>n.type===e.nest&&!n.destroyed);const point=home&&dist(e,home)>220?home:p;
      if(dist(e,point)>210)s.move(e,(point.x-e.x)/dist(e,point)*e.speed*dt,(point.y-e.y)/dist(e,point)*e.speed*dt);
      if(e.clock<=0&&d<340&&(!home||dist(p,home)<400)){this.cast(e.type==='salamander'?'fire':e.type==='spider'?'web':'strike',e,p,true);e.clock=e.type==='storm'?4.5:5.5;}
      if(d<e.r+p.r)s.encounters.damage(5,e.type+'_contact');return true;
    }
    update(dt){const s=this.s;this.slow=Math.max(0,this.slow-dt);this.comboClock=Math.max(0,this.comboClock-dt);this.trailClock-=dt;
      for(const type of TYPES){const a=this.owner.allies[type];if(!a)continue;s.expedition.capture(a,type,dt);if(a.state!=='ally')continue;this.owner.follow(a,{x:s.player.x-45+TYPES.indexOf(type)*35,y:s.player.y+45},dt);a.attack-=dt*s.attackRate();const target=s.target(a,330);if(a.attack<=0&&target){a.attack=this.stats(type).interval;if(type==='storm')this.lightning(a,target);else this.cast(type==='salamander'?'fire':'web',a,target);}}
      const b=s.encounters.beast;if(s.upgrades.comboFire&&this.has('salamander')&&b?.charge>0&&this.trailClock<=0){this.trailClock=.13;this.zone('fire',b.x,b.y);}
      const due=[];this.casts=this.casts.filter(c=>{c.time-=dt;if(c.time<=0){due.push(c);return false;}return true;});
      for(const c of due){if(c.type==='strike'){s.burst('elementThunder',c.x,c.y,3,.4,c.hostile?0xffb066:0x9beaff);if(c.hostile){if(dist(c,s.player)<c.r+s.player.r)s.encounters.damage(8,'storm_strike');}else for(const e of s.hitTargets())if(e.hp>0&&dist(c,e)<c.r+e.r)s.hit(e,this.stats('storm').damage*2,'storm',c);}else this.zone(c.type,c.x,c.y,c.hostile);}
      for(const z of [...this.zones]){z.life-=dt;if(z.life<=0){this.removeZone(z);continue;}if(z.hostile){if(dist(z,s.player)<z.r+s.player.r){if(z.type==='web')this.slow=.15;else s.encounters.damage(5,'salamander_fire');}}else {const targets=s.hitTargets().filter(e=>e.hp>0&&dist(e,z)<z.r+e.r);if(z.type==='web'){for(const e of targets){e.webUntil=s.elapsed+.2;if(!s.unstoppable(e))e.slowUntil=s.elapsed+.2;}z.tick-=dt;if(z.tick<=0){z.tick=this.stats('spider').tickInterval;for(const e of targets)s.hit(e,this.stats('spider').tickDamage,'spider',z);}if(s.upgrades.webBurst&&targets.length>=3)this.burstWeb(z);}else{z.tick-=dt;if(z.tick<=0){z.tick=.6;for(const e of targets){e.burningUntil=s.elapsed+.7;e.spreadBurn=z.spread;s.hit(e,this.stats('salamander').damage,'salamander',z);}}}}
        if(z.sprite)z.sprite.setFrame(Math.floor(s.elapsed*10)%8).setAlpha(Math.min(1,z.life/.4));
      }
      this.links=this.links.filter(l=>(l.life-=dt)>0);
    }
    recruitDash(type){this.dashStyle=DASH_TYPES.includes(type)?type:'normal';this.s.logEvent('dash_style',{style:this.dashStyle,creature:type});}
    dashStart(){this.dashOrigin={x:this.s.player.x,y:this.s.player.y,style:this.dashStyle};if(this.dashStyle==='spider')this.zone('web',this.s.player.x,this.s.player.y);}
    dashEnd(){const a=this.dashOrigin;if(!a)return;this.dashOrigin=null;const s=this.s,p=s.player,targets=s.hitTargets().filter(e=>e.hp>0),near=(r)=>targets.filter(e=>dist(e,p)<r+e.r);
      if(a.style==='salamander')for(let i=0;i<3;i++)this.zone('fire',a.x+(p.x-a.x)*i/2,a.y+(p.y-a.y)*i/2);
      if(a.style==='storm'){const t=s.target(p,150);if(t)this.lightning(p,t);}
      if(a.style==='cat'){const angle=Math.atan2(p.y-a.y,p.x-a.x);for(const e of near(85)){const delta=Math.atan2(Math.sin(Math.atan2(e.y-p.y,e.x-p.x)-angle),Math.cos(Math.atan2(e.y-p.y,e.x-p.x)-angle));if(Math.abs(delta)<1.1)s.hit(e,3+s.upgrades.claws,'cat',p);}s.burst('fxWhirl',p.x,p.y,2.3,.3,0xb5fff0);}
      if(a.style==='owl'){const t=s.target(p,175);if(t){s.hit(t,3,'owl',p);t.markUntil=s.elapsed+2;s.burst('fxHit',t.x,t.y,2,.35,0xa9f5ff);}}
      if(a.style==='beast'){const dx=p.x-a.x,dy=p.y-a.y,length=Math.hypot(dx,dy)||1;for(const e of targets){const projection=Math.max(0,Math.min(1,((e.x-a.x)*dx+(e.y-a.y)*dy)/(length*length))),x=a.x+dx*projection,y=a.y+dy*projection;if(Math.hypot(e.x-x,e.y-y)<e.r+20)s.hit(e,4,'beast',p);}s.burst('fxWhirl',p.x,p.y,2.5,.3,0xffc49c);}
      if(a.style==='frog'&&!s.shield){s.shield=true;s.burst('fxWater',p.x,p.y,3,.45,0x8ce7ae);s.logEvent('frog_dash_shield');}
      if(a.style==='mouse'){const stats=this.owner.stats('mouse'),pool=this.owner.helperPool;for(const t of near(190).sort((x,y)=>dist(x,p)-dist(y,p)).slice(0,2)){if(this.owner.helpers.length>=24)break;const sprite=s.pooled(pool,'mouse',1.7).setTint(0xb0ffff);this.owner.helpers.push({x:p.x,y:p.y,r:8,target:t,life:2.5,damage:stats.damage,hits:new Set(),sprite});}s.burst('fxDust',p.x,p.y,2,.3,0xb0ffff);}
      if(a.style==='mole'){this.owner.strikes.push({x:p.x,y:p.y,r:65,time:.45,total:.45,source:'mole',damage:5,echo:false});s.burst('fxEarth',p.x,p.y,2,.3,0xc9b9a3);}
      if(a.style==='bear'){for(const e of near(70)){s.hit(e,2,'bear',p);if(e.hp>0&&!e.kind&&!s.unstoppable(e))e.stun=Math.max(e.stun||0,.5);}s.burst('fxEarth',p.x,p.y,3,.4,0xbaffcb);}
    }
    draw(){const s=this.s,g=s.fx;for(const z of this.zones){const color=z.hostile?0xff8455:0x9beaff;g.lineStyle(2,color,Math.min(.85,z.life/.5)).strokeCircle(z.x,z.y,z.r);if(z.type==='web'){for(let i=0;i<8;i++){const a=i*Math.PI/4;g.lineBetween(z.x,z.y,z.x+Math.cos(a)*z.r,z.y+Math.sin(a)*z.r);}g.strokeCircle(z.x,z.y,z.r*.4).strokeCircle(z.x,z.y,z.r*.7);}}
      for(const c of this.casts){g.lineStyle(3,c.hostile?0xff8455:0x9beaff).strokeCircle(c.x,c.y,c.r);g.lineStyle(3,0xffe8a0).beginPath().arc(c.x,c.y,c.r,-Math.PI/2,-Math.PI/2+Math.PI*2*(1-c.time/c.total)).strokePath();if(c.type!=='strike'){const t=1-c.time/c.total,x=c.from.x+(c.x-c.from.x)*t,y=c.from.y+(c.y-c.from.y)*t;g.fillStyle(c.type==='fire'?0xff8d32:0xd4eaff).fillCircle(x,y,5);}}
      for(const l of this.links){const alpha=Math.min(1,l.life/.16),color=l.combo?0xffd369:0x65dfff;
        const path=()=>g.beginPath().moveTo(l.x,l.y).lineTo(l.x+(l.tx-l.x)*.3+8,l.y+(l.ty-l.y)*.3-9).lineTo(l.x+(l.tx-l.x)*.65-8,l.y+(l.ty-l.y)*.65+9).lineTo(l.tx,l.ty).strokePath();
        g.lineStyle(9,color,alpha*.3);path();g.lineStyle(4,color,alpha);path();g.lineStyle(1.5,0xffffff,alpha);path();
        g.lineStyle(2,color,alpha).strokeCircle(l.tx,l.ty,10+12*(1-l.life/.38));g.fillStyle(0xffffff,alpha).fillCircle(l.tx,l.ty,3);
      }
    }
    summary(){return {dashStyle:this.dashStyle,slowed:this.slow>0,zones:this.zones.map(({type,x,y,r,hostile,life})=>({type,x,y,r,hostile,life})),casts:this.casts.map(({type,x,y,r,hostile,time})=>({type,x,y,r,hostile,time})),links:this.links.length};}
    destroy(){for(const z of this.zones)z.sprite?.destroy();}
  }
  window.SurvivorElements=SurvivorElements;
})();
