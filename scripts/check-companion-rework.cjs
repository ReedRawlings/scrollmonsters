const assert=require('node:assert/strict');
const {run}=require('./survivor-test-utils.cjs');
run('Bear cross reach/falloff, flat Frog support, damaging Spider webs',async page=>{
 const out=await page.evaluate(()=>{
  const s=__survivorTest.scene;
  const reset=t=>{s.starter=t;s.start();s.obstacles=[];s.spawnTimer=999;s.player.fire=999;s.player.inv=999;};
  const enemy=(x,y)=>{const e=s.spawn('beast',x,y);Object.assign(e,{hp:1000,maxHp:1000,r:0,speed:0,clock:999});return e;};
  reset('bear');const b=s.creatures.allies.bear;Object.assign(b,{x:s.player.x,y:s.player.y,attack:999});
  const c=s.creatures,st=c.stats('bear'),x=b.x,y=b.y;
  const targets=[[0,0],[90,0],[180,0],[-180,0],[0,180],[0,-180],[50,50],[181,0]].map(([dx,dy])=>enemy(x+dx,y+dy));
  c.strikes.push({x,y,r:st.radius,width:st.width,time:.45,total:.45,source:'bear',damage:st.damage,shape:'cross',hits:new Set()});
  c.update(.225);const halfway=targets.map(e=>1000-e.hp);c.update(.225);const damage=targets.map(e=>1000-e.hp);c.update(.5);const after=targets.map(e=>1000-e.hp);
  s.upgrades.bearArea=1;s.upgrades.bearPower=1;const upgraded=c.stats('bear');const bearOffers=s.upgradePool().map(e=>e.id);
  reset('frog');let e=enemy(s.player.x+100,s.player.y);const frog=[];for(const source of ['player','cat','owl','beast','mouse','mole','bear','salamander','spider','storm']){const hp=e.hp;s.hit(e,4,source,s.player);frog.push(hp-e.hp);}s.upgrades.frogPower=99;const hp=e.hp;s.hit(e,4,'player',s.player);const noScaling=hp-e.hp;const frogOffer=s.upgradePool().some(e=>e.id==='frogPower');const stats=s.frogStats();
  reset('spider');e=enemy(s.player.x+80,s.player.y);const el=s.creatures.elements;s.creatures.allies.spider.attack=999;el.zone('web',e.x,e.y);el.update(.01);const first=1000-e.hp;el.update(.5);const between=1000-e.hp;el.update(.5);const second=1000-e.hp;const slow=e.slowUntil>s.elapsed;const life=el.zones[0].life;s.mode='paused';s.tick(1);const paused=el.zones[0].life===life;
  reset('bear');Object.assign(s.creatures.allies.bear,{x:s.player.x,y:s.player.y,attack:999});const a=s.creatures.allies.bear;s.creatures.strikes.push({x:a.x,y:a.y,r:180,width:28,time:.1,total:.45,source:'bear',damage:10,shape:'cross',hits:new Set()});s.expedition.release('spider',a.x+60,a.y+60,true);s.creatures.elements.zone('web',a.x+110,a.y+70);s.draw();
  return {halfway,damage,after,upgraded,bearOffers,frog,noScaling,frogOffer,stats,first,between,second,slow,paused};
 });
 assert.deepEqual(out.damage,[10,7.5,5,5,5,5,0,0]);assert.deepEqual(out.after,out.damage);assert.equal(out.halfway[2],0);
 assert.equal(out.upgraded.radius,210);assert.equal(out.upgraded.damage,12);assert(out.bearOffers.includes('bearPower'));assert(out.bearOffers.includes('bearArea'));
 assert(out.frog.every(d=>d===5));assert.equal(out.noScaling,5);assert.equal(out.frogOffer,false);assert.equal(out.stats.damageBonus,1);
 assert(Math.abs(out.first-1.2)<1e-8);assert.equal(out.between,out.first);assert(Math.abs(out.second-2.4)<1e-8);assert(out.slow&&out.paused);
 await page.screenshot({path:'/tmp/companion-rework.png'});
 console.log(JSON.stringify(out));
});
