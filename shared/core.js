// Pixel Dudes Brawl - shared game simulation (runs in the browser AND on the Node server)
(function(root){
const PRICES=[0,0,0,0,200,200,200,250,250,250,300,300,300,350,350,350,400,400,450,450,500,350,350,400,400,450,450,500,500,550,550,600,600,500,500,500];
const STARTER=[0,1,2,3];
const TIERS=[['BRONZE',0,'#c77b3f'],['SILVER',1100,'#c0c8d8'],['GOLD',1200,'#fee761'],['PLATINUM',1300,'#7fe0d0'],['DIAMOND',1400,'#8fb8ff']];
const MODES=[{id:'stock',n:'STOCK',d:'LAST ONE STANDING'},{id:'time',n:'TIME',d:'MOST KOS WHEN TIME RUNS OUT'},{id:'koth',n:'KING OF THE HILL',d:'HOLD THE ZONE FOR 15 SECONDS'},{id:'teams',n:'TEAMS 2V2',d:'P1+P3 VS P2+P4'},{id:'coin',n:'COIN RUSH',d:'FIRST TO 15 COINS'},{id:'pit',n:'MONEY PIT',d:'GRAB RAINING COINS - LAST ONE STANDING WINS THE JACKPOT'}];
const CHALLENGES=[{id:'play3',txt:'PLAY 3 MATCHES',n:3,r:40,k:'play'},{id:'kos10',txt:'LAND 10 KOS',n:10,r:50,k:'kos'},{id:'win2',txt:'WIN 2 MATCHES',n:2,r:60,k:'win'},
 {id:'onl2',txt:'PLAY 2 ONLINE MATCHES',n:2,r:50,k:'online'},{id:'owin',txt:'WIN AN ONLINE MATCH',n:1,r:80,k:'owin'},{id:'koth1',txt:'PLAY KING OF THE HILL',n:1,r:40,k:'mode',m:'koth'},{id:'coinw',txt:'WIN A COIN RUSH',n:1,r:70,k:'modewin',m:'coin'},{id:'team2',txt:'PLAY 2 TEAM MATCHES',n:2,r:50,k:'mode',m:'teams'},
 {id:'kos3m',txt:'GET 3 KOS IN ONE MATCH',n:1,r:60,k:'kos3'},
 {id:'flaw',txt:'WIN WITHOUT LOSING A STOCK',n:1,r:100,k:'flaw'},{id:'full4',txt:'PLAY A 4-FIGHTER MATCH',n:1,r:30,k:'four'}];
function chalAdd(c,e){switch(c.k){case 'play':return 1;case 'kos':return e.kos|0;case 'win':return e.won?1:0;case 'online':return e.online?1:0;case 'owin':return e.online&&e.won?1:0;
 case 'kos3':return (e.kos|0)>=3?1:0;case 'flaw':return e.flawless?1:0;case 'four':return e.players>=4?1:0;case 'mode':return e.mode==c.m?1:0;case 'modewin':return e.mode==c.m&&e.won?1:0}return 0}
const ITEM_KINDS=['bomb','speed','shield','heal','hammer'],ITEM_INT=[0,900,540,300],ITEM_NAMES=['OFF','LOW','MEDIUM','HIGH'];
// Cosmetics: purely visual, bought with coins and validated by the server. th = THEMES index the arena theme swaps in for arena `base`.
const COSMETICS=[
 {id:'hat_cap',cat:'hat',n:'BALL CAP',p:150},{id:'hat_band',cat:'hat',n:'HEADBAND',p:150},{id:'hat_viking',cat:'hat',n:'VIKING HELM',p:250},{id:'hat_top',cat:'hat',n:'TOP HAT',p:300},
 {id:'hat_wizard',cat:'hat',n:'WIZARD HAT',p:350},{id:'hat_crown',cat:'hat',n:'CROWN',p:500},{id:'hat_halo',cat:'hat',n:'HALO',p:600},
 {id:'tr_fire',cat:'trail',n:'FIRE TRAIL',p:200},{id:'tr_ice',cat:'trail',n:'ICE TRAIL',p:200},{id:'tr_spark',cat:'trail',n:'SPARKLE TRAIL',p:300},{id:'tr_rainbow',cat:'trail',n:'RAINBOW TRAIL',p:500},
 {id:'tr_bubble',cat:'trail',n:'BUBBLE TRAIL',p:250},{id:'tr_hearts',cat:'trail',n:'HEART TRAIL',p:300},{id:'tr_volt',cat:'trail',n:'VOLT TRAIL',p:350},{id:'tr_smoke',cat:'trail',n:'SHADOW SMOKE',p:350},{id:'tr_star',cat:'trail',n:'STARDUST TRAIL',p:400},{id:'tr_glitch',cat:'trail',n:'GLITCH TRAIL',p:450},
 {id:'ko_confetti',cat:'ko',n:'CONFETTI KO',p:250},{id:'ko_bolt',cat:'ko',n:'LIGHTNING KO',p:350},{id:'ko_boom',cat:'ko',n:'PIXEL BOOM KO',p:500},
 {id:'ko_hearts',cat:'ko',n:'HEARTBREAK KO',p:300},{id:'ko_ghost',cat:'ko',n:'GHOST KO',p:350},{id:'ko_shatter',cat:'ko',n:'SHATTER KO',p:400},{id:'ko_firework',cat:'ko',n:'FIREWORKS KO',p:450},{id:'ko_skull',cat:'ko',n:'SKULL KO',p:500},{id:'ko_hole',cat:'ko',n:'BLACK HOLE KO',p:600},
 {id:'po_jump',cat:'pose',n:'VICTORY HOP',p:200},{id:'po_spin',cat:'pose',n:'SPIN',p:250},{id:'po_dance',cat:'pose',n:'DANCE',p:300},{id:'po_trophy',cat:'pose',n:'TROPHY RAISE',p:400},
 {id:'nc_gold',cat:'name',n:'GOLD NAME',p:100,c:'#fee761'},{id:'nc_mint',cat:'name',n:'MINT NAME',p:100,c:'#7fe0d0'},{id:'nc_pink',cat:'name',n:'PINK NAME',p:150,c:'#ff8ad0'},
 {id:'nc_sky',cat:'name',n:'SKY NAME',p:150,c:'#8fb8ff'},{id:'nc_fire',cat:'name',n:'FIRE NAME',p:200,c:'#f99252'},{id:'nc_rainbow',cat:'name',n:'RAINBOW NAME',p:300,c:'rainbow'},{id:'nc_supporter',cat:'name',n:'SUPPORTER',p:0,c:'#ff8ad0',sup:1},
 {id:'ar_night',cat:'arena',n:'NIGHT MEADOW',p:400,base:0,th:6},{id:'ar_volcano',cat:'arena',n:'VOLCANO TOWERS',p:700,base:1,th:7},
 // melee weapons: purely visual (damage/hitboxes unchanged)
 {id:'wp_bat',cat:'weapon',n:'BASEBALL BAT',p:200},{id:'wp_wrench',cat:'weapon',n:'WRENCH',p:250},{id:'wp_sword',cat:'weapon',n:'SWORD',p:300},{id:'wp_spear',cat:'weapon',n:'SPEAR',p:350},
 {id:'wp_axe',cat:'weapon',n:'BATTLE AXE',p:400},{id:'wp_hammer',cat:'weapon',n:'WAR HAMMER',p:450},{id:'wp_katana',cat:'weapon',n:'KATANA',p:600},{id:'wp_beam',cat:'weapon',n:'BEAM SABER',p:800}];
const COS_CATS=['hat','trail','ko','pose','name','arena','weapon'];
const COS_BY=Object.fromEntries(COSMETICS.map(c=>[c.id,c]));
// parse a stored cosm JSON into {own:[ids],eq:{cat:id}}, dropping anything unknown or not owned
function cosParse(j){let o;try{o=typeof j=='string'?JSON.parse(j||'{}'):(j||{})}catch(e){o={}}const own=Array.isArray(o.own)?o.own.filter(id=>COS_BY[id]):[];const eq={};
 if(o.eq&&typeof o.eq=='object')for(const c of COS_CATS){const id=o.eq[c];if(id&&COS_BY[id]&&COS_BY[id].cat==c&&own.includes(id))eq[c]=id}return {own,eq}}
// ===== Single-elimination tournament bracket (pure; shared by client + server) =====
// b={size,ent:[entrant ids...],rd:[[{a,b,w}...]...]}; entrants are indices into ent; w = winning entrant index
function bracketNew(n){if(n!==4&&n!==8)throw new Error('bracket size must be 4 or 8');const rd=[];const s0=n==8?[0,7,3,4,1,6,2,5]:[0,3,1,2];
 rd.push([]);for(let k=0;k<n;k+=2)rd[0].push({a:s0[k],b:s0[k+1],w:null});for(let m=n/4;m>=1;m/=2)rd.push(Array.from({length:m},()=>({a:null,b:null,w:null})));return {size:n,rd}}
function bracketNext(b){for(let r=0;r<b.rd.length;r++)for(let m=0;m<b.rd[r].length;m++){const x=b.rd[r][m];if(x.w==null&&x.a!=null&&x.b!=null)return {r,m,a:x.a,b:x.b}}return null}
function bracketReport(b,r,m,w){const x=b.rd[r]&&b.rd[r][m];if(!x||x.w!=null||x.a==null||x.b==null)return false;if(w!==x.a&&w!==x.b)return false;x.w=w;
 const nx=b.rd[r+1];if(nx){const y=nx[m>>1];if(m&1)y.b=w;else y.a=w}return true}
function bracketChamp(b){const f=b.rd[b.rd.length-1][0];return f.w}
function bracketRound(b,r){const n=b.rd.length-1-r;return n==0?'FINAL':n==1?'SEMIS':'QUARTERS'}
// level curve: LV n needs 100+50*(n-1) more XP than LV n-1 (LV2=100, LV3=250, LV5=700, LV10=2700)
function levelOf(xp){let L=1,need=100;xp=Math.max(0,xp|0);while(xp>=need&&L<99){xp-=need;L++;need=100+50*(L-1)}return {level:L,into:xp,need}}
function tierOf(r){let t=TIERS[0];for(const x of TIERS)if(r>=x[1])t=x;return t[0]}
function createCore(H){H=H||{};
const W=480,T=16;const PCOL=['#e04848','#4a8fe0','#fee761','#a1e55a'];
const SFX=new Proxy({},{get:(_,k)=>a=>{H.sfx&&H.sfx(k,a)}});
function addShake(v){H.shake&&H.shake(v)}
function burst(x,y,c,n,sp){H.burst&&H.burst(x,y,c,n,sp)}
let F=[],map=null,arena=0,WW=960,WH=544,readyT=0,endT=0,winner=null,hitstop=0,timer=0,tick=0,opts={stocks:3,diff:1,time:0};
const KOTH_GOAL=900,COIN_GOAL=15;let HILL=null,hillT=0,CO=[],coinT=0;
function endless(){return opts.mode=='time'||opts.mode=='koth'||opts.mode=='coin'}
let stageL=0,stageR=W,stageTop=0;let IT=[],PR=[],itemT=0;const rnd=H.rand||Math.random;
function build(w,h,ops){const g=[];for(let y=0;y<h;y++)g.push(Array(w).fill(' '));for(const [c,x0,x1,y0,y1] of ops)for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)g[y][x]=c;return g}
const ARENAS=[
{name:'MEADOW',map:build(60,34,[['#',8,51,25,26],['#',10,49,27,27],['#',13,46,28,28],['#',17,42,29,29],['#',26,33,24,24],['-',12,19,21,21],['-',40,47,21,21],['-',23,36,17,17],['-',8,14,13,13],['-',45,51,13,13],['-',26,33,9,9]]),sp:[[14,25],[24,24],[35,24],[45,25]],rs:[30,4]},
{name:'BRICK TOWERS',map:build(60,34,[['#',6,53,26,27],['#',9,50,28,28],['#',13,46,29,29],['=',14,16,22,25],['=',43,45,22,25],['-',6,13,19,19],['-',46,53,19,19],['=',24,35,18,18],['-',20,23,22,22],['-',36,39,22,22],['-',17,23,15,15],['-',36,42,15,15],['-',9,16,11,11],['-',43,50,11,11],['=',28,31,10,10],['-',25,34,6,6]]),sp:[[10,26],[22,26],[37,26],[49,26]],rs:[30,2]},
{name:'SKY ISLANDS',map:build(60,34,[['#',3,15,20,20],['#',4,14,21,21],['#',6,12,22,22],['#',44,56,20,20],['#',45,55,21,21],['#',47,53,22,22],['#',21,38,25,25],['#',22,37,26,26],['#',25,34,27,27],['#',27,32,28,28],['-',24,35,20,20],['-',17,22,15,15],['-',37,42,15,15],['#',9,14,11,11],['#',45,50,11,11],['-',26,33,11,11]]),sp:[[8,20],[25,25],[34,25],[51,20]],rs:[30,3]},
{name:'GRAND BRIDGE',map:build(72,38,[['#',3,22,24,27],['#',5,20,28,29],['#',8,17,30,30],['#',49,68,24,27],['#',51,66,28,29],['#',54,63,30,30],['-',23,48,24,24],['#',29,42,31,31],['#',31,40,32,32],['-',8,16,19,19],['-',55,63,19,19],['=',33,38,19,19],['-',25,31,14,14],['-',40,46,14,14],['-',11,18,12,12],['-',53,60,12,12],['-',32,39,9,9]]),sp:[[8,24],[19,24],[52,24],[63,24]],rs:[36,3]},
{name:'SKY CASTLE',map:build(60,34,[['#',14,45,26,27],['#',16,43,28,28],['#',19,40,29,29],['#',22,37,30,30],['=',14,15,22,25],['=',44,45,22,25],['-',18,25,20,20],['-',34,41,20,20],['-',26,33,13,13]]),sp:[[18,26],[26,26],[33,26],[41,26]],rs:[30,3],mp:{x0:6,x1:48,y:17,w:6,v:.6},hz:1},
{name:'MONEY PIT',map:build(60,34,[['#',9,50,26,27],['#',11,48,28,28],['#',14,45,29,29],['#',9,11,23,25],['#',48,50,23,25],['-',16,23,21,21],['-',36,43,21,21],['-',25,34,15,15],['-',12,17,13,13],['-',42,47,13,13]]),sp:[[16,26],[25,26],[34,26],[43,26]],rs:[30,3],pit:1}];
let MP=null,HZ=null;
function mpOn(o){return MP&&o.dropT<=0&&Math.abs(o.y+o.h-MP.y)<.6&&o.x+o.w>MP.x&&o.x<MP.x+MP.w}
function stepMP(){if(!MP)return;const nx=MP.x+MP.vx;if(nx<MP.a||nx>MP.b)MP.vx=-MP.vx;const dx=MP.vx;for(const f of F)if(!f.out&&f.respawn<=0&&f.vy>=0&&mpOn(f)){f.x+=dx;if(overlapSolid(f))f.x-=dx}MP.x+=dx}
function stepHZ(){if(!HZ||readyT>0||endT||!(opts.items|0))return;if(HZ.t>0){HZ.t--;if(HZ.t==0){HZ.ph=HZ.ph==0?1:HZ.ph==1?2:0;HZ.t=HZ.ph==1?75:HZ.ph==2?12:Math.round(420+rnd()*240);if(HZ.ph==1)HZ.x=Math.round(stageL+16+rnd()*(stageR-stageL-32));if(HZ.ph==2){addShake(6);SFX.hit(6);burst(HZ.x,stageTop,'#fee761',16,2.5)}}}
 if(HZ.ph==2)for(const g of F){if(g.out||g.respawn>0||g.inv>0||g.hz>0)continue;if(Math.abs(g.x+5-HZ.x)<9){g.hz=30;if(g.buf.sh>0){g.buf.sh=0;continue}g.dmg+=9;g.vy=-4.5-g.dmg*.03;g.vx=(g.x+5>=HZ.x?1:-1)*2;g.hitstun=14;g.flash=8;g.ground=false;g.atkT=g.dashT=0}}
 for(const g of F)if(g.hz>0)g.hz--}
const solidCh=c=>c=='#'||c=='=';
function tileAt(x,y){const r=map[Math.floor(y/T)];if(!r)return ' ';return r[Math.floor(x/T)]||' '}
const solid=(x,y)=>solidCh(tileAt(x,y));
function overlapSolid(o){const xs=[o.x,o.x+o.w/2,o.x+o.w-.01],ys=[o.y,o.y+o.h/3,o.y+o.h*2/3,o.y+o.h-.01];for(const x of xs)for(const y of ys)if(solid(x,y))return true;return false}
function moveX(o){o.x+=o.vx;if(overlapSolid(o)){const s=Math.sign(o.vx);o.x-=o.vx;let n=0;while(n++<60&&!(o.x+=s*.25,overlapSolid(o))){}o.x-=s*.25;o.vx=0}}
function moveY(o){const ob=o.y+o.h;o.y+=o.vy;let landed=false;if(overlapSolid(o)){const s=Math.sign(o.vy);o.y-=o.vy;let n=0;while(n++<60&&!(o.y+=s*.25,overlapSolid(o))){}o.y-=s*.25;if(s>0)landed=true;o.vy=0}
 else if(o.vy>0&&o.dropT<=0){const r=Math.floor((o.y+o.h)/T),top=r*T;if(ob<=top+.01&&(tileAt(o.x+1,top+1)=='-'||tileAt(o.x+o.w-1,top+1)=='-')){o.y=top-o.h;o.vy=0;landed=true}}
 if(!landed&&MP&&o.vy>0&&o.dropT<=0&&ob<=MP.y+.01&&o.y+o.h>=MP.y&&o.x+o.w>MP.x&&o.x<MP.x+MP.w){o.y=MP.y-o.h;o.vy=0;landed=true}return landed}
function onGround(o){const yb=o.y+o.h+.5;if(solid(o.x+1,yb)||solid(o.x+o.w-1,yb))return true;if(o.dropT<=0&&Math.abs((o.y+o.h)%T)<.01&&(tileAt(o.x+1,yb)=='-'||tileAt(o.x+o.w-1,yb)=='-'))return 'plat';if(mpOn(o))return 'plat';return false}
function spawn(f,first){const A=ARENAS[arena],s=A.sp[f.i];f.x=first?s[0]*T+3:A.rs[0]*T-5+(f.i-1.5)*24;f.y=first?s[1]*T-f.h:A.rs[1]*T;f.vx=f.vy=0;f.dmg=first?0:0;f.inv=first?0:120;f.jumps=1;f.hitstun=0;f.atkT=f.dashT=0;f.airDash=true;f.spT=0;f.spCd=0;f.upUsed=false;if(!first)SFX.respawn()}
function hitbox(f){if(f.spT>0){const k=f.spK;if(k=='u'&&f.spT>4)return{x:f.x-3,y:f.y-8,w:f.w+6,h:18,p:{dmg:9,base:3.2,grow:.09,ang:1.35}};if(k=='s'&&f.spT>3)return{x:f.face>0?f.x+f.w-4:f.x-8,y:f.y+2,w:12,h:16,p:{dmg:12,base:3.8,grow:.11,ang:.45}};if(k=='d')return{x:f.x-1,y:f.y+10,w:f.w+2,h:12,p:{dmg:6,base:2,grow:.05,ang:-.6}};if(k=='w'&&f.spT>2)return{x:f.x-22,y:f.y+f.h-12,w:f.w+44,h:12,rad:1,p:{dmg:10,base:3.2,grow:.1,ang:1.1}}}if(f.atkT>=8&&f.atkT<=14&&f.buf&&f.buf.ham>0)return{x:f.face>0?f.x+f.w-2:f.x-22,y:f.y,w:24,h:16,ham:1,p:{dmg:14,base:3.6,grow:.12,ang:.8}};if(f.atkT>=8&&f.atkT<=14)return{x:f.face>0?f.x+f.w-2:f.x-14,y:f.y+3,w:16,h:12,p:{dmg:8,base:2.6,grow:.085,ang:.75}};
 if(f.dashT>2)return{x:f.x-3+f.face*4,y:f.y,w:f.w+6,h:f.h,p:{dmg:11,base:3.4,grow:.1,ang:.5}};return null}
function ov(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y}
function doHits(f){const hb=hitbox(f);if(!hb)return;for(const g of F){if(g==f||g.out||g.respawn>0||g.inv>0||f.hit.has(g))continue;if(!ov(hb,g))continue;f.hit.add(g);if(friendly(f,g))continue;if(g.buf.sh>0){g.buf.sh=0;burst(g.x+5,g.y+10,'#7fe0d0',12,2);SFX.land();f.vx=-f.face*2;continue}const p=hb.p;g.dmg+=p.dmg;
 const kb=p.base+g.dmg*p.grow*(g.ground?1:1.1),dir=hb.rad?(g.x>=f.x?1:-1):f.face;g.vx=dir*kb*Math.cos(p.ang);g.vy=-kb*Math.sin(p.ang)-1;g.lastHit=f.i;g.hitstun=Math.floor(6+kb*3.5);g.flash=8;g.face=-dir;g.atkT=g.dashT=0;g.ground=false;
 hitstop=Math.max(hitstop,Math.min(8,Math.floor(3+kb*.7)));addShake(2+kb*.8);burst(g.x+g.w/2,g.y+8,'#ffffff',6+kb|0,1+kb*.3);burst(g.x+g.w/2,g.y+8,PCOL[f.i],4,2);SFX.hit(kb);if(f.dashT>0)f.dashT=Math.min(f.dashT,3);if(f.spK=='s'&&f.spT>3)f.spT=3}}
function updF(f,inp){if(f.out)return;if(f.respawn>0){if(--f.respawn==0)spawn(f);return}const B=f.buf;if(B.spd>0)B.spd--;if(B.sh>0)B.sh--;if(B.ham>0)B.ham--;
 if(f.inv>0)f.inv--;if(f.flash>0)f.flash--;if(f.dashCd>0)f.dashCd--;if(f.spCd>0)f.spCd--;if(f.spT>0&&f.spK!='d')f.spT--;if(f.dropT>0)f.dropT--;
 const g=onGround(f);f.ground=!!g;if(f.ground){f.jumps=1;f.ff=false;f.airDash=true;f.upUsed=false;if(f.spK=='d'&&f.spT>0){f.spK='w';f.spT=9;f.hit=new Set();addShake(6);SFX.land();burst(f.x+5,f.y+f.h,'#fee761',14,2.6);burst(f.x+5,f.y+f.h,'#ffffff',8,1.6)}}
 if(readyT>0)inp={};
 if(f.hitstun>0){f.hitstun--;if(f.spT>0&&f.spK!='w')f.spT=0;f.vx*=f.ground?.85:.985;if(f.hitstun%3==0)H.part&&H.part(f.x+5,f.y+10)}
 else{const mv=(inp.r?1:0)-(inp.l?1:0);
  if(f.dashT<=0){const tv=mv*2.3*(f.buf.spd>0?1.45:1),ac=f.atkT>0?(f.ground?.4:.05):(f.ground?.35:.14);f.vx+=(tv-f.vx)*ac;if(mv&&f.atkT<=0)f.face=mv}
  if(inp.upE&&f.dashT<=0){if(f.ground){f.vy=f.buf.spd>0?-6.4:-5.8;SFX.jump();burst(f.x+5,f.y+f.h,'#d8dde6',4,1)}else if(f.jumps>0){f.jumps--;f.vy=-5.2;f.ff=false;SFX.dj();burst(f.x+5,f.y+f.h,'#ffffff',6,1.2)}}
  if(!f.ground&&inp.dE&&f.vy>-1){f.ff=true}
  if(g=='plat'&&inp.dE){f.dropT=12;f.y+=1;f.ground=false}
  if(inp.xp&&f.spCd<=0&&f.spT<=0&&f.atkT<=0&&f.dashT<=0){const k=inp.u?'u':inp.d?'d':mv?'s':'n';if(mv)f.face=mv;f.hit=new Set();
   if(k=='u'&&!f.upUsed){f.spK='u';f.spT=18;f.spCd=50;f.upUsed=true;f.vy=-6.6;f.vx=f.face*1.2;f.ff=false;SFX.dj();burst(f.x+5,f.y+f.h,'#fee761',8,1.6)}
   else if(k=='d'){if(f.ground){f.spK='w';f.spT=9;addShake(5);SFX.land();burst(f.x+5,f.y+f.h,'#fee761',12,2.4)}else{f.spK='d';f.spT=1;f.vy=7;f.vx*=.3}f.spCd=70}
   else if(k=='s'){f.spK='s';f.spT=22;f.spCd=70;if(!f.ground)f.vy=Math.min(f.vy,-.5);SFX.dash()}
   else if(k=='n'){f.spK='n';f.spT=12;f.spCd=80;PR.push({x:f.x+5+f.face*8,y:f.y+9,vx:f.face*3.6,vy:0,o:f.i,t:0,orb:1});SFX.swing()}}
  if(inp.ap&&f.atkT<=0&&f.dashT<=0&&f.spT<=0&&f.buf.bomb){f.buf.bomb=0;f.atkT=7;PR.push({x:f.x+5+f.face*6,y:f.y+4,vx:f.face*4.2+f.vx*.4,vy:-3.2,o:f.i,t:0});SFX.swing()}
  else if(inp.ap&&f.atkT<=0&&f.dashT<=0&&f.spT<=0){f.atkT=20;f.hit=new Set();f.vx+=f.face*1.2;SFX.swing()}
  if(inp.sp&&f.dashCd<=0&&f.atkT<=0&&(f.ground||f.airDash)){if(mv)f.face=mv;f.dashT=14;f.dashCd=45;if(!f.ground){f.airDash=false;f.vy=Math.min(f.vy,-1)}f.hit=new Set();SFX.dash()}}
 if(f.atkT>0)f.atkT--;
 if(f.dashT>0){f.dashT--;f.vx=f.face*(f.dashT>3?6.5:3);f.vy*=.6;f.trail.unshift([f.x,f.y]);if(f.trail.length>4)f.trail.pop()}else if(f.trail.length)f.trail.pop();
 if(f.spT>0){if(f.spK=='s'){f.vx=f.face*(f.spT>3?5:2);f.vy*=.5}else if(f.spK=='d'){f.vy=Math.max(f.vy,7);f.vx*=.9;f.hit.clear&&f.spT++>40&&(f.spT=0)}else if(f.spK=='n'){f.vx*=.8}}
 f.vy+=f.dashT>0?.05:(f.ff?.6:.35);f.vy=Math.min(f.vy,f.ff?7.5:5);
 const vy0=f.vy;moveX(f);if(moveY(f)){f.ground=true;if(vy0>2.6)SFX.land()}f.anim+=Math.abs(f.vx)*.1;
 if(f.hit)doHits(f);
 if(f.x<-96||f.x>WW+96||f.y>WH+64||f.y<-220){f.stocks--;SFX.ko();addShake(10);H.ko&&H.ko(f);if(f.lastHit!=null&&f.lastHit!=f.i)H.kill&&H.kill(f.lastHit,f.i);koScore(f);f.lastHit=null;f.buf={spd:0,sh:0,ham:0,bomb:0};if(endless())f.stocks=Math.max(1,f.stocks+1);if(f.stocks<=0){f.out=true}else f.respawn=60;f.vx=f.vy=0;f.dmg=0}}
function stageBounds(){let l=99,r=0,tp=99;map.forEach((row,y)=>row.forEach((c,x)=>{if(c!=' '){l=Math.min(l,x);r=Math.max(r,x);if(solidCh(c))tp=Math.min(tp,y)}}));stageL=l*T;stageR=(r+1)*T;stageTop=tp*T}
function groundBelow(x,y){const tx=Math.floor(x/T);if(tx<0||tx>=map[0].length)return -1;for(let ty=Math.max(0,Math.floor(y/T));ty<map.length;ty++){if(map[ty][tx]!=' ')return ty}return -1}
function safeX(cx,y,pref){if(pref){for(let d=0;d<16;d++){const x=cx+pref*d*T;if(groundBelow(x,y)>=0)return x+pref*T}}for(let d=0;d<50;d++)for(const s of [1,-1]){const x=cx+s*d*T;if(groundBelow(x,y)>=0)return x+s*T}return WW/2}
// CPU levels: dl = reaction delay (ticks), df = aggression (scales attack/special/jump odds), aim = spacing error px,
// idle = chance per tick to stand around briefly, rec = chance to use up-special recovery, sp = special-move multiplier.
const CPU_LV=[{dl:24,df:.4,aim:18,idle:.012,rec:.35,sp:.3},{dl:12,df:.65,aim:10,idle:.004,rec:.75,sp:.6},{dl:0,df:1,aim:0,idle:0,rec:1,sp:1}];
function ai(f){const P=CPU_LV[opts.diff]||CPU_LV[0],A=f.ai;if(!A.q)A.q=[];
 if(A.idle>0){A.idle--;A.q.length=0;return {}}
 if(P.idle&&f.ground&&f.hitstun<=0&&Math.random()<P.idle){A.idle=20+Math.floor(Math.random()*30);return {}}
 if(P.aim&&!(A.errT>0)){A.err=(Math.random()*2-1)*P.aim;A.errT=40+Math.floor(Math.random()*50)}A.errT--;
 const o=aiRaw(f,P);const off=!f.ground&&groundBelow(f.x+5,f.y+f.h)<0,dl=off?P.dl>>1:P.dl;
 A.q.push(o);if(A.q.length>dl+1)A.q.splice(0,A.q.length-dl-1);return A.q.length>dl?A.q[0]:{}}
function aiRaw(f,P){const DF=P.df;const o={l:0,r:0,u:0,d:0,upE:0,dE:0,ap:0,sp:0,xp:0};const A=f.ai;A.j--;
 const cx=f.x+5,feet=f.y+f.h;
 if(!f.ground&&groundBelow(cx,feet)<0){if(A.gapT>0)A.gapT--;const sx=safeX(cx,Math.max(0,f.y-48),A.gapT>0?A.gapDir:0),dir=sx>cx?1:-1;if(dir>0)o.r=1;else o.l=1;
  if(f.vy>0.3&&f.jumps>0&&A.j<=0){o.upE=1;A.j=12}else if(f.jumps==0&&f.vy>0.5&&f.airDash&&f.dashCd<=0&&Math.abs(sx-cx)>24){f.face=dir;o.sp=1}else if(f.jumps==0&&f.vy>1&&!f.upUsed&&f.spCd<=0&&(f.dashCd>0||!f.airDash)&&Math.random()<P.rec){o.u=1;o.xp=1}return o}
 for(const it of IT){const dx=it.x-f.x,dy=it.y-f.y;if(Math.abs(dx)<90&&Math.abs(dy)<24&&!(ITEM_KINDS[it.k]=='bomb'&&f.buf.bomb)){if(dx>4)o.r=1;else if(dx<-4)o.l=1;return o}}
 let tg=null,bd=1e9;for(const g of F){if(g==f||g.out||g.respawn>0||friendly(f,g)||(opts.teams&&g.team==f.team))continue;const d=Math.hypot(g.x-f.x,g.y-f.y);if(d<bd){bd=d;tg=g}}if(!tg)return o;
 {const P=(x,y)=>({x,y,w:10,h:20,dmg:0,vx:0,vy:0,ground:true,pseudo:1});
  if(opts.mode=='koth'&&HILL&&!ov(f,HILL)&&(bd>36||(f.i+(tick>>7))%3))tg=P(HILL.x+HILL.w/2-5,HILL.y+HILL.h-20);
  if(opts.mode=='coin'||opts.mode=='pit'){let bc=null,cd=opts.mode=='pit'?(bd>80?150:40):bd>40?320:90;for(const c of CO){const d=Math.hypot(c.x-f.x,c.y-f.y);if(d<cd){cd=d;bc=c}}if(bc)tg=P(bc.x-1,bc.y-12)}}
 const dx=tg.x-f.x+(tg.pseudo?0:(A.err||0)),dy=tg.y-f.y,R=Math.random()/DF;
 if(Math.abs(dx)>12){if(dx>0)o.r=1;else o.l=1}
 if(f.ground&&(o.r||o.l)){const nx=cx+(o.r?14:-14);if(groundBelow(nx,feet)<0){if(tg.y+tg.h<=feet+8&&Math.abs(dx)<260&&A.j<=0&&groundBelow(cx+(o.r?1:-1)*Math.min(Math.abs(dx),150),feet-40)>=0){o.upE=1;A.j=25;A.gapDir=o.r?1:-1;A.gapT=50}else o.l=o.r=0}}
 if((o.r||o.l)&&solid(cx+(o.r?9:-9),f.y+10)){if(f.ground&&A.j<=0){o.upE=1;A.j=14;A.gapDir=o.r?1:-1;A.gapT=40}else if(!f.ground&&f.vy>0&&f.jumps>0&&A.j<=0){o.upE=1;A.j=14}}
 const ceil=x=>{for(let yy=f.y-8;yy>f.y-72;yy-=8)if(solid(x-7,yy)||solid(x+7,yy))return true;return false};if(dy<-24&&Math.abs(dx)<140&&ceil(cx)){for(let d=1;d<14;d++){if(!ceil(cx+d*T)){o.r=1;o.l=0;break}if(!ceil(cx-d*T)){o.l=1;o.r=0;break}}}
 if(dy<-24&&f.ground&&A.j<=0&&R<.25){o.upE=1;A.j=18}else if(dy<-30&&!f.ground&&f.vy>0&&f.jumps>0&&A.j<=0){o.upE=1;A.j=18}
 if(dy>24&&f.ground&&onGround(f)=='plat'&&R<.08)o.dE=1;
 if(f.buf.bomb&&Math.abs(dx)>30&&Math.abs(dx)<110&&Math.abs(dy)<30&&R<.08&&f.atkT<=0){f.face=dx>0?1:-1;o.ap=1}
 else if(Math.abs(dx)<22&&Math.abs(dy)<16&&R<.22&&tg.inv<=0){f.face=dx>0?1:-1;o.l=o.r=0;o.ap=1}
 else if(Math.abs(dx)>40&&Math.abs(dx)<120&&Math.abs(dy)<10&&f.dashCd<=0&&R<.03&&f.ground&&groundBelow(cx+(dx>0?60:-60),feet)>=0){f.face=dx>0?1:-1;o.sp=1}
 if(!o.ap&&!o.sp&&f.spCd<=0&&Math.random()<P.sp){const ad=Math.abs(dx);if(ad<26&&Math.abs(dy)<14&&R<.05){f.face=dx>0?1:-1;o.xp=1;if(R<.025){o.d=1;o.l=o.r=0}}else if(ad>50&&ad<150&&Math.abs(dy)<10&&R<.015){f.face=dx>0?1:-1;o.l=o.r=0;o.xp=1}else if(dy>20&&ad<10&&!f.ground&&R<.1){o.d=1;o.xp=1}}
 if(R>.995&&f.ground){o.upE=1}return o}
function startFight(slots,ar,o){opts=Object.assign({stocks:3,diff:1,time:0,items:0,ff:true,mode:'stock'},o||{});if(!MODES.some(m=>m.id==opts.mode))opts.mode='stock';opts.teams=opts.mode=='teams';if(endless()&&!opts.time)opts.time=(opts.mode=='time'?120:180)*60;arena=ar;map=ARENAS[arena].map;WW=map[0].length*T;WH=map.length*T;stageBounds();F=[];
 slots.forEach((s,i)=>{if(!s||s.type=='none')return;const f={i,cpu:s.type=='cpu',skin:s.skin,name:s.name||'',x:0,y:0,w:10,h:20,vx:0,vy:0,face:i<2?1:-1,dmg:0,stocks:opts.stocks,out:false,respawn:0,inv:0,jumps:1,atkT:0,dashT:0,dashCd:0,airDash:true,hitstun:0,flash:0,dropT:0,ground:false,ff:false,hit:null,trail:[],anim:0,ai:{j:0},lastHit:null,buf:{spd:0,sh:0,ham:0,bomb:0},team:s.team!=null?s.team:i};spawn(f,true);F.push(f)});
 readyT=100;endT=0;winner=null;hitstop=0;timer=opts.time||0;tick=0;pickHill();hillT=1200;CO=[];coinT=60;F.forEach(f=>{f.pts=0;if(opts.teams)f.team=Array.isArray(opts.teamOf)&&opts.teamOf[f.i]!=null?opts.teamOf[f.i]&1:f.i%2});IT=[];PR=[];itemT=Math.round((ITEM_INT[opts.items|0]||0)*.5);const A=ARENAS[arena];MP=A.mp?{x:A.mp.x0*T,a:A.mp.x0*T,b:(A.mp.x1-A.mp.w)*T,y:A.mp.y*T,w:A.mp.w*T,h:4,vx:A.mp.v}:null;HZ=A.hz?{ph:0,t:300,x:0}:null}
function friendly(a,b){return opts.teams&&!opts.ff&&a.team==b.team}
// ===== Items: periodic stage drops, simulated here so the server is authoritative online =====
function spawnItem(){if(IT.length>=3)return;for(let n=0;n<24;n++){const x=stageL+8+rnd()*(stageR-stageL-26);if(groundBelow(x+5,0)<0||groundBelow(x+15,0)<0)continue;
  IT.push({k:Math.floor(rnd()*ITEM_KINDS.length),x,y:Math.max(-40,stageTop-160),vy:0,w:10,h:10,life:900});return}}
function giveItem(f,it){const k=ITEM_KINDS[it.k],B=f.buf;if(k=='bomb'){if(B.bomb)return false;B.bomb=1}else if(k=='speed')B.spd=480;else if(k=='shield')B.sh=600;else if(k=='heal')f.dmg=Math.max(0,f.dmg-35);else if(k=='hammer')B.ham=420;
 SFX.coin();burst(it.x+5,it.y+5,'#fee761',10,1.5);return true}
function explode(x,y,o){addShake(9);SFX.hit(8);burst(x,y,'#f99252',22,3.2);burst(x,y,'#fee761',14,2.2);burst(x,y,'#ffffff',8,1.5);
 for(const g of F){if(g.out||g.respawn>0||g.inv>0)continue;const dx=g.x+5-x,dy=g.y+10-y;if(dx*dx+dy*dy>42*42)continue;const of=F.find(f=>f.i==o);if(of&&of!==g&&friendly(of,g))continue;
  if(g.buf.sh>0){g.buf.sh=0;burst(g.x+5,g.y+10,'#7fe0d0',12,2);continue}g.dmg+=16;const kb=3.8+g.dmg*.1,dir=dx>=0?1:-1;g.vx=dir*kb*.6;g.vy=-kb*.85-1;g.lastHit=o!==g.i?o:g.lastHit;g.hitstun=Math.floor(6+kb*3.5);g.flash=8;g.atkT=g.dashT=0;g.ground=false;
  hitstop=Math.max(hitstop,6)}}
function stepItems(){if(readyT>0||endT)return;if(itemT>0&&--itemT==0){spawnItem();itemT=Math.round(ITEM_INT[opts.items|0]*(.75+rnd()*.5))}
 for(let n=IT.length-1;n>=0;n--){const it=IT[n];it.life--;if(it.vy>=0&&tileAt(it.x+5,it.y+it.h+it.vy+.1)!=' '&&!(tileAt(it.x+5,it.y+it.h-.1)!=' ')){const r=Math.floor((it.y+it.h+it.vy+.1)/T);it.y=r*T-it.h;it.vy=0}else{it.vy=Math.min(4,it.vy+.25);it.y+=it.vy}
  if(it.life<=0||it.y>WH+20){IT.splice(n,1);continue}
  for(const f of F){if(f.out||f.respawn>0||f.hitstun>0)continue;if(ov(it,f)&&giveItem(f,it)){IT.splice(n,1);break}}}
 for(let n=PR.length-1;n>=0;n--){const p=PR[n];p.t++;if(p.orb){p.x+=p.vx;let gone=p.t>70||solid(p.x,p.y);if(!gone)for(const g of F){if(g.i==p.o||g.out||g.respawn>0||g.inv>0)continue;if(p.x>g.x-4&&p.x<g.x+g.w+4&&p.y>g.y-4&&p.y<g.y+g.h+4){gone=true;const of=F.find(f=>f.i==p.o);if(of&&friendly(of,g))break;if(g.buf.sh>0){g.buf.sh=0;burst(g.x+5,g.y+10,'#7fe0d0',12,2);break}g.dmg+=7;const kb=2.4+g.dmg*.07,dir=p.vx>0?1:-1;g.vx=dir*kb*.75;g.vy=-kb*.65-1;g.lastHit=p.o;g.hitstun=Math.floor(6+kb*3.5);g.flash=8;g.face=-dir;g.atkT=g.dashT=0;g.spT=0;g.ground=false;hitstop=Math.max(hitstop,4);addShake(2+kb*.6);SFX.hit(kb);break}}if(gone){burst(p.x,p.y,PCOL[p.o],10,1.8);burst(p.x,p.y,'#ffffff',5,1.2);PR.splice(n,1)}continue}p.vy=Math.min(6,p.vy+.22);p.x+=p.vx;p.y+=p.vy;let boom=p.t>150||solid(p.x,p.y)||(p.vy>0&&tileAt(p.x,p.y)=='-');
  if(!boom)for(const g of F){if(g.i==p.o&&p.t<20||g.out||g.respawn>0)continue;if(p.x>g.x-2&&p.x<g.x+g.w+2&&p.y>g.y-2&&p.y<g.y+g.h+2){boom=true;break}}
  if(boom){explode(p.x,p.y,p.o);PR.splice(n,1)}else if(p.y>WH+60||p.x<-200||p.x>WW+200)PR.splice(n,1)}}
function surfaceAt(x){const r=groundBelow(x,Math.max(0,stageTop-200));return r}
function pickHill(){HILL=null;for(let n=0;n<40;n++){const w=56,x=stageL+4+rnd()*(stageR-stageL-w-8),y0=Math.max(0,stageTop-(n<30?90:0)-rnd()*40),r=groundBelow(x,y0);if(r<0||groundBelow(x+w-1,y0)!=r||groundBelow(x+w/2,y0)!=r)continue;const h={x:Math.round(x),y:r*T-44,w,h:44};if(HILL&&Math.abs(HILL.x-h.x)<60)continue;HILL=h;return}
 HILL={x:Math.round((stageL+stageR)/2-28),y:stageTop-44,w:56,h:44}}
function koScore(f){const k=f.lastHit!=null&&f.lastHit!=f.i?F.find(g=>g.i==f.lastHit):null;
 if(opts.mode=='time'){f.pts--;if(k)k.pts+=2}
 if(opts.mode=='coin'){const drop=Math.min(f.pts,Math.ceil(f.pts/2));f.pts-=drop;for(let n=0;n<drop&&CO.length<14;n++){const x=stageL+12+rnd()*(stageR-stageL-24);CO.push({x,y:stageTop-120-rnd()*40,vy:0,w:8,h:8,life:600})}}}
function stepModes(){if(readyT>0||endT)return;const m=opts.mode;
 if(m=='koth'){if(--hillT<=0){pickHill();hillT=1200;SFX.count()}const ins=F.filter(f=>!f.out&&f.respawn<=0&&ov(f,HILL));HILL.who=ins.length==1?ins[0].i:(ins.length?-2:-1);
  if(ins.length==1){const f=ins[0];f.pts++;if(f.pts>=KOTH_GOAL){winner=f;endT=90;SFX.game()}}}
 if(m=='pit'&&--coinT<=0){coinT=Math.max(10,opts.pitRate|0||40);if(CO.length<12&&jackpot()<pitCap()){const x=stageL+16+rnd()*(stageR-stageL-32);CO.push({x,y:Math.max(-60,stageTop-200)-rnd()*40,vy:0,w:8,h:8,life:600})}}
 if(m=='coin'||m=='pit'){if(m=='coin'&&--coinT<=0){coinT=75;if(CO.length<6){const x=stageL+12+rnd()*(stageR-stageL-24);if(groundBelow(x,0)>=0)CO.push({x,y:Math.max(-40,stageTop-180),vy:0,w:8,h:8,life:900})}}
  for(let n=CO.length-1;n>=0;n--){const c=CO[n];c.life--;if(c.vy>=0&&tileAt(c.x+4,c.y+c.h+c.vy+.1)!=' '&&tileAt(c.x+4,c.y+c.h-.1)==' '){c.y=Math.floor((c.y+c.h+c.vy+.1)/T)*T-c.h;c.vy=0}else{c.vy=Math.min(4,c.vy+.25);c.y+=c.vy}
   if(c.life<=0||c.y>WH+20){CO.splice(n,1);continue}
   for(const f of F){if(f.out||f.respawn>0)continue;if(ov(c,f)){if(m!='pit'||jackpot()<pitCap())f.pts++;SFX.coin();burst(c.x+4,c.y+4,'#fee761',6,1.2);CO.splice(n,1);if(m=='coin'&&f.pts>=COIN_GOAL&&!endT){winner=f;endT=90;SFX.game()}break}}}}}
function pitCap(){return Math.max(10,Math.min(5000,opts.pitCap|0||500))}
function jackpot(){let s=0;for(const f of F)s+=f.pts|0;return Math.min(s,pitCap())}
function score(f){return endless()?f.pts:(f.out?0:f.stocks)}
function rank(){return F.slice().sort((a,b)=>score(b)-score(a)||a.dmg-b.dmg)}
function step(getInp){tick++;if(readyT>0){readyT--;if(readyT==99||readyT==65)SFX.count();if(readyT==30)SFX.go()}
 if(hitstop>0)hitstop--;else{stepMP();for(const f of F)updF(f,f.cpu?ai(f):(getInp(f.i)||{}));stepItems();stepModes();stepHZ()}
 if(timer>0&&readyT<=0&&!endT){timer--;if(timer==0){const r=rank();winner=(r.length>1&&score(r[0])==score(r[1])&&(endless()||r[0].dmg==r[1].dmg))?null:r[0];endT=90;SFX.game()}}
 const alive=F.filter(f=>!f.out);if(opts.teams&&!endT&&new Set(alive.map(f=>f.team)).size<=1&&new Set(F.map(f=>f.team)).size>1){endT=90;winner=alive[0]||null;SFX.game()}
 if(!opts.teams&&!endless()&&alive.length<=1&&!endT){endT=90;winner=alive[0]||null;SFX.game()}
 if(endT&&--endT==0)return 'win';return null}
// compact snapshot for the network
function snap(){return F.map(f=>[Math.round(f.x*10),Math.round(f.y*10),Math.round(f.vx*10),Math.round(f.vy*10),f.face,Math.round(f.dmg),f.stocks,(f.out?1:0)|(f.ground?2:0)|(f.cpu?4:0),f.respawn,f.inv,f.atkT,f.dashT,f.hitstun,f.flash])}
function snapX(){return {I:IT.map(i=>[i.k,Math.round(i.x),Math.round(i.y),i.life]),P:PR.map(p=>[Math.round(p.x),Math.round(p.y),p.orb?p.o+1:0]),S:F.map(f=>[f.spT>0?'udswn'.indexOf(f.spK)+1:0,f.spT|0,f.spCd|0]),M:[HILL?[HILL.x,HILL.y,HILL.w,HILL.h,HILL.who|0]:0,CO.map(c=>[Math.round(c.x),Math.round(c.y)]),F.map(f=>f.pts|0),F.map(f=>f.team),MP?[Math.round(MP.x*10),Math.sign(MP.vx)]:0,HZ?[HZ.ph,HZ.t,HZ.x]:0],B:F.map(f=>(f.buf.spd>0?1:0)|(f.buf.sh>0?2:0)|(f.buf.ham>0?4:0)|(f.buf.bomb?8:0))}}
function unsnapX(o){if(!o)return;IT=(o.I||[]).map(a=>({k:a[0],x:a[1],y:a[2],w:10,h:10,vy:0,life:a[3]}));PR=(o.P||[]).map(a=>({x:a[0],y:a[1],orb:a[2]?1:0,o:a[2]-1}));(o.S||[]).forEach((a,k)=>{const f=F[k];if(f){f.spK=a[0]?'udswn'[a[0]-1]:'';f.spT=a[1];f.spCd=a[2]}});if(o.M){const M=o.M;HILL=M[0]?{x:M[0][0],y:M[0][1],w:M[0][2],h:M[0][3],who:M[0][4]}:null;CO=M[1].map(a=>({x:a[0],y:a[1],w:8,h:8}));M[2].forEach((p,k)=>{if(F[k])F[k].pts=p});M[3].forEach((t,k)=>{if(F[k])F[k].team=t});if(MP&&M[4]){MP.x=M[4][0]/10;MP.vx=Math.abs(MP.vx)*M[4][1]}if(HZ&&M[5]){HZ.ph=M[5][0];HZ.t=M[5][1];HZ.x=M[5][2]}}(o.B||[]).forEach((b,k)=>{const f=F[k];if(f)f.buf={spd:b&1,sh:b&2?1:0,ham:b&4?1:0,bomb:b&8?1:0}})}
function unsnap(a,f){f.x=a[0]/10;f.y=a[1]/10;f.vx=a[2]/10;f.vy=a[3]/10;f.face=a[4];f.dmg=a[5];f.stocks=a[6];f.out=!!(a[7]&1);f.ground=!!(a[7]&2);f.cpu=!!(a[7]&4);f.respawn=a[8];f.inv=a[9];f.atkT=a[10];f.dashT=a[11];f.hitstun=a[12];f.flash=a[13];return f}
return{ARENAS,T,PCOL,startFight,step,hitbox,onGround,snap,unsnap,snapX,unsnapX,rank,ITEM_KINDS,get items(){return IT},get hill(){return HILL},get coins(){return CO},get jackpot(){return opts.mode=='pit'?jackpot():0},get pitCap(){return pitCap()},get hillT(){return hillT},score,MODES,KOTH_GOAL,COIN_GOAL,get projs(){return PR},get mp(){return MP},get hz(){return HZ},
 get F(){return F},get map(){return map},get arena(){return arena},get WW(){return WW},get WH(){return WH},get readyT(){return readyT},get endT(){return endT},get winner(){return winner},get hitstop(){return hitstop},get timer(){return timer},get tick(){return tick},get opts(){return opts},
 setCPU(i,v){const f=F.find(f=>f.i==i);if(f)f.cpu=v}}}
const api={createCore,PRICES,STARTER,TIERS,tierOf,levelOf,CHALLENGES,chalAdd,ITEM_KINDS,ITEM_NAMES,MODES,COSMETICS,COS_CATS,COS_BY,cosParse,get ARENAS_N(){return this._an||(this._an=createCore({}).ARENAS.length)},bracketNew,bracketNext,bracketReport,bracketChamp,bracketRound};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PDBCore=api;
})(typeof window!=='undefined'?window:globalThis);
