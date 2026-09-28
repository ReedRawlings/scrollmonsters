(() => {
  const host=document.getElementById('runs');let runs=[];
  try {const saved=JSON.parse(localStorage.getItem('scrollmonsters-survivor-runs-v1')||'[]');if(Array.isArray(saved))runs=saved;}catch{host.textContent='Run history could not be read in this browser.';}
  const add=(parent,tag,text)=>{const el=document.createElement(tag);el.textContent=text;parent.append(el);return el;};
  const exportRuns=data=>{const blob=new Blob([JSON.stringify({schemaVersion:1,exportedAt:new Date().toISOString(),runs:data},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='woodland-runs-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  document.getElementById('export').onclick=()=>exportRuns(runs);
  if(!runs.length&&!host.textContent)add(host,'p','No recorded runs yet. Play a round to start collecting logs.');
  for(const run of runs){
    const s=run.summary||{},article=add(host,'article','');
    add(article,'h2',`${new Date(run.startedAt).toLocaleString()} · ${run.status==='in_progress'?'Unfinished / checkpoint':run.status}`);
    add(article,'p',`${run.runMode||'trial'} · ${s.seconds??0}s · ${s.kills??0} defeats · Level ${s.level??1} · HP ${s.hp??0}/${s.maxHp??40}`);
    if(run.telemetryOmitted)add(article,'p',`Older telemetry trimmed to fit local storage: ${run.telemetryOmitted.events||0} events, ${run.telemetryOmitted.samples||0} checkpoints. Final summary retained.`);
    add(article,'p',`Spawned: ${s.spawned??'not recorded'} · Alive at end: ${s.enemiesAlive??'not recorded'} · Peak alive: ${s.peakEnemies??'not recorded'} · Spawn cap: ${s.spawnCapSeconds??'not recorded'}s`);
    const d=s.damage||{};add(article,'p',`Damage: player ${Math.round(d.player||0)}, Cat ${Math.round(d.cat||0)}, Owl ${Math.round(d.owl||0)}. Taken: ${d.taken||0}. Owl: ${s.owl||'not_seen'}.`);
    add(article,'p','Upgrades: '+(Object.entries(s.upgrades||{}).filter(([,n])=>n>0).map(([id,n])=>`${id} ×${n}`).join(', ')||'none'));
    if(s.encounters){const e=s.encounters;add(article,'p',`Companion choice: ${e.choice||'none'} · Beast damage: ${Math.round(e.beastDamage||0)} · Nests cleared: ${(e.nests||[]).filter(n=>n.destroyed).length}/${(e.nests||[]).length} · Guardian: ${e.boss?(e.boss.defeated?'defeated':Math.ceil(e.boss.hp)+' HP remaining'):'not reached'}`);}
    if(s.creatures)add(article,'p','Companion damage: '+Object.entries(s.creatures.damage).map(([name,damage])=>name+' '+Math.round(damage)).join(' · '));
    if(s.relics)add(article,'p','Relics: '+(s.relics.equipped.join(', ')||'none'));
    if(s.expedition){const e=s.expedition;add(article,'p',`Chests: ${e.chestsOpened||0} (+${e.chestXp||0} XP) · Starter: ${e.starter} · Party: ${e.party.join(', ')} · Frog pulses: ${e.supportPulses} · Shields blocked: ${e.shieldBlocks} · Shrine: ${e.shrine.completed!==undefined?e.shrine.completed+'/3 challenges':e.shrine.done?'restored':'not completed'}`);}
    const button=add(article,'button','Export this run');button.onclick=()=>exportRuns([run]);
    const detail=add(article,'details','');add(detail,'summary','Event timeline');add(detail,'pre',(run.events||[]).map(e=>`${e.time.toFixed(2)}s  ${e.type}  ${JSON.stringify(Object.fromEntries(Object.entries(e).filter(([k])=>k!=='time'&&k!=='type')))}`).join('\n'));
    const samples=add(article,'details','');add(samples,'summary','5-second checkpoints');add(samples,'pre',JSON.stringify(run.samples||[],null,2));
  }
})();
