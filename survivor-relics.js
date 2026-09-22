(() => {
  const ITEMS=[
    {id:'boots',name:"Wayfarer's Boots",detail:'Move 2s: next shot deals +50% damage',extra:'and pierces up to three enemies.'},
    {id:'stone',name:'Standing Stone',detail:'Stand still: build up to +50% shot speed',extra:'over 2s. Moving removes the bonus.'},
    {id:'ricochet',name:'Ricochet Stone',detail:'Your shots bounce once to a nearby foe',extra:'for 60% damage.'},
    {id:'repulsion',name:'Repulsion Charm',detail:'Your shots knock enemies away from you.',extra:'Your shots fire 30% less frequently.'},
    {id:'slipstream',name:'Slipstream Cloak',detail:'Narrowly dodge a projectile to gain',extra:'+25% movement speed for 2s.'},
    {id:'bloodroot',name:'Bloodroot Pendant',detail:'Healing pickups pulse for 6 damage.',extra:'Excess healing makes the pulse wider.'}
  ];
  const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  class SurvivorRelics {
    constructor(s){this.s=s;this.equipped=[];this.queue=[];this.offers=[];this.selected=null;this.charge=0;this.still=0;this.slip=0;this.cache=null;this.cacheSprite=s.add.sprite(0,0,'xpChest',0).setScale(4).setTint(0xd7b0ff).setVisible(false);}
    destroy(){this.cacheSprite.destroy();}
    has(id){return this.equipped.includes(id);}
    reward(source){this.queue.push(source);this.s.logEvent('relic_reward',{source});}
    open(){if(!this.queue.length)return false;const s=this.s;this.source=this.queue.shift();const pool=ITEMS.filter(i=>!this.has(i.id));this.offers=[];while(this.offers.length<3&&pool.length)this.offers.push(pool.splice(Math.floor(s.rand()*pool.length),1)[0]);this.selected=null;s.mode='relic';s.joy=null;s.input.keyboard.resetKeys();s.logEvent('relic_offered',{source:this.source,choices:this.offers.map(i=>i.id)});s.saveRun();return true;}
    choose(i){if(this.s.mode!=='relic')return;if(this.selected){if(i<2)this.equip(this.selected,i);return;}const item=this.offers[i];if(!item)return;if(this.equipped.length===2){this.selected=item;this.s.draw();}else this.equip(item,this.equipped.length);}
    equip(item,slot){const replaced=this.equipped[slot]||null;this.equipped[slot]=item.id;this.charge=0;this.still=0;this.slip=0;this.s.logEvent('relic_equipped',{relic:item.id,replaced,source:this.source});this.close();}
    close(){this.selected=null;this.offers=[];this.s.mode='playing';this.s.input.keyboard.resetKeys();this.s.checkLevel();this.s.saveRun();this.s.draw();}
    skip(){this.s.logEvent('relic_skipped',{source:this.source});this.close();}
    update(dt){const s=this.s;this.slip=Math.max(0,this.slip-dt);this.still=s.moving?0:Math.min(2,this.still+dt);if(this.has('boots')&&s.moving)this.charge=Math.min(2,this.charge+dt);
      if(!s.isExpedition)return;
      if(!this.cache&&s.elapsed>=45){let spot=null;for(let i=0;i<40;i++){const a=s.rand()*Math.PI*2,x=Math.max(100,Math.min(s.worldSize-100,s.player.x+Math.cos(a)*420)),y=Math.max(100,Math.min(s.worldSize-100,s.player.y+Math.sin(a)*420));if(!s.blocked(x,y,100)&&s.encounters.nests.every(n=>dist(n,{x,y})>120)&&dist(s.expedition.shrine,{x,y})>150){spot={x,y};break;}}if(spot){this.cache={...spot,guards:0,claimed:false};s.logEvent('relic_cache_appeared',spot);s.announce('Guarded relic cache discovered!');}}
      const c=this.cache;if(c&&!c.claimed){if(dist(c,s.player)<240&&c.guards<3&&s.enemies.length<120){const a=c.guards*Math.PI*2/3,e=s.spawn('beast',c.x+Math.cos(a)*70,c.y+Math.sin(a)*70);if(e){e.cacheGuard=true;e.hp=e.maxHp=18;c.guards++;}}if(c.guards===3&&!s.enemies.some(e=>e.cacheGuard&&e.hp>0)&&dist(c,s.player)<45){c.claimed=true;this.reward('guarded_cache');}}
    }
    shot(){const charged=this.has('boots')&&this.charge>=2;if(charged)this.charge=0;return {source:'player',damage:charged?3:2,pierce:charged?3:1,hits:new Set(),charged};}
    shotRate(){return (1+(this.has('stone')?this.still/2*.5:0))*(this.has('repulsion')?.7:1);}
    impact(shot,e){const s=this.s;shot.hits=shot.hits||new Set();shot.hits.add(e);if(this.has('repulsion'))s.knockbackEnemy(e);if(this.has('ricochet')&&!shot.bounced){shot.bounced=true;const target=s.combatTargets().filter(t=>t.hp>0&&!shot.hits.has(t)&&dist(t,shot)<180).sort((a,b)=>dist(a,shot)-dist(b,shot))[0];if(target){const d=dist(target,shot)||1;s.shots.push({x:shot.x,y:shot.y,dx:(target.x-shot.x)/d,dy:(target.y-shot.y)/d,life:.7,source:'player',damage:(shot.damage||2)*.6,pierce:1,bounced:true,hits:new Set(shot.hits),sprite:s.pooled(s.shotPool,'nature',.5).setFrame('rock').setTint(0xc8b0ff)});}}if(shot.hits.size>=(shot.pierce||1))shot.life=0;}
    nearShot(b){if(!this.has('slipstream')||b.life<=0)return;const d=dist(b,this.s.player);if(d<42)b.closePass=true;if(b.closePass&&!b.dodged&&d>42&&d>(b.lastDistance||0)){b.dodged=true;this.slip=2;this.s.logEvent('relic_dodge');}b.lastDistance=d;}
    heal(amount){if(!this.has('bloodroot'))return;const s=this.s,r=80+(8-amount)*8;s.burst('fxWater',s.player.x,s.player.y,r/20,.5,0xffa0a0);for(const e of s.combatTargets())if(dist(e,s.player)<r+e.r)s.hit(e,6,'player',s.player);s.logEvent('relic_heal_pulse',{radius:r});}
    draw(){const s=this.s,p=s.player,g=s.fx;if(this.has('boots'))g.lineStyle(2,this.charge>=2?0xffd36b:0xb9cba5,.8).beginPath().arc(p.x,p.y,34,-Math.PI/2,-Math.PI/2+Math.PI*this.charge).strokePath();if(this.has('stone')&&this.still>0)g.lineStyle(3,0xc8b0ff,.7).strokeCircle(p.x,p.y,22+this.still*3);if(this.slip>0)g.lineStyle(3,0x8eefff,.8).strokeEllipse(p.x,p.y+15,48,18);const c=this.cache;this.cacheSprite.setVisible(!!c&&!c.claimed);if(c)this.cacheSprite.setPosition(c.x,c.y).setDepth(c.y+15);}
    ui(w,h){const s=this.s,c=this.cache,cam=s.cameras.main;if(this.equipped.length)s.label('Relics: '+this.equipped.map(id=>ITEMS.find(v=>v.id===id).name).join(' / '),w/2,h-23,w<700?9:11,'#dcc2ff','center');if(c&&!c.claimed&&s.mode==='playing')s.label('RELIC CACHE · '+(c.guards<3||s.enemies.some(e=>e.cacheGuard&&e.hp>0)?'GUARDED':'OPEN'),Math.max(100,Math.min(w-100,c.x-cam.scrollX)),Math.max(180,Math.min(h-135,c.y-cam.scrollY-55)),12,'#593064','center');
      if(s.mode!=='relic')return;const pw=Math.min(w-24,500),x=(w-pw)/2,y=Math.max(85,(h-430)/2);s.panel(x,y,pw,430);s.label(this.selected?'REPLACE A RELIC':'CHOOSE A RELIC',w/2,y+20,21,'#fff0b0','center');s.label('Combat paused · Two slots · This run only',w/2,y+51,13,'#e2ccb0','center');
      if(this.selected){s.label(this.selected.name,w/2,y+88,18,'#8ee0df','center');this.equipped.forEach((id,i)=>s.button('Replace '+ITEMS.find(v=>v.id===id).name,x+18,y+125+i*65,pw-36,()=>this.equip(this.selected,i)));s.button('Back to choices',x+18,y+270,pw-36,()=>{this.selected=null;s.draw();});}
      else this.offers.forEach((item,i)=>{s.button((i+1)+'. '+item.name,x+18,y+80+i*92,pw-36,()=>this.choose(i));s.label(item.detail,w/2,y+126+i*92,12,'#fff5d7','center');s.label(item.extra,w/2,y+142+i*92,12,'#fff5d7','center');});s.button('Leave reward',x+18,y+373,pw-36,()=>this.skip());
    }
    summary(){return {equipped:[...this.equipped],offers:this.offers.map(i=>i.id),pending:[...this.queue],charge:this.charge,standingSeconds:this.still,slipSeconds:this.slip,cache:this.cache?{...this.cache}:null};}
  }
  window.SurvivorRelics=SurvivorRelics;
})();
