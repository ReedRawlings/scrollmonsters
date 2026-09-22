(() => {
  const TYPES=['cat','owl','beast','frog','mouse','mole','bear'],KEY='scrollmonsters-starters-v1';
  const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  class Expedition {
    static readUnlocks(){
      let unlocked=['cat'];try{const saved=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(saved))unlocked.push(...saved.filter(t=>TYPES.includes(t)));
        const runs=JSON.parse(localStorage.getItem('scrollmonsters-survivor-runs-v1')||'[]');if(Array.isArray(runs))for(const run of runs){if(run.summary?.owl==='ally')unlocked.push('owl');if(run.summary?.encounters?.beast==='ally')unlocked.push('beast');for(const e of run.events||[])for(const t of TYPES)if(e.type===t+'_captured')unlocked.push(t);}
      }catch{}const result=[...new Set(unlocked)];try{localStorage.setItem(KEY,JSON.stringify(result));}catch{}return result;
    }
    constructor(s){this.s=s;this.chests=[];this.chestClock=20;this.chestsOpened=0;this.chestXp=0;this.frog=null;this.catCapture=null;this.second=false;this.phase=-1;this.eliteSpawned=false;this.extraEliteSpawned=false;this.lateStrength=false;this.supportPulses=0;this.shieldBlocks=0;this.pulse=0;this.shrine={x:960,y:504,active:false,triggered:false,done:false,progress:0,completed:0,inCombat:false,needsExit:false};this.shrineSprite=s.add.sprite(960,492,'dungeonProps','shrineAltar').setScale(3).setDepth(425).setVisible(false);this.frogSprite=s.add.sprite(0,0,'frog').setScale(3).setVisible(false);}
    destroy(){for(const c of this.chests)c.sprite.destroy();this.frogSprite.destroy();this.shrineSprite.destroy();}
    has(type){if(['mouse','mole','bear'].includes(type))return !!this.s.creatures.allies[type];return type==='cat'?this.s.catActive||!!this.catCapture:type==='owl'?!!this.s.owl:type==='beast'?!!this.s.encounters.beast:!!this.frog;}
    party(){return TYPES.filter(t=>['mouse','mole','bear'].includes(t)?this.s.creatures.allies[t]?.state==='ally':t==='cat'?this.s.catActive:t==='owl'?this.s.owl?.state==='ally':t==='beast'?this.s.encounters.beast?.state==='ally':this.frog?.state==='ally');}
    unlock(type){const s=this.s;if(s.unlocked.includes(type))return;s.unlocked.push(type);try{localStorage.setItem(KEY,JSON.stringify(s.unlocked));s.unlockError=false;}catch{s.unlockError=true;}s.logEvent('starter_unlocked',{creature:type});}
    release(type,x,y,ally=false){const s=this.s,state=ally?'ally':'ready',base={x,y,r:12,state,progress:ally?2.5:0,attack:0};
      if(type==='cat'){if(ally)s.catActive=true;else this.catCapture=base;Object.assign(s.cat,{x,y});}
      if(type==='owl'){s.owl={...base,hp:0,maxHp:18};s.owlAppeared=true;}
      if(type==='beast')s.encounters.beast={...base,r:14,charge:0,hits:new Set()};
      if(['mouse','mole','bear'].includes(type))s.creatures.release(type,x,y,ally);
      if(type==='frog')this.frog={...base,pulseClock:1};
    }
    initStarter(){const s=this.s;s.catActive=s.starter==='cat';if(!s.catActive)this.release(s.starter,920,980,true);}
    capture(body,type,dt){if(!body||body.state!=='ready')return;body.progress=dist(body,this.s.player)<70?Math.min(2.5,body.progress+dt):Math.max(0,body.progress-2*dt);if(body.progress>=2.5){body.state='ally';if(type==='cat'){this.s.catActive=true;this.catCapture=null;}this.unlock(type);this.s.logEvent(type+'_captured');this.s.announce(type.toUpperCase()+' recruited and unlocked as a starter!');this.s.saveRun();}}
    shieldBlocked(){this.s.burst('fxWater',this.s.player.x,this.s.player.y,3,.45);this.shieldBlocks++;this.s.logEvent('shield_blocked');}
    update(dt){const s=this.s;this.capture(this.catCapture,'cat',dt);this.capture(this.frog,'frog',dt);this.pulse=Math.max(0,this.pulse-dt);
      const f=this.frog;if(f?.state==='ally'){const d=dist(f,s.player)||1;if(d>50)s.move(f,(s.player.x-f.x)/d*Math.min(d,220*dt),(s.player.y-f.y)/d*Math.min(d,220*dt),false);f.pulseClock-=dt;if(f.pulseClock<=0){f.pulseClock=s.frogStats().shieldInterval;s.shield=true;this.supportPulses++;this.pulse=.65;s.burst('fxWater',s.player.x,s.player.y,4,.65);if(s.upgrades.chorus)s.chorusTime=Math.max(s.chorusTime,3);s.logEvent('frog_pulse',{haste:!!s.upgrades.chorus});}}
      this.updateChests(dt);if(!s.isExpedition)return;
      const phase=Math.min(4,Math.floor(s.elapsed/60));if(phase!==this.phase){this.phase=phase;s.logEvent('encounter_phase',{phase:this.phaseName()});if(phase>0)s.announce(this.phaseName());}
      if(s.elapsed>=150&&!this.second){this.second=true;const options=['frog',...s.nestDeck.filter(t=>!this.has(t))].filter(t=>!this.has(t)).slice(0,2);s.encounters.nests.push(...options.map((type,i)=>({kind:'nest',type,stage:1,activeAt:150,x:i?1380:540,y:1380,r:35,hp:70,maxHp:70,clock:2+i,spawnCount:0,destroyed:false})));s.logEvent('second_nests_appeared',{options});s.announce('New nests to the south: choose your third creature.');}
      if(s.elapsed>=180&&!this.lateStrength){this.lateStrength=true;for(const e of s.enemies)this.strengthen(e);s.logEvent('late_enemy_strength');}
      if(s.elapsed>=210&&!this.eliteSpawned){const e=s.spawn('beast');if(e){e.elite=true;e.hp=e.maxHp=65;e.sprite.setScale(5);e.speed*=1.1;this.eliteSpawned=true;s.logEvent('elite_appeared');s.announce('Elite Beast approaching!');}}
      if(s.elapsed>=120&&!this.extraEliteSpawned){const e=s.spawn('beast');if(e){e.elite=true;e.relicReward=true;e.hp=e.maxHp=45;e.sprite.setScale(4.5);e.speed*=1.15;this.extraEliteSpawned=true;s.logEvent('roaming_elite_appeared');s.announce('Roaming elite! Defeat it for a relic.');}}
      this.updateShrine(dt);
    }
    updateChests(dt){const s=this.s;this.chestClock-=dt;
      if(this.chestClock<=0){this.chestClock=25+Math.random()*15;if(this.chests.filter(c=>!c.opened).length<3){
        for(let i=0;i<40;i++){const a=Math.random()*Math.PI*2,r=260+Math.random()*240,x=s.player.x+Math.cos(a)*r,y=s.player.y+Math.sin(a)*r;
          if(x<60||y<60||x>s.worldSize-60||y>s.worldSize-60||s.blocked(x,y,36)||dist({x,y},this.shrine)<110||s.encounters.nests.some(n=>dist({x,y},n)<100)||this.chests.some(c=>dist(c,{x,y})<90))continue;
          const xp=8+Math.floor(s.elapsed/60)*2,sprite=s.add.sprite(x,y,'xpChest',0).setScale(3).setDepth(y+15);this.chests.push({x,y,xp,opened:false,life:0,sprite});s.logEvent('chest_spawned',{x:Math.round(x),y:Math.round(y),xp});break;
        }
      }}
      for(const c of this.chests){if(!c.opened&&dist(c,s.player)<38){c.opened=true;c.life=1.2;c.sprite.setFrame(1);s.gainXP(c.xp);this.chestsOpened++;this.chestXp+=c.xp;s.burst('fxHit',c.x,c.y,2,.5,0xffd36b);s.logEvent('chest_opened',{xp:c.xp,x:Math.round(c.x),y:Math.round(c.y)});s.announce('Treasure chest! +'+c.xp+' XP');}else if(c.opened)c.life-=dt;}
      this.chests=this.chests.filter(c=>{if(!c.opened||c.life>0)return true;c.sprite.destroy();return false;});
    }
    shrineStats(){const tier=Math.min(2,this.shrine.completed);return {hp:[60,140,300][tier],damage:[12,18,26][tier],speed:[55,65,78][tier],chargeSpeed:[280,320,360][tier]};}
    updateShrine(dt){const s=this.s,sh=this.shrine;sh.active=s.elapsed>=90&&!sh.done;if(!sh.active)return;
      const inside=dist(s.player,sh)<70;if(!inside)sh.needsExit=false;
      if(sh.inCombat||sh.needsExit)return;
      sh.progress=inside?Math.min(6,sh.progress+dt):Math.max(0,sh.progress-dt*2);
      if(sh.progress<6||s.enemies.filter(e=>e.hp>0).length>=120)return;
      let point=null;for(let i=0;i<24;i++){const a=i*Math.PI/12,x=sh.x+Math.cos(a)*150,y=sh.y+Math.sin(a)*150;if(!s.blocked(x,y,24)){point={x,y};break;}}if(!point)return;
      const stats=this.shrineStats(),e=s.spawn('beast',point.x,point.y);if(!e)return;
      Object.assign(e,{elite:true,shrineTier:sh.completed+1,hp:stats.hp,maxHp:stats.hp,contactDamage:stats.damage,speed:stats.speed,chargeSpeed:stats.chargeSpeed,r:20,strong:true,lateStrong:true});e.sprite.setScale(5+sh.completed*.5);
      sh.inCombat=true;sh.triggered=true;sh.progress=0;s.burst('fxEarth',e.x,e.y,4,.6);s.logEvent('shrine_activated',{tier:e.shrineTier,...stats});s.announce('Shrine challenge '+e.shrineTier+'/3! Defeat the elite for an upgrade.');
    }
    completeShrine(e){const s=this.s,sh=this.shrine;if(!sh.inCombat||e.shrineTier!==sh.completed+1)return;
      sh.completed++;sh.inCombat=false;sh.done=sh.completed===3;sh.active=!sh.done;if(sh.done)s.relics.reward('final_shrine');sh.needsExit=true;sh.progress=0;
      const healed=sh.completed===1?Math.min(12,s.maxHp-s.player.hp):0;s.player.hp+=healed;const xp=s.xpNeeded();s.gainXP(xp);
      s.logEvent('shrine_completed',{tier:sh.completed,heal:healed,xp});s.announce(sh.done?'Shrine exhausted. Final bonus upgrade earned!':'Bonus upgrade earned! Leave the circle before the next challenge.');
    }

    strengthen(e){if(e.lateStrong)return;e.lateStrong=true;e.hp*=1.2;e.maxHp*=1.2;}
    phaseName(){return ['Explore the woodland','Ranged hunters','Recruit and regroup','Elite territory','Guardian finale'][this.phase]||'Explore the woodland';}
    interval(){const t=this.s.elapsed;if(t<60)return .85-t*.004;if(t<120)return .55;if(t<150)return .7;if(t<180)return .4;if(t<200)return .85;if(t<240)return .4;return .34;}
    enemyType(){const s=this.s;if(s.elapsed<60)return s.elapsed>20&&s.rand()<.2?'beast':'bat';const r=s.rand();if(s.elapsed>=270)return r<.16?'owl':r<.35?'beast':'bat';if(s.elapsed>=120&&r<.12&&s.enemies.filter(e=>e.type==='mole'&&e.hp>0).length<2)return 'mole';if(r<.25&&s.enemies.filter(e=>e.type==='bear'&&e.hp>0).length<3)return 'bear';return r<.42?'owl':r<.6?'beast':'bat';}
    draw(){const s=this.s,g=s.fx,f=this.frog;this.frogSprite.setVisible(!!f);if(f){this.frogSprite.setPosition(f.x,f.y).setFrame(Math.floor(s.elapsed*6)%2).setDepth(f.y+20);g.lineStyle(2,0x8ce7ae).strokeCircle(f.x,f.y,f.state==='ready'?70:23);if(this.pulse>0)g.lineStyle(4,0x8ce7ae,this.pulse/.65).strokeCircle(s.player.x,s.player.y,35+85*(1-this.pulse/.65));}
      if(this.catCapture)g.lineStyle(3,0x8ce7ae).strokeCircle(this.catCapture.x,this.catCapture.y,70);
      const sh=this.shrine;this.shrineSprite.setVisible(s.isExpedition&&s.elapsed>=90).setTint(sh.done?0x66716e:sh.inCombat?0xffa066:0xffffff);
      if(s.isExpedition&&s.elapsed>=90){g.lineStyle(3,sh.done?0x66716e:sh.inCombat?0xffa066:0xb2eddf).strokeCircle(sh.x,sh.y,70);for(let i=0;i<3;i++)g.fillStyle(i<sh.completed?0x66716e:0xffd36b).fillCircle(sh.x-16+i*16,sh.y+46,4);if(sh.progress>0)g.lineStyle(6,0xffd36b).beginPath().arc(sh.x,sh.y,70,-Math.PI/2,-Math.PI/2+Math.PI*2*sh.progress/6).strokePath();}
    }
    drawUI(w,h){const s=this.s,cam=s.cameras.main;for(const [type,b] of [['frog',this.frog],['cat',this.catCapture]])if(b?.state==='ready')s.label('CAPTURE '+type.toUpperCase()+' '+Math.round(b.progress/2.5*100)+'%',Math.max(95,Math.min(w-95,b.x-cam.scrollX)),Math.max(175,Math.min(h-135,b.y-cam.scrollY-75)),13,'#30221a','center');
      for(const c of this.chests)if(!c.opened&&dist(c,s.player)<550)s.label('XP CHEST',Math.max(65,Math.min(w-65,c.x-cam.scrollX)),Math.max(180,Math.min(h-135,c.y-cam.scrollY-40)),12,'#30221a','center');
      const sh=this.shrine;if(s.isExpedition&&sh.active&&!sh.done)s.label('SHRINE · '+(sh.inCombat?'DEFEAT ELITE':sh.needsExit?'LEAVE TO REARM':dist(s.player,sh)>240?'OPTIONAL · '+(sh.completed+1)+'/3':`HOLD 6s · ${sh.completed+1}/3 · ${this.shrineStats().hp} HP / ${this.shrineStats().damage} DMG`),Math.max(100,Math.min(w-100,sh.x-cam.scrollX)),Math.max(180,Math.min(h-135,sh.y-cam.scrollY-90)),12,'#30221a','center');}
    summary(){return {chestsOpened:this.chestsOpened,chestXp:this.chestXp,chests:this.chests.map(({x,y,xp,opened})=>({x,y,xp,opened})),starter:this.s.starter,party:this.party(),phase:this.phaseName(),secondNests:this.second,extraEliteSpawned:this.extraEliteSpawned,supportPulses:this.supportPulses,frogSupport:this.s.frogStats(),shieldBlocks:this.shieldBlocks,shrine:{...this.shrine},frog:this.frog?{state:this.frog.state,x:this.frog.x,y:this.frog.y,progress:this.frog.progress}:null};}
  }
  window.Expedition=Expedition;
})();
