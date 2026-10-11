const {chromium}=require('playwright');const assert=require('node:assert/strict');const fs=require('node:fs');
(async()=>{const browser=await chromium.launch({headless:true,args:process.platform==='darwin'?['--use-gl=angle','--use-angle=metal']:[]});try{
const page=await browser.newPage({viewport:{width:540,height:900}}),errors=[];
page.on('pageerror',e=>errors.push(String(e)));

await page.goto(process.env.GAME_URL||'http://127.0.0.1:5198/');await page.waitForFunction(()=>window.__scollTest);await page.evaluate(()=>document.fonts.ready);
const click=async(x,y)=>{const b=await page.locator('canvas').first().boundingBox();await page.mouse.click(b.x+x*b.width/540,b.y+y*b.height/900);await page.waitForTimeout(150)};
const texts=()=>page.evaluate(()=>{
  const labels=[];
  const visit=object=>{if(!object.visible)return;if(object.type==='Text')labels.push(object.getData('label'));if(object.list)object.list.forEach(visit);};
  scrollMonstersGame.scene.getScene('ScrollMonsters').children.list.forEach(visit);
  return [...new Set(labels)];
});
await page.evaluate(()=>{window.__scollTest.setSave({});window.__scollTest.setMode('bestiary')});
await click(130,827);assert((await texts()).includes('No Feral creatures unlocked yet'));assert(!(await texts()).includes('Bat'));
fs.mkdirSync('output/collection-ui',{recursive:true});await page.screenshot({path:'output/collection-ui/empty.png'});
await click(130,827);assert((await texts()).includes('NOT ENOUGH ESSENCE'));
await page.evaluate(()=>{const a=window.__scollTest;const feral=a.monsterCatalog.filter(c=>c.affinityId==='feral').slice(1,6);window.testOwned=feral; a.setSave({ownedCreatures:feral.map(c=>c.id),activeParty:[feral[0].id],essence:{feral:200}})});
await click(130,827);let t=await texts();const owned=await page.evaluate(()=>window.testOwned);
for(const c of owned.slice(0,4))assert(t.includes(c.name));assert(!t.includes('Bat'));assert(!t.some(s=>s.startsWith('TIER ')));assert(t.includes('1/2'));
await page.screenshot({path:'output/collection-ui/collection.png'});
await click(425,315);assert.equal((await page.evaluate(()=>window.__scollTest.getSave())).activeParty.length,0);
await click(425,315);assert.equal((await page.evaluate(()=>window.__scollTest.getSave())).activeParty.length,1);
await click(335,757);t=await texts();assert(t.includes('2/2'));assert(t.includes(owned[4].name));assert(!t.includes(owned[0].name));
await click(204,757);assert((await texts()).includes('1/2'));
await click(270,258);assert((await texts()).includes('No Bloom creatures unlocked yet'));
await click(100,258);await click(130,827);t=await texts();assert(t.some(s=>s.startsWith('Tier 1')));
await page.screenshot({path:'output/collection-ui/summon.png'});
await click(270,741);await page.waitForTimeout(2100);assert.equal((await page.evaluate(()=>window.__scollTest.getSave())).essence.feral,180);
await click(400,827);assert.equal(await page.evaluate(()=>JSON.parse(window.render_game_to_text()).mode),'map');
assert.deepEqual(errors,[]);console.log('PASS: owned-only all-tier collection, empty states, pagination, party controls, summon navigation/transaction and map return; no errors');
}finally{await browser.close()}})();
