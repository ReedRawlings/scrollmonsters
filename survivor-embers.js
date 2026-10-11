(() => {
  // Embers: the Star Map currency. Full expeditions only (not the demo or the trial). Coins drop from dens, elites, shrines,
  // the hidden treasure and guardians; survival adds 1 per two minutes. A run must be completed, won or lost, to bank them:
  // restarting mid-run or closing the tab forfeits that run's Embers.
  const KEY = 'scrollmonsters-embers-v1', SURVIVAL_SECONDS = 120;
  class SurvivorEmbers {
    constructor(s){this.s=s;this.found=0;this.dropped=0;this.banked=null;}
    static read(){try{const v=JSON.parse(localStorage.getItem(KEY)||'null');if(v&&Number.isFinite(v.total))return {total:v.total,lifetime:v.lifetime||0};}catch{}return {total:0,lifetime:0};}
    get enabled(){return !!this.s.isExpedition&&!this.s.isDemo;}
    survival(){return Math.floor(this.s.elapsed/SURVIVAL_SECONDS);}
    // Coins spill in a ring around the source. Fixed offsets keep the simulation's random sequence unchanged.
    drop(x,y,count,source){
      if(!this.enabled||count<=0)return;
      const r=count>1?14+count*2:0;
      for(let i=0;i<count;i++){const a=i/count*Math.PI*2+.4;this.s.drop('ember',x+Math.cos(a)*r,y+Math.sin(a)*r);}
      this.dropped+=count;this.s.logEvent('embers_dropped',{source,count});
    }
    collect(item){this.found++;this.s.reward('ember',{x:item.x,y:item.y,found:this.found});}
    // Called once from finishRun. Only a completed run (won or lost) banks; a restart forfeits.
    bank(status){
      if(!this.enabled||this.banked)return this.banked;
      if(status!=='won'&&status!=='lost'){this.banked={found:this.found,survival:this.survival(),earned:0,total:SurvivorEmbers.read().total,stored:false,forfeited:true};this.s.logEvent('embers_forfeited',{status,found:this.found});return this.banked;}
      const survival=this.survival(),earned=this.found+survival,saved=SurvivorEmbers.read();
      saved.total+=earned;saved.lifetime+=earned;let stored=true;
      try{localStorage.setItem(KEY,JSON.stringify(saved));}catch{stored=false;}
      this.banked={found:this.found,survival,earned,total:saved.total,stored};
      this.s.logEvent('embers_banked',{status,found:this.found,survival,earned,total:saved.total});
      return this.banked;
    }
    summary(){return {enabled:this.enabled,found:this.found,dropped:this.dropped,survival:this.survival(),banked:this.banked,total:SurvivorEmbers.read().total};}
  }
  SurvivorEmbers.KEY=KEY;
  window.SurvivorEmbers=SurvivorEmbers;
})();
