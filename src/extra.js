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
 for(let i=0;i<4;i++){const s=L.slots[i];if(s&&s.tier)tierBadge(s.tier+' '+s.rating,8+i*118+55,60+99)}
 if(L.ranked)text('RANKED',W/2,56,'#8fb8ff',8,'center')};
const _drawResx=drawResults;drawResults=function(){_drawResx();const R=NET.res;if(!R)return;const me=R.rank.find(r=>r.i==NET.you);
 if(me&&me.rank){const k=me.rank;if(ACC.user){ACC.user.rating=k.rating;ACC.user.tier=k.tier}text('RATING '+k.old+' \u2192 '+k.rating+' ('+(k.delta>=0?'+':'')+k.delta+')  '+k.tier,W/2,178,k.delta>=0?'#7fe07f':'#ff7f7f',8,'center')}
 R.rank.forEach((r,k)=>{if(r.rank){const y=70+k*30;text((r.rank.delta>=0?'+':'')+r.rank.delta,120+r.name.length*8+6,y+17,r.rank.delta>=0?'#7fe07f':'#ff7f7f',8)}})};
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
 for(const p of CORE.projs){ctx.drawImage(itemSprite('bomb'),Math.round(p.x)-4,Math.round(p.y)-4,8,8);if(t%4<2){ctx.fillStyle='#fee761';ctx.fillRect(Math.round(p.x)+1,Math.round(p.y)-5,1,1)}}}
function drawBuffs(){for(const f of F){if(f.out||f.respawn>0||!f.buf)continue;const B=f.buf,x=Math.round(f.x),y=Math.round(f.y);
  if(B.sh){ctx.globalAlpha=.35+.15*Math.sin(t/5);ctx.fillStyle='#7fe0d0';ctx.fillRect(x-3,y-3,16,26);ctx.globalAlpha=1;ctx.fillStyle='#7fe0d0';ctx.fillRect(x-3,y-3,16,1);ctx.fillRect(x-3,y+22,16,1);ctx.fillRect(x-3,y-3,1,26);ctx.fillRect(x+12,y-3,1,26)}
  if(B.spd&&t%3==0)parts.length<PMAX&&parts.push({x:f.x+5-f.face*5,y:f.y+16,vx:-f.face*.5,vy:0,l:10,c:'#fee761'});
  if(B.ham){const hx=f.face>0?x+9:x-7;ctx.fillStyle=PAL.o;ctx.fillRect(hx,y+2,8,6);ctx.fillStyle='#8b93a6';ctx.fillRect(hx+1,y+3,6,4);ctx.fillStyle='#c77b3f';ctx.fillRect(hx+3,y+8,2,6)}
  if(B.bomb)ctx.drawImage(itemSprite('bomb'),x+1,y-20,8,8)}}
