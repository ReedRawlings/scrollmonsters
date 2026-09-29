const {chromium}=require('playwright'),assert=require('node:assert/strict'),{gameURL,launchOptions}=require('./survivor-test-utils.cjs');
// Same fixed 600s policy as check-relic-growth's long run, played in two fresh contexts: the seeded rand() must make them identical.
async function play(b){const ctx=await b.newContext({viewport:{width:1100,height:760}}),p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.addInitScript(()=>window.__vt_pending=true);await p.goto(gameURL('survivors.html?test'));await p.waitForFunction(()=>window.__phaserReady);
const r=await p.evaluate(()=>{const s=__survivorTest.scene;s.start();s.relics.equipped=['pack','echo','hunter','spite','drum','veil'];let steps=0;while(s.elapsed<601&&steps++<40000){if(s.mode==='relic')s.relics.choose(0);else if(s.mode==='upgrade')s.chooseUpgrade(0);else if(s.mode!=='playing')break;s.player.inv=2;if(s.elapsed>=600&&s.encounters.boss?.hp>0)s.hit(s.encounters.boss,99999,'player',s.player);s.tick(1/60);}return {mode:s.mode,elapsed:s.elapsed,spawned:s.spawned,nestDeck:s.nestDeck,events:s.run.events};});
await ctx.close();assert.deepEqual(errors,[]);return r;}
(async()=>{const b=await chromium.launch(launchOptions);try{const a=await play(b),c=await play(b);
assert.equal(a.mode,'won');assert.equal(c.spawned,a.spawned,'spawned differs between identical runs');assert.deepEqual(c.nestDeck,a.nestDeck,'nest deck differs');assert.equal(c.events.length,a.events.length,'event count differs');assert.deepEqual(c.events,a.events,'run.events differ');
console.log('PASS',{mode:a.mode,spawned:a.spawned,events:a.events.length,nestDeck:a.nestDeck.join(',')});
}finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1)});
