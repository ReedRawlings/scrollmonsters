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
      else if(s.mode==='upgrade')this.upgrade(w,h);
      else if(s.mode==='relic')this.relic(w,h);
      else if(s.mode==='pack')this.pack(w,h);
      else if(s.mode==='unlock')this.unlock(w,h);
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
        this.numbersToggle(w,py+ph+8);
        return;
      }
      const pw=Math.min(w-24,254),ph=178,px=(w-pw)/2,py=(h-ph)/2;ui.darkPanel(px,py,pw,ph);ui.banner('PAUSED',w/2,py-16);
      ['Move with WASD, arrows or touch drag.','R restarts · F fullscreen','Escape or P resumes.'].forEach((t,i)=>ui.darkText(t,w/2,py+32+i*16,{align:'center',color:D().muted}));
      this.button('Resume',px+16,py+ph-68,pw-32,24,()=>s.pause(),'resume');
      this.button('Run history / export',px+16,py+ph-38,pw-32,24,()=>{s.saveRun();location.assign('survivor-runs.html');},'history');
      this.numbersToggle(w,py+ph+8);
    }
    numbersToggle(w,y){const j=this.s.juice;this.s.ui.pill('Damage numbers: '+(j.numbersOn?'On':'Off'),w/2-64,y,128,20,()=>j.setNumbers(!j.numbersOn),{id:'damage-numbers'});}
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
    choicePanel(w,h,title,sub,count,cardH,extra=0){
      const pw=Math.min(w-12,h>w?300:440),ph=34+count*(cardH+6)+extra,px=(w-pw)/2,py=Math.max(30,(h-ph)/2+8);
      this.dim(w,h);this.s.ui.darkPanel(px,py,pw,ph);const banner=this.s.ui.banner(title,w/2,py-18);
      this.s.ui.darkText(sub,w/2,py+20,{align:'center',color:D().muted});
      return {px,py,pw,ph,banner};
    }
    upgrade(w,h){
      const s=this.s,ui=s.ui,cardH=58,{px,py,pw,banner}=this.choicePanel(w,h,'LEVEL '+s.level,'Combat paused · pick an upgrade',s.choices.length,cardH);
      const t=s.juice.since('upgrade');this.layout.cards=[];
      // The "LEVEL N" pop: the banner title springs in as the cards deal.
      if(!s.juice.reduced&&t<220){const k=t/220,c=1.7;banner.setScale(1+(c+1)*Math.pow(k-1,3)+c*Math.pow(k-1,2));}
      s.choices.forEach((c,i)=>{
        // Deal in: each card rises 14px and fades in, 70ms apart. Taps before LOCK_MS are ignored.
        const k=s.juice.reduced?1:Math.max(0,Math.min(1,(t-i*70)/180)),e=1-Math.pow(1-k,3),x=px+8,y=py+32+i*(cardH+6);
        ui.beginGroup('upcard'+i,{y:Math.round((1-e)*14)}).setAlpha(e);
        const owner=s.juice.ownerOf(c.id);
        ui.card((i+1)+'. '+c.name,x,y,pw-16,cardH,()=>{if(s.juice.since('upgrade')>=SurvivorScreens.LOCK_MS)s.chooseUpgrade(i);},
          {detail:c.detail,icon:'upgrade_'+c.id,badge:owner==='walker'?null:'face_'+owner,id:'up'+i});
        ui.endGroup();
        this.layout.cards.push({x,y,w:pw-16,h:cardH});
      });
    }
    // Upgrade pack reveal (prototype Moment 5). Cards are 120x170 logical: Pack_CardBack at 2x face down,
    // a DarkMode panel with the rarity strip, spinning icon, name, detail and owner face up.
    pack(w,h){
      const s=this.s,ui=s.ui,j=s.juice,r=s.packs.reveal;if(!r)return;this.dim(w,h);
      const now=j.now(),t=now-r.start,n=r.cards.length,ri={1:0,3:1,5:2}[r.size],color=SurvivorPacks.COLORS[r.size];
      const tall=h>w,cw=120,ch=170,cx=Math.round((w-cw)/2),top=tall?96:40,cy=top+44;
      this.layout.packCard=cy+ch/2;
      ui.banner(SurvivorPacks.rarity(r.size).toUpperCase()+' PACK',w/2,top-8);
      ui.darkText(n===1?'1 card':n+' cards',w/2,top+30,{align:'center',color});
      // Face-down pile: the cards still to reveal, each landing 90ms apart during the deal-in.
      for(let i=n-1;i>r.kept;i--){if(!j.reduced&&t<(n-1-i)*90)continue;const off=(i-r.kept)*3;
        ui.image('Pack_CardBack',cx+off,cy+off,cw,ch,{frame:j.frameRect('Pack_CardBack',ri)});}
      if(r.kept<n&&(j.reduced||t>=(n-1-r.kept)*90)){
        const card=r.cards[r.kept],since=r.flippedAt===null?-1:now-r.flippedAt;
        // Flip: squash the back to nothing over 90ms, then open the face over the next 90ms.
        const k=since<0?1:j.reduced?1:since<90?1-since/90:Math.min(1,(since-90)/90),face=since>=(j.reduced?0:90),dw=Math.max(2,Math.round(cw*k)),dx=cx+Math.round((cw-dw)/2);
        if(!face)ui.image('Pack_CardBack',dx,cy,dw,ch,{frame:j.frameRect('Pack_CardBack',ri)});
        else{ui.darkPanel(dx,cy,dw,ch);ui.rect(dx+6,cy+6,Math.max(0,dw-12),4,color);
          if(k>=1){const owner=j.ownerOf(card.id),key='upgrade_'+card.id;
            if(s.textures.exists(key))ui.image(key,cx+36,cy+18,48,48,{frame:j.frameRect(key,j.frameAt(key,now,true))});
            ui.darkText(card.name,cx+cw/2,cy+80,{align:'center',wrap:cw-16});
            ui.darkText(card.detail,cx+cw/2,cy+100,{align:'center',color:ScrollUI.DARK.muted,wrap:cw-16}).setOrigin(.5,0);
            ui.darkText(owner==='walker'?'WHOLE TEAM':owner.toUpperCase(),cx+cw/2,cy+ch-14,{align:'center',color});}}
        if(r.size>1&&!j.reduced&&!face)ui.image('Pack_Sheen',cx+((t%1800)/1800)*(cw-48),cy,48,ch,{frame:j.frameRect('Pack_Sheen',j.frameAt('Pack_Sheen',now,true)),alpha:.5});
      }
      // Hand row: one slot per card; filled slots show the kept icon.
      // Portrait: a row under the card. Landscape: a column beside it, clear of the party bar.
      this.layout.hand=[];
      for(let i=0;i<n;i++){const x=tall?Math.round(w/2+(i-(n-1)/2)*38-17):cx+cw+14,y=tall?cy+ch+18:cy+i*36;this.layout.hand.push({x:x+17,y:y+17});ui.darkPanel(x,y,34,34);
        if(i<r.kept){const key='upgrade_'+r.cards[i].id;if(s.textures.exists(key))ui.image(key,x+1,y+1,32,32,{frame:[0,0,16,16]});}}
    }
    relic(w,h){
      const s=this.s,ui=s.ui,r=s.relics,cardH=h>w?80:60,{px,py,pw,ph}=this.choicePanel(w,h,'CHOOSE A RELIC','Shrine reward · this run only',r.offers.length,cardH,30);
      const t=s.juice.since('relic');this.layout.cards=[];
      r.offers.forEach((item,i)=>{const owned=r.count(item.id),y=py+32+i*(cardH+6);this.layout.cards.push({x:px+8,y,w:pw-16,h:cardH});
        ui.card((i+1)+'. '+item.name,px+8,y,pw-16,cardH,()=>r.choose(i),{detail:item.detail+' '+item.extra,icon:'relic_'+item.id,id:'relic'+i});
        const bx=px+pw-14,by=y+10;
        if(!owned){const glow=s.juice.reduced?1:.65+.35*Math.sin(t/160);ui.darkText('NEW',bx,by,{align:'right',color:ScrollUI.DARK.gold}).setAlpha(glow);}
        else{const rolled=t>=400,label=ui.darkText('×'+(rolled?owned+1:owned),bx,by,{align:'right',color:rolled?ScrollUI.DARK.gold:ScrollUI.DARK.text});
          if(rolled&&!s.juice.reduced&&t<520)label.setScale(1+.4*(1-(t-400)/120));}});
      this.button('Leave reward',w/2-50,py+ph-28,100,20,()=>r.skip(),'skip');
    }
    unlock(w,h){
      const s=this.s,ui=s.ui,j=s.juice,type=s.unlockType,t=j.since('unlock'),cx=w/2,cy=h/2-10;
      this.dim(w,h);ui.banner('NEW STARTER',cx,cy-130);
      ui.image('Unlock_Rays',cx-96,cy-96,192,192,{frame:j.frameRect('Unlock_Rays',j.frameAt('Unlock_Rays',t,true))});
      const fillAt=400,fillEnd=fillAt+j.meta('Unlock_Fill').n/j.meta('Unlock_Fill').fps*1000;
      const face=ui.image('face_'+type,cx-38,cy-38,76,76);if(face){if(t<fillEnd)face.setTint(0x2a2238);else face.clearTint();}
      if(t>=fillAt&&t<fillEnd)ui.image('Unlock_Fill',cx-48,cy-48,96,96,{frame:j.frameRect('Unlock_Fill',j.frameAt('Unlock_Fill',t-fillAt,false))});
      const name=type==='storm'?'STORM LIZARD':String(type).toUpperCase();
      ui.darkText(t<fillEnd?'???':name,cx,cy+64,{size:18,align:'center'});
      ui.darkText('Now available as a starter',cx,cy+86,{align:'center',color:ScrollUI.DARK.muted});
      if(t>=900)this.button('Continue',cx-60,cy+106,120,26,()=>s.closeUnlock(),'continue');
    }
  }
  SurvivorScreens.LOCK_MS = 370;
  window.SurvivorScreens = SurvivorScreens;
})();
