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
