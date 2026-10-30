// ===== Feature pack: ranked / leaderboard =====
const TIERS=PDBCore.TIERS;
const tierCol=n=>(TIERS.find(t=>t[0]==n)||TIERS[0])[2];
function tierBadge(n,x,y,al='center'){if(!n)return;text(n,x,y,tierCol(n),8,al)}
UIS.add('leader');ONL_ITEMS.splice(ONL_ITEMS.indexOf('SHOP'),0,'LEADERBOARD');
const LBD={data:null,err:null,scroll:0};
function goLeader(){LBD.data=null;LBD.err=null;LBD.scroll=0;state='leader';api('leaderboard').then(j=>LBD.data=j).catch(e=>LBD.err='COULD NOT LOAD')}
const _updOnl=updOnlineMenu;updOnlineMenu=function(){if(ONL_ITEMS[onlSel]=='LEADERBOARD'&&mOK()){SFX.ok();goLeader();return}_updOnl()};
function updLeader(){if(mBack()||mOK()){SFX.back();state='online';return}const n=LBD.data?LBD.data.top.length:0;
 if(mU()&&LBD.scroll>0){LBD.scroll--;SFX.sel()}if(mD()&&LBD.scroll<Math.max(0,n-9)){LBD.scroll++;SFX.sel()}}
function drawLeader(){text('LEADERBOARD',W/2,28,PAL.Y,32,'center');panel(60,36,360,188);
 if(!LBD.data){text(LBD.err||'LOADING...',W/2,130,'#ffffff',16,'center')}else{const D=LBD.data;
  text('#',76,52,'#8b93a6',8,'center');text('PLAYER',90,52,'#8b93a6',8);text('TIER',290,52,'#8b93a6',8,'center');text('RATING',350,52,'#8b93a6',8,'center');text('WINS',396,52,'#8b93a6',8,'center');
  if(!D.top.length)text('NO RANKED MATCHES YET - PLAY QUICK MATCH!',W/2,120,'#d8dde6',8,'center');
  D.top.slice(LBD.scroll,LBD.scroll+9).forEach((r,k)=>{const y=58+k*16,me=ACC.user&&r.username==ACC.user.username;if(me){ctx.fillStyle='#5d4a6e';ctx.fillRect(66,y,348,15)}
   text(String(r.pos),76,y+12,r.pos<=3?PAL.Y:'#ffffff',8,'center');text(r.username.slice(0,16),90,y+12,'#ffffff',16);tierBadge(r.tier,290,y+11);text(String(r.rating),350,y+12,'#ffffff',16,'center');text(String(r.wins),396,y+12,'#d8dde6',8,'center')});
  if(D.top.length>9)text((LBD.scroll+1)+'-'+Math.min(D.top.length,LBD.scroll+9)+' OF '+D.top.length,404,218,'#8b93a6',8,'right');
  const m=D.me;text(m?('YOU: '+(m.pos?'#'+m.pos+'  ':'UNRANKED  ')+m.tier+'  '+m.rating):(ACC.user&&ACC.user.guest?'GUEST ACCOUNTS ARE NOT RANKED':''),W/2,212,m?tierCol(m.tier):'#8b93a6',8,'center')}
 text('QUICK MATCHES ARE RANKED',W/2,236,'#8b93a6',8,'center');bar([[['DP'],'SCROLL'],[['B'],'BACK']],[[['\u2191','\u2193'],'SCROLL'],[['ESC'],'BACK']])}
const _drawUIx=drawUI;drawUI=function(){if(state=='leader')drawLeader();else _drawUIx()};
const _updUIx=updUI;updUI=function(){if(state=='leader')updLeader();else _updUIx()};
const _drawLobbyx=drawLobby;drawLobby=function(){_drawLobbyx();const L=NET.lobby;if(!L)return;
 for(let i=0;i<4;i++){const s=L.slots[i];if(s&&s.tier)tierBadge(s.tier+' '+s.rating,8+i*118+55,62+92)}
 if(L.ranked&&!L.q2)text('RANKED',W/2,58,'#8fb8ff',8,'center')};
const _drawResx=drawResults;drawResults=function(){_drawResx();const R=NET.res;if(!R)return;const me=R.rank.find(r=>r.i==NET.you);
 if(me&&me.rank){const k=me.rank;if(ACC.user){ACC.user.rating=k.rating;ACC.user.tier=k.tier}text('RATING '+k.old+' \u2192 '+k.rating+' ('+(k.delta>=0?'+':'')+k.delta+')  '+k.tier,W/2,178,k.delta>=0?'#7fe07f':'#ff7f7f',8,'center')}
 const RH=resRH(R);R.rank.forEach((r,k)=>{if(r.rank){const y=70+k*RH;text((r.rank.delta>=0?'+':'')+r.rank.delta,120+Math.min(14,r.name.length)*8+6,y+(RH<30?15:17),r.rank.delta>=0?'#7fe07f':'#ff7f7f',8)}})};
// ===== Daily challenges =====
UIS.add('chal');ONL_ITEMS.splice(ONL_ITEMS.indexOf('SHOP'),0,'CHALLENGES');
const CHS={data:null,err:null,back:'menu',at:0};
function goChal(){CHS.back=state;if(!ACC.user){openLogin('menu');toast('LOG IN FOR DAILY CHALLENGES');return}CHS.data=null;CHS.err=null;state='chal';
 api('challenges').then(j=>{CHS.data=j;CHS.at=Date.now()}).catch(()=>CHS.err='COULD NOT LOAD')}
function chalToast(list){if(!list||!list.length)return;list.forEach((c,k)=>setTimeout(()=>{toast('CHALLENGE DONE: '+c.txt+' +'+c.reward);SFX.coin()},1200+k*1600))}
const _updOnl2=updOnlineMenu;updOnlineMenu=function(){if(ONL_ITEMS[onlSel]=='CHALLENGES'&&mOK()){SFX.ok();goChal();return}_updOnl2()};
function updChal(){if(mBack()||mOK()){SFX.back();state=CHS.back=='online'?'online':'menu'}}
function drawChal(){text('DAILY CHALLENGES',W/2,30,PAL.Y,32,'center');acctBadge(W-4,4,'right');panel(70,42,340,164);
 if(!CHS.data){text(CHS.err||'LOADING...',W/2,128,'#ffffff',16,'center')}else{
  CHS.data.list.forEach((c,k)=>{const y=52+k*46;panel(80,y,320,40,c.done?'#2f4a3a':'#3b3f52');text(c.txt,90,y+16,c.done?'#a1e55a':'#ffffff',16);
   ctx.fillStyle='#1a1c2c';ctx.fillRect(90,y+24,200,8);ctx.fillStyle=c.done?'#a1e55a':PAL.Y;ctx.fillRect(90,y+24,Math.round(200*c.prog/c.n),8);
   text(c.prog+'/'+c.n,296,y+32,'#d8dde6',8);if(c.done)text('DONE!',390,y+32,'#a1e55a',16,'right');else{coinIcon(352,y+25);text('+'+c.reward,362,y+32,'#fee761',8)}});
  const s=Math.max(0,CHS.data.resetIn-Math.floor((Date.now()-CHS.at)/1000)),h=Math.floor(s/3600),m=Math.floor(s/60)%60;
  text('NEW CHALLENGES IN '+h+'H '+m+'M',W/2,200,'#8b93a6',8,'center')}
 text('PROGRESS COUNTS IN ONLINE MATCHES AND LOCAL MATCHES WHILE LOGGED IN',W/2,222,'#d8dde6',8,'center');bar([[['B'],'BACK']],[[['ESC'],'BACK']])}
const _drawUIy=drawUI;drawUI=function(){if(state=='chal')drawChal();else _drawUIy()};
const _updUIy=updUI;updUI=function(){if(state=='chal')updChal();else _updUIy()};
// ===== Items (sim lives in shared core; this only draws them) =====
const ITEM_ART={bomb:['..oo..','.o##o.','o####o','o##.#o','o####o','.oooo.'],speed:['..yy..','.yyy..','yyyyyy','..yyy.','..yy..','.y....'],
 shield:['.cccc.','cwwwwc','cwccwc','cwccwc','.cwwc.','..cc..'],heal:['..gg..','..gg..','gggggg','gggggg','..gg..','..gg..'],hammer:['oooooo','o####o','oooooo','..ww..','..ww..','..ww..']};
const ITEM_PAL={o:'#3b2c2e','#':'#5a5a6e',y:'#fee761',c:'#7fe0d0',w:'#ffffff',g:'#a1e55a','.':null};
function itemSprite(k){return cacheCanvas('item_'+k,8,8,()=>{ITEM_ART[k].forEach((row,y)=>[...row].forEach((ch,x)=>{const c=ITEM_PAL[ch];if(c){ctx.fillStyle=c;ctx.fillRect(x+1,y+1,1,1)}}))})}
function drawItems(){for(const it of CORE.items){if(it.life<120&&Math.floor(t/4)%2)continue;const k=PDBCore.ITEM_KINDS[it.k],bob=Math.round(Math.sin(t/12+it.x)*1);
  const ix=Math.round(it.x)-3,iy=Math.round(it.y)-5+bob;ctx.fillStyle=PAL.o;ctx.fillRect(ix-1,iy-1,18,18);ctx.fillStyle=t%40<20?'#fee761':'#ffffff';ctx.fillRect(ix,iy,16,16);ctx.fillStyle='#262b44';ctx.fillRect(ix+1,iy+1,14,14);ctx.drawImage(itemSprite(k),ix,iy,16,16)}
 for(const p of CORE.projs){if(p.orb){const ox=Math.round(p.x),oy=Math.round(p.y),c=PCOL[p.o]||'#ffffff';ctx.fillStyle=PAL.o;ctx.fillRect(ox-4,oy-3,8,6);ctx.fillRect(ox-3,oy-4,6,8);ctx.fillStyle=c;ctx.fillRect(ox-3,oy-2,6,4);ctx.fillRect(ox-2,oy-3,4,6);ctx.fillStyle='#ffffff';ctx.fillRect(ox-1,oy-1,2,2);if(t%3==0&&parts.length<PMAX)parts.push({x:p.x,y:p.y+(Math.random()*4-2),vx:0,vy:0,l:8,c});continue}ctx.drawImage(itemSprite('bomb'),Math.round(p.x)-4,Math.round(p.y)-4,8,8);if(t%4<2){ctx.fillStyle='#fee761';ctx.fillRect(Math.round(p.x)+1,Math.round(p.y)-5,1,1)}}}
function drawBuffs(){for(const f of F){if(f.out||f.respawn>0||!f.buf)continue;const B=f.buf,x=Math.round(f.x),y=Math.round(f.y);
  if(B.sh){ctx.globalAlpha=.35+.15*Math.sin(t/5);ctx.fillStyle='#7fe0d0';ctx.fillRect(x-3,y-3,16,26);ctx.globalAlpha=1;ctx.fillStyle='#7fe0d0';ctx.fillRect(x-3,y-3,16,1);ctx.fillRect(x-3,y+22,16,1);ctx.fillRect(x-3,y-3,1,26);ctx.fillRect(x+12,y-3,1,26)}
  if(B.spd&&t%3==0)parts.length<PMAX&&parts.push({x:f.x+5-f.face*5,y:f.y+16,vx:-f.face*.5,vy:0,l:10,c:'#fee761'});
  if(B.ham){const hx=f.face>0?x+9:x-7;ctx.fillStyle=PAL.o;ctx.fillRect(hx,y+2,8,6);ctx.fillStyle='#8b93a6';ctx.fillRect(hx+1,y+3,6,4);ctx.fillStyle='#c77b3f';ctx.fillRect(hx+3,y+8,2,6)}
  if(B.bomb)ctx.drawImage(itemSprite('bomb'),x+1,y-20,8,8)}}
// ===== Game modes (rules live in shared core) =====
const MODE={get id(){return SET.mode||'stock'}};const TEAMC=['#e04848','#4d9be6'];
function modeOf(id){return PDBCore.MODES.find(m=>m.id==id)||PDBCore.MODES[0]}
function rulesLine(mode,items,ff){const m=modeOf(mode);return 'MODE: '+m.n+'  -  ITEMS: '+PDBCore.ITEM_NAMES[items|0]+(m.id=='teams'?'  -  FRIENDLY FIRE: '+(ff?'ON':'OFF'):'')}
function modeKeys(){const n=PDBCore.MODES.length,i=PDBCore.MODES.findIndex(m=>m.id==MODE.id);let d=0;
 if(KP.ArrowUp||KP.KeyW||anyPad(k=>padEdge(k,'LB')))d=-1;if(KP.ArrowDown||KP.KeyS||anyPad(k=>padEdge(k,'RB')))d=1;
 if(d){SET.mode=PDBCore.MODES[(i+d+n)%n].id;saveSet();SFX.sel()}if(MODE.id=='teams'&&(KP.KeyF||anyPad(k=>padEdge(k,'Y')))){SET.ff=!SET.ff;saveSet();SFX.sel()}}
function drawModePick(){const m=modeOf(MODE.id);panel(W/2-150,180,300,38);text('\u2191 '+m.n+' \u2193',W/2,196,PAL.Y,16,'center');
 text(m.d+(m.id=='teams'?'  -  FRIENDLY FIRE '+(SET.ff?'ON':'OFF'):'')+'  -  ITEMS '+PDBCore.ITEM_NAMES[SET.items|0],W/2,210,'#d8dde6',8,'center')}
function hudPts(f,x,y){const md=CORE.opts&&CORE.opts.mode;if(md=='teams'){ctx.fillStyle=TEAMC[f.team&1];ctx.fillRect(x+1,y+1,110,2)}
 if(md!='time'&&md!='koth'&&md!='coin')return false;let s;if(md=='koth')s=Math.floor((f.pts|0)/60)+'/'+(PDBCore.MODES&&CORE.KOTH_GOAL/60)+'S';else if(md=='coin')s=(f.pts|0)+'/'+CORE.COIN_GOAL;else s=((f.pts|0)>0?'+':'')+(f.pts|0)+' PTS';
 if(md=='coin')coinIcon(x+24,y+21);text(s,x+(md=='coin'?34:24),y+28,'#fee761',8);return true}
function drawModeWorld(){const md=CORE.opts&&CORE.opts.mode,Hh=CORE.hill;
 if(md=='koth'&&Hh){const who=Hh.who,c=who>=0?PCOL[who]:who==-2?'#ffffff':'#fee761';ctx.globalAlpha=.18+.06*Math.sin(t/8);ctx.fillStyle=c;ctx.fillRect(Hh.x,Hh.y,Hh.w,Hh.h);ctx.globalAlpha=1;ctx.fillStyle=c;
  for(let x=Hh.x;x<Hh.x+Hh.w;x+=4){ctx.fillRect(x,Hh.y+Hh.h-2,2,2);if((x+t>>2)%3==0)ctx.fillRect(x,Hh.y+Hh.h-6-((t+x)%20),1,1)}ctx.fillRect(Hh.x,Hh.y,1,Hh.h);ctx.fillRect(Hh.x+Hh.w-1,Hh.y,1,Hh.h);
  ctx.fillStyle=PAL.o;ctx.fillRect(Hh.x+Hh.w/2-1,Hh.y-10,2,12);ctx.fillStyle=c;ctx.fillRect(Hh.x+Hh.w/2+1,Hh.y-10,8,5)}
 if(md=='coin')for(const c of CORE.coins){const x=Math.round(c.x),y=Math.round(c.y),w=[6,4,2,4][Math.floor(t/6)%4];ctx.fillStyle=PAL.o;ctx.fillRect(x+4-w/2-1,y-1,w+2,10);ctx.fillStyle='#fee761';ctx.fillRect(x+4-w/2,y,w,8);ctx.fillStyle='#ffffff';ctx.fillRect(x+4-w/2,y+1,1,3)}
 if(md=='teams')for(const f of F){if(f.out||f.respawn>0)continue;ctx.fillStyle=TEAMC[f.team&1];ctx.fillRect(Math.round(f.x)-1,Math.round(f.y)+21,12,2)}}
const _drawItems0=drawItems;drawItems=function(){drawModeWorld();_drawItems0()};

// ===== Special moves (drawing + HUD pip) =====
function drawSpecials(){for(const f of F){if(f.out||f.respawn>0||!(f.spT>0))continue;const x=Math.round(f.x),y=Math.round(f.y),c=PCOL[f.i];
 if(f.spK=='u'){ctx.fillStyle='#fee761';for(let k=0;k<3;k++)ctx.fillRect(x-2+k*6,y-6-((t+k*2)%4),2,4);ctx.fillStyle=c;ctx.fillRect(x-3,y-8,16,2)}
 else if(f.spK=='s'){ctx.fillStyle=c;for(let k=0;k<3;k++)ctx.fillRect(f.face>0?x-6-k*5:x+12+k*5-3,y+4+k*5,4,2);ctx.fillStyle='#ffffff';ctx.fillRect(f.face>0?x+10:x-2,y+3,2,14)}
 else if(f.spK=='d'){ctx.fillStyle='#fee761';ctx.fillRect(x+1,y-6,2,5);ctx.fillRect(x+7,y-8,2,6);ctx.fillStyle=c;ctx.fillRect(x-1,y+20,12,2)}
 else if(f.spK=='w'){const r=(9-f.spT)*3+6,gy=y+19;ctx.fillStyle='#fee761';ctx.fillRect(x+5-r,gy,4,2);ctx.fillRect(x+1+r,gy,4,2);ctx.fillStyle='#ffffff';ctx.fillRect(x+5-r+1,gy-2,2,2);ctx.fillRect(x+2+r,gy-2,2,2)}
 else if(f.spK=='n'){ctx.fillStyle='#ffffff';ctx.fillRect(f.face>0?x+11:x-3,y+7,2,4)}}}
const _drawBuffsS=drawBuffs;drawBuffs=function(){_drawBuffsS();drawSpecials()};
const _hudPtsS=hudPts;hudPts=function(f,x,y){const r=_hudPtsS(f,x,y);if(!f.out){const ok=!(f.spCd>0);ctx.fillStyle=PAL.o;ctx.fillRect(x+101,y+21,9,9);ctx.fillStyle=ok?'#fee761':'#5d4a6e';ctx.fillRect(x+102,y+22,7,7);if(!ok){ctx.fillStyle='#8b93a6';const h=Math.round(7*(1-Math.min(1,f.spCd/80)));ctx.fillRect(x+102,y+29-h,7,h)}else{ctx.fillStyle='#ffffff';ctx.fillRect(x+103,y+23,2,2)}}return r};
const TEAMN=['RED','BLUE'];
// ===== Friends, invites, invite links =====
UIS.add('friends');ONL_ITEMS.splice(ONL_ITEMS.indexOf('SHOP'),0,'FRIENDS');
const FR={data:null,err:null,sel:0,name:'',msg:'',back:'online',confirm:-1,seenInv:new Set(),seenReq:new Set(),pendInv:null,busy:false};
function frRefresh(){if(!ONLINE||!ACC.user||ACC.user.guest)return Promise.resolve();return api('friends').then(j=>{FR.data=j;FR.err=null;
 for(const i of j.invites){const k=i.from+i.code+i.at;if(!FR.seenInv.has(k)){FR.seenInv.add(k);if(state!='ofight'&&state!='fight'){toast(i.from+' INVITED YOU! SEE FRIENDS');SFX.coin()}}}
 for(const n of j.incoming)if(!FR.seenReq.has(n)){FR.seenReq.add(n);toast('FRIEND REQUEST FROM '+n)}}).catch(e=>{FR.err='COULD NOT LOAD'})}
if(ONLINE)setInterval(()=>{if(ACC.user&&!ACC.user.guest&&state!='fight'&&state!='ofight'&&!document.hidden)frRefresh()},6000);
function frRows(){const D=FR.data||{friends:[],incoming:[],outgoing:[],invites:[]};const R=[{k:'add'}];
 D.invites.forEach(i=>R.push({k:'inv',n:i.from,code:i.code}));D.incoming.forEach(n=>R.push({k:'req',n}));D.friends.forEach(f=>R.push(Object.assign({k:'fr'},f,{n:f.name})));D.outgoing.forEach(n=>R.push({k:'out',n}));return R}
function goFriends(back){if(!ACC.user){openLogin('online');toast('LOG IN TO USE FRIENDS');return}if(ACC.user.guest){toast('GUESTS CANNOT ADD FRIENDS - REGISTER!');SFX.err();return}
 FR.back=back||'online';FR.sel=0;FR.msg='';FR.confirm=-1;state='friends';frRefresh()}
function frDo(path,name,after){if(FR.busy)return;FR.busy=true;api('friends/'+path,{name}).then(j=>{FR.busy=false;FR.msg=j.msg||'OK';SFX.ok();if(after)after();return frRefresh()}).catch(e=>{FR.busy=false;FR.msg=e.message;SFX.err()})}
function inviteLink(code){return location.origin+location.pathname+'?join='+code}
function frInvite(n){{FR.pendInv=n;FR.back='lobby';NET.lobby=null;state='lobby';netOpen({t:'create'});toast('CREATING ROOM FOR '+n+'...')}}
const _typeKeyF=typeKey;typeKey=function(ch){if(state=='friends'&&FR.sel==0){if(ch=='\b')FR.name=FR.name.slice(0,-1);else if(FR.name.length<12&&/[A-Za-z0-9_]/.test(ch))FR.name+=ch.toUpperCase();return true}return _typeKeyF(ch)};
function updFriends(){const R=frRows();if(FR.sel>=R.length)FR.sel=R.length-1;const os=FR.sel;FR.sel=listNav(R.length,FR.sel);if(os!=FR.sel)FR.confirm=-1;
 if(KP.Escape||anyPad(i=>padEdge(i,'B'))){SFX.back();state=FR.back=='lobby'&&NET.lobby?'lobby':'online';return}
 const r=R[FR.sel],ok=KP.Enter||anyPad(i=>padEdge(i,'A')),del=KP.Delete||anyPad(i=>padEdge(i,'X'))||(r.k!='add'&&KP.Backspace);
 if(r.k=='add'){if(ok){if(!FR.name){FR.msg='TYPE A USERNAME FIRST';SFX.err()}else frDo('add',FR.name,()=>FR.name='')}return}
 if(r.k=='req'){if(ok)frDo('accept',r.n);else if(del)frDo('remove',r.n)}
 else if(r.k=='inv'){if(ok){SFX.ok();NET.lobby=null;state='lobby';netOpen({t:'join',code:r.code})}}
 else if(r.k=='out'){if(del)frDo('remove',r.n)}
 else if(r.k=='fr'){const L=NET.lobby,inPriv=L&&!L.quick;
  if(ok){if(!inPriv&&r.room){SFX.ok();NET.lobby=null;state='lobby';netOpen({t:'join',code:r.room})}else if(inPriv){frDo('invite',r.n)}else{SFX.ok();frInvite(r.n)}}
  if(del){if(FR.confirm==FR.sel){FR.confirm=-1;frDo('remove',r.n)}else{FR.confirm=FR.sel;FR.msg='PRESS AGAIN TO REMOVE '+r.n;SFX.sel()}}}}
function drawFriends(){text('FRIENDS',W/2,28,PAL.Y,32,'center');acctBadge(W-4,4,'right');panel(60,36,360,182);const R=frRows(),L=NET.lobby,inPriv=L&&!L.quick;
 const top=Math.max(0,Math.min(FR.sel-4,R.length-9));
 R.slice(top,top+9).forEach((r,kk)=>{const k=kk+top,y=44+kk*19,on=k==FR.sel;if(on){ctx.fillStyle='#5d4a6e';ctx.fillRect(66,y,348,18);ctx.fillStyle=PAL.Y;ctx.fillRect(66,y,2,18)}
  const c=on?PAL.Y:'#ffffff';
  if(r.k=='add'){text('ADD FRIEND:',74,y+13,'#d8dde6',8);panel(144,y+2,150,14,'#3b3f52');text(FR.name+(on&&Math.floor(t/20)%2?'_':''),148,y+13,'#ffffff',8);text(on?'TYPE NAME + ENTER':'',406,y+13,'#8b93a6',8,'right')}
  else if(r.k=='inv'){text('INVITE: '+r.n+' - ROOM '+r.code,74,y+13,'#fee761',16);text('JOIN',406,y+13,c,8,'right')}
  else if(r.k=='req'){text('REQUEST: '+r.n,74,y+13,'#8fb8ff',16);text('ACCEPT / DECLINE',406,y+13,c,8,'right')}
  else if(r.k=='out'){text(r.n+' (PENDING)',74,y+13,'#8b93a6',16);text(on?'CANCEL':'',406,y+13,c,8,'right')}
  else{ctx.fillStyle=PAL.o;ctx.fillRect(73,y+5,8,8);ctx.fillStyle=r.online?'#7fe07f':'#5d5d70';ctx.fillRect(74,y+6,6,6);text(r.n,86,y+13,c,16);
   const st=r.room&&!inPriv?'IN ROOM '+r.room+' - JOIN':r.online?(inPriv?'INVITE TO '+L.code:'ONLINE - INVITE'):'OFFLINE';text(FR.confirm==k?'REMOVE?':st,406,y+13,FR.confirm==k?'#ff7f7f':r.online?'#a1e55a':'#8b93a6',8,'right')}});
 if(!FR.data)text(FR.err||'LOADING...',W/2,130,'#d8dde6',16,'center');else if(R.length==1)text('NO FRIENDS YET - ADD ONE BY USERNAME',W/2,120,'#d8dde6',8,'center');
 text(FR.msg,W/2,214,'#fee761',8,'center');
 const r=R[FR.sel]||{};bar([[['DP'],'SELECT'],[['A'],r.k=='req'?'ACCEPT':r.k=='add'?'ADD':'OK'],...(r.k=='fr'||r.k=='req'||r.k=='out'?[[['X'],'REMOVE']]:[]),[['B'],'BACK']],
  [[['\u2191','\u2193'],'SELECT'],[['ENTER'],r.k=='req'?'ACCEPT':r.k=='add'?'ADD':'OK'],...(r.k=='fr'||r.k=='req'||r.k=='out'?[[['DEL'],'REMOVE']]:[]),[['ESC'],'BACK']],236)}
const _updOnlF=updOnlineMenu;updOnlineMenu=function(){if(ONL_ITEMS[onlSel]=='FRIENDS'&&mOK()){SFX.ok();goFriends('online');return}_updOnlF()};
const _drawUIf=drawUI;drawUI=function(){if(state=='friends')drawFriends();else _drawUIf()};
// invite link (?join=CODE): auto-join once logged in
let PJ=null;if(ONLINE)try{const c=new URLSearchParams(location.search).get('join');if(c&&/^[A-Za-z]{4}$/.test(c)){PJ=c.toUpperCase();history.replaceState(null,'',location.pathname)}}catch(e){}
let PJasked=false;
const _updUIf=updUI;updUI=function(){
 if(PJ&&!ACC.checking&&(state=='menu'||state=='online')){if(ACC.user){const c=PJ;PJ=null;NET.lobby=null;state='lobby';netOpen({t:'join',code:c});toast('JOINING ROOM '+c)}else if(!PJasked){PJasked=true;openLogin('online');toast('LOG IN (OR PLAY AS GUEST) TO JOIN ROOM '+PJ)}}
 if(state=='friends')updFriends();else _updUIf()};
// lobby: invite link + friends
const _updLobbyF=updLobby;updLobby=function(){const L=NET.lobby;
 if(L&&!L.quick){if(KP.KeyL){const u=inviteLink(L.code);SFX.ok();try{navigator.clipboard.writeText(u).then(()=>toast('INVITE LINK COPIED!'),()=>toast(u))}catch(e){toast(u)}return}
  if(KP.KeyV||anyPad(i=>padEdge(i,'ST'))&&!L.host){goFriends('lobby');return}
  if(FR.pendInv&&L.code){const n=FR.pendInv;FR.pendInv=null;api('friends/invite',{name:n,code:L.code}).then(j=>toast(j.msg)).catch(e=>toast(e.message))}}
 _updLobbyF()};
const _drawLobbyF=drawLobby;drawLobby=function(){_drawLobbyF();const L=NET.lobby;if(!L||L.quick)return;
 text(lastDev=='pad'?(L.host?'SHARE CODE '+L.code+' OR INVITE FROM ONLINE > FRIENDS':'START: INVITE FRIENDS'):(ACC.user&&!ACC.user.guest?'L: COPY INVITE LINK   V: INVITE FRIENDS':'L: COPY INVITE LINK'),W/2,229,'#8fb8ff',8,'center')};
