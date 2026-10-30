// ===== 2v2 + tournaments (local & online) =====
const PB2=PDBCore;
// --- online menu entries
ONL_ITEMS.splice(ONL_ITEMS.indexOf('QUICK MATCH')+1,0,'QUICK 2V2');ONL_ITEMS.splice(ONL_ITEMS.indexOf('CREATE PRIVATE ROOM')+1,0,'TOURNAMENT');
const _updOnlT=updOnlineMenu;updOnlineMenu=function(){const o=ONL_ITEMS[onlSel];if((o=='QUICK 2V2'||o=='TOURNAMENT')&&mOK()){SFX.ok();NET.lobby=null;state='lobby';netOpen({t:o=='TOURNAMENT'?'tcreate':'quick2'});return}_updOnlT()};
const teamOfSlot=i=>{const s=NET.slots&&NET.slots[i];return s&&s.team!=null?s.team:i%2};
// --- net messages: spectator flag, tournament info, champion screen
const TN={champ:null,endT:0};
const _netMsgT=netMsg;netMsg=function(m){if(m.t=='tchamp'){TN.champ=m;if(m.you&&m.coins)setTimeout(()=>SFX.coin(),600);state='tchamp';return}
 _netMsgT(m);if(m.t=='start'){NET.spec=!!m.spec;NET.tour=m.tour||null;NET.teams=m.teams||null}
 if(m.t=='end'&&m.tour){TN.endT=performance.now()}};
UIS.add('tchamp');
// after a tournament match: results show briefly, then everyone sees the bracket until the next match starts
const _updUIT=updUI;updUI=function(){if(state=='tchamp'){if(mOK()||mStart()){SFX.ok();state=NET.lobby?'lobby':'online';TN.champ=null}else if(mBack()){SFX.back();TN.champ=null;netLeave()}return}
 if(state=='oresult'&&NET.res&&NET.res.tour&&performance.now()-TN.endT>3000&&NET.lobby&&NET.lobby.T){state='lobby';return}_updUIT()};
const _drawUIT=drawUI;drawUI=function(){if(state=='tchamp')drawTChamp();else if(state=='lobby'&&NET.lobby&&NET.lobby.tour)drawTourLobby();else _drawUIT()};
// --- lobby: team picking (private 2v2), tournament size
const _updLobT=updLobby;updLobby=function(){const L=NET.lobby;
 if(L&&L.tour){if(mBack()){SFX.back();netLeave();return}if(L.T)return;if(mL())lobbySkin(-1);if(mR())lobbySkin(1);
  if(L.host){if(KP.KeyZ||anyPad(i=>padEdge(i,'BK'))){netSend({t:'rules',tsize:L.tsize==8?4:8});SFX.sel()}
   if(KP.KeyQ||anyPad(i=>padEdge(i,'LB'))){netSend({t:'arena',arena:(L.arena+ARENAS.length-1)%ARENAS.length});SFX.sel()}if(KP.KeyE||anyPad(i=>padEdge(i,'RB'))){netSend({t:'arena',arena:(L.arena+1)%ARENAS.length});SFX.sel()}
   if(KP.KeyI||anyPad(i=>padRep(i,'dn'))){netSend({t:'rules',items:((L.items|0)+1)%4});SFX.sel()}
   if(KP.KeyC||anyPad(i=>padEdge(i,'Y'))){netSend({t:'addcpu'});SFX.sel()}if(KP.Backspace||anyPad(i=>padEdge(i,'X'))){netSend({t:'delcpu'});SFX.sel()}
   if(mStart()||anyPad(i=>padEdge(i,'A'))){netSend({t:'start'});SFX.ok()}}return}
 if(L&&!L.quick&&L.mode=='teams'&&(KP.KeyT||anyPad(i=>padEdge(i,'RS')||padEdge(i,'LS')))){netSend({t:'team'});SFX.sel()}_updLobT()};
const _drawLobT=drawLobby;drawLobby=function(){_drawLobT();const L=NET.lobby;if(!L||L.mode!='teams')return;
 for(let i=0;i<4;i++){const s=L.slots[i];if(!s)continue;const tm=s.team!=null?s.team:i%2,x=8+i*118;ctx.fillStyle=TEAMC[tm];ctx.fillRect(x+1,63,108,5);text('TEAM '+TEAMN[tm],x+55,174,TEAMC[tm],8,'center')}
 if(L.q2)text('2V2 QUICK MATCH'+(L.ranked?' - RANKED':'')+' - BOTS FILL ON EASY',W/2,58,'#d8dde6',8,'center');else if(!L.quick)text('T: SWITCH TEAM (2 PER TEAM)',W/2,58,'#d8dde6',8,'center')};
// --- shared bracket drawing: T={size,rd}, ent=[{name,skin}]
function drawBracket(T,ent,x0,y0,w,h,cur){const R=T.rd.length,cw=w/R;
 for(let r=0;r<R;r++){const M=T.rd[r],gh=h/M.length;text(PB2.bracketRound(T,r),x0+r*cw+cw/2,y0-4,'#d8dde6',8,'center');
  const cmp=gh<28,bh=cmp?Math.max(12,Math.min(16,Math.floor(gh)-2)):26;M.forEach((m,k)=>{const y=Math.round(y0+k*gh+gh/2-bh/2),x=x0+r*cw+4,bw=cw-10,live=cur&&cur.r==r&&cur.m==k;panel(x,y,bw,bh,live?'#5d4a6e':'#2b2b40');
   if(cmp){const nm=e=>e==null?'-':String((ent[e]||{name:'?'}).name),cl=e=>e==null?'#8b93a6':m.w===e?PAL.Y:m.w!=null?'#5d6377':'#ffffff',mx=Math.floor((bw-16)/10);text(nm(m.a).slice(0,mx),x+4,y+bh/2+3,cl(m.a),8);text('V',x+bw/2,y+bh/2+3,'#8b93a6',8,'center');text(nm(m.b).slice(0,mx),x+bw-4,y+bh/2+3,cl(m.b),8,'right');if(r<R-1){ctx.fillStyle='#8b93a6';ctx.fillRect(x+bw,y+Math.floor(bh/2),10,1)}return}
   [m.a,m.b].forEach((e,j)=>{const yy=y+10+j*12;if(e==null){text('-',x+6,yy,'#8b93a6',8);return}const E=ent[e]||{name:'?'};const won=m.w===e,lost=m.w!=null&&m.w!==e;
    text(String(E.name).slice(0,Math.floor(bw/5)-2),x+6,yy,won?PAL.Y:lost?'#5d6377':'#ffffff',8);if(won)text('>',x+bw-8,yy,PAL.Y,8)});
   if(r<R-1){ctx.fillStyle='#8b93a6';ctx.fillRect(x+bw,y+13,10,1)}})}}
function drawTourLobby(){const L=NET.lobby;text('TOURNAMENT',W/2,24,PAL.Y,32,'center');acctBadge(W-4,4,'right');
 if(L.T&&L.ent){panel(W/2-60,30,120,16);text('CODE: '+L.code,W/2,42,'#ffffff',8,'center');drawBracket(L.T,L.ent,8,64,W-16,140,PB2.bracketNext(L.T));
  text(L.tstate=='fight'?'MATCH IN PROGRESS - SPECTATING':'NEXT MATCH STARTING...',W/2,222,PAL.Y,8,'center');bar([[['B'],'LEAVE']],[[['ESC'],'LEAVE']],242);return}
 panel(W/2-60,30,120,22);text('CODE: '+L.code,W/2,46,'#ffffff',16,'center');
 for(let i=0;i<8;i++){const s=L.slots[i],x=8+(i%4)*118,y=58+(i>>2)*60;panel(x,y,110,54,i==L.you?'#5d4a6e':'#2b2b40');
  if(!s){text(i<L.tsize?'OPEN (CPU FILL)':'-',x+55,y+30,'#8b93a6',8,'center');continue}
  drawSheet(imgs[s.skin],x+4,y+12,1,2,Math.floor(t/7)%4,1);text(s.name.slice(0,12),x+30,y+20,nameCol(s.cos,'#ffffff'),8);text(s.type=='cpu'?'CPU':i==L.you?'YOU':s.host?'HOST':'PLAYER',x+30,y+34,'#d8dde6',8)}
 const A=ARENAS[L.arena];panel(8,182,W-16,48);text(L.tsize+' ENTRANTS  -  ARENA '+(L.host?'\u2190 '+A.name+' \u2192':A.name)+'  -  ITEMS '+PB2.ITEM_NAMES[L.items|0],W/2,196,'#ffffff',8,'center');
 text('SINGLE ELIMINATION 1V1 - WINNER GETS '+(L.tsize==8?200:100)+' COINS + A TROPHY',W/2,209,'#d8dde6',8,'center');
 text(L.host?'START WHEN READY - EMPTY SEATS BECOME CPUS':'WAITING FOR HOST TO START',W/2,222,L.host?PAL.Y:'#d8dde6',8,'center');
 if(!L.host)bar([[['DP'],'SKIN'],[['B'],'LEAVE']],[[['\u2190','\u2192'],'SKIN'],[['ESC'],'LEAVE']],242);else bar([[['BK'],'SIZE'],[['LB','RB'],'ARENA'],[['DN'],'ITEMS'],[['Y','X'],'CPU'],[['A'],'START']],[[['Z'],'SIZE 4/8'],[['Q','E'],'ARENA'],[['I'],'ITEMS'],[['C','BKSP'],'CPU'],[['ENTER'],'START']],242)}
function drawTChamp(){const C=TN.champ;if(!C)return;text('CHAMPION!',W/2,34,PAL.Y,32,'center');drawTrophy(W/2-8,42,2);
 drawSheet(imgs[C.skin],W/2-16,72,1,0,Math.floor(t/8)%2,2);text(C.name,W/2,124,'#ffffff',16,'center');
 if(C.you)text('YOU WON THE '+C.size+'-PLAYER TOURNAMENT!  +'+C.coins+' COINS  +1 TROPHY',W/2,138,PAL.Y,8,'center');
 drawBracket(C.T,C.ent,20,160,W-40,74,null);bar([[['A'],'LOBBY'],[['B'],'LEAVE']],[[['ENTER'],'LOBBY'],[['ESC'],'LEAVE']],242)}
function drawTrophy(x,y,s){s=s||1;ctx.fillStyle=PAL.o;ctx.fillRect(x-s,y-s,(8+2)*s,(12+2)*s);ctx.fillStyle='#fee761';ctx.fillRect(x,y,8*s,5*s);ctx.fillRect(x+2*s,y+5*s,4*s,3*s);ctx.fillRect(x+3*s,y+8*s,2*s,2*s);ctx.fillRect(x+1*s,y+10*s,6*s,2*s);ctx.fillStyle='#f99252';ctx.fillRect(x+5*s,y+1*s,1*s,3*s)}
// trophies on the account badge (profile)
const _acctBadgeT=acctBadge;acctBadge=function(x,y,al){_acctBadgeT(x,y,al);const n=ACC.user&&ACC.user.trophies|0;if(!n)return;const s=ACC.user.username+'  ',w=s.length*4+String(ACC.user.coins).length*4+20,x0=(al=='right'?x-w:x)+w+2;
 panel(x0,y,22+String(n).length*4,13);drawTrophy(x0+3,y+1,.8);text(String(n),x0+13,y+10,'#fee761',8)};
// team markers over fighters + spectator banner
const _drawBuffsT=drawBuffs;drawBuffs=function(){_drawBuffsT();if(!CORE.opts||!CORE.opts.teams)return;for(const f of F){if(!f||f.out)continue;ctx.fillStyle=TEAMC[f.team&1];ctx.fillRect(Math.round(f.x+2),Math.round(f.y-9),6,2);ctx.fillRect(Math.round(f.x+4),Math.round(f.y-7),2,2)}};
const _drawHUDT=drawHUD;drawHUD=function(){_drawHUDT();if(state=='ofight'&&NET.tour){const c=NET.tour.cur,T=NET.tour.T;if(c&&T)safe(()=>text('TOURNAMENT '+PB2.bracketRound(T,c.r)+(NET.spec?'  -  SPECTATING':''),W/2,30,PAL.Y,8,'center'))}
 if(state=='fight'&&LT.on&&LT.cur)safe(()=>text('TOURNAMENT '+PB2.bracketRound(LT.T,LT.cur.r),W/2,30,PAL.Y,8,'center'))};
// ===== Local tournament =====
const LT={on:false,size:4,hum:1,T:null,ent:null,cur:null,orig:null,sel:0,ticket:null,res:null,champ:null};
UIS.add('ltsetup');UIS.add('ltbracket');UIS.add('ltchamp');
function goLT(){LT.sel=0;state='ltsetup'}
function ltBegin(){LT.orig=slots.map(s=>Object.assign({},s));const hs=[];LT.orig.forEach((s,i)=>{if(s.type=='human')hs.push(i)});if(!hs.length)hs.push(0);
 LT.ent=[];for(let k=0;k<Math.min(LT.hum,LT.size);k++){const p=hs[k]!=null?hs[k]:k;LT.ent.push({name:'P'+(p+1),skin:LT.orig[p].skin,human:true,p})}
 const used=LT.ent.map(e=>e.skin);let c=0;while(LT.ent.length<LT.size){let sk;do{sk=Math.floor(Math.random()*NS)}while(used.includes(sk)&&used.length<NS);used.push(sk);LT.ent.push({name:['BOLT','ZIGGY','MOCHI','RUSTY','PIXIE','TANK','NOVA'][c++%7],skin:sk,human:false})}
 // shuffle seeding
 for(let i=LT.ent.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[LT.ent[i],LT.ent[j]]=[LT.ent[j],LT.ent[i]]}
 LT.T=PB2.bracketNew(LT.size);LT.on=true;LT.cur=null;LT.res=null;LT.ticket=null;LT.champ=null;ltSimCPU();state='ltbracket';
 if(ONLINE&&ACC.user)api('local/start',{}).then(j=>LT.ticket=j.ticket).catch(()=>{})}
function ltSimCPU(){let n;while((n=PB2.bracketNext(LT.T))&&!LT.ent[n.a].human&&!LT.ent[n.b].human)PB2.bracketReport(LT.T,n.r,n.m,Math.random()<.5?n.a:n.b)}
function ltPlay(){const n=PB2.bracketNext(LT.T);if(!n)return ltFinish();LT.cur=n;const A=LT.ent[n.a],B=LT.ent[n.b];const pos=[null,null,null,null];
 [A,B].forEach(e=>{if(e.human)pos[e.p]=e});[A,B].forEach(e=>{if(!e.human){const i=pos.findIndex(x=>!x);pos[i]=e}});
 pos.forEach((e,i)=>{slots[i]=Object.assign({},LT.orig[i],{type:e?(e.human?'human':'cpu'):'none',skin:e?e.skin:LT.orig[i].skin})});LT.pos=pos;
 arena=Math.floor(Math.random()*ARENAS.length);const pm=SET.mode;if(pm=='teams')SET.mode='stock';startFight();SET.mode=pm;SFX.go()}
function ltFinish(){const ci=PB2.bracketChamp(LT.T),C=LT.ent[ci];LT.champ=C;state='ltchamp';LT.res=null;slots.forEach((s,i)=>Object.assign(s,LT.orig[i]));
 if(ONLINE&&ACC.user&&LT.ticket){api('local/tourney',{ticket:LT.ticket,size:LT.size,won:!!C.human}).then(j=>{LT.res=j;if(j.user)setUser(j.user);if(j.coins)SFX.coin()}).catch(()=>{})}LT.ticket=null}
function ltQuit(){if(LT.orig)slots.forEach((s,i)=>Object.assign(s,LT.orig[i]));LT.on=false;state='menu'}
const _updT=update;update=function(){
 // left a tournament some other way (pause > QUIT TO MENU): restore the player's slots and drop tournament mode
 if(LT.on&&state=='menu'){ltQuit()}
 if(LT.on&&state=='win'&&!LT.cur)LT.on=false;
  if(LT.on&&state=='win'){t++;pollPads();if(_prevState!='win')localClaim();_prevState='win';try{ltWin()}finally{endPads()}return}// own win input: the base win handler would rematch on a controller press
 if(state=='ltsetup'||state=='ltbracket'||state=='ltchamp'){t++;pollPads();try{updLT()}finally{endPads()}return}// these screens bypass the base update(), so do its per-frame pad work here: without pollPads/endPads controller input froze
 _updT()};
function ltWin(){if(!(mOK()||mStart()||mBack()))return;
const w=winner,n=LT.cur;let e=w&&LT.pos[w.i];if(!e){const live=F.filter(f=>f&&!f.out).sort((a,b)=>b.stocks-a.stocks||a.dmg-b.dmg);e=live.length?LT.pos[live[0].i]:LT.ent[n.a]}
  PB2.bracketReport(LT.T,n.r,n.m,LT.ent.indexOf(e));LT.cur=null;ltSimCPU();SFX.ok();if(PB2.bracketNext(LT.T))state='ltbracket';else ltFinish();return}
function updLT(){
 if(state=='ltsetup'){LT.sel=listNav(3,LT.sel);if(mBack()){SFX.back();state='menu';return}
  if(mL()||mR()){const d=mL()?-1:1;if(LT.sel==0)LT.size=LT.size==4?8:4;if(LT.sel==1)LT.hum=Math.max(1,Math.min(4,LT.hum+d));SFX.sel()}
  if(mOK()||mStart()){SFX.ok();if(LT.sel==2)ltBegin();else if(LT.sel==1)LT.hum=LT.hum%4+1;else LT.size=LT.size==4?8:4}return}
 if(state=='ltbracket'){if(mBack()){SFX.back();ltQuit();return}if(mOK()||mStart())ltPlay();return}
 if(state=='ltchamp'){if(mOK()||mStart()||mBack()){SFX.ok();LT.on=false;state='menu'}return}}
const _drawUIL=drawUI;drawUI=function(){if(state=='ltsetup')drawLTSetup();else if(state=='ltbracket')drawLTBracket();else if(state=='ltchamp')drawLTChamp();else _drawUIL()};
function drawLTSetup(){text('TOURNAMENT',W/2,40,PAL.Y,32,'center');panel(W/2-120,60,240,90);
 const it=['ENTRANTS: \u2190 '+LT.size+' \u2192','HUMAN PLAYERS: \u2190 '+LT.hum+' \u2192','START BRACKET'];drawList(it,LT.sel,W/2,82,226,20);
 text('HUMANS USE THE CONTROLS/SKINS FROM CHARACTER SELECT (P1-P4)',W/2,166,'#d8dde6',8,'center');text('REST ARE CPUS - SINGLE ELIMINATION 1V1 - RULES FROM SETTINGS',W/2,178,'#d8dde6',8,'center');
 if(ONLINE)text(ACC.user?'CHAMPION EARNS UP TO '+(LT.size==8?80:40)+' COINS (LOCAL DAILY CAP)':'LOG IN TO EARN COINS',W/2,194,'#fee761',8,'center');
 bar([[['A'],'OK'],[['B'],'BACK']],[[['ENTER'],'OK'],[['ESC'],'BACK']],242)}
function drawLTBracket(){text('TOURNAMENT BRACKET',W/2,24,PAL.Y,24,'center');const n=PB2.bracketNext(LT.T);drawBracket(LT.T,LT.ent,8,52,W-16,150,n);
 if(n)text('NEXT: '+LT.ent[n.a].name+' VS '+LT.ent[n.b].name,W/2,220,'#ffffff',16,'center');bar([[['A'],'FIGHT'],[['B'],'QUIT']],[[['ENTER'],'FIGHT'],[['ESC'],'QUIT']],242)}
function drawLTChamp(){const C=LT.champ;if(!C)return;text('CHAMPION!',W/2,34,PAL.Y,32,'center');drawTrophy(W/2-8,42,2);drawSheet(imgs[C.skin],W/2-16,72,1,0,Math.floor(t/8)%2,2);
 text(C.name,W/2,124,'#ffffff',16,'center');if(LT.res)text(LT.res.coins?'+'+LT.res.coins+' COINS'+(LT.res.capped?' (DAILY CAP)':''):C.human?(LT.res.why?'TOO SHORT FOR COINS':'DAILY CAP REACHED'):'CPU WINS - NO COINS',W/2,138,PAL.Y,8,'center');
 drawBracket(LT.T,LT.ent,20,160,W-40,74,null);bar([[['A'],'MENU']],[[['ENTER'],'MENU']],242)}
