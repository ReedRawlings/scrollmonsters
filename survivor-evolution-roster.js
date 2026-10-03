(() => {
  'use strict';
  const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const ASSETS={bamboo:['Bloom/Tier1/Bamboo','SpriteSheet.png',16],cyclope:['Cyclope','SpriteSheet.png',16],monkeyboxer:['Feral/Tier3/MonkeyBoxerBlue','SpriteSheet.png',28],kappa:['Bloom/Tier3/KappaGreen','SpriteSheet.png',16],heartbloom:['Bloom/Tier3/HeartGreen','SpriteSheet.png',16],spirit:['Arcane/Tier2/Spirit','SpriteSheet.png',16],panda:['Bloom/Tier2/Panda','SpriteSheet.png',16],mushroom:['Bloom/Tier2/Mushroom','mushroom.png',16],trapdoor:['Feral/Tier2/SpiderYellow','SpriteSheet.png',16]};
  const RECIPES=[
    {id:'cyclope',parents:['cat','spider'],name:'Cyclope',hp:80,bonus:'+10% party damage to webbed foes',ability:'Binding silk gathers enemies for a heavy cleave.'},
    {id:'heartbloom',parents:['frog','mouse'],name:'Heart',hp:120,bonus:'8% less damage taken; retains Frog support',ability:'Heart guardians attack foes and absorb hostile shots.'},
    {id:'spirit',parents:['mouse','owl'],name:'Spirit',hp:40,bonus:'+6% party attack speed',ability:'Homing wisps pierce through nearby enemies.'},
    {id:'kappa',parents:['storm','salamander'],name:'Kappa',hp:100,bonus:'8% less damage taken',ability:'Burning lightning charges an expanding storm ring.'},
    {id:'monkeyboxer',parents:['beast','bear'],name:'Monkey Boxer',hp:140,bonus:'+6% party damage',ability:'Charges end in a directional ground-breaking slam.'},
    {id:'panda',parents:['bear','bamboo'],name:'Panda',hp:140,bonus:'10% less damage taken',ability:'Cross tremors raise rows of lingering bamboo spikes.'},
    {id:'mushroom',parents:['bamboo','mole'],name:'Mushroom',hp:80,bonus:'+10% party damage to infected foes',ability:'Burrowing eruptions plant lingering spore patches.'},
    {id:'trapdoor',parents:['mole','spider'],name:'Trapdoor Spider',hp:80,bonus:'+10% party damage to webbed foes',ability:'Eruptions leave webbed craters that gather enemies.'}
  ];
  const UPGRADES={
    bamboo:[['rootPower','Sharp Shoots','Spike damage +10',5],['rootArea','Root Network','Spike lines reach +16 farther',4],['rootLife','Deep Roots','Spikes last +0.5s',4]],
    cyclope:[['cycReach','Long Strands','Cleave radius +15',4],['cycEcho','Second Cut','A follow-up cleave hits the same area',1],['cycSnap','Silk Collapse','Crowded silk bursts for extra damage',1]],
    heartbloom:[['heartGuardians','Heart Guardians','Summon one additional guardian',3],['heartLife','Lasting Love','Guardians last +0.6s',4],['heartRetaliate','Brave Heart','Intercepted shots trigger a retaliatory burst',1]],
    spirit:[['spiritWisps','Wisp Chorus','Summon one additional wisp',3],['spiritPierce','Ghost Passage','Wisps pierce one additional enemy',3],['spiritLife','Soul Feast','Kills extend wisp life, capped at 5s total',1]],
    kappa:[['kappaBurn','Lasting Charge','Burns last +0.5s',4],['kappaRange','Storm Circuit','Lightning jump range +20',4],['kappaBlast','Overload','Storm rings detonate burning targets',1]],
    monkeyboxer:[['boxReach','Seismic Fists','Shockwave reaches +25 farther',4],['boxWidth','Broad Impact','Shockwave width +12',4],['boxEcho','Afterpunch','Slam repeats after a short delay',1]],
    panda:[['pandaReach','Bamboo Rows','Spike rows reach +25 farther',4],['pandaLife','Lasting Grove','Spikes last +0.5s',4],['pandaShatter','Splinter Tremor','A second tremor shatters spikes',1]],
    mushroom:[['mushroomLife','Spore Bed','Spore patches last +0.7s',4],['mushroomSlow','Clinging Spores','Spores slow ordinary enemies',1],['mushroomSpread','Spore Chain','Infected deaths release a small spore patch',1]],
    trapdoor:[['trapArea','Wide Crater','Crater radius +12',4],['trapEcho','Double Ambush','Eruptions repeat after a delay',1],['trapPull','Silk Vortex','Web craters pull ordinary enemies inward',1]]
  };
  const TINT={bamboo:0xa7d990,cyclope:0xd9b0ff,monkeyboxer:0xa4d4ff,kappa:0x83e4cb,heartbloom:0xf3abc9,spirit:0xb6d9ff,panda:0xa8e3ac,mushroom:0xd5a2dd,trapdoor:0xeee2a5};
  class SurvivorEvolutionRoster {
    static assets=ASSETS;static recipes=RECIPES;static upgrades=UPGRADES;static tints=TINT;
    static parents={mouse:['mousePower','mouseCount','mouseSpeed','mouseJump'],mole:['molePower','moleArea','moleSpeed','moleEcho','moleSlow'],bear:['bearPower','bearArea','bearSpeed','bearStun','bearGuard'],spider:['webWeaken','webPower','webSpeed','webCount','webArea','webBurst'],bamboo:['rootPower','rootArea','rootLife']};
    static icons={bamboo:'webArea',cyclope:'sweep',monkeyboxer:'bearStun',kappa:'feather',heartbloom:'bubble',spirit:'feather',panda:'bearArea',mushroom:'moleArea',trapdoor:'webArea'};
    constructor(ev){this.ev=ev;this.s=ev.s;this.fields=[];this.blasts=[];this.missiles=[];this.pool=[];}
    has(type){return type in ASSETS;}
    stats(type){const u=this.s.upgrades,v=this.ev.owner.allies[type]?.inherited||{},n=k=>v[k]||0,roots={rootDamage:20+10*n('rootPower'),rootLife:3+.5*n('rootLife')};
      if(type==='bamboo')return {damage:20+10*u.rootPower,radius:75+16*u.rootArea,width:24,life:3+.5*u.rootLife,interval:2.6};
      if(type==='cyclope')return {damage:60+10*n('claws')+10*n('webPower'),radius:135*(1+.2*n('sweep'))+15*u.cycReach,interval:1.4/(1+.2*n('webSpeed')),fieldRadius:42+5*n('webArea'),fieldDamage:10,life:4,count:Math.min(6,2+n('webCount')),weakness:.2+.05*n('webWeaken'),pull:!!n('pull'),echo:!!u.cycEcho,burst:!!(u.cycSnap||n('webBurst')||n('comboWeb'))};
      if(type==='heartbloom')return {damage:30+10*n('mousePower'),radius:55,interval:3/(1+.2*n('mouseSpeed')),count:Math.min(12,3+n('mouseCount')+u.heartGuardians),life:2.5+.6*u.heartLife,shieldInterval:8/(1+.2*n('bubble')),chorus:n('chorus'),retaliate:!!u.heartRetaliate,jump:!!n('mouseJump')};
      if(type==='spirit')return {damage:30+10*n('mousePower')+10*n('owlPower'),interval:2.8/(1+.2*(n('mouseSpeed')+n('owlSpeed'))),count:Math.min(12,2+n('mouseCount')+n('feather')+u.spiritWisps),pierce:2+u.spiritPierce,life:2.4,marks:!!n('marks'),split:!!n('split'),extend:!!u.spiritLife,jump:!!n('mouseJump')};
      if(type==='kappa')return {damage:40+10*n('stormPower'),fireDamage:30+10*n('firePower'),radius:36+6*n('fireArea'),life:3+.5*(n('fireLife')+u.kappaBurn),interval:2.2/(1+.2*(n('stormSpeed')+n('fireSpeed'))),jumps:Math.min(8,3+n('stormJumps')),range:130+20*(n('stormRange')+u.kappaRange),ring:120,detonate:!!u.kappaBlast,spread:!!n('fireSpread'),strike:!!n('stormStrike')};
      if(type==='monkeyboxer')return {damage:120+20*n('beastPower')+20*n('bearPower'),radius:160+30*n('bearArea')+25*u.boxReach,width:50+12*u.boxWidth,interval:2.6/(1+.2*(n('beastSpeed')+n('bearSpeed'))),stun:.35+.2*n('bearStun'),echo:!!u.boxEcho,slam:!!n('slam'),guard:!!n('bearGuard')};
      if(type==='panda')return {...roots,damage:100+20*n('bearPower'),radius:170+30*n('bearArea')+16*n('rootArea')+25*u.pandaReach,width:32,life:roots.rootLife+.5*u.pandaLife,interval:2.6/(1+.2*n('bearSpeed')),stun:.35+.2*n('bearStun'),guard:!!n('bearGuard'),shatter:!!u.pandaShatter};
      if(type==='mushroom')return {...roots,damage:80+20*n('molePower'),radius:60+12*n('moleArea')+8*n('rootArea'),life:roots.rootLife+.7*u.mushroomLife,interval:2.8/(1+.2*n('moleSpeed')),echo:!!n('moleEcho'),slow:!!(n('moleSlow')||u.mushroomSlow)};
      if(type==='trapdoor')return {damage:80+20*n('molePower')+10*n('webPower'),radius:60+12*n('moleArea')+5*n('webArea')+12*u.trapArea,interval:3/(1+.2*(n('moleSpeed')+n('webSpeed'))),life:4,count:Math.min(8,2+n('webCount')),weakness:.2+.05*n('webWeaken'),echo:!!(n('moleEcho')||u.trapEcho),pull:!!u.trapPull,burst:!!n('webBurst')};
    }
    field(type,point,kind,st,extra={}){const same=this.fields.filter(f=>f.source===type),cap=st.count||8;if(same.length>=cap)this.fields.splice(this.fields.indexOf(same[0]),1);
      this.fields.push({x:point.x,y:point.y,source:type,kind,r:st.radius,damage:st.damage,life:st.life,total:st.life,tick:0,weakness:st.weakness||0,burst:!!st.burst,pull:!!st.pull,slow:st.slow!==false,...extra});}
    effect(effect,type,point,radius,angle=0){this.s.reward('abilityfx',{effect,creature:type,x:point.x,y:point.y,radius,angle,tint:TINT[type]});}
    blast(type,point,st,delay=.12,extra={}){if(this.blasts.length>=40)return;this.blasts.push({source:type,x:point.x,y:point.y,r:st.radius,damage:st.damage,stun:st.stun||0,time:delay,total:delay,...extra});}
    pulse(a,st){const s=this.s;s.shield=true;s.expedition.supportPulses++;if(st.chorus)s.chorusTime=Math.max(s.chorusTime,3);this.effect('shield','heartbloom',s.player,45);for(const p of this.missiles)if(p.source==='heartbloom')p.empowered=2;}
    support(dt,a,type,st){if(type!=='heartbloom')return;a.pulseClock=(a.pulseClock??1)-dt;if(a.pulseClock<=0){a.pulseClock=st.shieldInterval;this.pulse(a,st);}}
    attack(a,type,target,power=1){const s=this.s,st=this.stats(type),scaled={...st,damage:st.damage*power},angle=Math.atan2(target.y-a.y,target.x-a.x);
      if(type==='bamboo')this.field(type,target,'roots',scaled,{shape:'line',angle,width:st.width});
      if(type==='cyclope'){
        this.field(type,target,'silk',{radius:st.fieldRadius,damage:st.fieldDamage*power,life:st.life,count:st.count,weakness:st.weakness,burst:st.burst,pull:true});
        this.blast(type,a,scaled,.25,{shape:'cleave',angle,arc:1.5,echo:st.echo,pull:st.pull});}
      if(type==='monkeyboxer'){const d=dist(a,target)||1;a.rushTime=Math.min(d,230)/440;a.rushDX=(target.x-a.x)/d;a.rushDY=(target.y-a.y)/d;a.rushPower=power;this.effect('rosterrush',type,a,undefined,angle);}
      if(type==='panda'){this.blast(type,a,scaled,.25,{shape:'cross',width:st.width,field:{...st,damage:st.rootDamage*power},shatter:st.shatter});}
      if(type==='mushroom'||type==='trapdoor')this.blast(type,target,scaled,.6,{echo:st.echo,field:{...st,damage:(type==='mushroom'?st.rootDamage:10)*power},kind:type==='mushroom'?'spores':'silk'});
      if(type==='kappa')this.chain(a,target,st,power);
      if(type==='heartbloom'||type==='spirit'){const targets=s.combatTargets().filter(e=>e.hp>0&&dist(a,e)<440);for(let i=0;i<st.count&&this.missiles.length<40;i++)this.missiles.push({source:type,x:a.x,y:a.y,target:targets[i%Math.max(1,targets.length)]||target,life:st.life,age:0,st:scaled,hits:new Set(),empowered:0,sprite:s.pooled(this.pool,type,type==='heartbloom'?1.5:1.8).setTint(TINT[type])});}
    }
    chain(a,first,st,power){const s=this.s,seen=new Set();let origin=a,target=first;
      for(let i=0;i<st.jumps&&target?.hp>0;i++){seen.add(target);this.ev.links.push({x:origin.x,y:origin.y,tx:target.x,ty:target.y,life:.25});target.burningUntil=s.elapsed+.7;s.hit(target,st.damage*power,'kappa',origin);this.field('kappa',target,'fire',{radius:st.radius,damage:st.fireDamage*power,life:st.life});origin=target;target=s.combatTargets().filter(e=>e.hp>0&&!seen.has(e)&&dist(origin,e)<st.range+(s.relics?.stormglassRange(origin)||0)).sort((x,y)=>dist(x,origin)-dist(y,origin))[0];}
      this.ev.links=this.ev.links.slice(-64);a.stormCharge=(a.stormCharge||0)+seen.size;
      if(a.stormCharge>=6){a.stormCharge-=6;this.blast('kappa',a,{radius:st.ring,damage:st.damage*1.5*power},.2,{detonate:st.detonate});this.ev.fx.push({type:'ring',x:a.x,y:a.y,r:st.ring,life:.45,total:.45});}
      a.volleys=(a.volleys||0)+1;if(st.strike&&a.volleys%3===0)this.blast('kappa',first,{radius:60,damage:st.damage*2*power},.65);
    }
    rush(a,dt){if(!(a.rushTime>0))return false;const s=this.s,st=this.stats('monkeyboxer'),step=Math.min(a.rushTime,dt);s.move(a,a.rushDX*440*step,a.rushDY*440*step,false);a.rushTime-=dt;
      if(a.rushTime<=0){const power=a.rushPower??1;this.blast('monkeyboxer',a,{...st,damage:st.damage*power},.1,{shape:'line',angle:Math.atan2(a.rushDY,a.rushDX),width:st.width,echo:st.echo});if(st.slam)this.blast('monkeyboxer',a,{...st,radius:90,damage:st.damage*.4*power},.15);}return true;}
    shieldBlock(){if(this.ev.has('heartbloom')){for(const p of this.missiles)if(p.source==='heartbloom')p.empowered=2;this.effect('shield','heartbloom',this.s.player,55);if(this.ev.owner.allies.heartbloom.inherited?.comboShield&&this.ev.owner.elements.has('spider'))this.ev.owner.elements.zone('web',this.s.player.x,this.s.player.y);}}
    dash(from,power,point){const type=from.style;if(!this.has(type))return false;const st=this.stats(type),s=this.s,target=s.target(point,240)||point;
      if(type==='monkeyboxer')this.blast(type,point,{...st,damage:st.damage*power},.05,{shape:'line',angle:Math.atan2(point.y-from.y,point.x-from.x),width:st.width});
      else {if(type==='heartbloom'){s.shield=true;this.effect('shield',type,point,45);}this.attack({...point,inherited:this.ev.owner.allies[type]?.inherited},type,target,power);}return true;}
    inside(f,e){if(f.shape==='cross')return this.ev.owner.crossHits(f,e,f.r,f.width);const d=dist(f,e);if(f.shape==='line'){const dx=e.x-f.x,dy=e.y-f.y,c=Math.cos(f.angle),si=Math.sin(f.angle),x=dx*c+dy*si,y=-dx*si+dy*c;return x>=-e.r&&x<=f.r+e.r&&Math.abs(y)<=f.width/2+e.r;}if(f.shape==='cleave'){const delta=Math.atan2(Math.sin(Math.atan2(e.y-f.y,e.x-f.x)-f.angle),Math.cos(Math.atan2(e.y-f.y,e.x-f.x)-f.angle));return d<f.r+e.r&&Math.abs(delta)<f.arc;}return d<f.r+e.r;}
    update(dt){const s=this.s;
      for(const f of this.fields){f.life-=dt;f.tick-=dt;const targets=s.hitTargets().filter(e=>e.hp>0&&this.inside(f,e));for(const e of targets){if(f.slow&&!s.unstoppable(e))e.slowUntil=s.elapsed+.2;if(f.kind==='silk'){e.webUntil=s.elapsed+.2;e.evolutionWeakness=f.weakness;}if(f.kind==='spores')e.sporeUntil=s.elapsed+.3;if(f.kind==='fire')e.burningUntil=s.elapsed+.7;if(f.pull&&!s.unstoppable(e)&&!e.kind){const d=dist(e,f)||1;s.move(e,(f.x-e.x)/d*35*dt,(f.y-e.y)/d*35*dt,false);}}
        if(f.tick<=0){f.tick=f.kind==='fire'?.6:1;for(const e of targets)s.hit(e,f.damage,f.source,f);}if(f.burst&&targets.length>=3){f.life=0;this.blast(f.source,f,{radius:f.r,damage:f.damage*4},.05);}}
      this.fields=this.fields.filter(f=>f.life>0);
      const due=[];this.blasts=this.blasts.filter(b=>{b.time-=dt;if(b.time<=0){due.push(b);return false;}return true;});
      for(const b of due){for(const e of s.hitTargets())if(e.hp>0&&this.inside(b,e)){s.hit(e,b.damage*(b.detonate&&e.burningUntil>s.elapsed?1.6:1),b.source,b);if(b.stun&&!s.unstoppable(e))e.stun=Math.max(e.stun||0,b.stun);if(b.pull)s.knockbackEnemy(e);}this.effect('rosterimpact',b.source,b,b.r,b.angle||0);
        if(b.field){this.field(b.source,b,b.kind||'roots',b.field,{shape:b.shape,width:b.width});if(b.shatter)this.blast(b.source,b,{radius:b.r,damage:b.damage*.7},.7,{shape:b.shape,width:b.width,shatterFields:true});}
        if(b.shatterFields)this.fields=this.fields.filter(f=>f.source!==b.source||dist(f,b)>4);
        if(b.echo)this.blast(b.source,b,{radius:b.r,damage:b.damage,stun:b.stun},.5,{...b,time:.5,total:.5,echo:false,field:null});}
      for(const p of this.missiles){p.life-=dt;p.age+=dt;p.empowered=Math.max(0,p.empowered-dt);if(p.life<=0)continue;
        if(p.source==='heartbloom'){const shot=s.encounters.bullets.find(b=>b.life>0&&dist(b,p)<18);if(shot){shot.life=0;if(p.st.retaliate)this.blast(p.source,p,{radius:70,damage:p.st.damage*2},.05);if(p.empowered<=0)p.life=0;continue;}}
        if(!p.target||p.target.hp<=0||p.hits.has(p.target))p.target=s.combatTargets().find(e=>e.hp>0&&!p.hits.has(e)&&dist(p,e)<240);
        if(!p.target){p.life=0;continue;}this.ev.owner.follow(p,p.target,dt,p.source==='spirit'?350:310);
        if(dist(p,p.target)<p.target.r+9){const e=p.target;p.hits.add(e);const hp=e.hp;s.hit(e,p.st.damage*(p.empowered>0?1.3:1),p.source,p);if(hp===e.hp)continue;this.effect('inked',p.source,e);if(p.st.marks)e.markUntil=s.elapsed+3;
          if(p.st.extend&&e.hp<=0)p.life=Math.min(5-p.age,p.life+.6);if(p.st.split&&!p.split&&this.missiles.length<40){p.split=true;this.missiles.push({...p,life:.6,st:{...p.st,damage:p.st.damage*.33,split:false},hits:new Set(p.hits),sprite:s.pooled(this.pool,'spirit',1.2).setTint(TINT.spirit)});}
          const cap=p.source==='spirit'?p.st.pierce+(p.st.jump&&e.hp<=0?1:0):p.st.jump&&e.hp<=0?2:1;if(p.hits.size>=cap)p.life=0;
        }
      }
      this.missiles=this.missiles.filter(p=>{if(p.life>0)return true;p.sprite.setVisible(false);return false;});
    }
    killed(e,source){const s=this.s;if(source==='kappa'&&this.ev.has('kappa')&&this.stats('kappa').spread&&e.burningUntil>s.elapsed&&!e.kappaSpread){e.kappaSpread=true;const st=this.stats('kappa');this.field('kappa',e,'fire',{...st,damage:st.fireDamage,radius:st.radius*.7,life:1.5});}
      if(this.ev.has('mushroom')&&s.upgrades.mushroomSpread&&e.sporeUntil>s.elapsed&&!e.sporeReleased){e.sporeReleased=true;const st=this.stats('mushroom');this.field('mushroom',e,'spores',{...st,damage:st.rootDamage,radius:st.radius*.55,life:1.5});}}
    remove(type){this.fields=this.fields.filter(f=>f.source!==type);}
    draw(){for(const p of this.missiles)p.sprite.setPosition(p.x,p.y).setFrame(Math.floor(this.s.elapsed*6)%4*4).setDepth(p.y+25);}
    summary(){return {fields:this.fields.map(({source,kind,x,y,r,life})=>({source,kind,x,y,r,life})),blasts:this.blasts.length,missiles:this.missiles.length};}
    destroy(){for(const sprite of this.pool)sprite.destroy();}
  }
  window.SurvivorEvolutionRoster=SurvivorEvolutionRoster;
})();
