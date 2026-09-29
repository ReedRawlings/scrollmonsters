(() => {
  'use strict';
  const D = () => ScrollUI.DARK;
  const pretty = id => id==='storm'?'Storm Lizard':id[0].toUpperCase()+id.slice(1);
  class SurvivorScreens {
    constructor(s){this.s=s;this.layout={faces:[]};}
    // w,h are logical. Called inside the x2 group.
    draw(w,h){
      const s=this.s;this.layout={faces:[]};
      if(s.mode==='title')this.title(w,h);
      else if(s.mode==='paused')this.paused(w,h);
      else if(s.mode==='won'||s.mode==='lost')this.ended(w,h);
    }
    // Buttons inside a black panel use the lighter item-slot art; black pills would vanish against it.
    button(label,x,y,w,h,action,id){return this.s.ui.card(label,x,y,w,h,action,{align:'center',id});}
    dim(w,h){const ui=this.s.ui;ui.rect(0,0,w,h,'#0b0710b0');ui.hitArea(0,0,w,h,()=>{},'modal-blocker');}
    title(w,h){
      const s=this.s,ui=s.ui,portrait=h>w,roster=SurvivorExpansion.roster,sel=s.starter;
      this.dim(w,h);
      const L=portrait
        ?{banner:[w/2,26],hero:[87,72],name:[w/2,186],desc:[w/2,204,240],grid:[24,228],begin:[55,340,160,44],field:[55,398,76,26],hist:[139,398,76,26]}
        :{banner:[w/2,10],hero:[64,56],name:[112,172],desc:[112,190,200],grid:[240,60],begin:[250,168,212,40],field:[250,220,104,26],hist:[358,220,104,26]};
      ui.banner('SCROLL MONSTERS',...L.banner);
      const [hx,hy]=L.hero;ui.panel('dk_slot',hx,hy,96,96,5,2);ui.image('face_'+sel,hx+10,hy+10,76,76);
      ui.darkText(pretty(sel).toUpperCase(),L.name[0],L.name[1],{size:18,align:'center'});
      const info=roster.find(([id])=>id===sel);
      ui.darkText(info?info[1]:'',L.desc[0],L.desc[1],{align:'center',color:D().muted,wrap:L.desc[2]}).setOrigin(.5,0);
      roster.forEach(([id],i)=>{const x=L.grid[0]+(i%5)*46,y=L.grid[1]+Math.floor(i/5)*46,known=s.unlocked.includes(id);this.layout.faces.push({id,x,y,size:38,known});
        const face=ui.image('face_'+id,x,y,38,38);if(face){if(known)face.clearTint();else face.setTint(0x2a2238);}
        ui.hitArea(x,y,38,38,()=>s.chooseStarter(id),'face-'+id);
        if(id===sel){const g=ui.graphics();g.lineStyle(2,0xffffff,1);
          for(const [cx,cy,dx,dy] of [[x-4,y-4,1,1],[x+42,y-4,-1,1],[x-4,y+42,1,-1],[x+42,y+42,-1,-1]])g.lineBetween(cx,cy,cx+6*dx,cy).lineBetween(cx,cy,cx,cy+6*dy);}});
      const [bx,by,bw,bh]=L.begin;ui.card('BEGIN',bx,by,bw,bh,()=>s.start(),{color:D().gold,size:18,align:'center',id:'begin'});
      const other=s.field==='desert'?'woods':'desert';
      ui.pill(s.field==='desert'?'Desert':'Woodland',...L.field,()=>location.assign('survivors.html?'+(s.isExpedition?'':'trial&')+'field='+other),{id:'field'});
      ui.pill('History',...L.hist,()=>location.assign('survivor-runs.html'),{id:'history'});
    }
    paused(w,h){
      const s=this.s,ui=s.ui,ids=[...new Set(s.relics.equipped)];this.dim(w,h);
      if(ids.length){
        // Relic collection: one column in portrait, two in landscape so 13 relics fit 320 logical px.
        const cols=w>h?2:1,rows=Math.ceil(ids.length/cols),pw=Math.min(w-16,cols===2?440:254),ph=64+rows*20+34,px=(w-pw)/2,py=Math.max(34,(h-ph)/2);
        ui.darkPanel(px,py,pw,ph);ui.banner('RELICS',w/2,py-16);
        const colW=(pw-24)/cols;
        ids.forEach((id,i)=>{const cx=px+12+Math.floor(i/rows)*colW,cy=py+26+(i%rows)*20;ui.image('relic_'+id,cx,cy,16,16,{frame:[0,0,16,16]});
          ui.darkText(s.relics.name(id)+' ×'+s.relics.count(id),cx+22,cy+8,{color:D().muted});});
        this.button('Resume',w/2-50,py+ph-30,100,22,()=>s.pause(),'resume');
        return;
      }
      const pw=Math.min(w-24,254),ph=178,px=(w-pw)/2,py=(h-ph)/2;ui.darkPanel(px,py,pw,ph);ui.banner('PAUSED',w/2,py-16);
      ['Move with WASD, arrows or touch drag.','R restarts · F fullscreen','Escape or P resumes.'].forEach((t,i)=>ui.darkText(t,w/2,py+32+i*16,{align:'center',color:D().muted}));
      this.button('Resume',px+16,py+ph-68,pw-32,24,()=>s.pause(),'resume');
      this.button('Run history / export',px+16,py+ph-38,pw-32,24,()=>{s.saveRun();location.assign('survivor-runs.html');},'history');
    }
    ended(w,h){
      const s=this.s,ui=s.ui,won=s.mode==='won';this.dim(w,h);
      const ally=Math.round(s.owlDamage+s.encounters.beastDamage+Object.values(s.creatures.damage).reduce((a,b)=>a+b,0));
      const lines=['Survived '+Math.floor(s.elapsed)+' seconds · '+s.kills+' defeated','Your damage: '+Math.round(s.playerDamage),'Cat: '+Math.round(s.catDamage)+' · Ally: '+ally,'Damage taken: '+s.damageTaken];
      const pw=Math.min(w-24,254),ph=196,px=(w-pw)/2,py=(h-ph)/2;ui.darkPanel(px,py,pw,ph);ui.banner(won?'COMPLETE':'FAILED',w/2,py-16);
      ui.darkText(won?'Expedition complete':'Expedition failed',w/2,py+28,{align:'center',color:won?D().gold:D().danger});
      lines.forEach((t,i)=>ui.darkText(t,w/2,py+50+i*16,{align:'center',color:D().muted}));
      this.button('Choose starter / play again',px+16,py+ph-68,pw-32,24,()=>{s.mode='title';s.draw();},'again');
      this.button('Run history / export',px+16,py+ph-38,pw-32,24,()=>{s.saveRun();location.assign('survivor-runs.html');},'history');
    }
  }
  window.SurvivorScreens = SurvivorScreens;
})();
