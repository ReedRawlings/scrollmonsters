const {chromium}=require('playwright'),assert=require('node:assert/strict'),{gameURL,launchOptions}=require('./survivor-test-utils.cjs');
async function open(b,path){const ctx=await b.newContext({viewport:{width:1100,height:760}}),p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.addInitScript(()=>window.__vt_pending=true);await p.goto(gameURL(path));await p.waitForFunction(()=>window.__phaserReady);return {p,close:async()=>{await ctx.close();assert.deepEqual(errors,[]);}};}
// Replay both runs through the first Guardian encounter; check-relic-growth covers the full 1200s expedition separately.
async function play(b){const {p,close}=await open(b,'survivors.html?test');
const r=await p.evaluate(()=>{const s=__survivorTest.scene;s.start();s.relics.equipped=['pack','echo','hunter','spite','drum','veil'];let steps=0;while(s.elapsed<601&&steps++<40000){if(s.mode==='relic')s.relics.choose(0);else if(s.mode==='upgrade')s.chooseUpgrade(0);else if(s.mode==='pack')s.packs.close();else if(s.mode==='merge')s.creatures.evolution.choose('leave');else if(s.mode!=='playing')break;s.player.inv=2;if(s.encounters.boss?.hp>0&&((!s.encounters.boss.final&&s.elapsed>=600)||(s.encounters.boss.final&&s.elapsed>=1200)))s.hit(s.encounters.boss,99999,'player',s.player);s.tick(1/60);}return {mode:s.mode,seed:s.run.seed,spawned:s.spawned,nestDeck:s.nestDeck,events:s.run.events};});
await close();return r;}
// The world a seed produces before any play: den spots and nest deck.
async function layout(b,path){const {p,close}=await open(b,path);const r=await p.evaluate(()=>{const s=__survivorTest.scene;s.start();return {seed:s.run.seed,dens:s.encounters.nests.map(n=>[n.x,n.y]),nestDeck:s.nestDeck};});await close();return r;}
(async()=>{const b=await chromium.launch(launchOptions);try{const a=await play(b),c=await play(b);
assert.equal(a.mode,'playing');assert.equal(a.seed,9137,'?test pins the seed');assert.equal(c.spawned,a.spawned,'spawned differs between identical runs');assert.deepEqual(c.nestDeck,a.nestDeck,'nest deck differs');assert.equal(c.events.length,a.events.length,'event count differs');assert.deepEqual(c.events,a.events,'run.events differ');
const pinned=await layout(b,'survivors.html?test'),other=await layout(b,'survivors.html?test&seed=42'),replay=await layout(b,'survivors.html?test&seed=42');
assert.equal(other.seed,42);assert.notDeepEqual(other.dens,pinned.dens,'another seed places dens elsewhere');assert.notDeepEqual(other.nestDeck,pinned.nestDeck,'another seed shuffles the nest deck');assert.deepEqual(replay,other,'?seed=N replays the same layout');
// Normal play draws a fresh seed for every run, and records it so the run can be replayed.
const {p,close}=await open(b,'survivors.html'),seeds=[];for(const key of ['Enter','r','r']){await p.keyboard.press(key);seeds.push(await p.evaluate(()=>JSON.parse(localStorage.getItem('scrollmonsters-survivor-runs-v1'))[0].seed));}await close();
assert(seeds.every(Number.isInteger),'runs record their seed: '+seeds);assert.equal(new Set(seeds).size,3,'each run gets its own seed: '+seeds);
console.log('PASS',{spawned:a.spawned,events:a.events.length,nestDeck:a.nestDeck.join(','),seed42Deck:other.nestDeck.join(','),normalSeeds:seeds});
}finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1)});
