const {spawn}=require('node:child_process');
const net=require('node:net');
const path=require('node:path');
const tests=['greens-map','greens-browser','starter-grid','opening-balance','enemy-pressure','survivor-fx','elements','relic-growth','determinism','party-growth','matching-dens','exploration','entrypoints','survivors','creatures','expedition','survivor-encounters','capture-choice','relic-contracts','survivor-reliability','ui-foundation','juice','damage-numbers','upgrade-packs','feedback'];
const root=path.resolve(__dirname,'..');
let server,child,interrupted=false;
const stop=()=>{child?.kill('SIGTERM');server?.kill('SIGTERM');};
process.once('SIGINT',()=>{interrupted=true;stop();process.exitCode=130;});
process.once('SIGTERM',()=>{interrupted=true;stop();process.exitCode=143;});
async function freePort(){const listener=net.createServer();await new Promise((resolve,reject)=>{listener.once('error',reject);listener.listen(0,'127.0.0.1',resolve);});const port=listener.address().port;await new Promise(resolve=>listener.close(resolve));return port;}
async function waitForServer(url){for(let n=0;n<100;n++){if(server&&server.exitCode!==null)throw Error('Local test server exited');try{const response=await fetch(new URL('survivors.html',url));if(response.ok)return;}catch{}await new Promise(resolve=>setTimeout(resolve,100));}throw Error('Game server did not become ready: '+url);}
async function check(name,url){return new Promise(resolve=>{child=spawn(process.execPath,[path.join(__dirname,'check-'+name+'.cjs')],{cwd:root,env:{...process.env,GAME_URL:url},stdio:'inherit'});const active=child;const timeout=setTimeout(()=>{console.error('TIMEOUT: '+name);active.kill('SIGTERM');},120000);active.once('error',error=>{console.error(error);clearTimeout(timeout);resolve(false);});active.once('exit',code=>{clearTimeout(timeout);child=null;resolve(code===0);});});}
(async()=>{try{let url=process.env.GAME_URL;if(!url){const port=await freePort();url='http://127.0.0.1:'+port+'/';server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1','--directory',root],{cwd:root,stdio:'ignore'});server.on('error',error=>console.error(error));}await waitForServer(url);const failed=[];for(const test of tests){if(interrupted)return;console.log('\n[Survivors] '+test);if(!await check(test,url))failed.push(test);}console.log('\nSurvivors: '+(tests.length-failed.length)+'/'+tests.length+' checks passed.');if(failed.length){console.error('Failed: '+failed.join(', '));process.exitCode=1;}}finally{stop();}})().catch(error=>{console.error(error);process.exitCode=1;});
