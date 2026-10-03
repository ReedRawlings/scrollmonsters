const assert = require('node:assert/strict');
const {run} = require('./survivor-test-utils.cjs');
run('Mouse/Mole/Bear recruitment, abilities, warnings, protection and persistence', async page => {
  const result = await page.evaluate(() => {
    const s = __survivorTest.scene, out = {};
    const setup = starter => {s.starter=starter;s.start();s.obstacles=[];s.spawnTimer=999;s.player.fire=999;s.player.inv=999;};
    for (const type of ['mouse','mole','bear']) {
      s.nestDeckOverride=[type,'owl','beast'];setup('cat');s.elapsed=30;s.encounters.nestsActive=true;
      const nest=s.encounters.nests[0];s.hit(nest,9990,'player',s.player);s.player.x=nest.x;s.player.y=nest.y;
      for(let i=0;i<151;i++)s.creatures.update(1/60);
      if(!s.expedition.party().includes(type)||!s.unlocked.includes(type))throw Error('Capture failed: '+type);
      setup(type);
      const pool=s.upgradePool().map(u=>u.id);
      if(!pool.includes('partyDamage')||!pool.includes('partySpeed')||(type!=='bear'&&pool.includes(type+'Power')))throw Error('Shared progression offers incorrect');
      if(s.catActive||s.expedition.party().join()!==type)throw Error('Starter must replace Cat');
      const a=s.creatures.allies[type];a.x=s.player.x;a.y=s.player.y;a.attack=0;
      const targets=[50,65].map(dx=>{const e=s.spawn('beast',s.player.x+dx,s.player.y);Object.assign(e,{hp:2000,maxHp:2000,speed:0,clock:999});return e;});
      for(let i=0;i<240;i++)s.creatures.update(1/60);
      out[type]={damage:s.creatures.damage[type],targetHp:targets.map(e=>e.hp)};
    }
    setup('bear');s.upgrades.bearGuard=1;Object.assign(s.creatures.allies.bear,{x:s.player.x,y:s.player.y});s.player.inv=0;s.encounters.damage(80,'test');out.protectedHp=s.player.hp;
    setup('cat');s.player.inv=0;const bear=s.spawn('bear',s.player.x+60,s.player.y);bear.clock=0;s.creatures.enemy(bear,0);out.bearWarning=bear.phase==='slam';bear.clock=0;s.creatures.enemy(bear,0);s.creatures.update(.02);out.bearHit=s.player.hp;
    setup('cat');s.player.inv=0;const mole=s.spawn('mole',s.player.x+200,s.player.y);mole.clock=0;s.creatures.enemy(mole,0);out.moleDelay=s.creatures.strikes[0].time;s.player.y+=200;s.creatures.update(1.3);out.dodgedHp=s.player.hp;
    setup('mole');s.upgrades.moleEcho=1;s.upgrades.moleSlow=1;const a=s.creatures.allies.mole;Object.assign(a,{x:s.player.x,y:s.player.y,attack:0});const e=s.spawn('beast',s.player.x+60,s.player.y);e.hp=e.maxHp=2000;
    s.creatures.update(.01);s.creatures.update(.71);out.first=s.creatures.damage.mole;s.creatures.update(.51);out.second=s.creatures.damage.mole;out.slow=e.slowUntil>s.elapsed;
    setup('mouse');s.upgrades.mouseJump=1;s.upgrades.mouseCount=2;Object.assign(s.creatures.allies.mouse,{x:s.player.x,y:s.player.y,attack:0});const one=s.spawn('bat',s.player.x+10,s.player.y);one.hp=10;const two=s.spawn('beast',s.player.x+30,s.player.y);two.hp=1000;s.creatures.update(.001);out.helpers=s.creatures.helpers.length;for(let i=0;i<90;i++)s.creatures.update(1/60);out.bites=s.creatures.damage.mouse;
    setup('bear');s.upgrades.bearStun=2;Object.assign(s.creatures.allies.bear,{x:s.player.x,y:s.player.y,attack:0});const target=s.spawn('beast',s.player.x+50,s.player.y);target.hp=1000;s.creatures.update(.01);s.creatures.update(.16);out.stagger=target.stun;const time=s.elapsed;s.mode='paused';s.tick(5);out.paused=s.elapsed===time;
    setup('cat');s.elapsed=35;s.creatures.update(0);out.swarm=s.enemies.filter(e=>e.type==='mouse').length;
    return out;
  });
  for(const type of ['mouse','mole','bear'])assert(result[type].damage>0, type+' damages targets');
  assert(result.mole.targetHp.every(hp=>hp<2000),'Mole damages grouped targets');
  assert.equal(result.protectedHp,352);assert(result.bearWarning);assert.equal(result.bearHit,304);
  assert.equal(result.moleDelay,1.25);assert.equal(result.dodgedHp,400);
  assert(Math.abs(result.first-80)<1e-6);assert(Math.abs(result.second-160)<1e-6);assert(result.slow);
  assert.equal(result.helpers,5);assert(result.bites>1);assert.equal(result.stagger,.75);assert(result.paused);assert.equal(result.swarm,6);
  await page.reload();await page.waitForFunction(()=>window.__phaserReady);
  const saved=await page.evaluate(()=>__survivorTest.scene.unlocked);
  for(const type of ['mouse','mole','bear'])assert(saved.includes(type));
}).catch(error=>{console.error(error);process.exitCode=1;});
