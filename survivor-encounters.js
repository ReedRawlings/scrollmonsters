(() => {
  const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  class SurvivorEncounters {
    constructor(scene){
      if(!scene.textures.exists('hostileOrb')){const g=scene.make.graphics({x:0,y:0,add:false});g.fillStyle(0xff792f).fillCircle(8,8,6).lineStyle(2,0xffecc0).strokeCircle(8,8,6);g.generateTexture('hostileOrb',16,16);g.destroy();}
      this.s=scene;this.chosen=null;this.stageChoices={};this.beast=null;this.beastDamage=0;this.boss=null;this.bossAppeared=false;this.bullets=[];this.bulletPool=[];this.pulses=[];this.shotsFired=0;this.nestsActive=false;this.trails=[];this.nestSprites=[];
      const choices=scene.nestDeck.filter(t=>t!==scene.starter),first=choices.slice(0,2),elemental=choices.find(t=>['salamander','spider','storm'].includes(t));
      if(!scene.nestDeckOverride&&elemental&&!first.some(t=>['salamander','spider','storm'].includes(t)))first[1]=elemental;
      const placed=[];this.nests=(scene.isExpedition?first:['owl','beast']).map((type,i)=>{const spot=this.denPosition(placed);placed.push(spot);return {kind:'nest',type,stage:0,activeAt:30,...spot,r:35,hp:50,maxHp:50,clock:1+i,spawnCount:0,destroyed:false};});
      this.beastSprite=scene.add.sprite(0,0,'beast').setScale(3.5).setVisible(false);
      this.bossSprite=scene.add.sprite(0,0,'guardian').setScale(2.2).setVisible(false);
    }
    denPosition(existing=this.nests||[]){const s=this.s,sh=s.expedition?.shrine||{x:s.worldSize/2,y:s.worldSize*.2625};
      const valid=p=>!s.blocked(p.x,p.y,100)&&dist(p,s.player)>300&&dist(p,sh)>180&&existing.every(n=>dist(n,p)>300)&&(s.expedition?.chests||[]).every(c=>dist(c,p)>100);
      for(let i=0;i<250;i++){const p={x:140+Math.random()*(s.worldSize-280),y:140+Math.random()*(s.worldSize-280)};if(valid(p))return p;}
      for(let y=140;y<s.worldSize-140;y+=120)for(let x=140;x<s.worldSize-140;x+=120)if(valid({x,y}))return {x,y};throw new Error('No clear den location');
    }
    destroy(){for(const n of this.nestSprites){n.base.destroy();n.token.destroy();}for(const b of this.bulletPool)b.destroy();this.beastSprite.destroy();this.bossSprite.destroy();}
    targets(){return [...this.nests.filter(n=>this.nestsActive&&this.s.elapsed>=(n.activeAt||30)&&!n.destroyed),...(this.boss?.hp>0?[this.boss]:[])];}
    hitSpecial(e){
      const s=this.s;
      if(e.kind==='nest'){if(!this.nestsActive||s.elapsed<(e.activeAt||30)){e.hp=e.maxHp;return true;}
        if(e.hp<=0&&!e.destroyed){e.destroyed=true;s.burst('fxDust',e.x,e.y,3,.55);const stage=e.stage||0,eligible=!this.stageChoices[stage]&&!s.expedition.has(e.type)&&Object.keys(this.stageChoices).length<(s.isExpedition?2:1);s.logEvent('nest_destroyed',{creature:e.type,stage,eligible});
          if(eligible){s.expedition.release(e.type,e.x,e.y,false,stage);s.announce(e.type.toUpperCase()+' freed! Hold its ring to choose.');}
          else s.announce('Nest cleared. This recruitment choice is locked.');
          s.saveRun();
        }return true;
      }
      if(e.kind==='boss'){if(e.hp<=0&&!e.dead){e.dead=true;s.creatures.strikes=s.creatures.strikes.filter(a=>a.source!=='guardian_eruption');this.bullets.forEach(b=>b.sprite.setVisible(false));this.bullets=[];s.logEvent('boss_defeated');s.announce('Guardian defeated!');s.saveRun();}return true;}return false;
    }
    damage(amount,source){const s=this.s,p=s.player;if(p.inv>0||p.hp<=0)return;if(s.shield){s.expedition.shieldBlocked();s.shield=false;p.inv=.85;return;}amount*=s.creatures.protection();p.hp=Math.max(0,p.hp-amount);p.inv=.85;s.damageTaken+=amount;s.logEvent('damage_taken',{enemy:source,amount,hp:p.hp,x:Math.round(p.x),y:Math.round(p.y)});}
    shoot(from,angle,speed=150,source='owl_feather'){
      this.shotsFired++;const sprite=this.s.pooled(this.bulletPool,source==='owl_feather'?'feather':'guardianFire',source==='owl_feather'?1.6:1.5).setTint(source==='owl_feather'?0xff8877:0xffc05c);
      this.bullets.push({x:from.x,y:from.y,dx:Math.cos(angle),dy:Math.sin(angle),speed,life:5,source,sprite});
    }
    updateNest(n,dt){
      if(!this.nestsActive||this.s.elapsed<(n.activeAt||30)||n.destroyed)return;const s=this.s;n.clock-=dt;
      const own=s.enemies.filter(e=>e.nest===n.type&&e.hp>0).length;
      if(n.clock<=0&&own<6&&s.enemies.length<120){
        // Keep defenders out of tree trunks and stagger arrivals around the nest.
        const angle=n.spawnCount++*2.4,x=n.x+Math.cos(angle)*52,y=n.y+Math.sin(angle)*52;
        const e=s.spawn(n.type,x,y);e.nest=n.type;e.clock=.9;s.move(e,0,0);n.clock=n.type==='owl'?5:7;
      }
    }
    updateShooter(e,dt){
      const s=this.s,p=s.player,d=dist(e,p)||1;
      if(e.phase==='shoot'){
        if(e.clock<=0){this.shoot(e,e.aim);e.phase='seek';e.clock=2.8;}
      }else{
        if(d>260)s.move(e,(p.x-e.x)/d*55*dt,(p.y-e.y)/d*55*dt,false);
        else if(d<150)s.move(e,(e.x-p.x)/d*35*dt,(e.y-p.y)/d*35*dt,false);
        if(e.clock<=0&&d<520){e.phase='shoot';e.aim=Math.atan2(p.y-e.y,p.x-e.x);e.clock=.75;}
      }
      if(d<25)this.damage(7,'owl_contact');
    }
    spawnBoss(){
      const s=this.s,p=s.player;this.bossAppeared=true;
      let x=p.x+190,y=p.y;for(let i=0;i<24;i++){const a=i*Math.PI/12;x=clamp(p.x+Math.cos(a)*190,80,s.worldSize-80);y=clamp(p.y+Math.sin(a)*190,80,s.worldSize-80);if(!s.blocked(x,y,75))break;}
      this.boss={kind:'boss',x,y,r:35,hp:s.isExpedition?1200:200,maxHp:s.isExpedition?1200:200,phase:'seek',clock:1,volleys:0,aim:0};
      s.logEvent('boss_appeared');s.announce('Guardian approaches! Dodge its aimed and ring volleys.');
    }
    updateBoss(dt){
      const s=this.s;if(!this.bossAppeared&&s.elapsed>=(s.isExpedition?570:90))this.spawnBoss();const b=this.boss;if(!b||b.hp<=0)return;
      const d=dist(b,s.player)||1;b.clock-=dt*2;
      if(b.phase==='seek'){
        if(d>230)s.move(b,(s.player.x-b.x)/d*85*dt,(s.player.y-b.y)/d*85*dt,true);
        if(b.clock<=0){b.volleys++;b.phase=b.volleys%4===0?'eruption':b.volleys%3===0?'ring':'aimed';if(b.phase==='eruption'&&s.creatures.elements.hostileCount()>1)b.phase='aimed';b.aim=Math.atan2(s.player.y-b.y,s.player.x-b.x);b.clock=b.phase==='ring'?.9:.65;s.burst('guardianBlast',b.x,b.y,2,.45);if(b.phase==='eruption'){for(const off of [-90,0,90])s.creatures.strikes.push({x:clamp(s.player.x+off,60,s.worldSize-60),y:s.player.y,r:52,time:.575,total:.575,hostile:true,source:'guardian_eruption',damage:12});}}
      }else if(b.clock<=0){
        if(b.phase==='ring'){for(let i=0;i<16;i++)this.shoot(b,i*Math.PI*2/16+b.volleys*.12,165,'boss_ring');}
        else if(b.phase==='aimed')for(const offset of [-.12,0,.12])this.shoot(b,b.aim+offset,245,'boss_aimed');
        s.logEvent('boss_volley',{pattern:b.phase});s.burst('guardianBlast',b.x,b.y,2.5,.4);b.phase='seek';b.clock=1.15;
      }
      if(d<b.r+s.player.r)this.damage(12,'boss_contact');
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
        const x=clamp(b.x+dx*length,22,s.worldSize-22),y=clamp(b.y+dy*length,22,s.worldSize-22),vx=x-b.x,vy=y-b.y,travel=Math.hypot(vx,vy);if(travel<1)continue;
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
      b.attack-=dt*s.attackRate();
      if(b.charge>0){
        this.trails.push({x:b.x,y:b.y,dx:b.dx,dy:b.dy,life:.22});const step=Math.min(dt,b.charge);b.charge-=dt;s.move(b,b.dx*430*step,b.dy*430*step,false);
        for(const e of s.combatTargets())if(e.hp>0&&!b.hits.has(e)&&dist(e,b)<e.r+24){b.hits.add(e);s.hit(e,s.companionStats().beast.damage,'beast',b);this.pulses.push({x:e.x,y:e.y,r:30,life:.35});}
        if(b.charge<=0){this.pulses.push({x:b.x,y:b.y,r:45,life:.35});s.burst('fxEarth',b.x,b.y,s.upgrades.slam?4:2.5,.5);}
        if(b.charge<=0&&s.upgrades.slam){this.pulses.push({x:b.x,y:b.y,r:105,life:.35});for(const e of s.combatTargets())if(e.hp>0&&dist(e,b)<105+e.r)s.hit(e,s.companionStats().beast.shockwave,'beast',b);}
      }else{
        const plan=b.attack<=0?this.planBeastCharge():null;
        if(plan){s.burst('fxDust',b.x,b.y,2,.4,0xffffff,Math.atan2(plan.dy,plan.dx));b.dx=plan.dx;b.dy=plan.dy;b.charge=plan.length/430;b.hits=new Set();b.attack=s.companionStats().beast.interval;s.logEvent('beast_charge',{expectedHits:plan.hits,expectedBlastHits:plan.blastHits,bossInPath:plan.bossHit,dx:b.dx,dy:b.dy});}
        else{const d=dist(b,s.player)||1;if(d>65)s.move(b,(s.player.x-b.x)/d*Math.min(d,250*dt),(s.player.y-b.y)/d*Math.min(d,250*dt),false);}
      }
    }
    update(dt){
      if(!this.nestsActive&&this.s.elapsed>=30){this.nestsActive=true;this.s.logEvent('nests_appeared');this.s.announce('A den of monsters appears');}
      for(const n of this.nests)this.updateNest(n,dt);this.updateBeast(dt);this.updateBoss(dt);
      for(const b of this.bullets){b.x+=b.dx*b.speed*dt;b.y+=b.dy*b.speed*dt;b.life-=dt;if(this.s.blocked(b.x,b.y,4))b.life=0;if(b.life>0&&dist(b,this.s.player)<17){this.damage(b.source==='owl_feather'?6:8,b.source);b.life=0;}this.s.relics.nearShot(b);}
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
        if(!this.nestSprites[i])this.nestSprites[i]={base:s.add.sprite(n.x,n.y,'nature',n.type==='bear'?'rock':'nestStump').setScale(3),token:s.add.sprite(n.x,n.y-12,n.type==='owl'?'feather':n.type==='beast'?'nestBone':n.type==='frog'?'frog':n.type).setScale(n.type==='owl'||n.type==='beast'?1.6:1.2)};
        const art=this.nestSprites[i],visible=this.nestsActive&&s.elapsed>=(n.activeAt||30);art.base.setVisible(visible).setDepth(n.y-1).setTint(n.destroyed?0x77716a:0xffffff);art.token.setVisible(visible&&!n.destroyed).setDepth(n.y+1);if(!visible)continue;if(['mouse','mole','bear'].includes(n.type))g.fillStyle(0x30251d,n.destroyed?.35:.85).fillEllipse(n.x,n.y+15,n.type==='bear'?35:25,14);
        if(!n.destroyed){g.fillStyle(0x30221a).fillRect(n.x-35,n.y-49,70,6);g.fillStyle(0xffd36b).fillRect(n.x-35,n.y-49,70*Math.max(0,n.hp)/n.maxHp,6);}
      }
      for(const e of s.enemies)if(e.type==='owl'&&e.phase==='shoot')g.lineStyle(2,0xff8070,.8).lineBetween(e.x,e.y,e.x+Math.cos(e.aim)*200,e.y+Math.sin(e.aim)*200);
      for(const t of this.trails)g.lineStyle(14,0xffc464,t.life/.22*.65).lineBetween(t.x-t.dx*18,t.y-t.dy*18,t.x+t.dx*18,t.y+t.dy*18);
      for(const p of this.pulses)g.lineStyle(5,0xffd36b,p.life/.35).strokeCircle(p.x,p.y,p.r*(1-p.life/.35));
      const b=this.beast;this.beastSprite.setVisible(!!b);if(b){this.beastSprite.setPosition(b.x,b.y).setDepth(b.y+20).setFrame(Math.floor(s.elapsed*8)%4*4).setTint(b.charge>0?0xffdd88:0xffffff);g.lineStyle(3,0x83d9ff).strokeCircle(b.x,b.y,b.state==='ready'?70:23);if(b.state==='ready')g.lineStyle(6,0xffd36b).beginPath().arc(b.x,b.y,70,-Math.PI/2,-Math.PI/2+Math.PI*2*b.progress/2.5,false).strokePath();}
      const boss=this.boss;this.bossSprite.setVisible(!!boss&&boss.hp>0);if(boss?.hp>0){this.bossSprite.setPosition(boss.x,boss.y).setDepth(boss.y+35).setFrame(Math.floor(s.elapsed*6)%6);if(boss.phase==='ring')g.lineStyle(4,0xffa052).strokeCircle(boss.x,boss.y,65+(1.1-boss.clock)*35);if(boss.phase==='aimed')g.lineStyle(3,0xffa052).lineBetween(boss.x,boss.y,boss.x+Math.cos(boss.aim)*320,boss.y+Math.sin(boss.aim)*320);}
      for(const bullet of this.bullets)bullet.sprite.setPosition(bullet.x,bullet.y).setFrame(bullet.source==='owl_feather'?0:Math.floor(s.elapsed*12)%4).setRotation(Math.atan2(bullet.dy,bullet.dx)).setDepth(2900);
    }
    drawUI(w,h){}
    summary(){return {nestsActive:this.nestsActive,shotsFired:this.shotsFired,choice:this.chosen,stageChoices:{...this.stageChoices},beast:this.beast?.state||null,beastDamage:this.beastDamage,nests:this.nests.map(n=>({type:n.type,x:n.x,y:n.y,stage:n.stage,activeAt:n.activeAt,hp:n.hp,destroyed:n.destroyed,spawnCount:n.spawnCount})),boss:this.boss?{hp:this.boss.hp,defeated:this.boss.hp<=0}:null};}
    snapshot(){return {...this.summary(),nests:this.nests.map(n=>({type:n.type,stage:n.stage,activeAt:n.activeAt,x:n.x,y:n.y,hp:n.hp,destroyed:n.destroyed})),beast:this.beast?{x:this.beast.x,y:this.beast.y,state:this.beast.state,progress:this.beast.progress,charging:this.beast.charge>0,trailSegments:this.trails.length,impactEffects:this.pulses.length}:null,boss:this.boss?{x:this.boss.x,y:this.boss.y,hp:this.boss.hp,phase:this.boss.phase}:null,hostileShots:this.bullets.map(b=>({x:Math.round(b.x),y:Math.round(b.y),dx:b.dx,dy:b.dy,source:b.source}))};}
  }
  window.SurvivorEncounters=SurvivorEncounters;
})();
