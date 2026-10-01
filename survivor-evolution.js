(() => {
  'use strict';
  const ROOT='assets/Ninja Adventure - Asset Pack/Actor/Monsters/';
  const ASSETS={mollusc:['Mollusc','Mollusc.png',16],octopus:['Octopus','SpriteSheet.png',16],reptile:['Feral/Tier2/Reptile','Reptile.png',16],tengu:['Arcane/Tier2/Tengu','SpriteSheet.png',28],axolotl:['Axolot','SpriteSheet.png',16]};
  const RECIPES=[
    {id:'octopus',parents:['cat','mollusc'],name:'Octopus',hp:8,bonus:'Slowed foes take +15% party damage',ability:'Tentacle sweeps spread slowing ink.'},
    {id:'reptile',parents:['salamander','beast'],name:'Reptile',hp:12,bonus:'+6% party damage',ability:'Charges leave fire and end in a heavy bite.'},
    {id:'tengu',parents:['owl','storm'],name:'Tengu',hp:4,bonus:'+6% party attack speed',ability:'Piercing feathers chain lightning on impact.'},
    {id:'axolotl',parents:['frog','mollusc'],name:'Axolotl',hp:12,bonus:'10% damage reduction; retains Frog support',ability:'Shield pulses burst into slowing ink when blocked.'}
  ];
  const PARENT_UPGRADES={cat:['claws','sweep','pull'],mollusc:['inkPower','inkArea','inkLife'],salamander:['firePower','fireSpeed','fireLife','fireArea','fireSpread'],beast:['beastPower','beastSpeed','slam'],owl:['owlPower','owlSpeed','feather','split','marks'],storm:['stormPower','stormSpeed','stormJumps','stormRange','stormStrike'],frog:['bubble','chorus','frogPower']};
  const UPGRADES={
    mollusc:[['inkPower','Dark Ink','Ink damage +1',5],['inkArea','Spreading Ink','Ink radius +8',4],['inkLife','Lingering Ink','Ink lasts +0.5s',4]],
    octopus:[['octoRear','Backhand Sweep','Also sweep behind Octopus',1],['octoPool','Ink Flood','Ink radius +10',4],['octoCrush','Squeezing Grip','Tentacles deal +25% damage to inked foes per rank',3]],
    reptile:[['reptileTrail','Blazing Wake','Fire trail radius +8',4],['reptileBite','Explosive Bite','Bites detonate burning targets',1],['reptileRush','Double Charge','Follow each charge with one shorter charge',1]],
    tengu:[['tenguVolley','Storm Feathers','Fire one additional feather',3],['tenguJumps','Conductive Plumage','Lightning hits one additional enemy',3],['tenguStorm','Gathering Storm','Every third volley calls a delayed thunder strike',1]],
    axolotl:[['axoPulse','Bubble Rhythm','Shield pulses 20% faster per rank',4],['axoRing','Ink Halo','Shield-break ink radius +15',4],['axoHaste','Bubble Rally','Shield breaks grant 3s of +30% party attack speed',1]]
  };
  const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  class SurvivorEvolution {
    static recipes=RECIPES;
    static types=Object.keys(ASSETS);
    static evolved=RECIPES.map(r=>r.id);
    static preload(s){for(const [type,entries] of Object.entries(UPGRADES))for(const [id] of entries)s.load.image('upgrade_'+id,'assets/icons/upgrades/'+({mollusc:'webArea',octopus:'sweep',reptile:'slam',tengu:'feather',axolotl:'bubble'}[type])+'.png');for(const [id,[dir,file,height]] of Object.entries(ASSETS)){s.load.spritesheet(id,ROOT+dir+'/'+file,{frameWidth:16,frameHeight:height});s.load.image('face_'+id,ROOT+dir+'/Faceset.png');}}
    constructor(s,owner){this.s=s;this.owner=owner;this.pending=null;this.zones=[];this.projectiles=[];this.projectilePool=[];this.links=[];this.casts=[];this.haste=0;this.fx=[];this.merges=[];this.discovered=[];
      try{const v=JSON.parse(localStorage.getItem('scrollmonsters-evolutions-v1')||'[]');if(Array.isArray(v))this.discovered=v.filter(id=>SurvivorEvolution.evolved.includes(id));}catch{}
      for(const [type,entries] of Object.entries(UPGRADES)){this.owner.damage[type]=0;for(const [id] of entries)s.upgrades[id]=0;}
    }
    has(id){return this.owner.allies[id]?.state==='ally';}
    recipe(id){return RECIPES.find(r=>r.id===id);}
    options(type){const party=this.s.expedition.party();return RECIPES.filter(r=>r.parents.includes(type)&&!party.includes(r.id)&&r.parents.some(t=>t!==type&&party.includes(t)));}
    offer(type,body){if(!this.s.isExpedition)return false;const options=this.options(type);if(!options.length&&this.s.expedition.party().length<3)return false;
      this.pending={type,body,options:options.map(r=>r.id),openedAt:this.s.juice.now()};body.state='pending';this.s.mode='merge';this.s.joy=null;this.s.input.keyboard.resetKeys();this.s.accumulator=0;this.s.reward('mergeoffer',this.preview());return true;
    }
    preview(){const p=this.pending;if(!p)return null;return {captured:p.type,canRecruit:this.s.expedition.party().length<3,options:p.options.map(id=>{const r=this.recipe(id),partner=r.parents.find(t=>t!==p.type);return {...r,partner,inherited:Object.fromEntries((PARENT_UPGRADES[partner]||[]).filter(k=>this.s.upgrades[k]>0).map(k=>[k,this.s.upgrades[k]]))};})};}
    choose(choice){const p=this.pending,s=this.s;if(!p||s.mode!=='merge')return false;
      if(choice==='recruit'&&s.expedition.party().length>=3)return false;
      const r=this.recipe(choice);if(choice!=='recruit'&&choice!=='leave'&&(!r||!this.options(p.type).some(v=>v.id===choice)))return false;
      // Clear pending first: double clicks and presentation callbacks cannot grant twice.
      this.pending=null;s.mode='playing';
      if(r){const partner=r.parents.find(t=>t!==p.type),inherited={};
        for(const t of r.parents)for(const id of PARENT_UPGRADES[t]||[]){inherited[id]=s.upgrades[id]||0;s.upgrades[id]=0;}
        // Pair upgrades carry into their corresponding combined attack. Cross-pair upgrades remain available to the inherited attack.
        for(const id of choice==='reptile'?['comboFire']:choice==='tengu'?['comboStorm']:choice==='octopus'?['comboWeb']:['comboShield']){inherited[id]=s.upgrades[id]||0;s.upgrades[id]=0;}
        this.remove(partner);s.expedition.dismissCapture(p.type,{...p.body,state:'ready'});
        this.owner.release(choice,p.body.x,p.body.y,true);const a=this.owner.allies[choice];a.inherited=inherited;a.attack=.3;a.pulseClock=1;
        this.recalculateHealth();s.creatures.elements.recruitDash(choice);
        s.expedition.completeCapture(p.body,p.type,'merge');
        if(!this.discovered.includes(choice)){this.discovered.push(choice);try{localStorage.setItem('scrollmonsters-evolutions-v1',JSON.stringify(this.discovered));}catch{s.unlockError=true;}}
        const event={parents:[...r.parents],result:choice,inherited:{...inherited},partyBonus:{hp:r.hp,description:r.bonus},x:a.x,y:a.y};this.merges.push(event);s.logEvent('creature_merged',event);s.reward('merge',event);
        
      }else if(choice==='recruit')s.expedition.completeCapture(p.body,p.type,'recruit');
      else {s.expedition.dismissCapture(p.type,{...p.body,state:'ready'});s.expedition.completeCapture(p.body,p.type,'leave');}
      s.joy=null;s.input.keyboard.resetKeys();s.accumulator=0;s.saveRun();s.draw();return true;
    }
    remove(type){const s=this.s;
      if(type==='cat')s.catActive=false;else if(type==='owl'){s.owl=null;s.shots=s.shots.filter(v=>{if(v.source!=='owl')return true;v.sprite.setVisible(false);return false;});}
      else if(type==='beast')s.encounters.beast=null;else if(type==='frog')s.expedition.frog=null;
      else {this.owner.allies[type]?.sprite.destroy();delete this.owner.allies[type];}
      // Finish existing effects before consuming their upgrade state, rather than leaving orphaned damage sources.
      if(type==='salamander'||type==='storm'){const el=this.owner.elements;for(const z of [...el.zones])if(!z.hostile&&type==='salamander'&&z.type==='fire')el.removeZone(z);el.casts=el.casts.filter(c=>c.hostile||c.type!==(type==='salamander'?'fire':'strike'));}
      if(type==='mollusc')this.zones=this.zones.filter(z=>z.source!=='mollusc');
    }
    recalculateHealth(){const s=this.s,next=RECIPES.filter(r=>this.has(r.id)).reduce((v,r)=>v+r.hp,0),difference=next-(this.healthBonus||0);this.healthBonus=next;s.maxHp+=difference;s.player.hp=Math.max(0,Math.min(s.maxHp,s.player.hp+Math.max(0,difference)));}
    partyDamage(e){return 1+(this.has('reptile')?.06:0)+(this.has('octopus')&&e.slowUntil>this.s.elapsed?.15:0);}
    tempo(){return (this.has('tengu')?.06:0)+(this.haste>0?.3:0);}
    protection(){return this.has('axolotl')?.9:1;}
    frogSupport(){return this.has('axolotl')?this.owner.allies.axolotl.inherited||{}:null;}
    stats(type){const u=this.s.upgrades,a=this.owner.allies[type],v=a?.inherited||{},n=k=>v[k]||0;
      if(type==='mollusc')return {damage:2+u.inkPower,interval:2.6,radius:44+8*u.inkArea,life:3+.5*u.inkLife};
      if(type==='octopus')return {damage:5+n('claws'),interval:.85,radius:140*(1+.2*n('sweep')),inkDamage:2+n('inkPower'),inkRadius:48+8*n('inkArea')+10*u.octoPool,life:3+.5*n('inkLife'),rear:!!u.octoRear,pull:!!n('pull'),crush:.25*u.octoCrush};
      if(type==='reptile')return {damage:7+2*n('beastPower'),bite:8+n('beastPower'),interval:2/(1+.2*(n('beastSpeed')+n('fireSpeed'))),fireDamage:3+n('firePower'),radius:30+6*n('fireArea')+8*u.reptileTrail,life:3+.5*n('fireLife'),slam:!!n('slam'),spread:!!n('fireSpread'),rush:!!u.reptileRush,explode:!!u.reptileBite};
      if(type==='tengu')return {damage:4+n('owlPower'),lightning:(3+n('stormPower'))*(n('comboStorm')?1.2:1),interval:1.5/(1+.2*(n('owlSpeed')+n('stormSpeed'))),count:Math.min(12,1+n('feather')+u.tenguVolley),jumps:Math.min(8,2+n('stormJumps')+u.tenguJumps),range:130+20*n('stormRange'),marks:!!n('marks'),split:!!n('split'),strike:!!(n('stormStrike')||u.tenguStorm)};
      return {damage:2+n('inkPower'),interval:2.6,radius:48+8*n('inkArea'),life:3+.5*n('inkLife'),shieldInterval:8/(1+.2*(n('bubble')+u.axoPulse)),ring:100+15*u.axoRing,chorus:n('chorus')};
    }
    upgrades(){return Object.entries(UPGRADES).flatMap(([type,list])=>this.has(type)?list.filter(([id,,,cap])=>this.s.upgrades[id]<cap).map(([id,name,detail])=>({id,name,detail,owner:type})):[]);}
    ownerOf(id){return Object.keys(UPGRADES).find(t=>UPGRADES[t].some(v=>v[0]===id));}
    zone(type,point,source,stats,power=1){const same=this.zones.filter(z=>z.source===source);if(same.length>=8)this.zones.splice(this.zones.indexOf(same[0]),1);
      this.zones.push({type,source,x:point.x,y:point.y,r:stats.radius,life:stats.life,total:stats.life,tick:0,damage:stats.damage*power});if(type==='ink')this.s.reward('abilityfx',{creature:source,effect:'ink',x:point.x,y:point.y,radius:stats.radius});
    }
    ink(point,source,power=1){const st=this.stats(source);this.zone('ink',point,source,{radius:st.inkRadius||st.radius,life:st.life,damage:st.inkDamage||st.damage},power);}
    sweep(a,angle,power=1){const s=this.s,st=this.stats('octopus'),v=a.inherited||{},arc=Math.min(Math.PI,1.4+.2*(v.sweep||0));
      for(const e of s.hitTargets()){const delta=Math.abs(Math.atan2(Math.sin(Math.atan2(e.y-a.y,e.x-a.x)-angle),Math.cos(Math.atan2(e.y-a.y,e.x-a.x)-angle)));if(e.hp<=0||dist(e,a)>st.radius+e.r||!(delta<=arc||(st.rear&&delta>=Math.PI-arc)))continue;
        s.hit(e,st.damage*power*(e.inkUntil>s.elapsed?1+st.crush:1),'octopus',a);if(e.inkUntil>s.elapsed)s.reward('abilityfx',{creature:'octopus',effect:'inked',x:e.x,y:e.y,target:e});if(st.pull)s.knockbackEnemy(e);
      }
      for(const sign of st.rear?[1,-1]:[1])this.ink({x:a.x+Math.cos(angle)*st.radius*.65*sign,y:a.y+Math.sin(angle)*st.radius*.65*sign},'octopus',power);
      if(v.comboWeb)for(const z of [...this.owner.elements.zones])if(!z.hostile&&z.type==='web'&&dist(z,a)<st.radius+z.r)this.owner.elements.burstWeb(z,power);
      this.fx.push({type:'sweep',x:a.x,y:a.y,angle,r:st.radius,arc,rear:st.rear,life:.3,total:.3});s.reward('abilityfx',{creature:'octopus',effect:'sweep',x:a.x,y:a.y,angle,radius:st.radius});
    }
    charge(a,target,followup=false){const d=dist(a,target)||1;a.dx=(target.x-a.x)/d;a.dy=(target.y-a.y)/d;a.charge=Math.min(followup?130:245,d+25)/430;a.hits=new Set();a.trailClock=0;a.followup=followup;this.s.reward('abilityfx',{creature:'reptile',effect:'charge',x:a.x,y:a.y,angle:Math.atan2(a.dy,a.dx),followup});}
    bite(a){const s=this.s,st=this.stats('reptile');for(const e of s.hitTargets())if(e.hp>0&&dist(e,a)<70+e.r){const burning=e.burningUntil>s.elapsed;s.hit(e,st.bite,'reptile',a);if(st.explode&&burning){s.reward('abilityfx',{creature:'reptile',effect:'detonate',x:e.x,y:e.y,radius:75});for(const t of s.hitTargets())if(t!==e&&t.hp>0&&dist(t,e)<75+t.r)s.hit(t,st.bite*.5,'reptile',e);}}
      if(st.slam)for(const e of s.hitTargets())if(e.hp>0&&dist(e,a)<105+e.r)s.hit(e,3.2+(a.inherited?.beastPower||0),'reptile',a);
      s.reward('abilityfx',{creature:'reptile',effect:'bite',x:a.x,y:a.y,radius:70});
    }
    feather(a,target,stats){const angle=Math.atan2(target.y-a.y,target.x-a.x);for(let i=0;i<stats.count&&this.projectiles.length<40;i++){const an=angle+(i-(stats.count-1)/2)*.15;this.projectiles.push({x:a.x,y:a.y,dx:Math.cos(an),dy:Math.sin(an),life:1.3,hits:new Set(),stats,sprite:this.s.pooled(this.projectilePool,'feather',1.7).setTint(0x9ce9ff)});}
      a.volleys=(a.volleys||0)+1;if(stats.strike&&a.volleys%3===0&&this.casts.length<8)this.casts.push({x:target.x,y:target.y,r:60,time:.65,damage:stats.lightning*2});
    }
    lightning(from,first,st,power=1){let target=first,origin=from;const seen=new Set();for(let i=0;i<st.jumps&&target?.hp>0;i++){seen.add(target);this.links.push({x:origin.x,y:origin.y,tx:target.x,ty:target.y,life:.25});this.s.hit(target,st.lightning*power,'tengu',origin);origin=target;const range=st.range+(this.s.relics?.stormglassRange(target)||0);target=this.s.combatTargets().filter(e=>e.hp>0&&!seen.has(e)&&dist(origin,e)<range).sort((a,b)=>dist(origin,a)-dist(origin,b))[0];}this.links=this.links.slice(-64);}
    shieldBlock(){if(!this.has('axolotl'))return;const s=this.s,st=this.stats('axolotl');this.zone('ink',s.player,'axolotl',{radius:st.ring,life:st.life,damage:st.damage});if(s.upgrades.axoHaste){this.haste=3;s.reward('abilityfx',{creature:'axolotl',effect:'rally',x:s.player.x,y:s.player.y});}
      if(this.owner.allies.axolotl.inherited?.comboShield&&this.owner.elements.has('spider'))this.owner.elements.zone('web',s.player.x,s.player.y);
      this.fx.push({type:'ring',x:s.player.x,y:s.player.y,r:st.ring,life:.45,total:.45});s.reward('abilityfx',{creature:'axolotl',effect:'shieldbreak',x:s.player.x,y:s.player.y,radius:st.ring});
    }
    update(dt){const s=this.s;this.haste=Math.max(0,this.haste-dt);
      for(const type of SurvivorEvolution.types){const a=this.owner.allies[type];if(!a)continue;s.expedition.capture(a,type,dt);if(s.mode!=='playing')return;if(a.state!=='ally')continue;const st=this.stats(type);a.attack-=dt*s.attackRate();
        if(type==='reptile'&&a.charge>0){const step=Math.min(dt,a.charge);s.move(a,a.dx*430*step,a.dy*430*step,false);a.charge-=dt;a.trailClock-=dt;
          if(a.trailClock<=0){a.trailClock=.12;this.zone('fire',a,'reptile',{radius:st.radius,life:st.life,damage:st.fireDamage*(a.inherited?.comboFire?1.2:1)});}
          for(const e of s.hitTargets())if(e.hp>0&&!a.hits.has(e)&&dist(a,e)<e.r+26){a.hits.add(e);s.hit(e,st.damage,'reptile',a);}
          if(a.charge<=0){this.bite(a);const next=s.target(a,200);if(st.rush&&!a.followup&&next)this.charge(a,next,true);}continue;
        }
        this.owner.follow(a,{x:s.player.x-45+SurvivorEvolution.types.indexOf(type)*22,y:s.player.y+48},dt);
        if(type==='axolotl'){a.pulseClock=(a.pulseClock??1)-dt;if(a.pulseClock<=0){a.pulseClock=st.shieldInterval;s.shield=true;s.expedition.supportPulses++;if(st.chorus)s.chorusTime=3;s.reward('abilityfx',{creature:type,effect:'shield',x:s.player.x,y:s.player.y});}}
        const target=s.target(a,type==='octopus'?st.radius:360);if(a.attack>0||!target)continue;a.attack=st.interval;
        if(type==='octopus')this.sweep(a,Math.atan2(target.y-a.y,target.x-a.x));else if(type==='reptile')this.charge(a,target);else if(type==='tengu')this.feather(a,target,st);else this.ink(target,type);
      }
      for(const z of this.zones){z.life-=dt;z.tick-=dt;const targets=s.hitTargets().filter(e=>e.hp>0&&dist(e,z)<z.r+e.r);for(const e of targets){if(z.type==='ink'){e.inkUntil=s.elapsed+.2;if(!s.unstoppable(e))e.slowUntil=s.elapsed+.2;}else e.burningUntil=s.elapsed+.7;}
        if(z.tick<=0){z.tick=z.type==='fire'?.6:1;for(const e of targets)s.hit(e,z.damage,z.source,z);}
      }this.zones=this.zones.filter(z=>z.life>0);
      for(const p of this.projectiles){p.life-=dt;p.x+=p.dx*380*dt;p.y+=p.dy*380*dt;if(s.blocked(p.x,p.y,3,true))p.life=0;if(p.life<=0)continue;
        for(const e of s.hitTargets())if(e.hp>0&&!p.hits.has(e)&&dist(e,p)<e.r+7){p.hits.add(e);const hp=e.hp;s.hit(e,p.stats.damage,'tengu',p);if(e.hp===hp)continue;s.reward('abilityfx',{creature:'tengu',effect:'spark',x:e.x,y:e.y,target:e});if(p.stats.marks)e.markUntil=s.elapsed+3;
          const next=s.combatTargets().filter(t=>t!==e&&t.hp>0&&dist(t,e)<p.stats.range).sort((a,b)=>dist(a,e)-dist(b,e))[0];if(next)this.lightning(e,next,p.stats);
          if(p.stats.split&&!p.split&&this.projectiles.length<40){p.split=true;for(const off of [-.55,.55]){const an=Math.atan2(p.dy,p.dx)+off;this.projectiles.push({...p,dx:Math.cos(an),dy:Math.sin(an),life:.5,hits:new Set(p.hits),stats:{...p.stats,damage:p.stats.damage*.33,lightning:p.stats.lightning*.33,split:false},sprite:s.pooled(this.projectilePool,'feather',1).setTint(0x9ce9ff)});}}
          if(p.hits.size>=3){p.life=0;break;}
        }
      }this.projectiles=this.projectiles.filter(p=>{if(p.life>0)return true;p.sprite.setVisible(false);return false;});
      for(const c of this.casts){c.time-=dt;if(c.time<=0){for(const e of s.hitTargets())if(e.hp>0&&dist(e,c)<c.r+e.r)s.hit(e,c.damage,'tengu',c);s.reward('abilityfx',{creature:'tengu',effect:'strike',x:c.x,y:c.y,radius:c.r});}}
      this.casts=this.casts.filter(c=>c.time>0);this.links=this.links.filter(l=>(l.life-=dt)>0);this.fx=this.fx.filter(f=>(f.life-=dt)>0);
    }
    killed(e,source){const a=this.owner.allies.reptile;if(source==='reptile'&&a&&this.stats('reptile').spread&&e.burningUntil>this.s.elapsed&&!e.evolutionSpread){e.evolutionSpread=true;const st=this.stats('reptile');this.zone('fire',e,'reptile',{radius:st.radius*.7,life:1.5,damage:st.fireDamage});}}
    enemy(e,dt){if(e.type!=='mollusc')return false;const s=this.s,d=dist(e,s.player)||1;if(d>160)s.move(e,(s.player.x-e.x)/d*e.speed*dt,(s.player.y-e.y)/d*e.speed*dt);if(e.clock<=0&&d<300){e.clock=4;this.owner.elements.cast('web',e,s.player,true);}if(d<e.r+s.player.r)s.encounters.damage(5,'mollusc_contact');return true;}
    dashEnd(from,power=1,endpoint=null){const s=this.s,p=endpoint||s.player,type=from.style;if(type==='octopus')this.sweep({...p,inherited:this.owner.allies.octopus?.inherited},Math.atan2(p.y-from.y,p.x-from.x),power);
      else if(type==='reptile'){const st=this.stats(type);for(let i=0;i<3;i++)this.zone('fire',{x:from.x+(p.x-from.x)*i/2,y:from.y+(p.y-from.y)*i/2},type,{radius:st.radius,life:st.life,damage:st.fireDamage},power);}
      else if(type==='tengu'){const t=s.target(p,220);if(t)this.lightning(p,t,this.stats(type),power);}
      else if(type==='mollusc')this.ink(p,type,power);else if(type==='axolotl'){s.shield=true;this.ink(p,type,power);s.reward('abilityfx',{creature:'axolotl',effect:'shield',x:p.x,y:p.y});}
    }
    draw(){const s=this.s,g=s.fx;for(const z of this.zones){if(s.evoFx?.coversZone(z.type))continue;const color=z.type==='fire'?0xff8c40:0x9b7be5;g.fillStyle(color,.2).fillCircle(z.x,z.y,z.r);g.lineStyle(2,color,.7).strokeCircle(z.x,z.y,z.r);}
      for(const p of this.projectiles)p.sprite.setPosition(p.x,p.y).setRotation(Math.atan2(p.dy,p.dx)).setDepth(p.y+25);
      for(const l of this.links)if(!s.evoFx?.has('Lightning_Link'))g.lineStyle(3,0x9beaff,l.life/.25).lineBetween(l.x,l.y,l.tx,l.ty);
      for(const c of this.casts)if(!s.evoFx?.has('Thunder_Warning'))g.lineStyle(2,0x9beaff).strokeCircle(c.x,c.y,c.r);
      for(const f of this.fx){if(s.evoFx?.has(f.type==='sweep'?'Tentacle_Sweep':'Bubble_Break'))continue;g.lineStyle(4,0xccafff,f.life/f.total);if(f.type==='sweep'){g.beginPath().arc(f.x,f.y,f.r,f.angle-f.arc,f.angle+f.arc).strokePath();if(f.rear)g.beginPath().arc(f.x,f.y,f.r,f.angle+Math.PI-f.arc,f.angle+Math.PI+f.arc).strokePath();}else g.strokeCircle(f.x,f.y,f.r*(1-f.life/f.total));}
    }
    catalog(){return RECIPES.map(r=>({...r,unlocked:this.discovered.includes(r.id),available:this.s.expedition.party().some(t=>r.parents.includes(t)),upgrades:UPGRADES[r.id].map(([id,name,detail])=>({id,name,detail}))}));}
    summary(){return {pending:this.preview(),discovered:[...this.discovered],merges:this.merges.map(m=>({...m})),healthBonus:this.healthBonus||0,haste:this.haste,zones:this.zones.map(({type,source,x,y,r,life})=>({type,source,x,y,r,life})),projectiles:this.projectiles.length,casts:this.casts.length};}
    destroy(){for(const p of this.projectilePool)p.destroy();}
  }
  window.SurvivorEvolution=SurvivorEvolution;
})();
