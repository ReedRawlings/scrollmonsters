(() => {
  const ITEMS=[
    {id:'boots',name:"Wayfarer's Boots",detail:'Move 2s: next shot deals +50% damage',extra:'Pierces three enemies; +50% damage per copy.'},
    {id:'stone',name:'Standing Stone',detail:'Stand still: build up to +50% shot speed',extra:'+50% per copy. Moving removes the bonus.'},
    {id:'ricochet',name:'Ricochet Stone',detail:'Your shots bounce once to a nearby foe',extra:'60% damage per bounce; +1 bounce per copy.'},
    {id:'repulsion',name:'Repulsion Charm',detail:'Your shots knock enemies away from you.',extra:'Fire penalty: 30% divided by copies owned.'},
    {id:'slipstream',name:'Slipstream Cloak',detail:'Narrowly dodge a projectile to gain',extra:'+25% speed for 2s; extra copies add 1s.'},
    {id:'bloodroot',name:'Bloodroot Pendant',detail:'Healing pickups pulse for 6 damage.',extra:'+6 damage per copy; excess healing adds radius.'}
    ,{id:'pack',name:'Pack Sigil',detail:'Alternating party attackers: +15% hit damage',extra:'Each copy adds 15%. Same target, within 3s.'}
    ,{id:'resonance',name:'Resonance Bell',detail:'Three different party attackers within 3s:',extra:'third hit deals +40% damage per copy.'}
    ,{id:'echo',name:'Echo Fang',detail:'Creature hits can echo for 40% damage.',extra:'15% chance; copies improve chance up to 60%.'}
    ,{id:'drum',name:"Guardian's Drum",detail:'Block with a shield: party attacks 30% faster',extra:'for 3s. Each extra copy adds 2s.'}
    ,{id:'hunter',name:"Hunter's Brand",detail:'Creature hits build +3% damage on a target',extra:'up to 30% per copy; resets after 3s.'}
    ,{id:'spite',name:'Spite Seed',detail:'Kills can explode for 40% of the killing hit.',extra:'20% chance; copies improve chance up to 70%.'}
    ,{id:'veil',name:'Phase Veil',detail:'First 0.08s of dash ignores incoming damage.',extra:'Copies add 0.03s, capped at dash duration.'}
  ];
  const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  class SurvivorRelics {
    constructor(s){this.s=s;this.equipped=[];this.queue=[];this.offers=[];this.selected=null;this.charge=0;this.still=0;this.slip=0;this.drum=0;this.echoes=[];this.nextCache=45;this.cacheNumber=0;this.nextElite=240;this.cache=null;this.cacheSprite=s.add.sprite(0,0,'xpChest',0).setScale(4).setTint(0xd7b0ff).setVisible(false);}
    destroy(){this.cacheSprite.destroy();}
    count(id){return this.equipped.filter(v=>v===id).length;}
    name(id){return ITEMS.find(v=>v.id===id).name;}
    has(id){return this.equipped.includes(id);}
    reward(source){this.queue.push(source);this.s.logEvent('relic_reward',{source});}
    open(){if(!this.queue.length)return false;const s=this.s;this.source=this.queue.shift();const pool=[...ITEMS];this.offers=[];while(this.offers.length<3&&pool.length)this.offers.push(pool.splice(Math.floor(s.rand()*pool.length),1)[0]);this.selected=null;s.mode='relic';s.joy=null;s.input.keyboard.resetKeys();s.logEvent('relic_offered',{source:this.source,choices:this.offers.map(i=>i.id)});s.saveRun();return true;}
    choose(i){if(this.s.mode!=='relic')return;const item=this.offers[i];if(item)this.equip(item);}
    equip(item){this.equipped.push(item.id);this.s.logEvent('relic_equipped',{relic:item.id,stack:this.count(item.id),source:this.source});const index=this.offers.indexOf(item);this.close();this.s.reward('relic',{id:item.id,index});}
    shieldBlocked(){if(this.has('drum')){this.drum=3+2*(this.count('drum')-1);this.s.announce('Guardian’s Drum: party haste!');}}
    modifyHit(e,amount,source){const s=this.s,creature=['cat','owl','beast','mouse','mole','bear','salamander','spider','storm'].includes(source),party=creature||source==='player';if(!party)return amount;
      if(e.relicHitAt===undefined||s.elapsed-e.relicHitAt>3){e.hunterHits=0;e.lastRelicSource=null;}
      if(e.lastRelicSource&&e.lastRelicSource!==source)amount*=1+.15*this.count('pack');
      e.relicSourceTimes=e.relicSourceTimes||{};
      for(const [attacker,time] of Object.entries(e.relicSourceTimes))if(s.elapsed-time>3)delete e.relicSourceTimes[attacker];
      e.relicSourceTimes[source]=s.elapsed;
      if(Object.keys(e.relicSourceTimes).length>=3){amount*=1+.4*this.count('resonance');e.relicSourceTimes={};}
      e.lastRelicSource=source;e.relicHitAt=s.elapsed;
      if(creature){e.hunterHits=Math.min(10,(e.hunterHits||0)+1);amount*=1+.03*this.count('hunter')*e.hunterHits;}
      return amount;
    }
    queueEcho(e,amount,source){if(['cat','owl','beast','mouse','mole','bear','salamander','spider','storm'].includes(source)&&this.has('echo')&&this.s.rand()<.6*(1-Math.pow(.75,this.count('echo')))&&this.echoes.length<80)this.echoes.push({target:e,amount:amount*.4,source,time:.18});}
    killed(e,amount){const n=this.count('spite');if(!n||this.s.rand()>=.7*(1-Math.pow(5/7,n)))return;this.s.burst('fxEarth',e.x,e.y,4,.45,0xd7b0ff);for(const t of this.s.combatTargets())if(t!==e&&t.hp>0&&dist(t,e)<90+t.r)this.s.hit(t,amount*.4,'player',e,true);}
    close(){this.selected=null;this.offers=[];this.s.mode='playing';this.s.input.keyboard.resetKeys();this.s.checkLevel();this.s.saveRun();this.s.draw();}
    skip(){this.s.logEvent('relic_skipped',{source:this.source});this.close();}
    update(dt){const s=this.s;this.drum=Math.max(0,this.drum-dt);const due=[];this.echoes=this.echoes.filter(e=>{e.time-=dt;if(e.time<=0){due.push(e);return false;}return true;});for(const e of due)if(e.target.hp>0){s.burst('fxHit',e.target.x,e.target.y,1.8,.3,0xd7b0ff);s.hit(e.target,e.amount,e.source,s.player,true);}this.slip=Math.max(0,this.slip-dt);this.still=s.moving?0:Math.min(2,this.still+dt);if(this.has('boots')&&s.moving)this.charge=Math.min(2,this.charge+dt);
      if(!s.isExpedition)return;
      if(this.cache?.claimed&&s.elapsed>=this.nextCache)this.cache=null;
      if(s.elapsed>=this.nextElite&&s.elapsed<570){const e=s.spawn('beast');if(e){this.nextElite+=90;e.elite=true;e.packReward=true;e.hp=e.maxHp=90+Math.max(0,s.elapsed-240)*.6;e.contactDamage=14+Math.floor(s.elapsed/120);e.sprite.setScale(5);s.logEvent('relic_hunter_appeared');s.announce('Pack hunter approaching!');}}
      if(!this.cache&&s.elapsed>=this.nextCache&&s.elapsed<570){let spot=null;for(let i=0;i<40;i++){const a=s.rand()*Math.PI*2,x=Math.max(100,Math.min(s.worldSize-100,s.player.x+Math.cos(a)*420)),y=Math.max(100,Math.min(s.worldSize-100,s.player.y+Math.sin(a)*420));if(!s.blocked(x,y,100)&&s.encounters.nests.every(n=>dist(n,{x,y})>120)&&dist(s.expedition.shrine,{x,y})>150){spot={x,y};break;}}if(spot){this.cacheNumber++;this.cache={...spot,guards:0,claimed:false,id:this.cacheNumber};s.logEvent('relic_cache_appeared',spot);this.cacheSprite.setFrame(0);s.announce(s.field==='desert'?'Buried supply cache revealed!':'Guarded supply cache discovered!');}}
      const c=this.cache;if(c&&!c.claimed){if(dist(c,s.player)<240&&c.guards<3&&s.enemies.length<120){const a=c.guards*Math.PI*2/3,e=s.spawn('beast',c.x+Math.cos(a)*70,c.y+Math.sin(a)*70);if(e){e.cacheGuard=c.id;e.hp=e.maxHp=18*(1+s.elapsed/180);c.guards++;}}if(c.guards===3&&!s.enemies.some(e=>e.cacheGuard===c.id&&e.hp>0)&&dist(c,s.player)<45){c.claimed=true;this.nextCache=s.elapsed+75;this.cacheSprite.setFrame(1);s.packs.drop(c.x,c.y,s.field==='desert'?'buried_cache':'guarded_cache');}}
    }
    shot(){const charged=this.has('boots')&&this.charge>=2;if(charged)this.charge=0;return {source:'player',damage:charged?2*(1+.5*this.count('boots')):2,pierce:charged?3:1,hits:new Set(),charged};}
    shotRate(){return (1+(this.has('stone')?this.still/2*.5*this.count('stone'):0))*(this.has('repulsion')?1-.3/this.count('repulsion'):1);}
    impact(shot,e){const s=this.s;shot.hits=shot.hits||new Set();shot.hits.add(e);if(this.has('repulsion'))s.knockbackEnemy(e);if(this.has('ricochet')&&(shot.bounces||0)<this.count('ricochet')){shot.bounces=(shot.bounces||0)+1;shot.bounced=true;const target=s.combatTargets().filter(t=>t.hp>0&&!shot.hits.has(t)&&dist(t,shot)<180).sort((a,b)=>dist(a,shot)-dist(b,shot))[0];if(target){const d=dist(target,shot)||1;s.shots.push({x:shot.x,y:shot.y,dx:(target.x-shot.x)/d,dy:(target.y-shot.y)/d,life:.7,source:'player',damage:(shot.damage||2)*.6,pierce:1,bounced:true,bounces:shot.bounces,hits:new Set(shot.hits),sprite:s.pooled(s.shotPool,'nature',.5).setFrame('rock').setTint(0xc8b0ff)});}}if(shot.hits.size>=(shot.pierce||1))shot.life=0;}
    nearShot(b){if(!this.has('slipstream')||b.life<=0)return;const d=dist(b,this.s.player);if(d<42)b.closePass=true;if(b.closePass&&!b.dodged&&d>42&&d>(b.lastDistance||0)){b.dodged=true;this.slip=2+this.count('slipstream')-1;this.s.logEvent('relic_dodge');}b.lastDistance=d;}
    heal(amount){if(!this.has('bloodroot'))return;const s=this.s,r=80+(8-amount)*8;s.burst('fxWater',s.player.x,s.player.y,r/20,.5,0xffa0a0);for(const e of s.combatTargets())if(dist(e,s.player)<r+e.r)s.hit(e,6*this.count('bloodroot'),'player',s.player);s.logEvent('relic_heal_pulse',{radius:r});}
    draw(){const s=this.s,p=s.player,g=s.fx;if(this.has('boots'))g.lineStyle(2,this.charge>=2?0xffd36b:0xb9cba5,.8).beginPath().arc(p.x,p.y,34,-Math.PI/2,-Math.PI/2+Math.PI*this.charge).strokePath();if(this.has('stone')&&this.still>0)g.lineStyle(3,0xc8b0ff,.7).strokeCircle(p.x,p.y,22+this.still*3);if(this.slip>0)g.lineStyle(3,0x8eefff,.8).strokeEllipse(p.x,p.y+15,48,18);const c=this.cache;this.cacheSprite.setVisible(!!c&&!c.claimed);if(c)this.cacheSprite.setPosition(c.x,c.y).setDepth(c.y+15);}
    summary(){return {equipped:[...this.equipped],stacks:Object.fromEntries([...new Set(this.equipped)].map(id=>[id,this.count(id)])),drumSeconds:this.drum,pendingEchoes:this.echoes.length,nextCache:this.nextCache,nextElite:this.nextElite,offers:this.offers.map(i=>i.id),pending:[...this.queue],charge:this.charge,standingSeconds:this.still,slipSeconds:this.slip,cache:this.cache?{...this.cache}:null};}
  }
  SurvivorRelics.items=ITEMS;
  window.SurvivorRelics=SurvivorRelics;
})();
