const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {run}=require('./survivor-test-utils.cjs');
const fixture=path.join(__dirname,'fixtures/combat-before-scale.json');
run('Combat scale preserves health ratios, damage, healing, attacks and dashes',async page=>{
 if(process.env.RECORD_BASELINE_DIR){await page.route('**/survivor*.js*',route=>{const p=path.join(process.env.RECORD_BASELINE_DIR,new URL(route.request().url()).pathname.split('/').pop());return fs.existsSync(p)?route.fulfill({contentType:'application/javascript',body:fs.readFileSync(p,'utf8')}):route.continue();});await page.reload();await page.waitForFunction(()=>window.__phaserReady);}
 const result=await page.evaluate(()=>{
  const s=__survivorTest.scene;const reset=()=>{s.starter='cat';s.start();s.catActive=false;s.obstacles=[];s.player.fire=s.player.inv=s.spawnTimer=9999;s.juice.enabled=false;};reset();const scale=s.maxHp/40,n=x=>+((x/scale).toFixed(7));
  const enemy=(dx=65,dy=0)=>{const e=s.spawn('beast',s.player.x+dx,s.player.y+dy);Object.assign(e,{hp:10000*scale,maxHp:10000*scale,speed:0,clock:9999,enemyShield:false});return e;};
  const normalizeStats=st=>Object.fromEntries(Object.entries(st).map(([k,v])=>[k,/damage|bite|lightning|shockwave/i.test(k)?n(v):v]));
  const out={baseHP:n(s.maxHp),creatures:{},enemies:[],health:{},bosses:[]};
  for(const rank of [0,2])for(const type of ['mouse','mole','bear','salamander','spider','storm',...SurvivorEvolution.types]){
   reset();s.expedition.release(type,s.player.x,s.player.y,true);const a=s.creatures.allies[type];a.attack=0;a.inherited={};for(const k of Object.keys(s.upgrades)){s.upgrades[k]=rank;a.inherited[k]=rank;}s.upgrades.partyDamage=s.upgrades.partySpeed=0;
   for(let i=0;i<5;i++)enemy(50+i*22,(i%2)*12);
   const stats=normalizeStats(s.creatures.stats(type));
   for(let i=0;i<120;i++){s.elapsed+=1/60;s.creatures.update(1/60);}
   const attack=s.enemies.map(e=>n(10000*scale-e.hp));
   s.creatures.elements.dashEnd({x:s.player.x-90,y:s.player.y,style:type},.65,{x:s.player.x,y:s.player.y});
   for(let i=0;i<60;i++){s.elapsed+=1/60;s.creatures.update(1/60);}
   out.creatures[type+rank]={stats,attack,dash:s.enemies.map(e=>n(10000*scale-e.hp)),maxHP:n(s.maxHp)};
  }
  for(const at of [0,360,900]){reset();s.elapsed=at;s.rand=()=>.5;for(const t of ['bat','owl','beast','cat','frog','mouse','mole','bear','salamander','spider','storm','bamboo','mollusc','shaman','hunter','skeleton','lion']){const e=s.spawn(t,s.player.x+500,s.player.y);out.enemies.push([at,t,n(e.hp),n(e.contactDamage||(t==='beast'?12:7)*scale)]);}out.enemies.push([at,'growth',n(s.enemyDamageBonus())]);}
  reset();for(const final of [false,true]){s.encounters.spawnBoss(final);out.bosses.push(n(s.encounters.boss.hp));}
  reset();s.expedition.release('frog',s.player.x,s.player.y,true);const e=enemy();s.upgrades.partyDamage=1;s.hit(e,3*scale,'cat',s.player);out.health.frogHit=n(10000*scale-e.hp);
  s.player.inv=0;s.shield=false;s.encounters.damage(7*scale,'test');out.health.hurt=n(s.player.hp);s.grantUpgrade('hide');out.health.hide=[n(s.player.hp),n(s.maxHp)];
  s.player.hp=10*scale;s.drop('heal',s.player.x,s.player.y);s.tick(0);out.health.heal=n(s.player.hp);
  reset();s.relics.equipped=['bloodroot'];let target=enemy();s.relics.heal(3*scale);out.health.bloodroot=[n(10000*scale-target.hp),s.run.events.find(e=>e.type==='relic_heal_pulse').radius];
  reset();s.relics.equipped=['echo'];s.rand=()=>0;target=enemy();s.hit(target,3*scale,'cat',s.player);s.relics.update(.2);out.health.echo=n(10000*scale-target.hp);
  out.companions=normalizeStats(s.companionStats().owl);out.beast=normalizeStats(s.companionStats().beast);out.shot=n(s.relics.shot().damage);
  return out;
 });
 if(process.env.RECORD_BASELINE_DIR){fs.writeFileSync(fixture,JSON.stringify(result,null,2)+'\n');return;}
 // The subsequent opening-damage balance pass reduces incoming bases by 20%.
 const expected=JSON.parse(fs.readFileSync(fixture,'utf8'));
 expected.health.hurt=34.4;expected.health.hide[0]=42.4;
 assert.deepEqual(result,expected);
 const actual=await page.evaluate(()=>{const s=__survivorTest.scene;s.starter='cat';s.start();s.juice.enabled=true;s.upgrades.partyDamage=1;const e=s.spawn('bear',s.player.x+60,s.player.y);e.hp=100;e.enemyShield=false;s.hit(e,30,'cat',s.player);return {hp:s.maxHp,remaining:e.hp,number:s.juice.numbers.list()[0].value};});
 assert.equal(actual.hp,400);assert(Math.abs(actual.remaining-67.6)<1e-9);assert.equal(actual.number,32);
});
