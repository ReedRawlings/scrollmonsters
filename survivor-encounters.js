(() => {
  const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  class SurvivorEncounters {
    constructor(scene){
      if(!scene.textures.exists('hostileOrb')){const g=scene.make.graphics({x:0,y:0,add:false});g.fillStyle(0xff792f).fillCircle(8,8,6).lineStyle(2,0xffecc0).strokeCircle(8,8,6);g.generateTexture('hostileOrb',16,16);g.destroy();}
      this.s=scene;this.chosen=null;this.stageChoices={};this.beast=null;this.beastDamage=0;this.boss=null;this.bossAppeared=false;this.finalAppeared=false;this.finalDefeated=false;this.guardianSwarmStarted=false;this.bossRestUntil=0;this.bullets=[];this.bulletPool=[];this.pulses=[];this.shotsFired=0;this.nestsActive=false;this.trails=[];this.nestSprites=[];
      const choices=scene.nestDeck.filter(t=>t!==scene.starter),first=choices.slice(0,2),elemental=choices.find(t=>['salamander','spider','storm'].includes(t));
      if(!scene.isDemo&&!scene.nestDeckOverride&&elemental&&!first.some(t=>['salamander','spider','storm'].includes(t)))first[1]=elemental;
      const placed=[];this.nests=(scene.isExpedition?first:['owl','beast']).map((type,i)=>{const spot=this.denPosition(placed);placed.push(spot);return {kind:'nest',type,stage:0,activeAt:scene.isDemo?60:30,...spot,r:35,hp:500,maxHp:500,clock:1+i,spawnCount:0,destroyed:false};});
      this.beastSprite=scene.add.sprite(0,0,'beast').setScale(3.5).setVisible(false);
      this.bossSprite=scene.add.sprite(0,0,'guardian').setScale(2.2).setVisible(false);
    }
    denPosition(existing=this.nests||[],required=true){existing=existing.filter(n=>!n.destroyed);const s=this.s,sh=s.shrineLocation;const planned=s.greens?.denSpot(existing);if(planned)return planned;
      const valid=p=>!s.blocked(p.x,p.y,100)&&SurvivorWorld.distance(s,p,s.player)>300&&SurvivorWorld.distance(s,p,sh)>180&&existing.every(n=>SurvivorWorld.denApart(s,n,p))&&(s.expedition?.chests||[]).every(c=>SurvivorWorld.distance(s,c,p)>100);
      for(let i=0;i<250;i++){const p={x:140+s.rand()*(s.worldSize-280),y:140+s.rand()*(s.worldSize-280)};if(valid(p))return SurvivorWorld.near(s,p);}
      for(let y=140;y<s.worldSize-140;y+=120)for(let x=140;x<s.worldSize-140;x+=120)if(valid({x,y}))return SurvivorWorld.near(s,{x,y});if(required)throw new Error('No clear den location');return null;
    }
    destroy(){for(const n of this.nestSprites){n.base.destroy();n.token.destroy();}for(const b of this.bulletPool)b.destroy();this.beastSprite.destroy();this.bossSprite.destroy();}
    targets(){return [...this.nests.filter(n=>this.nestsActive&&this.s.elapsed>=n.activeAt&&!n.destroyed),...(this.boss?.hp>0?[this.boss]:[])];}
    hitSpecial(e){
      const s=this.s;
      if(e.kind==='nest'){if(!this.nestsActive||s.elapsed<e.activeAt){e.hp=e.maxHp;return true;}
        if(e.hp<=0&&!e.destroyed){e.destroyed=true;s.burst('fxDust',e.x,e.y,3,.55);const stage=e.stage||0,partyFull=s.isExpedition&&s.expedition.party().length>=3,eligible=!s.expedition.has(e.type)&&(partyFull||(!this.stageChoices[stage]&&Object.keys(this.stageChoices).length<(s.isExpedition?7:1)));s.logEvent('nest_destroyed',{creature:e.type,stage,eligible});
          if(eligible){s.expedition.release(e.type,e.x,e.y,false,stage);s.announce(e.type.toUpperCase()+' freed! Hold its ring to choose.');}
          else s.announce('Nest cleared. This recruitment choice is locked.');
          s.saveRun();
        }return true;
      }
      if(e.kind==='boss'){if(e.hp<=0&&!e.dead){e.dead=true;s.creatures.strikes=s.creatures.strikes.filter(a=>a.source!=='guardian_eruption');this.bullets.forEach(b=>b.sprite.setVisible(false));this.bullets=[];this.bossRestUntil=s.elapsed+10;if(e.final||s.isDemo)this.finalDefeated=true;else if(s.isExpedition)s.packs.drop(e.x,e.y,'miniboss');s.logEvent('boss_defeated',{final:!!e.final});s.headline(e.final?'Ancient Guardian defeated!':s.isDemo?'Guardian defeated!':'Guardian defeated. The expedition continues.');if(!e.final&&!s.isDemo&&s.isExpedition)this.guardianSwarm();s.saveRun();}return true;}return false;
    }
    guardianSwarm(){const s=this.s,count=64;if(this.guardianSwarmStarted)return;this.guardianSwarmStarted=true;s.enemyCap+=count;const view=s.spawnView(),halfW=(view.right-view.left)/2+90,halfH=(view.bottom-view.top)/2+90,p=s.player;let spawned=0;
      for(let i=0;i<count;i++){const a=Math.PI*2*i/count,dx=Math.cos(a),dy=Math.sin(a),edge=Math.min(halfW/Math.max(.001,Math.abs(dx)),halfH/Math.max(.001,Math.abs(dy))),d=edge+(i%4)*24,wrap=n=>((n%s.worldSize)+s.worldSize)%s.worldSize,x=wrap(p.x+dx*d),y=wrap(p.y+dy*d),e=s.spawn(s.expedition.enemyType(),x,y);if(e){e.guardianSwarm=true;spawned++;}}
      s.spawnTimer=0;s.logEvent('guardian_swarm_appeared',{count:spawned});s.headline('A massive horde closes in from every direction!');}
    damage(amount,source){const s=this.s,p=s.player;if(p.inv>0||p.hp<=0)return;if(s.shield){s.expedition.shieldBlocked();s.shield=false;p.inv=.25;return;}amount=s.enemyHitDamage(amount);p.hp=Math.max(0,p.hp-amount);p.inv=.25;s.juice.hurt(amount);s.damageTaken+=amount;s.logEvent('damage_taken',{enemy:source,amount,hp:p.hp,x:Math.round(p.x),y:Math.round(p.y)});}
    shoot(from,angle,speed=150,source='mage_orb'){
      this.shotsFired++;const sprite=this.s.pooled(this.bulletPool,source==='hunter_arrow'?'hunterArrow':source==='mage_orb'?'mageOrb':source==='owl_feather'?'feather':'guardianFire',source==='mage_orb'?1.5:source==='owl_feather'?1.6:1.5).setTint(source==='owl_feather'?0xff8877:0xffc05c);
      this.bullets.push({x:from.x,y:from.y,dx:Math.cos(angle),dy:Math.sin(angle),speed,life:5,source,sprite});
    }
    updateNest(n,dt){
      if(!this.nestsActive||this.s.elapsed<n.activeAt||n.destroyed||!SurvivorEnemies.spawnUnlocked(this.s,n.type)||(this.s.isDemo&&this.s.elapsed>=600))return;const s=this.s;n.clock-=dt*(s.isExpedition&&this.bossPressure()?.15:1);
      const own=s.enemies.filter(e=>e.nest===n.type&&e.hp>0).length;
      if(n.clock<=0&&own<6&&s.enemies.length<s.enemyCap){
        // Keep defenders out of tree trunks and stagger arrivals around the nest.
        const angle=n.spawnCount++*2.4,x=n.x+Math.cos(angle)*52,y=n.y+Math.sin(angle)*52;
        const e=s.spawn(n.type,x,y);if(!e)return;e.nest=n.type;e.clock=.9;s.move(e,0,0);n.clock=n.type==='owl'?5:7;
      }
    }
    updateShooter(e,dt){
      const s=this.s,p=s.player,d=dist(e,p)||1;
      if(e.phase==='shoot'){
        if(e.clock<=0){for(const offset of (e.variant==='mageBlack'?[-.22,0,.22]:[0]))this.shoot(e,e.aim+offset);e.phase='seek';e.clock=2.8;}
      }else{
        if(d>260)s.move(e,(p.x-e.x)/d*55*dt,(p.y-e.y)/d*55*dt,false);
        else if(d<150)s.move(e,(e.x-p.x)/d*35*dt,(e.y-p.y)/d*35*dt,false);
        if(e.clock<=0&&d<520){e.phase='shoot';e.aim=Math.atan2(p.y-e.y,p.x-e.x);e.clock=.75;}
      }
      if(d<25)this.damage(70,'mage_contact');
    }
    bossPressure(){const s=this.s;return !!(this.boss?.hp>0)||s.elapsed<this.bossRestUntil||(s.isExpedition&&((s.elapsed>=570&&!this.bossAppeared)||(!s.isDemo&&s.elapsed>=1140)));}
    spawnBoss(final=false){
      const s=this.s,p=s.player;this.bossAppeared=true;if(final)this.finalAppeared=true;
      let x=p.x+190,y=p.y;for(let i=0;i<24;i++){const a=i*Math.PI/12;x=p.x+Math.cos(a)*190;y=p.y+Math.sin(a)*190;if(!s.blocked(x,y,75))break;}
      this.boss={kind:'boss',x,y,r:35,final,hp:s.isExpedition?(final?40000:12000):2000,maxHp:s.isExpedition?(final?40000:12000):2000,phase:'seek',clock:1,volleys:0,aim:0};
      if(s.isExpedition)s.spawnTimer=Math.max(s.spawnTimer,2.4);s.logEvent('boss_appeared',{final});s.headline(final?'Ancient Guardian approaches!':'Guardian approaches!');
    }
    updateBoss(dt){
      const s=this.s;if(!this.bossAppeared&&s.elapsed>=(s.isExpedition?570:90))this.spawnBoss();if(s.isExpedition&&!s.isDemo&&s.elapsed>=1140&&!this.finalAppeared){if(this.boss?.hp>0)s.logEvent('miniboss_retreated');s.creatures.strikes=s.creatures.strikes.filter(a=>a.source!=='guardian_eruption');this.bullets.forEach(b=>b.sprite.setVisible(false));this.bullets=[];this.spawnBoss(true);}const b=this.boss;if(!b||b.hp<=0)return;
      const d=dist(b,s.player)||1;b.clock-=dt*(b.final?2.3:2);
      if(b.phase==='seek'){
        if(d>230)s.move(b,(s.player.x-b.x)/d*85*dt,(s.player.y-b.y)/d*85*dt,true);
        if(b.clock<=0){b.volleys++;b.phase=b.volleys%4===0?'eruption':b.volleys%3===0?'ring':'aimed';if(b.phase==='eruption'&&s.creatures.elements.hostileCount()>1)b.phase='aimed';b.aim=Math.atan2(s.player.y-b.y,s.player.x-b.x);b.clock=b.phase==='ring'?.9:.65;s.burst('guardianBlast',b.x,b.y,2,.45);if(b.phase==='eruption'){for(const off of [-90,0,90])s.creatures.strikes.push({x:s.player.x+off,y:s.player.y,r:52,time:.575,total:.575,hostile:true,source:'guardian_eruption',damage:120});}}
      }else if(b.clock<=0){
        if(b.phase==='ring'){const count=b.final?20:16;for(let i=0;i<count;i++)this.shoot(b,i*Math.PI*2/count+b.volleys*.12,b.final?185:165,'boss_ring');}
        else if(b.phase==='aimed')for(const offset of (b.final?[-.24,-.12,0,.12,.24]:[-.12,0,.12]))this.shoot(b,b.aim+offset,245,'boss_aimed');
        s.logEvent('boss_volley',{pattern:b.phase});s.burst('guardianBlast',b.x,b.y,2.5,.4);b.phase='seek';b.clock=1.15;
      }
      if(d<b.r+s.player.r)this.damage(120,'boss_contact');
    }
    planBeastCharge(){
      const b=this.beast,s=this.s,maxLength=430*.55;
      const targets=s.combatTargets().filter(e=>e.hp>0&&dist(e,s.player)<330&&dist(e,b)<maxLength+105+e.r);
      if(!targets.length)return null;
      const candidates=[];
      for(const e of targets){
        candidates.push({x:e.x,y:e.y});
        const neighbors=targets.filter(n=>dist(n,e)<95);
        if(neighbors.length>1)candidates.push({x:neighbors.reduce((v,n)=>v+n.x,0)/neighbors.length,y:neighbors.reduce((v,n)=>v+n.y,0)/neighbors.length});
      }
      let best=null;
      for(const target of candidates){
        const d=dist(b,target);if(d<1)continue;
        const length=Math.min(maxLength,d+(s.upgrades.slam?0:25)),dx=(target.x-b.x)/d,dy=(target.y-b.y)/d;
        const x=b.x+dx*length,y=b.y+dy*length,vx=x-b.x,vy=y-b.y,travel=Math.hypot(vx,vy);if(travel<1)continue;
        let score=0,hits=0,blastHits=0,bossHit=false;
        for(const e of targets){const t=clamp(((e.x-b.x)*vx+(e.y-b.y)*vy)/(travel*travel),0,1);const lineHit=Math.hypot(e.x-b.x-t*vx,e.y-b.y-t*vy)<e.r+24;const blast=!!s.upgrades.slam&&Math.hypot(e.x-x,e.y-y)<105+e.r;
          if(lineHit){hits++;score+=1;}if(blast){blastHits++;score+=.65;}if(e.kind==='boss'&&(lineHit||blast)){bossHit=true;score+=.35;}
        }
        if(score>0&&(!best||score>best.score+.001||(Math.abs(score-best.score)<.001&&travel<best.length)))best={dx:vx/travel,dy:vy/travel,length:travel,score,hits,blastHits,bossHit};
      }
      return best;
    }
    updateBeast(dt){
      const b=this.beast,s=this.s;if(!b)return;
      if(b.state==='ready'){
        s.expedition.capture(b,'beast',dt);return;
      }
      if(b.state!=='ally')return;b.attack-=dt*s.attackRate();
      if(b.charge>0){
        this.trails.push({x:b.x,y:b.y,dx:b.dx,dy:b.dy,life:.22});const step=Math.min(dt,b.charge);b.charge-=dt;s.move(b,b.dx*430*step,b.dy*430*step,false);
        for(const e of s.hitTargets())if(e.hp>0&&!b.hits.has(e)&&dist(e,b)<e.r+24){b.hits.add(e);s.hit(e,s.companionStats().beast.damage,'beast',b);this.pulses.push({x:e.x,y:e.y,r:30,life:.35});}
        if(b.charge<=0){this.pulses.push({x:b.x,y:b.y,r:45,life:.35});s.burst('fxEarth',b.x,b.y,s.upgrades.slam?4:2.5,.5);}
        if(b.charge<=0&&s.upgrades.slam){this.pulses.push({x:b.x,y:b.y,r:105,life:.35});for(const e of s.hitTargets())if(e.hp>0&&dist(e,b)<105+e.r)s.hit(e,s.companionStats().beast.shockwave,'beast',b);}
      }else{
        const plan=b.attack<=0?this.planBeastCharge():null;
        if(plan){s.burst('fxDust',b.x,b.y,2,.4,0xffffff,Math.atan2(plan.dy,plan.dx));b.dx=plan.dx;b.dy=plan.dy;b.charge=plan.length/430;b.hits=new Set();b.attack=s.companionStats().beast.interval;s.logEvent('beast_charge',{expectedHits:plan.hits,expectedBlastHits:plan.blastHits,bossInPath:plan.bossHit,dx:b.dx,dy:b.dy});}
        else{const d=dist(b,s.player)||1;if(d>65)s.move(b,(s.player.x-b.x)/d*Math.min(d,250*dt),(s.player.y-b.y)/d*Math.min(d,250*dt),false);}
      }
    }
    update(dt){
      if(!this.nestsActive&&this.s.elapsed>=(this.s.isDemo?60:30)){this.nestsActive=true;this.s.logEvent('nests_appeared');this.s.headline('A Den Appears');}
      for(const n of this.nests)this.updateNest(n,dt);this.updateBeast(dt);if(this.s.mode!=='playing')return;this.updateBoss(dt);
      for(const b of this.bullets){b.x+=b.dx*b.speed*dt;b.y+=b.dy*b.speed*dt;b.life-=dt;if(this.s.blocked(b.x,b.y,4))b.life=0;if(b.life>0&&dist(b,this.s.player)<17){this.damage(b.source==='hunter_arrow'?100:['owl_feather','mage_orb'].includes(b.source)?60:80,b.source);b.life=0;}this.s.relics.nearShot(b);}
      this.bullets=this.bullets.filter(b=>{if(b.life>0)return true;b.sprite.setVisible(false);return false;});
      for(const t of this.trails)t.life-=dt;this.trails=this.trails.filter(t=>t.life>0);
      for(const p of this.pulses)p.life-=dt;this.pulses=this.pulses.filter(p=>p.life>0);
    }
    splitShot(shot){
      if(!this.s.upgrades.split||shot.split||shot.didSplit)return;shot.didSplit=true;const angle=Math.atan2(shot.dy,shot.dx);
      for(const off of [-.55,.55])this.s.shots.push({x:shot.x,y:shot.y,dx:Math.cos(angle+off),dy:Math.sin(angle+off),life:.65,source:'owl',split:true,hits:new Set(shot.hits),sprite:this.s.pooled(this.s.shotPool,'feather',1)});
    }
    draw(){
      const s=this.s,g=s.fx;
      for(const [i,n] of this.nests.entries()){
        if(!this.nestSprites[i])this.nestSprites[i]={base:s.greens?s.add.sprite(n.x,n.y+32,'greensDen').setOrigin(.5,1).setScale(4):s.add.sprite(n.x,n.y,'nature',n.type==='bear'?'rock':'nestStump').setScale(3),token:s.add.sprite(n.x,n.y-12,n.type==='owl'?'feather':n.type==='beast'?'nestBone':n.type==='frog'?'frog':n.type).setScale(n.type==='owl'||n.type==='beast'?1.6:1.2)};
        const art=this.nestSprites[i],visible=this.nestsActive&&s.elapsed>=n.activeAt;art.base.setVisible(visible).setDepth(n.y-1).setTint(n.destroyed?0x77716a:0xffffff);art.token.setVisible(visible&&!n.destroyed).setDepth(n.y+1);if(!visible)continue;if(['mouse','mole','bear'].includes(n.type))g.fillStyle(0x30251d,n.destroyed?.35:.85).fillEllipse(n.x,n.y+15,n.type==='bear'?35:25,14);
        if(!n.destroyed){const bar=s.greens?n.y-104:n.y-49;g.fillStyle(0x30221a).fillRect(n.x-35,bar,70,6);g.fillStyle(0xffd36b).fillRect(n.x-35,bar,70*Math.max(0,n.hp)/n.maxHp,6);}
      }
      for(const e of s.enemies)if(e.type==='owl'&&e.phase==='shoot')for(const offset of(e.variant==='mageBlack'?[-.22,0,.22]:[0]))g.lineStyle(2,0xff8070,.8).lineBetween(e.x,e.y,e.x+Math.cos(e.aim+offset)*200,e.y+Math.sin(e.aim+offset)*200);
      for(const t of this.trails)g.lineStyle(14,0xffc464,t.life/.22*.65).lineBetween(t.x-t.dx*18,t.y-t.dy*18,t.x+t.dx*18,t.y+t.dy*18);
      for(const p of this.pulses)g.lineStyle(5,0xffd36b,p.life/.35).strokeCircle(p.x,p.y,p.r*(1-p.life/.35));
      const b=this.beast;this.beastSprite.setVisible(!!b);if(b){this.beastSprite.setPosition(b.x,b.y).setDepth(b.y+20).setFrame(Math.floor(s.elapsed*8)%4*4).setTint(b.charge>0?0xffdd88:0xffffff);}
      const boss=this.boss;this.bossSprite.setVisible(!!boss&&boss.hp>0);if(boss?.hp>0){this.bossSprite.setTexture(boss.final?'ancientGuardian':'guardian').setPosition(boss.x,boss.y).setDepth(boss.y+35).setFrame(Math.floor(s.elapsed*6)%6);if(boss.phase==='ring')g.lineStyle(4,0xffa052).strokeCircle(boss.x,boss.y,65+(1.1-boss.clock)*35);if(boss.phase==='aimed')g.lineStyle(3,0xffa052).lineBetween(boss.x,boss.y,boss.x+Math.cos(boss.aim)*320,boss.y+Math.sin(boss.aim)*320);}
      for(const bullet of this.bullets)bullet.sprite.setPosition(bullet.x,bullet.y).setFrame(['owl_feather','hunter_arrow'].includes(bullet.source)?0:Math.floor(s.elapsed*12)%4).setRotation(Math.atan2(bullet.dy,bullet.dx)).setDepth(800000000);
    }
    drawUI(w,h){}
    summary(){return {nestsActive:this.nestsActive,shotsFired:this.shotsFired,choice:this.chosen,finalAppeared:this.finalAppeared,finalDefeated:this.finalDefeated,bossPressure:this.bossPressure(),stageChoices:{...this.stageChoices},beast:this.beast?.state||null,beastDamage:this.beastDamage,nests:this.nests.map(n=>({type:n.type,x:n.x,y:n.y,stage:n.stage,activeAt:n.activeAt,hp:n.hp,destroyed:n.destroyed,spawnCount:n.spawnCount})),boss:this.boss?{final:!!this.boss.final,hp:this.boss.hp,defeated:this.boss.hp<=0}:null};}
    snapshot(){return {...this.summary(),nests:this.nests.map(n=>({type:n.type,stage:n.stage,activeAt:n.activeAt,x:n.x,y:n.y,hp:n.hp,destroyed:n.destroyed})),beast:this.beast?{x:this.beast.x,y:this.beast.y,state:this.beast.state,progress:this.beast.progress,charging:this.beast.charge>0,trailSegments:this.trails.length,impactEffects:this.pulses.length}:null,boss:this.boss?{final:!!this.boss.final,x:this.boss.x,y:this.boss.y,hp:this.boss.hp,phase:this.boss.phase}:null,hostileShots:this.bullets.map(b=>({x:Math.round(b.x),y:Math.round(b.y),dx:b.dx,dy:b.dy,source:b.source}))};}
  }
  window.SurvivorEncounters=SurvivorEncounters;
})();
