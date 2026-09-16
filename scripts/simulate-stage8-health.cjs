// Replay the accepted stage 8 health targets in each isolated VM.
const fs=require('node:fs'),path=require('node:path');
const runtime=require('./balance-runtime.cjs'),originalCreate=runtime.create;
runtime.create=(seed)=>{
 const g=originalCreate(seed);
 for(const entry of g.stageRosters[8])if(['feral-beast','arcane-owl'].includes(entry.id))entry.hpOverride=entry.id==='feral-beast'?26:16;
 return g;
};
process.env.SIM_OUTPUT ||= 'output/balance-stage8-health-minus4';
require('./simulate-economy.cjs');
const file=path.resolve(process.env.SIM_OUTPUT,'report.json'),report=JSON.parse(fs.readFileSync(file));
report.scenario={stage:8,hpChanges:{'feral-beast':{from:30,to:26},'arcane-owl':{from:20,to:16}},scope:'Calculator VM only; game.js unchanged'};
fs.writeFileSync(file,JSON.stringify(report,null,2));
