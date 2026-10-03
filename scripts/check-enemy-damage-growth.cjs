const assert=require('node:assert/strict');
const fs=require('node:fs');
const {run}=require('./survivor-test-utils.cjs');
run('enemy damage grows every two minutes after minute two',async page=>{
 const result=await page.evaluate(()=>{
  const s=__survivorTest.scene;s.start();s.obstacles=[];s.spawnTimer=999;s.catActive=false;s.player.fire=999;
  const p=s.player,out={};out.starting=[40,50,60,70,80,90,100,120,140,180,260].map(base=>{p.hp=400;p.inv=0;s.encounters.damage(base,'starting');return 400-p.hp;});
  out.boundaries=[0,120,180,239.999,240,359.999,360,479.999,480,600].map(t=>{s.elapsed=t;p.hp=400;p.inv=0;s.encounters.damage(70,'boundary');return 400-p.hp;});
  // A creature spawned before the boundary gains damage without respawning.
  s.elapsed=239;s.rand=()=>.5;const e=s.spawn('bat',p.x,p.y);e.speed=0;s.elapsed=240;p.hp=400;p.inv=0;s.tick(0);out.contact=400-p.hp;e.hp=0;
  // A projectile already in flight uses the current bonus when it lands.
  s.elapsed=359;s.encounters.shoot({x:p.x,y:p.y},0,150,'mage_orb');s.elapsed=360;p.hp=400;p.inv=0;s.encounters.update(0);out.projectile=400-p.hp;
  s.creatures.strikes.push({x:p.x,y:p.y,r:50,time:0,total:1,hostile:true,source:'guardian_eruption',damage:120});p.hp=400;p.inv=0;s.creatures.update(0);out.eruption=400-p.hp;
  s.creatures.elements.zone('fire',p.x,p.y,true);p.hp=400;p.inv=0;s.creatures.elements.update(0);out.fire=400-p.hp;
  const protection=s.creatures.protection;s.creatures.protection=()=>.75;p.hp=400;p.inv=0;s.encounters.damage(100,'hunter_arrow');out.reduced=400-p.hp;s.creatures.protection=protection;
  p.hp=400;p.inv=0;s.shield=true;s.encounters.damage(120,'boss_contact');out.shield=p.hp===400&&!s.shield;s.encounters.damage(120,'boss_contact');out.invulnerable=p.hp===400;
  out.snapshot=JSON.parse(render_game_to_text()).enemyDamageBonus;s.start();out.reset=s.enemyDamageBonus();s.draw();return out;
 });
 assert.deepEqual(result.starting,[32,40,48,56,64,72,80,96,112,144,208]);
 assert.deepEqual(result.boundaries,[56,56,56,56,66,66,76,76,86,96]);assert.equal(result.contact,66);assert.equal(result.projectile,68);assert.equal(result.eruption,116);assert.equal(result.fire,60);assert.equal(result.reduced,75);assert(result.shield&&result.invulnerable);assert.equal(result.snapshot,20);assert.equal(result.reset,0);
 fs.mkdirSync('output/enemy-damage-growth',{recursive:true});await page.waitForTimeout(150);await page.screenshot({path:'output/enemy-damage-growth/gameplay.png'});console.log(result);
}).catch(e=>{console.error(e);process.exitCode=1;});
