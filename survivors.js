(() => {
  'use strict';
  // Survivor history uses its own storage key; campaign saves are untouched.
  const WORLD = 4500, DURATION = new URLSearchParams(location.search).has('trial')?120:600, STEP = 1 / 60, MAX_HP = 40;
  const RUN_HISTORY_KEY = 'scrollmonsters-survivor-runs-v1', RUN_HISTORY_BYTES = 2 * 1024 * 1024;
  const A = 'assets/Ninja Adventure - Asset Pack/';
  // Survivors UI is laid out in logical space and drawn at uiScale(): 2x (portrait, desktop Normal) or 3x (desktop Large).
  const FACESETS = {walker:'Characters/EggBoy',cat:'Animals/CatCyclop',owl:'Monsters/Arcane/Tier1/Owl',beast:'Monsters/Feral/Tier1/Beast',frog:'Animals/Frog',mouse:'Monsters/Arcane/Tier1/MouseBlack',mole:'Monsters/Bloom/Tier1/Mole',bear:'Monsters/Feral/Tier2/Bear',salamander:'Monsters/Feral/Tier1/Lizard',spider:'Monsters/Feral/Tier2/SpiderRed',storm:'Monsters/Feral/Tier1/Lizard2'};
  const RELIC_IDS = ['boots','stone','ricochet','repulsion','slipstream','bloodroot','pack','resonance','echo','drum','hunter','spite','veil'];
  const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
  const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
  const direction = (x,y) => Math.abs(x)>Math.abs(y) ? (x<0?2:3) : (y<0?1:0);
  class WoodlandTrial extends Phaser.Scene {
    constructor(){super('WoodlandTrial');}
    preload(){
      SurvivorEnemies.preload(this);
      for(const [key,pack,file] of [['fxHit','Combat','impact_hit_1'],['fxWhirl','Combat','slash_whirlwind'],['fxEarth','Earth','impact_earth_3'],['fxWater','Water','impact_water'],['fxDust','Combat','impact_dust_dash']])this.load.spritesheet(key,`assets/SoggySocks ${pack} FX/PNG/${file}_sheet.png`,{frameWidth:100,frameHeight:100});
      this.load.spritesheet('xpChest',A+'Items/Treasure/LittleTreasureChest.png',{frameWidth:16,frameHeight:16});
      this.load.image('dungeonProps',A+'Backgrounds/Tilesets/TilesetDungeon.png');
      this.load.image('nestBone',A+'Items/Weapons/Bone/Sprite.png');
      this.load.spritesheet('guardianBlast',A+'FX/Elemental/Explosion/SpriteSheet.png',{frameWidth:40,frameHeight:40});
      this.load.spritesheet('guardianFire',A+'FX/Projectile/Fireball.png',{frameWidth:16,frameHeight:16});
      this.load.image('desert',A+'Backgrounds/Tilesets/TilesetDesert.png');
      this.load.spritesheet('mouse',A+'Actor/Monsters/Arcane/Tier1/MouseBlack/SpriteSheet.png',{frameWidth:16,frameHeight:16});
      this.load.spritesheet('bear',A+'Actor/Monsters/Feral/Tier2/Bear/SpriteSheet.png',{frameWidth:16,frameHeight:16});
      this.load.spritesheet('mole',A+'Actor/Monsters/Bloom/Tier1/Mole/Mole.png',{frameWidth:16,frameHeight:16});
      this.load.spritesheet('salamander',A+'Actor/Monsters/Feral/Tier1/Lizard/Lizard.png',{frameWidth:16,frameHeight:16});
      this.load.spritesheet('storm',A+'Actor/Monsters/Feral/Tier1/Lizard2/Lizard2.png',{frameWidth:16,frameHeight:16});
      this.load.spritesheet('spider',A+'Actor/Monsters/Feral/Tier2/SpiderRed/SpriteSheet.png',{frameWidth:16,frameHeight:16});
      this.load.spritesheet('elementThunder',A+'FX/Elemental/Thunder/SpriteSheet.png',{frameWidth:16,frameHeight:28});
      this.load.spritesheet('elementFire',A+'FX/Particle/Fire.png',{frameWidth:12,frameHeight:12});
      this.load.spritesheet('frog',A+'Actor/Animals/Frog/SpriteSheet.png',{frameWidth:16,frameHeight:16});
      this.load.spritesheet('guardian',A+'Actor/Boss/DemonCyclop/Walk.png',{frameWidth:50,frameHeight:50});
      this.load.spritesheet('walker',A+'Actor/Characters/EggBoy/SeparateAnim/Walk.png',{frameWidth:16,frameHeight:16});
      this.load.spritesheet('cat',A+'Actor/Animals/CatCyclop/SpriteSheet.png',{frameWidth:16,frameHeight:16});
      this.load.spritesheet('bat',A+'Actor/Monsters/Feral/Tier1/Bat/SpriteSheet.png',{frameWidth:16,frameHeight:16});
      this.load.spritesheet('beast',A+'Actor/Monsters/Feral/Tier1/Beast/Beast.png',{frameWidth:16,frameHeight:16});
      this.load.spritesheet('slash',A+'FX/SlashFx/Slash/SpriteSheet.png',{frameWidth:32,frameHeight:32});
      this.load.spritesheet('owl',A+'Actor/Monsters/Arcane/Tier1/Owl/Owl.png',{frameWidth:16,frameHeight:16});
      this.load.image('frenzyPickup',A+'Items/Scroll/ScrollThunder.png');
      this.load.image('feather',A+'Items/Resource/feather.png');
      this.load.image('heart',A+'Items/Potion/Heart.png');
      this.load.image('floor',A+'Backgrounds/Tilesets/TilesetFloor.png');
      this.load.image('nature',A+'Backgrounds/Tilesets/TilesetNature.png');SurvivorGreens.preload(this);
      this.load.audio('hit',A+'Audio/Sounds/Menu/Accept4.wav');
      for(const k of ['panel','slot','pill','banner','status','zslot','heart'])this.load.image('dk_'+k,'assets/ui/darkmode/'+k+'.png');
      this.load.image('xpGem','assets/ui/xp_gem.png');
      this.load.image('killIcon',A+'Items/Weapons/Sword/SpriteInHand.png');
      this.load.font('NovelMix','assets/ui/font_medium_9px.ttf');
      for(const [id,path] of Object.entries(FACESETS))this.load.image('face_'+id,A+'Actor/'+path+'/Faceset.png');
      for(const id of RELIC_IDS)this.load.image('relic_'+id,'assets/icons/relics/'+id+'.png');
      for(const [key,m] of Object.entries(FX_SHEETS))this.load.image(key,m.src);
      for(const id of UPGRADE_ICON_IDS)this.load.image('upgrade_'+id,'assets/icons/upgrades/'+id+'.png');
      this.load.image('upgrade_bearPower','assets/icons/upgrades/bearStun.png');
      this.load.on('loaderror',file=>{document.getElementById('fallback').textContent='Could not load '+file.key+'. Reload to retry.';});
    }
    create(){
      document.getElementById('fallback').hidden=true;this.field=new URLSearchParams(location.search).get('field')==='desert'?'desert':'woods';this.isExpedition=DURATION===600;this.unlocked=Expedition.readUnlocks();this.starter='cat';this.catActive=true;
      this.seed=this.runSeed();this.rng=this.seed;this.mode='title';this.accumulator=0;this.enemies=[];this.shots=[];this.effects=[];this.pickups=[];this.trail=[];this.obstacles=[];
      this.enemyPool=[];this.shotPool=[];this.effectPool=[];this.pickupPool=[];
      this.keys=this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT');
      this.enemyCap=150;this.worldSize=WORLD;this.cameras.main.removeBounds();
      this.makeMap();
      this.textures.get('nature').add('nestStump',0,0,128,32,32);this.textures.get('dungeonProps').add('shrineAltar',0,32,32,16,32);
      const shieldIcon=this.make.graphics({x:0,y:0,add:false});shieldIcon.fillStyle(0x83d9ff).lineStyle(2,0x244e72).beginPath().moveTo(4,3).lineTo(28,3).lineTo(26,20).lineTo(16,29).lineTo(6,20).closePath().fillPath().strokePath();shieldIcon.generateTexture('shieldPickup',32,32);shieldIcon.destroy();
      const icon=this.make.graphics({x:0,y:0,add:false});icon.lineStyle(6,0x9beaff).beginPath().moveTo(7,4).lineTo(7,18).arc(16,18,9,Math.PI,0,true).lineTo(25,4).strokePath();icon.generateTexture('magnetPickup',32,32);icon.clear();icon.lineStyle(3,0xbfffd5).strokeCircle(16,16,13).lineBetween(16,6,16,26).lineBetween(6,16,26,16);icon.generateTexture('cleansePickup',32,32);icon.destroy();
      this.player={x:800,y:800,r:12,dir:0,hp:MAX_HP,inv:0,fire:0};
      this.cat={x:754,y:810,r:10,dir:0,attack:0};
      this.playerSprite=this.add.sprite(800,800,'walker').setScale(3);
      this.owlSprite=this.add.sprite(800,800,'owl').setScale(3).setVisible(false);
      this.catSprite=this.add.sprite(754,810,'cat').setScale(3);
      this.playerShadow=this.add.ellipse(800,815,29,12,0x243b2c,.3);
      this.catShadow=this.add.ellipse(754,822,26,10,0x243b2c,.3);
      this.fx=this.add.graphics().setDepth(900000000);
      this.cameras.main.startFollow(this.playerSprite,true,1,1);
      this.ui=new ScrollUI.NativeView(this);this.ui.root.setScrollFactor(0).setDepth(1000000000);this.juice=new SurvivorJuice(this);this.hud=new SurvivorHud(this);this.screens=new SurvivorScreens(this);
      this.joyGraphic=this.add.graphics().setScrollFactor(0).setDepth(1000000001);
      this.input.addPointer(2);
      // Any interactive UI object under the pointer owns the press; only bare field starts movement.
      this.input.on('pointerdown',(p,over)=>{if(this.mode==='pack'){this.packs.act();return;}if(this.mode==='playing'&&!over.length&&!this.joy){this.joy={id:p.id,x:p.x,y:p.y,dx:0,dy:0,touch:p.wasTouch,started:performance.now()};if(p.wasTouch)this.mouseAim=null;else this.mouseAim={x:p.x,y:p.y};}});
      this.input.on('pointermove',p=>{if(this.mode==='playing'&&!p.wasTouch)this.mouseAim={x:p.x,y:p.y};if(this.joy?.id===p.id){this.joy.dx=p.x-this.joy.x;this.joy.dy=p.y-this.joy.y;}});
      const release=p=>{if(this.joy?.id!==p.id)return;const joy=this.joy;this.joy=null;
        const dx=p.x-joy.x,dy=p.y-joy.y,d=Math.hypot(dx,dy);
        if(joy.touch&&performance.now()-joy.started<=300&&d>=48){this.expansion.dash({x:dx/d,y:dy/d});}
      };
      this.input.on('pointerup',release);this.input.on('pointerupoutside',release);
      this.input.keyboard.on('keydown-ENTER',()=>{if(this.mode==='title'||this.mode==='won'||this.mode==='lost')this.start();else if(this.mode==='paused')this.pause();else if(this.mode==='unlock')this.closeUnlock();else if(this.mode==='pack')this.packs.act();});
      for(let i=1;i<=3;i++)this.input.keyboard.on('keydown-'+['ONE','TWO','THREE'][i-1],()=>this.mode==='relic'?(this.juice.since('relic')>=SurvivorScreens.LOCK_MS&&this.relics.choose(i-1)):(this.juice.since('upgrade')>=SurvivorScreens.LOCK_MS&&this.chooseUpgrade(i-1)));
      this.input.keyboard.on('keydown-ESC',()=>this.pause());
      this.input.keyboard.on('keydown-P',()=>this.pause());
      this.input.keyboard.on('keydown-R',()=>{if(this.mode!=='title')this.start();});
      this.input.keyboard.on('keydown-SPACE',()=>{if(this.mode==='pack')this.packs.act();else this.expansion.dash();});
      this.input.keyboard.on('keydown-F',()=>{if(this.scale.isFullscreen)this.scale.stopFullscreen();else this.scale.startFullscreen();});
      this.game.events.on('blur',()=>{this.joy=null;this.input.keyboard.resetKeys();if(this.mode==='pack')this.packs.blurred=true;if(this.mode==='playing'){this.mode='paused';this.draw();}});
      this.scale.on('resize',()=>this.draw());
      window.addEventListener('pagehide',()=>this.saveRun());
      this.resetState();this.mode='title';this.draw();
      window.render_game_to_text=()=>JSON.stringify(this.snapshot());
      window.advanceTime=ms=>{this.manual=true;for(let n=0;n<Math.round(ms/(1000/60));n++)this.tick(STEP);this.draw();};
      if(new URLSearchParams(location.search).has('test'))window.__survivorTest={scene:this,start:()=>this.start(),spawn:(type,x,y)=>this.spawn(type,x,y),tick:seconds=>window.advanceTime(seconds*1000)};
      window.__phaserReady=true;
    }
    uiScale(){return this.scale.width<this.scale.height?2:(this.juice?.uiLarge?3:2);}
    uiSize(){const k=this.uiScale();return {w:this.scale.width/k,h:this.scale.height/k};}
    // World point to logical UI point (the world camera never zooms).
    toUI(x,y){const cam=this.cameras.main,k=this.uiScale();return {x:(x-cam.scrollX)/k,y:(y-cam.scrollY)/k};}
    // Each run gets a fresh seed so dens, chests and spawns vary; ?seed=N replays one, and ?test pins 9137 so checks are reproducible.
    runSeed(){const q=new URLSearchParams(location.search);if(q.has('seed'))return Number(q.get('seed'))>>>0;if(q.has('test'))return 9137;return crypto.getRandomValues(new Uint32Array(1))[0];}
    rand(){this.rng=(1664525*this.rng+1013904223)>>>0;return this.rng/4294967296;}
    makeMap(){
      const floor=this.textures.get('floor');floor.add('grass',0,0,192,16,16);floor.add('sand',0,16,16,16,16);this.textures.get('desert').add('palm',0,160,160,32,32);
      const nature=this.textures.get('nature');
      nature.add('tree',0,64,32,64,48);nature.add('bush',0,0,0,32,32);nature.add('rock',0,240,160,32,32);nature.add('flower',0,0,160,16,16);
      // The woods field is the procedural Greens map, rebuilt each run in resetState().
      if(this.field!=='desert')return;
      this.loopFloor=this.add.tileSprite(-WORLD,-WORLD,WORLD*3,WORLD*3,'floor','sand').setOrigin(0).setTileScale(2).setDepth(-1000000000);
      for(let n=0;n<220;n++){const x=24+this.rand()*(WORLD-48),y=24+this.rand()*(WORLD-48);this.add.image(x,y,'nature',this.field==='desert'?'rock':'flower').setScale(this.field==='desert'?.45:2).setAlpha(.6).setDepth(-999999999);}
      // Wide corridors, visible trunks; no invisible collision on canopy pixels.
      const positions=[[355,700],[450,680],[545,700],[355,900],[545,900],[1055,700],[1150,680],[1245,700],[1055,900],[1245,900],[560,650],[1010,630],[600,1000],[1060,1010],[330,380],[750,320],[1240,370],[290,810],[1280,810],[360,1240],[810,1270],[1220,1230]];
      for(const [i,[x,y]] of positions.map(([x,y])=>[x*WORLD/1600,y*WORLD/1600]).entries()){
        const tree=i<10||i%3!==0,r=tree?23:28;
        this.obstacles.push({x,y,r});
        this.add.ellipse(x,y+5,r*2.7,r,0x203c29,.25).setDepth(y-1);
        this.add.image(x,y+25,this.field==='desert'&&tree?'desert':'nature',tree?(this.field==='desert'?'palm':'tree'):'rock').setOrigin(.5,1).setScale(tree?2:3).setDepth(y+25);
      }

    }
    resetState(){
      this.rng=this.seed;if(this.field!=='desert'){this.greens?.destroy();this.obstacles=[];this.greens=new SurvivorGreens(this);}this.shrineLocation=this.greens?{...this.greens.map.shrine}:null;
      if(!this.shrineLocation){for(let i=0;i<200;i++){const p={x:200+this.rand()*(WORLD-400),y:200+this.rand()*(WORLD-400)};if(!this.blocked(p.x,p.y,160)&&distance(p,{x:WORLD/2,y:WORLD/2})>400){this.shrineLocation=p;break;}}}
      this.expansion=new SurvivorExpansion(this);this.totalXp=0;this.xpRemainder=0;
      for(const list of [this.enemies,this.shots,this.effects,this.pickups])for(const e of list)e.sprite.setVisible(false);
      this.enemies=[];this.shots=[];this.effects=[];this.pickups=[];this.trail=[];this.elapsed=0;SurvivorEnemies.reset(this);this.spawnTimer=.25;this.recycleTimer=0;this.kills=0;this.spawned=0;this.peakEnemies=0;this.spawnCapSeconds=0;this.catKills=0;this.playerDamage=0;this.catDamage=0;this.damageTaken=0;this.accumulator=0;this.joy=null;
      this.aim={x:0,y:1};this.mouseAim=null;
      Object.assign(this.player,{x:WORLD/2,y:WORLD/2,hp:MAX_HP,inv:0,fire:.1,dir:0});Object.assign(this.cat,{x:WORLD/2-42,y:WORLD/2+30,attack:0});
      this.owl=null;this.owlAppeared=false;this.owlDamage=0;this.haste=0;this.chorusTime=0;this.shield=false;this.notice='';this.noticeTime=0;this.nextHealAt=30;this.supplyAt=35;this.supplyIndex=0;this.level=1;this.xp=0;this.choices=[];this.upgrades={partyDamage:0,partySpeed:0,mousePower:0,mouseCount:0,mouseSpeed:0,mouseJump:0,molePower:0,moleArea:0,moleSpeed:0,moleEcho:0,moleSlow:0,bearPower:0,bearArea:0,bearSpeed:0,bearStun:0,bearGuard:0,claws:0,sweep:0,cast:0,feather:0,hide:0,feet:0,pull:0,split:0,slam:0,owlPower:0,owlSpeed:0,beastPower:0,beastSpeed:0,bubble:0,frogPower:0,chorus:0,marks:0};this.maxHp=40;this.stronger=false;
      this.creatures?.destroy();this.creatures=new SurvivorCreatures(this);this.nestDeck=this.nestDeckOverride?[...this.nestDeckOverride]:['owl','beast','cat','mouse','bear','mole','salamander','spider','storm'].map(type=>({type,sort:this.rand()})).sort((a,b)=>a.sort-b.sort).map(e=>e.type);this.relics?.destroy();this.relics=new SurvivorRelics(this);this.packs?.destroy();this.packs=new SurvivorPacks(this);this.expedition?.destroy();this.encounters?.destroy();this.encounters=new SurvivorEncounters(this);this.expedition=new Expedition(this);this.expedition.initStarter();
      this.trail.push({x:this.cat.x,y:this.cat.y},{x:this.player.x,y:this.player.y});
    }
    openUnlock(type){this.unlockType=type;this.mode='unlock';this.joy=null;this.input.keyboard.resetKeys();this.accumulator=0;this.draw();}
    closeUnlock(){if(this.mode!=='unlock')return;this.unlockType=null;this.mode='playing';this.accumulator=0;this.draw();}
    // Title presentation state (starterFrom/starterAt/lockedTap) only drives the menu's flip and hints.
    chooseStarter(id){if(!this.unlocked.includes(id)){this.lockedTap={id,at:this.juice.now()};this.draw();return;}this.lockedTap=null;if(id!==this.starter){this.starterFrom=this.starter;this.starterAt=this.juice.now();}const mode=this.mode;this.run=null;this.starter=id;this.resetState();this.mode=mode;this.draw();}
    start(){this.lockedTap=null;if(this.run&&!this.run.finished)this.finishRun('restarted');const fromTitle=this.mode==='title';this.seed=this.runSeed();this.resetState();this.juice.reset();if(fromTitle)this.juice.iris();this.run={id:crypto.randomUUID(),version:2,seed:this.seed,build:'reliability-v26',field:this.field,runMode:this.isExpedition?'expedition':'trial',starter:this.starter,startedAt:new Date().toISOString(),status:'in_progress',events:[],samples:[],finished:false};this.nextSample=0;this.logEvent('started');this.saveRun();this.mode='playing';this.input.keyboard.resetKeys();this.draw();}
    reward(kind,data={}){this.events.emit('reward',{kind,...data});} // presentation hook: emits only, changes nothing
    logEvent(type,data={}){if(type==='owl_captured')this.expedition.unlock('owl');if(type==='beast_captured')this.expedition.unlock('beast');if(this.run&&!this.run.finished)this.run.events.push({time:+this.elapsed.toFixed(2),type,...data});}
    runSummary(){return {field:this.field,greens:this.greens?.summary()||null,totalXp:this.totalXp,creatures:this.creatures.summary(),relics:this.relics.summary(),expedition:this.expedition.summary(),seconds:+this.elapsed.toFixed(2),spawned:this.spawned,enemiesAlive:this.enemies.filter(e=>e.hp>0).length,peakEnemies:this.peakEnemies,spawnCapSeconds:+this.spawnCapSeconds.toFixed(2),kills:this.kills,level:this.level,xp:this.xp,hp:this.player.hp,maxHp:this.maxHp,damage:{player:this.playerDamage,cat:this.catDamage,owl:this.owlDamage,taken:this.damageTaken},companionStats:this.companionStats(),encounters:this.encounters.summary(),upgrades:{...this.upgrades},owl:this.owl?.state||'not_seen'};}
    saveRun(){
      if(!this.run)return;
      this.run.summary=this.runSummary();this.run.updatedAt=new Date().toISOString();
      try {
        const stored=localStorage.getItem(RUN_HISTORY_KEY);
        let history=[];
        try { history=JSON.parse(stored||'[]'); } catch { /* Replace unreadable history with this run. */ }
        if(!Array.isArray(history))history=[];
        const current={...this.run,events:[...this.run.events],samples:[...this.run.samples]};
        history=[current,...history.filter(r=>r&&r.id!==current.id)].slice(0,50);
        // Keep the newest summary even when an unusually long run fills the budget.
        const trim=()=>{
          if(history.length>1){history.pop();return true;}
          const field=current.samples.length?'samples':current.events.length?'events':null;
          if(!field)return false;
          const removed=Math.ceil(current[field].length/2);
          current[field]=current[field].slice(removed);
          current.telemetryOmitted={...current.telemetryOmitted,[field]:(current.telemetryOmitted?.[field]||0)+removed};
          return true;
        };
        while(true){
          const serialized=JSON.stringify(history);
          if(serialized.length*2>RUN_HISTORY_BYTES){if(trim())continue;throw new Error('Run summary exceeds history budget');}
          try {
            localStorage.setItem(RUN_HISTORY_KEY,serialized);
            this.logStorageError=false;
            return;
          }catch(error){
            const quota=error.name==='QuotaExceededError'||error.name==='NS_ERROR_DOM_QUOTA_REACHED'||error.code===22||error.code===1014;
            if(!quota||!trim())throw error;
          }
        }
      }catch{this.logStorageError=true;}
    }
    finishRun(status){if(!this.run||this.run.finished)return;this.logEvent('ended',{outcome:status});this.run.status=status;this.run.finished=true;this.saveRun();}
    sampleRun(){
      if(!this.run||this.elapsed<this.nextSample)return;
      this.run.samples.push({
        seconds:+this.elapsed.toFixed(2),x:Math.round(this.player.x),y:Math.round(this.player.y),
        hp:this.player.hp,maxHp:this.maxHp,level:this.level,xp:this.xp,totalXp:this.totalXp,
        kills:this.kills,spawned:this.spawned,enemies:this.enemies.length,peakEnemies:this.peakEnemies,
        spawnCapSeconds:+this.spawnCapSeconds.toFixed(2),party:this.expedition.party(),phase:this.expedition.phaseName(),
        damage:{player:this.playerDamage,cat:this.catDamage,owl:this.owlDamage,beast:this.encounters.beastDamage,...this.creatures.damage,taken:this.damageTaken}
      });
      this.nextSample=this.elapsed+5;
      this.saveRun();
    }
    pause(){if(this.mode==='playing')this.mode='paused';else if(this.mode==='paused')this.mode='playing';this.joy=null;this.input.keyboard.resetKeys();this.accumulator=0;this.logEvent(this.mode==='paused'?'paused':'resumed');this.saveRun();this.draw();}
    pooled(pool,key,scale=3){let sprite=pool.find(s=>!s.visible);if(!sprite){sprite=this.add.sprite(0,0,key);pool.push(sprite);}return sprite.setTexture(key).setVisible(true).setActive(true).setAlpha(1).setTint(0xffffff).setScale(scale).setFlipX(false).setRotation(0);}
    // The camera's scroll without the cosmetic follow offset (juice shake, title pan). The sim reads this, never cam.scrollX,
    // so presentation can't change what is 'on screen' to the game logic. It is snapshotted at the start of each real frame,
    // right after a render has applied the current offset; scripted ticks between renders keep the last snapshot.
    viewScroll(){if(!this.simScroll){const cam=this.cameras.main;this.simScroll={x:cam.scrollX+cam.followOffset.x,y:cam.scrollY+cam.followOffset.y};}return this.simScroll;}
    snapshotView(){const cam=this.cameras.main;this.simScroll={x:cam.scrollX+cam.followOffset.x,y:cam.scrollY+cam.followOffset.y};}
    spawnView(){
      const cam=this.cameras.main,v=this.viewScroll();
      // Include both the rendered camera and its next follow position.
      const x=this.player.x-cam.width/2;
      const y=this.player.y-cam.height/2;
      const cx=Math.abs(x-v.x)>cam.width?x:v.x,cy=Math.abs(y-v.y)>cam.height?y:v.y;
      return {left:Math.min(x,cx),top:Math.min(y,cy),right:Math.max(x,cx)+cam.width,bottom:Math.max(y,cy)+cam.height};
    }
    enemySpawnPoint(radius=20){
      const p=this.player,view=this.spawnView(),counts=Array(8).fill(0),tau=Math.PI*2;
      const sector=(x,y)=>Math.floor(((Math.atan2(y-p.y,x-p.x)+tau)%tau)/tau*8);
      const nearby=Math.max(view.right-view.left,view.bottom-view.top);
      for(const e of this.enemies)if(e.hp>0&&distance(e,p)<nearby)counts[sector(e.x,e.y)]++;
      // Sample valid offscreen positions before weighting, so blocked/world edges
      // cannot force a spawn onto the screen or inside an obstacle.
      const candidates=[];
      for(let i=0;i<48;i++){
        const a=(i%8+this.rand())*tau/8,dx=Math.cos(a),dy=Math.sin(a),margin=64+this.rand()*48;
        const tx=(dx>0?view.right+margin-p.x:p.x-view.left+margin)/Math.max(.0001,Math.abs(dx));
        const ty=(dy>0?view.bottom+margin-p.y:p.y-view.top+margin)/Math.max(.0001,Math.abs(dy));
        const d=Math.min(tx,ty),x=p.x+dx*d,y=p.y+dy*d;
        if(distance({x,y},p)<220||this.blocked(x,y,radius))continue;
        candidates.push({x,y,weight:1/(1+counts[sector(x,y)])**2});
      }
      let choice=this.rand()*candidates.reduce((sum,c)=>sum+c.weight,0);
      for(const c of candidates){choice-=c.weight;if(choice<=0)return c;}
      return candidates[candidates.length-1]||null;
    }
    recycleDistantEnemies(dt){
      this.recycleTimer=(this.recycleTimer||0)-dt;if(this.recycleTimer>0)return;
      this.recycleTimer=.75;const view=this.spawnView();let moved=0;
      for(const e of this.enemies){
        if(e.hp<=0||e.placedSpawn||e.elite||e.kind||e.packReward||e.shrineTier||e.phase!=='seek'||e.stun>0)continue;
        if(e.x>=view.left-300&&e.x<=view.right+300&&e.y>=view.top-300&&e.y<=view.bottom+300)continue;
        const point=this.enemySpawnPoint(Math.max(20,e.r));if(!point)continue;
        e.x=point.x;e.y=point.y;
        if(++moved===2)break;
      }
    }
    spawn(type,x,y){
      if(this.enemies.filter(e=>e.hp>0).length>=this.enemyCap)return;
      const placedSpawn=x!==undefined;
      if(!placedSpawn){const point=this.enemySpawnPoint();if(!point)return;x=point.x;y=point.y;}
      const beast=type==='beast',def=SurvivorEnemies.stats[type]||{cat:{hp:7,speed:72,r:11,scale:3},frog:{hp:6,speed:42,r:10,scale:3},mouse:{hp:2,speed:95,r:8,scale:2},salamander:{hp:12,speed:42,r:12,scale:3},spider:{hp:10,speed:45,r:12,scale:3},storm:{hp:12,speed:42,r:12,scale:3},bear:{hp:28,speed:32,r:20,scale:4},mole:{hp:12,speed:40,r:12,scale:3}}[type];const e={type,x,y,placedSpawn,r:beast?16:11,hp:beast?9:type==='owl'?6:4,maxHp:beast?9:type==='owl'?6:4,speed:beast?47:68,phase:'seek',clock:1.5+this.rand(),dx:0,dy:0,flash:0,sprite:this.pooled(this.enemyPool,SurvivorEnemies.textureFor(type),beast?3.5:2.5)};if(def){e.hp=e.maxHp=def.hp;e.speed=def.speed;e.r=def.r;e.sprite.setScale(def.scale);if(type==='mouse')e.contactDamage=4;}SurvivorEnemies.decorate(this,e);if(this.stronger)this.strengthen(e);if(this.expedition.lateStrength)this.expedition.strengthen(e);if(this.isExpedition&&this.elapsed>=300){const tier=1+Math.floor((this.elapsed-300)/60);e.hp*=1+.3*tier;e.maxHp=e.hp;e.speed*=1+.035*tier;}this.enemies.push(e);if(type in this.creatures.waveCounts)this.creatures.waveCounts[type]++;this.spawned++;this.peakEnemies=Math.max(this.peakEnemies,this.enemies.length);return e;
    }
    burst(key,x,y,scale=1,life=.4,tint=0xffffff,a=0){
      // Cosmetic only: pooled, bounded, and advanced by the combat clock so pauses freeze FX.
      if(this.effects.length>=80)return;const sprite=this.pooled(this.effectPool,key,scale).setTint(tint);
      this.effects.push({x,y,a,life,maxLife:life,frames:this.textures.get(key).frameTotal-1,sprite});
    }
    blocked(x,y,r,ignoreProps=false){return this.obstacles.some(o=>!(ignoreProps&&o.prop)&&SurvivorWorld.distance(this,{x,y},o)<r+o.r);}
    move(body,dx,dy,solid=true){body.x+=dx;body.y+=dy;if(!solid)return;
      for(const o of this.obstacles){let x=SurvivorWorld.delta(body.x,o.x,WORLD),y=SurvivorWorld.delta(body.y,o.y,WORLD),d=Math.hypot(x,y),r=body.r+o.r;if(d<r){if(d<.001){x=1;y=0;d=1;}body.x+=x/d*(r-d);body.y+=y/d*(r-d);}}
    }
    combatTargets(){return [...this.enemies,...this.encounters.targets(),...(this.owl?.state==='wild'?[this.owl]:[])];}
    // Impact loops use this so attacks that land on breakables smash them; aiming still uses combatTargets().
    hitTargets(){return this.greens?[...this.combatTargets(),...this.greens.targets()]:this.combatTargets();}
    target(from,range,anchor=from){let result=null,best=range;for(const e of this.combatTargets()){const d=distance(e,from);if(e.hp>0&&d<best&&distance(e,anchor)<range+50){best=d;result=e;}}return result;}
    hit(e,amount,source,from,relicEffect=false){if(e.hp<=0)return;if(e.kind==='prop'){this.greens.damage(e,amount);return;}if(e.enemyShield){e.enemyShield=false;this.burst('fxWater',e.x,e.y,1.8,.3,0xffbc88);return;}let boost=1;if(!relicEffect){amount*=1+.08*this.upgrades.partyDamage;const before=amount;amount=this.relics.modifyHit(e,amount,source);if(before>0)boost=amount/before;}if(!relicEffect&&['player','cat','owl','beast','mouse','mole','bear','salamander','spider','storm'].includes(source))amount+=this.frogStats().damageBonus;if(!relicEffect&&e.markUntil>this.elapsed&&source!=='owl'){amount*=1.25;boost*=1.25;}if(!relicEffect&&source!=='player'&&e.webUntil>this.elapsed){const web=1+this.creatures.elements.stats('spider').vulnerability;amount*=web;boost*=web;}if(!relicEffect)this.relics.queueEcho(e,amount,source);const applied=Math.min(e.hp,amount);e.hp-=amount;e.flash=.1;this.juice.damage(e,amount,boost);if(source==='player'||source==='owl')this.burst(source==='player'?'fxEarth':'fxHit',e.x,e.y,source==='player'?1.4:1.6,.32,source==='owl'?0xa9f5ff:0xffffff);
      if(source==='cat')this.catDamage+=applied;else if(source==='owl')this.owlDamage+=applied;else if(source==='beast')this.encounters.beastDamage+=applied;else if(source in this.creatures.damage)this.creatures.damage[source]+=applied;else this.playerDamage+=applied;
      if(!relicEffect){this.creatures.elements.hit(e,source);if(e.hp<=0){this.relics.killed(e,amount);this.creatures.elements.killed(e);}}if(this.encounters.hitSpecial(e))return;
      if(e===this.owl&&e.hp<=0){e.state='ready';e.progress=0;this.logEvent('owl_weakened');this.announce('Owl weakened! Stay inside its ring to capture.');return;}
      const dx=e.x-from.x,dy=e.y-from.y,d=Math.hypot(dx,dy)||1;if(!this.unstoppable(e)){if(source==='cat'&&this.upgrades.pull)this.knockbackEnemy(e);else this.move(e,dx/d*12,dy/d*12);}
      if(e.hp<=0){if(e.packReward)this.packs.drop(e.x,e.y,'elite');if(e.shrineTier)this.expedition.completeShrine(e);else if(e.elite){this.logEvent('elite_defeated');this.announce('Elite defeated!');for(let i=0;i<8;i++)this.drop('xp',e.x,e.y);}this.kills++;if(source==='cat')this.catKills++;this.drop('xp',e.x,e.y);if(this.player.hp<this.maxHp&&this.elapsed>=this.nextHealAt){this.drop('heal',e.x,e.y);this.nextHealAt=this.elapsed+30;}}
    }
    // Map callouts are off by design (playtest 2026-09-29); only headline() shows a header.
    announce(message){}
    headline(message){this.notice=message;this.noticeTime=4;}
    drop(type,x,y){const sprite=this.pooled(this.pickupPool,{xp:'xpGem',heal:'heart',haste:'frenzyPickup',shield:'shieldPickup',magnet:'magnetPickup',cleanse:'cleansePickup'}[type],type==='xp'?2:type==='shield'?.85:1.7);this.pickups.push({type,x,y,life:type==='xp'?Infinity:25,sprite});}
    summonOwl(){
      this.logEvent('owl_appeared');this.owlAppeared=true;const p=this.player;let x=p.x,y=p.y;
      for(let n=0;n<24;n++){const a=n*Math.PI/12;x=p.x+Math.cos(a)*220;y=p.y+Math.sin(a)*220;if(!this.blocked(x,y,70))break;}
      this.owl={x,y,r:12,hp:18,maxHp:18,state:'wild',progress:0,attack:0,flash:0};
      this.announce('Wild Owl appeared! Weaken it to recruit.');
    }
    xpGainMultiplier(){return 1.5+.05*Math.min(10,Math.floor(this.elapsed/60));}
    gainXP(amount,scale=true){const earned=amount*(scale?this.xpGainMultiplier():1)+this.xpRemainder,whole=Math.floor(earned+1e-9);this.xpRemainder=Math.max(0,earned-whole);this.xp+=whole;this.totalXp+=whole;return whole;}
    xpNeeded(){return 10+(this.level-1)*6;}
    frogStats(){const active=this.expedition?.frog?.state==='ally',u=this.upgrades;return {active,damageBonus:active?1:0,shieldInterval:10/(1+.2*u.bubble),chorusBonus:u.chorus?.5+.15*(u.chorus-1):0};}
    attackRate(){return 1+.06*this.upgrades.partySpeed+(this.relics?.drum>0?.3:0)+(this.haste>0?.5:0)+(this.chorusTime>0&&this.frogStats().active?this.frogStats().chorusBonus:0);}
    companionStats(){const u=this.upgrades;return {owl:{damage:3.2+u.owlPower,interval:1.1/(1+.2*u.owlSpeed)},beast:{damage:4.8+2*u.beastPower,shockwave:3.2+u.beastPower,interval:2/(1+.2*u.beastSpeed)}};}
    upgradePool(){const stats=this.companionStats(),u=this.upgrades;return [
      ...this.creatures.upgrades(),
      {id:'partyDamage',name:'Party Power',detail:`All damage +${8*u.partyDamage}% → +${8*(u.partyDamage+1)}%`},
      {id:'partySpeed',name:'Party Tempo',detail:`All attack speed +${6*u.partySpeed}% → +${6*(u.partySpeed+1)}%`},
      ...(this.catActive?[{id:'claws',name:'Sharpened Claws',detail:'Cat damage +1'},{id:'sweep',name:'Wide Sweep',detail:'Cat reach +20% and wider arc'}]:[]),
      {id:'cast',name:'Quick Cast',detail:'Basic attack speed +20%'},
      {id:'hide',name:'Tough Hide',detail:'+8 maximum HP and heal 8'},
      {id:'feet',name:'Fleet Feet',detail:'Movement speed +10%'},
      ...(this.catActive&&!this.upgrades.pull?[{id:'pull',name:'Repelling Sweep',detail:'Swipes knock foes away from you and stagger them'}]:[]),
      ...(this.owl?.state==='ally'?[...(!u.marks?[{id:'marks',name:'Hunter Marks',detail:'Owl marks: other party attacks deal +25%'}]:[]),{id:'owlPower',name:'Razor Feathers',detail:`Feather damage ${stats.owl.damage} → ${stats.owl.damage+1}`},{id:'owlSpeed',name:'Rapid Volley',detail:`Volley interval ${stats.owl.interval.toFixed(2)}s → ${(1.1/(1+.2*(u.owlSpeed+1))).toFixed(2)}s`},{id:'feather',name:'Extra Feather',detail:'Owl fires +1 piercing projectile'},...(!this.upgrades.split?[{id:'split',name:'Splinter Feathers',detail:'Two splinters on hit, each at 33% damage'}]:[])]:[]),
      ...(this.encounters.beast?.state==='ally'?[{id:'beastPower',name:'Crushing Force',detail:`Charge ${stats.beast.damage} → ${stats.beast.damage+2}; quake ${stats.beast.shockwave} → ${stats.beast.shockwave+1}`},{id:'beastSpeed',name:'Relentless Charge',detail:`Charge interval ${stats.beast.interval.toFixed(2)}s → ${(2/(1+.2*(u.beastSpeed+1))).toFixed(2)}s`},...(!this.upgrades.slam?[{id:'slam',name:'Quake Charge',detail:'Beast charge ends in a damaging shockwave'}]:[])]:[])
      ,...(this.expedition.frog?.state==='ally'?[{id:'bubble',name:'Bubble Rhythm',detail:'Frog shields 20% faster per rank'},{id:'chorus',name:'Rallying Chorus',detail:`Shield pulse: 3s attack speed +${u.chorus?50+15*(u.chorus-1):0}% → +${50+15*u.chorus}%`}]:[])
    ].filter(choice=>!['claws','cast','owlPower','owlSpeed','beastPower','beastSpeed','mousePower','mouseSpeed','molePower','moleSpeed','bearSpeed','firePower','fireSpeed','webPower','webSpeed','stormPower','stormSpeed'].includes(choice.id));}
    checkLevel(){
      if(this.mode==='relic'||this.mode==='pack')return;if(this.relics.open())return;
      if(this.xp<this.xpNeeded())return;
      this.xp-=this.xpNeeded();this.level++;
      const pool=this.upgradePool();this.choices=[];
      while(this.choices.length<3)this.choices.push(pool.splice(Math.floor(this.rand()*pool.length),1)[0]);
      this.logEvent('level_up',{level:this.level,offered:this.choices.map(c=>c.id)});this.reward('levelup',{level:this.level});this.saveRun();this.mode='upgrade';this.joy=null;this.input.keyboard.resetKeys();this.accumulator=0;
    }
    grantUpgrade(id){this.upgrades[id]++;if(id==='hide'){this.maxHp+=8;const hp=this.player.hp;this.player.hp=Math.min(this.maxHp,hp+8);this.juice.heal(this.player.hp-hp);}}
    chooseUpgrade(index){
      if(this.mode!=='upgrade'||!this.choices[index])return;
      const id=this.choices[index].id;this.grantUpgrade(id);this.logEvent('upgrade_chosen',{upgrade:id,rank:this.upgrades[id]});
      this.reward('upgrade',{id,index});
      this.choices=[];this.mode='playing';this.input.keyboard.resetKeys();this.joy=null;
      this.checkLevel();this.saveRun();this.draw();
    }
    strengthen(e){if(e.strong)return;e.strong=true;e.hp*=1.2;e.maxHp*=1.2;e.speed*=1.08;}
    updateDifficulty(){if(!this.stronger&&this.elapsed>=60){this.stronger=true;this.logEvent('enemy_strength_increased');for(const e of this.enemies)this.strengthen(e);this.announce('The woods stir: enemies are tougher and faster.');}}
    updateOwl(dt){

      const o=this.owl,p=this.player;if(!o)return;
      if(o.state==='wild'){
        const d=distance(o,p)||1;if(d>125)this.move(o,(p.x-o.x)/d*50*dt,(p.y-o.y)/d*50*dt,false);
      }else if(o.state==='ready'){
        this.expedition.capture(o,'owl',dt);
      }else{
        const d=distance(o,p)||1;if(d>65)this.move(o,(p.x-o.x)/d*Math.min(d,240*dt),(p.y-o.y)/d*Math.min(d,240*dt),false);
        o.attack-=dt*this.attackRate();
        const target=this.target(o,420,p);
        if(o.attack<=0&&target){const angle=Math.atan2(target.y-o.y,target.x-o.x),count=1+this.upgrades.feather;for(let i=0;i<count;i++){const a=angle+(i-(count-1)/2)*.12;this.shots.push({x:o.x,y:o.y,dx:Math.cos(a),dy:Math.sin(a),life:1.35,source:'owl',hits:new Set(),sprite:this.pooled(this.shotPool,'feather',1.5)});}o.attack=this.companionStats().owl.interval;}
      }
    }
    unstoppable(e){return !!e.elite||e.kind==='boss'||(e.type==='beast'&&e.phase==='charge');}
    knockbackEnemy(e){
      if(e.hp<=0||e.kind||this.unstoppable(e))return;const p=this.player,dx=e.x-p.x,dy=e.y-p.y,d=Math.hypot(dx,dy)||1;
      // Push away from the player in short solid steps; never teleport through a trunk.
      for(let i=0;i<12;i++){const x=e.x+dx/d*5,y=e.y+dy/d*5;if(this.blocked(x,y,e.r))break;e.x=x;e.y=y;}
      e.stun=.45;
    }
    separateEnemies(dt){
      // Soft body spacing, applied simultaneously to avoid iteration-order drift.
      // Committed charges and elites keep their line; ordinary enemies yield.
      const bodies=this.enemies.filter(e=>e.hp>0),push=bodies.map(()=>({x:0,y:0}));
      const fixed=e=>this.unstoppable(e)||['windup','shoot','slam','spin','summon','hunterAim'].includes(e.phase)||e.stun>0;
      for(let i=0;i<bodies.length;i++)for(let j=i+1;j<bodies.length;j++){
        const a=bodies[i],b=bodies[j],space=a.r+b.r+8;
        let dx=a.x-b.x,dy=a.y-b.y,d=Math.hypot(dx,dy);if(d>=space)continue;
        if(d<.001){const angle=(i*2.399+j*.73);dx=Math.cos(angle);dy=Math.sin(angle);d=1;}
        const strength=(space-d)/space*60,ax=dx/d*strength,ay=dy/d*strength;
        if(!fixed(a)){push[i].x+=ax;push[i].y+=ay;}
        if(!fixed(b)){push[j].x-=ax;push[j].y-=ay;}
      }
      bodies.forEach((e,i)=>{const v=push[i],d=Math.hypot(v.x,v.y);if(d>0){const scale=Math.min(45,d)/d*dt;this.move(e,v.x*scale,v.y*scale);}});
    }
    updateSupplies(){if(this.elapsed<this.supplyAt)return;this.supplyAt=this.elapsed+45;if(this.pickups.filter(p=>['magnet','haste','cleanse'].includes(p.type)&&p.life>0).length>=3)return;
      for(let i=0;i<50;i++){const a=this.rand()*Math.PI*2,r=260+this.rand()*220,x=this.player.x+Math.cos(a)*r,y=this.player.y+Math.sin(a)*r;if(this.blocked(x,y,35)||this.encounters.nests.some(n=>distance(n,{x,y})<90))continue;const type=['magnet','haste','cleanse'][this.supplyIndex++%3];this.drop(type,x,y);this.pickups[this.pickups.length-1].life=90;this.logEvent('supply_spawned',{pickup:type,x,y});break;}}
    earlySpawnRate(){return .75+.25*Math.max(0,Math.min(1,(this.elapsed-120)/120));}
    enemyDamageBonus(){return Math.max(0,Math.floor(this.elapsed/60)-2);}
    spawnInterval(){if(this.isExpedition)return this.expedition.interval()/this.earlySpawnRate();return this.elapsed<60?.8-this.elapsed*.005:Math.max(.25,.5-(this.elapsed-60)/240);}
    tick(dt){
      if(this.mode!=='playing')return;
      SurvivorWorld.sync(this);
      this.elapsed+=dt;const p=this.player,c=this.cat;p.inv=Math.max(0,p.inv-dt);
      this.haste=Math.max(0,this.haste-dt);this.chorusTime=Math.max(0,this.chorusTime-dt);this.noticeTime=Math.max(0,this.noticeTime-dt);this.updateOwl(dt);this.updateDifficulty();this.expedition.update(dt);this.greens?.update(dt);this.creatures.update(dt);this.encounters.update(dt);
      let dx=Number(this.keys.D.isDown||this.keys.RIGHT.isDown)-Number(this.keys.A.isDown||this.keys.LEFT.isDown),dy=Number(this.keys.S.isDown||this.keys.DOWN.isDown)-Number(this.keys.W.isDown||this.keys.UP.isDown);
      if(this.joy){dx=this.joy.dx/48;dy=this.joy.dy/48;if(Math.hypot(dx,dy)<.12)dx=dy=0;}
      const mag=Math.hypot(dx,dy);if(mag>1){dx/=mag;dy/=mag;}this.moving=mag>.01;const priorX=p.x,priorY=p.y;
      const dashing=this.expansion.move(dt,dx,dy);if(this.moving&&!dashing){p.dir=direction(dx,dy);this.move(p,dx*150*(1+.1*this.upgrades.feet)*(this.relics.slip>0?1.25:1)*(this.creatures.elements.slow>0?.7:1)*dt,dy*150*(1+.1*this.upgrades.feet)*(this.relics.slip>0?1.25:1)*(this.creatures.elements.slow>0?.7:1)*dt);const last=this.trail[this.trail.length-1];if(!last||distance(p,last)>9)this.trail.push({x:p.x,y:p.y});}
      this.moving=Math.hypot(p.x-priorX,p.y-priorY)>.01;this.relics.update(dt);this.packs.update();this.updateSupplies();
      // Follow the player's traversable route instead of steering into a trunk.
      while(this.trail.length>1&&distance(c,this.trail[0])<12)this.trail.shift();
      if(this.trail.length>150)this.trail.splice(0,this.trail.length-150);
      const waypoint=this.trail[0]||p, gap=distance(c,p);
      if(this.catActive&&(gap>44||this.trail.length>5)){const d=distance(c,waypoint)||1;this.move(c,(waypoint.x-c.x)/d*Math.min(d,240*dt),(waypoint.y-c.y)/d*Math.min(d,240*dt),false);c.dir=waypoint.x<c.x?2:3;}
      if(this.catActive&&gap>450){c.x=p.x-24;c.y=p.y+24;this.trail=[{x:p.x,y:p.y}];}
      p.fire-=dt*this.attackRate()*this.relics.shotRate();c.attack-=dt*this.attackRate();
      // Mouse aims in camera space; the touch stick retains its last nonzero direction.
      let aimX=0,aimY=0;
      if(this.joy?.touch){if(Math.hypot(this.joy.dx,this.joy.dy)>=48*.12){aimX=this.joy.dx;aimY=this.joy.dy;}}
      else if(this.mouseAim){const target=this.cameras.main.getWorldPoint(this.mouseAim.x,this.mouseAim.y);aimX=target.x-p.x;aimY=target.y-p.y;}
      const aimLength=Math.hypot(aimX,aimY);if(aimLength>.001)this.aim={x:aimX/aimLength,y:aimY/aimLength};
      p.dir=direction(this.aim.x,this.aim.y);
      if(p.fire<=0){const sprite=this.pooled(this.shotPool,'nature',.5).setFrame('rock');this.shots.push({...this.relics.shot(),x:p.x,y:p.y,dx:this.aim.x,dy:this.aim.y,life:1.2,sprite});p.fire=.52/(1+.2*this.upgrades.cast);}
      if(this.catActive&&c.attack<=0){const target=this.target(c,115*(1+.2*this.upgrades.sweep),p);if(target){const a=Math.atan2(target.y-c.y,target.x-c.x);const sprite=this.pooled(this.effectPool,'slash',2.5*(1+.2*this.upgrades.sweep));if(this.upgrades.pull)this.burst('fxWhirl',c.x,c.y,2.5*(1+.2*this.upgrades.sweep),.4,0xb5fff0);this.effects.push({x:c.x+Math.cos(a)*35,y:c.y+Math.sin(a)*35,a,life:.26,sprite});for(const e of this.hitTargets()){const ea=Math.atan2(e.y-c.y,e.x-c.x),delta=Math.atan2(Math.sin(ea-a),Math.cos(ea-a));if(distance(e,c)<120*(1+.2*this.upgrades.sweep)&&Math.abs(delta)<Math.min(Math.PI,1.4+.2*this.upgrades.sweep))this.hit(e,2.4+this.upgrades.claws,'cat',c);}this.creatures.elements.catSwipe(c,a,120*(1+.2*this.upgrades.sweep),Math.min(Math.PI,1.4+.2*this.upgrades.sweep));c.attack=.85;}}
      this.recycleDistantEnemies(dt);
      this.spawnTimer-=dt;if(this.enemies.length>=this.enemyCap)this.spawnCapSeconds+=dt;if(this.spawnTimer<=0&&this.enemies.length<this.enemyCap&&(!this.isExpedition||this.elapsed<DURATION)){this.spawn(this.isExpedition?this.expedition.enemyType():this.elapsed>18&&this.rand()<.27?'beast':'bat');this.spawnTimer=this.spawnInterval();}
      for(const e of this.enemies){if(e.hp<=0)continue;e.flash=Math.max(0,e.flash-dt);const x=p.x-e.x,y=p.y-e.y,d=Math.hypot(x,y)||1;e.clock-=dt;if(e.stun>0){e.stun=Math.max(0,e.stun-dt);continue;}if(SurvivorEnemies.update(this,e,dt*(e.slowUntil>this.elapsed?.5:1)))continue;if(e.type==='owl'){this.encounters.updateShooter(e,dt*(e.slowUntil>this.elapsed?.5:1));continue;}if(this.creatures.enemy(e,dt*(e.slowUntil>this.elapsed?.5:1)))continue;
        if(e.type==='beast'&&e.phase==='seek'&&e.clock<=0&&d<340){e.phase='windup';e.clock=.8;e.dx=x/d;e.dy=y/d;}
        if(e.phase==='windup'){if(e.clock<=0){e.phase='charge';e.clock=.62;}}
        else if(e.phase==='charge'){this.move(e,e.dx*(e.chargeSpeed||280)*dt,e.dy*(e.chargeSpeed||280)*dt);if(e.clock<=0){e.phase='seek';e.clock=2.8;}}
        else this.move(e,x/d*e.speed*dt*(e.slowUntil>this.elapsed?.5:1),y/d*e.speed*dt*(e.slowUntil>this.elapsed?.5:1));
        if(distance(e,p)<e.r+p.r&&p.inv<=0){if(this.shield){this.expedition.shieldBlocked();this.shield=false;p.inv=.25;this.announce('Shield blocked a hit!');continue;}const amount=((e.contactDamage||(e.type==='beast'?12:7))+this.enemyDamageBonus())*this.creatures.protection();p.hp=Math.max(0,p.hp-amount);this.damageTaken+=amount;this.juice.hurt(amount);this.logEvent('damage_taken',{enemy:SurvivorEnemies.identity(e),amount,hp:p.hp,x:Math.round(p.x),y:Math.round(p.y)});p.inv=.25;this.move(p,-x/d*15,-y/d*15);}
      }
      this.separateEnemies(dt);
      for(const s of [...this.shots]){s.x+=s.dx*380*dt;s.y+=s.dy*380*dt;s.life-=dt;if(this.blocked(s.x,s.y,3,true))s.life=0;
        if(s.life>0)for(const e of this.hitTargets()){if(e.hp>0&&!s.hits?.has(e)&&distance(e,s)<e.r+6){this.hit(e,s.source==='owl'?this.companionStats().owl.damage*(s.split ? 0.33 : 1):(s.damage||2),s.source||'player',s);if(s.source==='owl'){if(this.upgrades.marks)e.markUntil=this.elapsed+3;s.hits.add(e);this.encounters.splitShot(s);if(s.hits.size>=3){s.life=0;break;}}else{this.relics.impact(s,e);if(s.life<=0)break;}}}}
      for(const fx of this.effects)fx.life-=dt;
      for(const item of this.pickups){if(item.life<=0)continue;item.life-=dt;if(item.type==='xp'&&(item.magnetized||distance(item,p)<100)){const d=distance(item,p)||1;item.x+=(p.x-item.x)/d*Math.min(d,(item.magnetized?900:320)*dt);item.y+=(p.y-item.y)/d*Math.min(d,(item.magnetized?900:320)*dt);}if(distance(item,p)<38){
        if(item.type==='xp'){this.gainXP(1);item.life=0;this.reward('gem',{x:item.x,y:item.y});}
        if(item.type==='heal'&&(p.hp<this.maxHp||this.relics.has('bloodroot'))){const healed=Math.min(8,this.maxHp-p.hp);p.hp=Math.min(this.maxHp,p.hp+8);this.juice.heal(healed);p.inv=Math.max(p.inv,.25);this.logEvent('healed',{amount:healed,hp:p.hp});this.relics.heal(healed);item.life=0;this.announce('+'+healed+' health');}
        if(item.type==='magnet'){for(const xp of this.pickups)if(xp.type==='xp'&&xp.life>0)xp.magnetized=true;item.life=0;this.announce('XP magnet!');this.logEvent('supply_collected',{pickup:'magnet'});}
        if(item.type==='cleanse'){const el=this.creatures.elements;for(const z of [...el.zones])if(z.hostile&&distance(z,p)<300)el.removeZone(z);el.casts=el.casts.filter(c=>!c.hostile||distance(c,p)>=300);this.creatures.strikes=this.creatures.strikes.filter(c=>!c.hostile||distance(c,p)>=300);el.slow=0;this.burst('fxWater',p.x,p.y,8,.6,0xbfffd5);item.life=0;this.announce('Nearby hazards cleared!');this.logEvent('supply_collected',{pickup:'cleanse'});}
        if(item.type==='haste'){this.logEvent('supply_collected',{pickup:'haste'});this.haste=12;item.life=0;this.announce('Frenzy! Party attacks 50% faster for 12s.');}
        if(item.type==='shield'&&!this.shield){this.shield=true;item.life=0;this.announce('Shield ready: blocks the next hit.');}
      }}
      const retain=(items,condition)=>items.filter(e=>{if(condition(e))return true;e.sprite.setVisible(false).setActive(false);return false;});
      this.enemies=retain(this.enemies,e=>e.hp>0);this.shots=retain(this.shots,e=>e.life>0);this.effects=retain(this.effects,e=>e.life>0);this.pickups=retain(this.pickups,e=>e.life>0);
      if(p.hp<=0){this.mode='lost';this.joy=null;this.finishRun('lost');}else if(this.elapsed>=DURATION&&this.encounters.boss?.hp<=0){this.mode='won';this.joy=null;this.finishRun('won');}else this.checkLevel();
      if(!this.run?.finished)this.sampleRun();
    }
    update(time,delta){
      this.snapshotView();
      if(!this.manual&&!window.__vt_pending){
        this.juice.realtime();this.packs.realtime();
        // Hit-stop holds the real-time loop only; STEP and elapsed never stretch and advanceTime is never frozen.
        if(this.juice.frozen())this.accumulator=0;
        else{this.accumulator+=Math.min(delta/1000,.1);while(this.accumulator>=STEP){this.tick(STEP);this.accumulator-=STEP;}}
      }
      this.draw();
    }
    draw(){if(!this.ui)return;SurvivorWorld.sync(this);this.juice.observe();this.packs?.drawWorld();const p=this.player,c=this.cat,frame=Math.floor(this.elapsed*8)%4;
      this.playerSprite.setPosition(p.x,p.y).setFrame((this.moving?frame:0)*4+p.dir).setDepth(p.y+20).setAlpha(p.inv>0&&Math.floor(p.inv*16)%2?.45:1);
      this.catSprite.setVisible(this.catActive||!!this.expedition.catCapture).setPosition(c.x,c.y).setFrame(Math.floor(this.elapsed*6)%2).setFlipX(c.dir===2).setDepth(c.y+20);
      this.playerShadow.setPosition(p.x,p.y+15).setDepth(p.y-1);this.catShadow.setVisible(this.catActive).setPosition(c.x,c.y+13).setDepth(c.y-1);
      this.fx.clear();if(this.shield)this.fx.lineStyle(3,0x83d9ff,.85).strokeCircle(p.x,p.y,29);this.fx.lineStyle(2,0xffefb0,.85).strokeEllipse(p.x,p.y+15,31,15);if(this.catActive)this.fx.lineStyle(2,0x77dede,.9).strokeEllipse(c.x,c.y+13,30,14);
      for(const e of this.enemies){e.sprite.setPosition(e.x,e.y).setFrame(['cat','frog','lion'].includes(e.type)?frame%2:frame*4+direction(p.x-e.x,p.y-e.y)).setDepth(e.y+20).setTint(e.flash>0?0xffffff:e.phase==='windup'?0xffbf70:0xffffff);
        if(e.elite)this.fx.lineStyle(3,0xffd36b,1).strokeCircle(e.x,e.y,e.r+12);
        if(e.phase==='windup'){this.fx.lineStyle(3,0xffbe70,.9).lineBetween(e.x,e.y,e.x+e.dx*180,e.y+e.dy*180);this.fx.strokeCircle(e.x,e.y,e.r+7);}
        if(e.hp<e.maxHp){this.fx.fillStyle(0x382921,.8).fillRect(e.x-15,e.y-28,30,4);this.fx.fillStyle(0xf0c16e).fillRect(e.x-15,e.y-28,30*e.hp/e.maxHp,4);}}
      SurvivorEnemies.draw(this);
      const o=this.owl;this.owlSprite.setVisible(!!o);
      if(o){this.owlSprite.setPosition(o.x,o.y).setFrame(frame*4+direction(p.x-o.x,p.y-o.y)).setDepth(o.y+20);
        if(o.state!=='ready')this.fx.lineStyle(3,o.state==='ally'?0x8ee0df:0xffd36b,.9).strokeCircle(o.x,o.y,24);
        
        if(o.state==='wild'){this.fx.fillStyle(0x30221a).fillRect(o.x-20,o.y-33,40,5);this.fx.fillStyle(0xffd36b).fillRect(o.x-20,o.y-33,40*o.hp/o.maxHp,5);}
      }
      this.greens?.draw();this.encounters.draw();this.expedition.draw();this.creatures.draw();this.relics.draw();
      for(const s of this.shots){s.sprite.setPosition(s.x,s.y).setRotation(s.source==='owl'?Math.atan2(s.dy,s.dx):this.elapsed*8).setDepth(800000000);if(s.source==='owl'){s.sprite.setScale(s.split?1.5:2).setTint(0xd8faff);this.fx.lineStyle(s.split?1:2,0xadebff,.7).lineBetween(s.x,s.y,s.x-s.dx*18,s.y-s.dy*18);}if(s.charged)s.sprite.setTint(0xffd36b).setScale(.7);}
      for(const e of this.effects)e.sprite.setPosition(e.x,e.y).setRotation(e.a).setFrame(Math.min((e.frames||4)-1,Math.floor((1-e.life/(e.maxLife||.26))*(e.frames||4)))).setDepth(800000001);
      for(const e of this.pickups){const o=e.type==='xp'?this.juice.gemOffset(e):null;if(o)e.sprite.setScale(2*o.scale);e.sprite.setPosition(e.x+(o?.x||0),e.y+(o?.y||0)).setDepth(e.y+30).setTint(e.type==='haste'?0xffd36b:e.type==='shield'?0x83d9ff:0xffffff);if(e.type!=='xp')this.fx.lineStyle(2,e.type==='haste'?0xffd36b:e.type==='shield'?0x83d9ff:0xff9292,.9).strokeCircle(e.x,e.y,18);}
      this.ui.begin(this.mode);
      const logical=this.uiSize();
      this.ui.beginGroup('ui2x',{scale:this.uiScale()});
      if(this.mode!=='title')this.hud.draw(logical.w,logical.h);
      if(['title','paused','won','lost','upgrade','relic','pack','unlock'].includes(this.mode))this.screens.draw(logical.w,logical.h);
      this.screens.dismiss(logical.w,logical.h);
      this.ui.endGroup();
      this.ui.end();this.juice.update();this.joyGraphic.clear();if(this.joy){const j=this.joy,len=Math.max(48,Math.hypot(j.dx,j.dy));this.joyGraphic.fillStyle(0x30221a,.3).fillCircle(j.x,j.y,48).lineStyle(2,0xfff0b0,.6).strokeCircle(j.x,j.y,48).fillStyle(0xfff0b0,.6).fillCircle(j.x+j.dx/len*35,j.y+j.dy/len*35,15);}
    }
    snapshot(){return {enemyDamageBonus:this.enemyDamageBonus(),field:this.field,greens:this.greens?.summary()||null,enemyCap:this.enemyCap,enemyCount:this.enemies.filter(e=>e.hp>0).length,dash:{style:this.creatures.elements.dashStyle,cooldown:this.expansion.cooldown,active:this.expansion.dashTime>0},creatures:this.creatures.summary(),relics:this.relics.summary(),expedition:this.expedition.summary(),unlockedStarters:this.unlocked,companionStats:this.companionStats(),encounters:this.encounters.snapshot(),mode:this.mode,coordinates:'World pixels; x right, y down; coordinates continue across repeating 4500-unit tiles',world:{width:WORLD,height:WORLD,looping:true},elapsed:+this.elapsed.toFixed(2),duration:DURATION,player:{x:Math.round(this.player.x),y:Math.round(this.player.y),hp:this.player.hp,maxHp:this.maxHp,invulnerable:this.player.inv>0,invulnerabilitySeconds:this.player.inv,aim:{...this.aim}},cat:{x:Math.round(this.cat.x),y:Math.round(this.cat.y),attackCooldown:+this.cat.attack.toFixed(2),damage:this.catDamage,kills:this.catKills},owl:this.owl?{x:Math.round(this.owl.x),y:Math.round(this.owl.y),state:this.owl.state,hp:this.owl.hp,captureSeconds:+this.owl.progress.toFixed(2),damage:this.owlDamage}:null,buffs:{partyDamageMultiplier:1+.08*this.upgrades.partyDamage,partyAttackSpeedBonus:.06*this.upgrades.partySpeed,frog:this.frogStats(),chorusSeconds:this.chorusTime,attackRate:this.attackRate(),hasteSeconds:+this.haste.toFixed(2),shield:this.shield},notice:this.noticeTime>0?this.notice:null,kills:this.kills,playerDamage:this.playerDamage,obstacles:this.obstacles.map(({x,y,r})=>({x,y,r})),enemies:this.enemies.slice(0,40).map(e=>({type:e.type,appearance:SurvivorEnemies.identity(e),summonedBy:e.summonedBy||null,aimLocked:!!e.aimLocked,x:Math.round(e.x),y:Math.round(e.y),hp:e.hp,maxHp:e.maxHp,speed:e.speed,phase:e.phase,strong:!!e.strong,elite:!!e.elite,shrineTier:e.shrineTier||null,contactDamage:e.contactDamage||(e.type==='beast'?12:7)})),spawned:this.spawned,peakEnemies:this.peakEnemies,level:this.level,xp:this.xp,xpNeeded:this.xpNeeded(),xpGainMultiplier:this.xpGainMultiplier(),upgrades:this.upgrades,choices:this.choices,strongerEnemies:this.stronger,projectiles:this.shots.length,pickups:this.pickups.map(e=>({type:e.type,appearance:SurvivorEnemies.identity(e),summonedBy:e.summonedBy||null,aimLocked:!!e.aimLocked,x:Math.round(e.x),y:Math.round(e.y),secondsLeft:+e.life.toFixed(1)})),controls:'WASD/arrows to move; mouse to aim; touch drag to move and aim; Space or quick directional swipe to dash; automatic fire; P/Escape pause; R restart; F fullscreen; Enter start/resume'};}
  }
  const portrait=window.innerWidth/window.innerHeight<.85;
  new Phaser.Game({type:Phaser.WEBGL,parent:'game',width:portrait?540:1440,height:960,backgroundColor:'#5c9855',pixelArt:true,roundPixels:true,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:WoodlandTrial,audio:{disableWebAudio:true}});
})();
