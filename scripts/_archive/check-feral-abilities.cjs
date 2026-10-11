const {chromium}=require('playwright'),fs=require('fs'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,args:process.platform==='darwin'?['--use-gl=angle','--use-angle=metal']:[]});try{
 const page=await browser.newPage({viewport:{width:540,height:940}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.url()+': '+r.status())});
 await page.addInitScript(()=>window.__vt_pending=true);
 await page.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync('game.js','utf8').replace('window.__scollTest = {','window.__scollTest = { abilityTest:()=>({upgradeDefs,attemptUpgrade,damageEnemy,state,feralAttacks,feralCreatureAttack,updateBurn,updateCompanions,firePlayerVolley,updateCombat,bloomAttacks,bloomCreatureAttack,render}),')}));
 await page.goto(process.env.GAME_URL||'http://localhost:5185');await page.waitForFunction(()=>window.__scollTest);
 const report=await page.evaluate(()=>{
 const a=__scollTest;a.setSave({unlockedStage:10,ownedCreatures:['feral-bat','feral-beast','feral-lizard'],activeParty:['feral-bat','feral-beast','feral-lizard']});a.startStage(1);
 const t=a.abilityTest(),s=t.state,check=(v,m)=>{if(!v)throw Error(m)};
 const enemy=(x,y)=>({x,y,hp:100,maxHp:100,r:17,type:'basic',monsterId:'feral-beast',edge:'north',speed:0,damage:0,attackTimer:999,meleeTimer:999,meleeCooldown:1,gold:1});
 for(const [id,ability] of Object.entries(t.feralAttacks)){
  const c={creatureId:id,x:270,y:410};s.enemies=[enemy(270,410-ability.range-0.01)];
  check(!t.feralCreatureAttack(c,ability),'outside range '+id);
  s.enemies=[enemy(270,410-ability.range)];check(t.feralCreatureAttack(c,ability),'boundary '+id);check(s.enemies[0].hp===100-ability.damage,'damage '+id);
 }
 const beast={creatureId:'feral-beast',x:270,y:410};s.enemies=[enemy(320,410),enemy(340,430),enemy(270,490),enemy(391,410)];t.feralCreatureAttack(beast,t.feralAttacks['feral-beast']);check(s.enemies.map(e=>e.hp).join(',')==='97,97,100,100','slash arc/range');
 // Bonus slash retargets behind Beast after a kill, but cannot chain.
 const slashUpgrade=t.upgradeDefs.find(d=>d.id==='strikerFollowup');
 check(slashUpgrade.max===5 && slashUpgrade.costs.join(',')==='30,41,55,74,100','five ranks and original costs');
 s.save.essence.feral=1000;
 for(let n=1;n<=5;n++){t.attemptUpgrade(slashUpgrade);check(s.save.upgrades.strikerFollowup===n,'purchase rank '+n);}
 t.attemptUpgrade(slashUpgrade);check(s.save.upgrades.strikerFollowup===5,'rank cap');s.save.upgrades={};
 const originalRandom=Math.random;
 try {
  for(let rank=1;rank<=5;rank++) {
   s.save.upgrades={strikerFollowup:rank};s.effects=[];s.enemies=[enemy(320,410),enemy(220,410)];s.enemies[0].hp=3;
   Math.random=()=>rank*.2-.001;t.feralCreatureAttack(beast,t.feralAttacks['feral-beast']);check(s.enemies[0].hp===97,'rank proc '+rank);
  }
  s.save.upgrades={strikerFollowup:1,strikerFollowupHeal:1};s.party.hp=5;
  s.effects=[];s.enemies=[enemy(320,410),enemy(220,410),enemy(270,490)];
  s.enemies[0].hp=s.enemies[1].hp=3;
  Math.random=()=>0.19;t.feralCreatureAttack(beast,t.feralAttacks['feral-beast']);
  check(s.enemies.length===1 && s.enemies[0].hp===100,'bonus slash non-chaining');
  check(s.effects.filter(e=>e.type==='feralAbility').length===2,'bonus slash animation');
  check(s.party.hp===6,'mending slash heal');
  s.effects=[];s.enemies=[enemy(320,410),enemy(220,410)];s.enemies[0].hp=3;
  Math.random=()=>0.2;t.feralCreatureAttack(beast,t.feralAttacks['feral-beast']);
  check(s.enemies[0].hp===100,'20% boundary');
  s.save.upgrades={};s.enemies=[enemy(320,410),enemy(220,410)];s.enemies[0].hp=3;
  Math.random=()=>0;t.feralCreatureAttack(beast,t.feralAttacks['feral-beast']);check(s.enemies[0].hp===100,'unowned follow-up');
 } finally {Math.random=originalRandom;s.save.upgrades={};}
 const lizard={creatureId:'feral-lizard',x:270,y:410};s.enemies=[enemy(270,300)];const e=s.enemies[0],random=Math.random;
 try{Math.random=()=>0.049;t.feralCreatureAttack(lizard,t.feralAttacks['feral-lizard']);check(!!e.burn,'burn proc');t.updateBurn(e,.99);check(e.hp===98,'early burn');t.updateBurn(e,.01);check(e.hp===97,'first tick');t.updateBurn(e,1);check(e.hp===96&&!e.burn,'second tick/expiry');Math.random=()=>.05;t.feralCreatureAttack(lizard,t.feralAttacks['feral-lizard']);check(!e.burn,'5% boundary');Math.random=()=>0;t.feralCreatureAttack(lizard,t.feralAttacks['feral-lizard']);t.updateBurn(e,.5);t.feralCreatureAttack(lizard,t.feralAttacks['feral-lizard']);check(e.burn.remaining===2&&e.burn.nextTick===1,'refresh');}finally{Math.random=random}
 s.enemies=[];s.effects=[];s.projectiles=[];s.companions=[];s.obstacles=[];s.vases=[];s.spawnTimer=s.fireTimer=s.vaseTimer=s.rockSpawnTimer=999;s.mouse={x:270,y:800};t.firePlayerVolley();check(s.projectiles[0].maxDistance===152&&s.projectiles[0].y===450,'player origin/range');for(let i=0;i<20;i++)t.updateCombat(1/60);check(!s.projectiles.some(p=>p.source==='player'),'projectile expiry');
 s.projectiles=[];s.enemies=[enemy(270,603)];t.firePlayerVolley();for(let i=0;i<20;i++)t.updateCombat(1/60);check(s.enemies[0].hp===100,'player hit beyond 152');
 s.projectiles=[];s.enemies=[enemy(270,602)];t.firePlayerVolley();for(let i=0;i<20;i++)t.updateCombat(1/60);check(s.enemies[0].hp===99,'player boundary hit');
 for(const [id,ability] of Object.entries(t.bloomAttacks)){s.projectiles=[];s.enemies=[enemy(270,300)];check(t.bloomCreatureAttack({creatureId:id,x:270,y:410},ability),'Bloom attack '+id);if(ability.targeted)check(s.enemies[0].hp===99,'Mole direct damage');else {check(s.projectiles[0].source===id,'Bloom projectile');for(let i=0;i<30;i++)t.updateCombat(1/60);check(s.enemies[0].hp===100-ability.damage,'Bloom damage '+id);}}
 a.setSave({unlockedStage:10});
 for(let run=0;run<2;run++) {
  a.startStage(3);s.enemies=[];a.spawnEnemy('boss','north');const boss=s.enemies[0];t.damageEnemy(boss,boss.hp);
  check(s.mode==='result' && s.save.completed.includes(3),'stage 3 completion');
  check(s.save.essence.feral===15,'first-clear-only FE on run '+run);
 }
 a.setSave({unlockedStage:10,ownedCreatures:['feral-bat','feral-beast','feral-lizard'],activeParty:['feral-bat','feral-beast','feral-lizard']});
 a.startStage(1);s.enemies=[enemy(270,320)];s.save.shinyCreatures=['feral-bat','feral-beast','feral-lizard'];
 for(const c of s.companions)c.timer=0;
 t.updateCompanions(0);
 check(s.companions.map(c=>c.timer).join(',')==='0.5,1,1','shiny dispatch and cooldown');
 s.save.shinyCreatures=[];
 a.startStage(1);s.spawnTimer=s.fireTimer=999;s.obstacles=[];s.enemies=[enemy(190,360),enemy(330,345),enemy(300,280)];s.effects=[];
 for(const c of s.companions)t.feralCreatureAttack(c,t.feralAttacks[c.creatureId]);s.enemies[2].burn={remaining:2,nextTick:1};s.animationTime+=.12;t.render();
 return 'PASS: all Feral range boundaries and damage, Beast arc, burn proc/ticks/refresh, player 152px limit, and all three Bloom attacks';
 });
 await page.waitForTimeout(250);fs.mkdirSync('output/feral-abilities',{recursive:true});await page.screenshot({path:'output/feral-abilities/combat.png'});assert.deepEqual(errors,[]);console.log(report);
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
