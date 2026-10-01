const assert=require('node:assert/strict');
const fs=require('node:fs');
const {run}=require('./survivor-test-utils.cjs');
run('enemy damage grows each minute after minute two',async page=>{
 const result=await page.evaluate(()=>{
  const s=__survivorTest.scene;s.start();s.obstacles=[];s.spawnTimer=999;s.catActive=false;s.player.fire=999;
  const p=s.player,out={};
  out.boundaries=[0,120,179.999,180,239.999,240,540,600].map(t=>{s.elapsed=t;p.hp=40;p.inv=0;s.encounters.damage(7,'boundary');return 40-p.hp;});
  // A creature spawned before the boundary gains damage without respawning.
  s.elapsed=179;s.rand=()=>.5;const e=s.spawn('bat',p.x,p.y);e.speed=0;s.elapsed=180;p.hp=40;p.inv=0;s.tick(0);out.contact=40-p.hp;e.hp=0;
  // A projectile already in flight uses the current bonus when it lands.
  s.elapsed=239;s.encounters.shoot({x:p.x,y:p.y},0,150,'mage_orb');s.elapsed=240;p.hp=40;p.inv=0;s.encounters.update(0);out.projectile=40-p.hp;
  s.creatures.strikes.push({x:p.x,y:p.y,r:50,time:0,total:1,hostile:true,source:'guardian_eruption',damage:12});p.hp=40;p.inv=0;s.creatures.update(0);out.eruption=40-p.hp;
  s.creatures.elements.zone('fire',p.x,p.y,true);p.hp=40;p.inv=0;s.creatures.elements.update(0);out.fire=40-p.hp;
  const protection=s.creatures.protection;s.creatures.protection=()=>.75;p.hp=40;p.inv=0;s.encounters.damage(10,'hunter_arrow');out.reduced=40-p.hp;s.creatures.protection=protection;
  p.hp=40;p.inv=0;s.shield=true;s.encounters.damage(12,'boss_contact');out.shield=p.hp===40&&!s.shield;s.encounters.damage(12,'boss_contact');out.invulnerable=p.hp===40;
  out.snapshot=JSON.parse(render_game_to_text()).enemyDamageBonus;s.start();out.reset=s.enemyDamageBonus();s.draw();return out;
 });
 assert.deepEqual(result.boundaries,[7,7,7,8,8,9,14,15]);assert.equal(result.contact,8);assert.equal(result.projectile,8);assert.equal(result.eruption,14);assert.equal(result.fire,7);assert.equal(result.reduced,9);assert(result.shield&&result.invulnerable);assert.equal(result.snapshot,2);assert.equal(result.reset,0);
 fs.mkdirSync('output/enemy-damage-growth',{recursive:true});await page.waitForTimeout(150);await page.screenshot({path:'output/enemy-damage-growth/gameplay.png'});console.log(result);
}).catch(e=>{console.error(e);process.exitCode=1;});
