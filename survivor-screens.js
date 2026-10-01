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
      const s=this.s,ui=s.ui,j=s.juice,portrait=h>w,roster=SurvivorExpansion.roster,sel=s.starter,now=j.now(),red=j.reduced;
      this.dim(w,h);
      // Landscape is laid out in a 480x320 frame, centred however big the logical screen is (720x480 at Normal UI size).
      const ox=portrait?0:Math.round((w-480)/2),oy=portrait?0:Math.round((h-320)/2);if(!portrait){ui.beginGroup('titleframe',{x:ox,y:oy});w=480;h=320;}
      const L=portrait
        ?{banner:[w/2,26],hero:[87,72],name:[w/2,186],desc:[w/2,204,240],grid:[24,228],begin:[55,340,160,44],field:[55,398,76,26],hist:[139,398,76,26]}
        :{banner:[w/2,10],hero:[64,56],name:[112,172],desc:[112,190,200],grid:[240,60],begin:[250,168,212,40],field:[250,220,104,26],hist:[358,220,104,26]};
      const ease=k=>1+2.2*Math.pow(k-1,3)+1.2*Math.pow(k-1,2),bracket=(x,y,bw,bh)=>{const g=ui.graphics();g.lineStyle(2,0xffffff,1);
        for(const [cx,cy,dx,dy] of [[x-4,y-4,1,1],[x+bw+4,y-4,-1,1],[x-4,y+bh+4,1,-1],[x+bw+4,y+bh+4,-1,-1]])g.lineBetween(cx,cy,cx+6*dx,cy).lineBetween(cx,cy,cx,cy+6*dy);};
      ui.banner('SCROLL MONSTERS',...L.banner);
      // Hero flip (prototype menu): squash the old face for 80ms, then open the new one to 1.1x with an 8px lift over 220ms.
      const [hx,hy]=L.hero,t=s.starterAt==null?Infinity:now-s.starterAt;ui.panel('dk_slot',hx,hy,96,96,5,2);
      const old=!red&&t<80,k=red||t>=300?1:old?1-t/80:(t-80)/220,sx=red||t>=300?1:old?k:k<.5?2.2*k:1.1-.2*(k-.5),lift=old||red||t>=300?0:8*Math.sin(Math.PI*k),key='face_'+(old?s.starterFrom:sel);
      const face=ui.image(key,hx+48,hy+48-lift,Math.max(1,76*sx),76,{center:true});this.layout.hero={scaleX:Math.round(sx*1000)/1000,key};
      if(!red&&t>=80&&t<400&&this.sparkAt!==s.starterAt){this.sparkAt=s.starterAt;for(let i=0;i<8;i++){const a=i*Math.PI/4+j.rand()*.5,r=30+j.rand()*24;j.play('Reward_Trail',ox+hx+48+Math.cos(a)*r,oy+hy+48+Math.sin(a)*r,{ui:true,scale:1});}}
      const step=d=>{const ids=roster.map(([id])=>id),n=ids.length;let i=ids.indexOf(sel);for(let c=0;c<n;c++){i=(i+d+n)%n;if(s.unlocked.includes(ids[i]))return s.chooseStarter(ids[i]);}};
      ui.pill('<',hx-41,hy+34,30,28,()=>step(-1),{id:'prev'});ui.pill('>',hx+107,hy+34,30,28,()=>step(1),{id:'next'});
      // Name and description slide up as they fade in; a locked tap shows how to unlock instead.
      const lock=s.lockedTap&&now-s.lockedTap.at<1500?s.lockedTap:null,info=roster.find(([id])=>id===sel),nk=red?1:Math.min(1,Math.max(0,t/180)),dk=red?1:Math.min(1,Math.max(0,(t-50)/200));
      ui.darkText(lock?'???':pretty(sel).toUpperCase(),L.name[0],L.name[1]+5*(1-nk),{size:18,align:'center'}).setAlpha(lock?1:nk);
      ui.darkText(lock?'Capture one in an expedition to unlock it':info?info[1]:'',L.desc[0],L.desc[1]+5*(1-dk),{align:'center',color:lock?D().danger:D().muted,wrap:L.desc[2]}).setOrigin(.5,0).setAlpha(lock?1:dk);
      const pos=i=>({x:L.grid[0]+(i%5)*46,y:L.grid[1]+Math.floor(i/5)*46}),ids=roster.map(([id])=>id);
      roster.forEach(([id],i)=>{let {x,y}=pos(i);const known=s.unlocked.includes(id);
        if(lock?.id===id&&!red&&now-lock.at<220)x+=Math.round(4*Math.sin((now-lock.at)/220*Math.PI*4)*(1-(now-lock.at)/220));
        this.layout.faces.push({id,x:x+ox,y:y+oy,size:38,known}); // layout is recorded in screen space
        const f=ui.image('face_'+id,x,y,38,38);if(f){if(known)f.clearTint();else f.setTint(0x2a2238);}
        ui.hitArea(x,y,38,38,()=>s.chooseStarter(id),'face-'+id);});
      // The selection brackets slide from the previous face over 150ms.
      const to=pos(ids.indexOf(sel)),from=s.starterFrom?pos(ids.indexOf(s.starterFrom)):to,bk=red?1:Math.min(1,t/150),be=bk>=1?1:ease(bk);
      bracket(from.x+(to.x-from.x)*be,from.y+(to.y-from.y)*be,38,38);
      const [bx,by,bw,bh]=L.begin;ui.card('BEGIN',bx,by,bw,bh,()=>s.start(),{color:D().gold,size:18,align:'center',id:'begin'});
      bracket(bx-2,by-2,bw+4,bh+4);this.layout.begin=[bx+ox,by+oy,bw,bh];this.layout.beginBrackets=[bx+ox,by+oy,bw,bh];
      const other=s.field==='desert'?'woods':'desert';
      ui.pill(s.field==='desert'?'Desert':'Woodland',...L.field,()=>location.assign('survivors.html?'+(s.isExpedition?'':'trial&')+'field='+other),{id:'field'});
      ui.pill('History',...L.hist,()=>location.assign('survivor-runs.html'),{id:'history'});
      if(!portrait)ui.endGroup();
    }
    paused(w,h){
      const s=this.s,ui=s.ui,ids=[...new Set(s.relics.equipped)];this.dim(w,h);
      if(ids.length){
        // Relic collection: one column in portrait, two in landscape so 13 relics fit 320 logical px.
        const cols=w>h?2:1,rows=Math.ceil(ids.length/cols),pw=Math.min(w-16,cols===2?440:254),ph=64+rows*20+34+28,px=(w-pw)/2,py=Math.max(34,(h-ph)/2);this.layout.pausePanel={x:px,y:py,w:pw,h:ph};
        ui.darkPanel(px,py,pw,ph);ui.banner('RELICS',w/2,py-16);
        const colW=(pw-24)/cols;
        ids.forEach((id,i)=>{const cx=px+12+Math.floor(i/rows)*colW,cy=py+26+(i%rows)*20;ui.image('relic_'+id,cx,cy,16,16,{frame:[0,0,16,16]});
          ui.darkText(s.relics.name(id)+' ×'+s.relics.count(id),cx+22,cy+8,{color:D().muted});});
        this.button('Resume',w/2-50,py+ph-58,100,22,()=>s.pause(),'resume');
        this.numbersToggle(w,py+ph-30);
        return;
      }
      const pw=Math.min(w-24,w>h?340:254),ph=206,px=(w-pw)/2,py=(h-ph)/2;this.layout.pausePanel={x:px,y:py,w:pw,h:ph};ui.darkPanel(px,py,pw,ph);ui.banner('PAUSED',w/2,py-16);
      ['Move with WASD, arrows or touch drag.','R restarts · F fullscreen','Escape or P resumes.'].forEach((t,i)=>ui.darkText(t,w/2,py+32+i*16,{align:'center',color:D().muted}));
      this.button('Resume',px+16,py+ph-96,pw-32,24,()=>s.pause(),'resume');
      this.button('Run history / export',px+16,py+ph-66,pw-32,24,()=>{s.saveRun();location.assign('survivor-runs.html');},'history');
      this.numbersToggle(w,py+ph-30);
    }
    // Pause settings, inside the panel's bottom row: damage numbers everywhere; UI size on desktop (landscape) only.
    numbersToggle(w,y){const s=this.s,j=s.juice,wide=w>this.s.uiSize().h,num=()=>j.setNumbers(!j.numbersOn),label='Damage numbers: '+(j.numbersOn?'On':'Off');
      // Inside a black panel, so they use the lighter card art like the other panel buttons.
      this.layout.settings=wide?{x:w/2-154,y,w:308,h:20}:{x:w/2-64,y,w:128,h:20};
      if(!wide)return this.button(label,w/2-64,y,128,20,num,'set-numbers');
      this.button(label,w/2-154,y,150,20,num,'set-numbers');
      this.button('UI size: '+(j.uiLarge?'Large':'Normal'),w/2+4,y,150,20,()=>j.setUiLarge(!j.uiLarge),'set-ui-size');}
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
            if(s.textures.exists(key))ui.image(key,cx+40,cy+14,40,40,{frame:j.frameRect(key,j.frameAt(key,now,true))});
            ui.darkText(card.name,cx+cw/2,cy+64,{align:'center',wrap:cw-12});
            ui.darkText(card.detail,cx+cw/2,cy+76,{align:'center',color:ScrollUI.DARK.muted,wrap:cw-12}).setOrigin(.5,0);
            ui.darkText(owner==='walker'?'WHOLE TEAM':owner.toUpperCase(),cx+cw/2,cy+ch-14,{align:'center',color});}}
        if(r.size>1&&!j.reduced&&!face)ui.image('Pack_Sheen',cx+((t%1800)/1800)*(cw-48),cy,48,ch,{frame:j.frameRect('Pack_Sheen',j.frameAt('Pack_Sheen',now,true)),alpha:.5});
      }
      // Hand row: one slot per card; filled slots show the kept icon.
      // Portrait: a row under the card. Landscape: a column beside it, clear of the party bar.
      this.layout.hand=[];
      for(let i=0;i<n;i++){const x=tall?Math.round(w/2+(i-(n-1)/2)*38-17):cx+cw+14,y=tall?cy+ch+18:cy+i*36;this.layout.hand.push({x:x+17,y:y+17});ui.darkPanel(x,y,34,34);
        if(i<r.kept){const key='upgrade_'+r.cards[i].id;if(s.textures.exists(key))ui.image(key,x+1,y+1,32,32,{frame:[0,0,16,16]});}}
    }
    // The picked upgrade card lingers through the 260ms hold: a brief flash, then it fades and shrinks away,
    // so the icon flying to the party bar visibly lifts off it. Drawn in any mode; no hit areas.
    dismiss(w,h){
      const s=this.s,j=s.juice,p=j.picked;if(!p)return;const t=j.now()-p.at;if(t>=SurvivorScreens.HOLD_MS){j.dismissState=null;return;}
      const ui=s.ui,red=j.reduced;
      // Press: dip to 96% over 30ms, grow to 106% by 90ms, then shrink and fade out by the end of the hold.
      const sc=red?1:t<30?1-.04*t/30:t<90?.96+.1*(t-30)/60:1.06-.11*(t-90)/(SurvivorScreens.HOLD_MS-90),alpha=t<90?1:1-(t-90)/(SurvivorScreens.HOLD_MS-90);
      // The other cards drop 20px and fade over 120ms.
      const ok=Math.min(1,t/120),oe=1-Math.pow(1-ok,2),oa=1-ok,dy=red?0:20*oe;j.dismissState={picked:sc,others:{alpha:oa,dy}};
      if(oa>0)p.others.forEach((o,i)=>{const {x,y,w:cw,h:ch}=o.card;ui.beginGroup('pickother'+i,{y:dy}).setAlpha(oa);ui.panel('dk_slot',x,y,cw,ch,5,2);
        if(s.textures.exists('upgrade_'+o.id))ui.image('upgrade_'+o.id,x+8,y+(ch-32)/2,32,32,{frame:[0,0,16,16]});ui.darkText(o.label,x+40,y+12);ui.endGroup();});
      const {x,y,w:cw,h:ch}=p.card,cx=x+cw/2,cy=y+ch/2;
      ui.beginGroup('pickdismiss',{x:cx*(1-sc),y:cy*(1-sc),scale:sc}).setAlpha(alpha);
      ui.panel('dk_slot',x,y,cw,ch,5,2);
      if(s.textures.exists('upgrade_'+p.id))ui.image('upgrade_'+p.id,x+8,y+(ch-32)/2,32,32,{frame:[0,0,16,16]});
      ui.darkText(p.label,x+40,y+12);ui.darkText(p.detail,x+40,y+25,{color:D().muted,wrap:cw-50}).setOrigin(0,0);
      if(!j.reduced&&t<60)ui.rect(x,y,cw,ch,'#ffffff'+Math.round((1-t/60)*128).toString(16).padStart(2,'0'));
      ui.endGroup();
    }
    relic(w,h){
      const s=this.s,ui=s.ui,r=s.relics,cardH=h>w?80:60,{px,py,pw,ph}=this.choicePanel(w,h,'CHOOSE A RELIC','Shrine reward · this run only',r.offers.length,cardH,30);
      const t=s.juice.since('relic');this.layout.cards=[];
      r.offers.forEach((item,i)=>{const owned=r.count(item.id),y=py+32+i*(cardH+6);this.layout.cards.push({x:px+8,y,w:pw-16,h:cardH});
        // Deal in like the upgrade cards; taps before LOCK_MS are ignored so a pick is never blind.
        const k=s.juice.reduced?1:Math.max(0,Math.min(1,(t-i*70)/180)),e=1-Math.pow(1-k,3);ui.beginGroup('relcard'+i,{y:Math.round((1-e)*14)}).setAlpha(e);
        ui.card((i+1)+'. '+item.name,px+8,y,pw-16,cardH,()=>{if(s.juice.since('relic')>=SurvivorScreens.LOCK_MS)r.choose(i);},{detail:item.detail+' '+item.extra,icon:'relic_'+item.id,id:'relic'+i});
        const bx=px+pw-14,by=y+10;
        if(!owned){const glow=s.juice.reduced?1:.65+.35*Math.sin(t/160);ui.darkText('NEW',bx,by,{align:'right',color:ScrollUI.DARK.gold}).setAlpha(glow);}
        else{const rolled=t>=400,label=ui.darkText('×'+(rolled?owned+1:owned),bx,by,{align:'right',color:rolled?ScrollUI.DARK.gold:ScrollUI.DARK.text});
          if(rolled&&!s.juice.reduced&&t<520)label.setScale(1+.4*(1-(t-400)/120));}
        ui.endGroup();});
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
  SurvivorScreens.HOLD_MS = 260;
  window.SurvivorScreens = SurvivorScreens;
})();
