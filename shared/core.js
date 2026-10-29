// Pixel Dudes Brawl - shared game simulation (runs in the browser AND on the Node server)
(function(root){
const PRICES=[0,0,0,0,200,200,200,250,250,250,300,300,300,350,350,350,400,400,450,450,500];
const STARTER=[0,1,2,3];
const TIERS=[['BRONZE',0,'#c77b3f'],['SILVER',1100,'#c0c8d8'],['GOLD',1200,'#fee761'],['PLATINUM',1300,'#7fe0d0'],['DIAMOND',1400,'#8fb8ff']];
const CHALLENGES=[{id:'play3',txt:'PLAY 3 MATCHES',n:3,r:40,k:'play'},{id:'kos10',txt:'LAND 10 KOS',n:10,r:50,k:'kos'},{id:'win2',txt:'WIN 2 MATCHES',n:2,r:60,k:'win'},
 {id:'onl2',txt:'PLAY 2 ONLINE MATCHES',n:2,r:50,k:'online'},{id:'owin',txt:'WIN AN ONLINE MATCH',n:1,r:80,k:'owin'},{id:'kos3m',txt:'GET 3 KOS IN ONE MATCH',n:1,r:60,k:'kos3'},
 {id:'flaw',txt:'WIN WITHOUT LOSING A STOCK',n:1,r:100,k:'flaw'},{id:'full4',txt:'PLAY A 4-FIGHTER MATCH',n:1,r:30,k:'four'}];
function chalAdd(c,e){switch(c.k){case 'play':return 1;case 'kos':return e.kos|0;case 'win':return e.won?1:0;case 'online':return e.online?1:0;case 'owin':return e.online&&e.won?1:0;
 case 'kos3':return (e.kos|0)>=3?1:0;case 'flaw':return e.flawless?1:0;case 'four':return e.players>=4?1:0;case 'mode':return e.mode==c.m?1:0;case 'modewin':return e.mode==c.m&&e.won?1:0}return 0}
const ITEM_KINDS=['bomb','speed','shield','heal','hammer'],ITEM_INT=[0,900,540,300],ITEM_NAMES=['OFF','LOW','MEDIUM','HIGH'];
function tierOf(r){let t=TIERS[0];for(const x of TIERS)if(r>=x[1])t=x;return t[0]}
function createCore(H){H=H||{};
const W=480,T=16;const PCOL=['#e04848','#4a8fe0','#fee761','#a1e55a'];
const SFX=new Proxy({},{get:(_,k)=>a=>{H.sfx&&H.sfx(k,a)}});
function addShake(v){H.shake&&H.shake(v)}
function burst(x,y,c,n,sp){H.burst&&H.burst(x,y,c,n,sp)}
let F=[],map=null,arena=0,WW=960,WH=544,readyT=0,endT=0,winner=null,hitstop=0,timer=0,tick=0,opts={stocks:3,diff:1,time:0};
let stageL=0,stageR=W,stageTop=0;let IT=[],PR=[],itemT=0;const rnd=H.rand||Math.random;
function build(w,h,ops){const g=[];for(let y=0;y<h;y++)g.push(Array(w).fill(' '));for(const [c,x0,x1,y0,y1] of ops)for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)g[y][x]=c;return g}
const ARENAS=[
{name:'MEADOW',map:build(60,34,[['#',8,51,25,26],['#',10,49,27,27],['#',13,46,28,28],['#',17,42,29,29],['#',26,33,24,24],['-',12,19,21,21],['-',40,47,21,21],['-',23,36,17,17],['-',8,14,13,13],['-',45,51,13,13],['-',26,33,9,9]]),sp:[[14,25],[24,24],[35,24],[45,25]],rs:[30,4]},
{name:'BRICK TOWERS',map:build(60,34,[['#',6,53,26,27],['#',9,50,28,28],['#',13,46,29,29],['=',14,16,22,25],['=',43,45,22,25],['-',6,13,19,19],['-',46,53,19,19],['=',24,35,18,18],['-',20,23,22,22],['-',36,39,22,22],['-',17,23,15,15],['-',36,42,15,15],['-',9,16,11,11],['-',43,50,11,11],['=',28,31,10,10],['-',25,34,6,6]]),sp:[[10,26],[22,26],[37,26],[49,26]],rs:[30,2]},
{name:'SKY ISLANDS',map:build(60,34,[['#',3,15,20,20],['#',4,14,21,21],['#',6,12,22,22],['#',44,56,20,20],['#',45,55,21,21],['#',47,53,22,22],['#',21,38,25,25],['#',22,37,26,26],['#',25,34,27,27],['#',27,32,28,28],['-',24,35,20,20],['-',17,22,15,15],['-',37,42,15,15],['#',9,14,11,11],['#',45,50,11,11],['-',26,33,11,11]]),sp:[[8,20],[25,25],[34,25],[51,20]],rs:[30,3]},
{name:'GRAND BRIDGE',map:build(72,38,[['#',3,22,24,27],['#',5,20,28,29],['#',8,17,30,30],['#',49,68,24,27],['#',51,66,28,29],['#',54,63,30,30],['-',23,48,24,24],['#',29,42,31,31],['#',31,40,32,32],['-',8,16,19,19],['-',55,63,19,19],['=',33,38,19,19],['-',25,31,14,14],['-',40,46,14,14],['-',11,18,12,12],['-',53,60,12,12],['-',32,39,9,9]]),sp:[[8,24],[19,24],[52,24],[63,24]],rs:[36,3]}];
const solidCh=c=>c=='#'||c=='=';
function tileAt(x,y){const r=map[Math.floor(y/T)];if(!r)return ' ';return r[Math.floor(x/T)]||' '}
const solid=(x,y)=>solidCh(tileAt(x,y));
function overlapSolid(o){const xs=[o.x,o.x+o.w/2,o.x+o.w-.01],ys=[o.y,o.y+o.h/3,o.y+o.h*2/3,o.y+o.h-.01];for(const x of xs)for(const y of ys)if(solid(x,y))return true;return false}
function moveX(o){o.x+=o.vx;if(overlapSolid(o)){const s=Math.sign(o.vx);o.x-=o.vx;let n=0;while(n++<60&&!(o.x+=s*.25,overlapSolid(o))){}o.x-=s*.25;o.vx=0}}
function moveY(o){const ob=o.y+o.h;o.y+=o.vy;let landed=false;if(overlapSolid(o)){const s=Math.sign(o.vy);o.y-=o.vy;let n=0;while(n++<60&&!(o.y+=s*.25,overlapSolid(o))){}o.y-=s*.25;if(s>0)landed=true;o.vy=0}
 else if(o.vy>0&&o.dropT<=0){const r=Math.floor((o.y+o.h)/T),top=r*T;if(ob<=top+.01&&(tileAt(o.x+1,top+1)=='-'||tileAt(o.x+o.w-1,top+1)=='-')){o.y=top-o.h;o.vy=0;landed=true}}return landed}
function onGround(o){const yb=o.y+o.h+.5;if(solid(o.x+1,yb)||solid(o.x+o.w-1,yb))return true;if(o.dropT<=0&&Math.abs((o.y+o.h)%T)<.01&&(tileAt(o.x+1,yb)=='-'||tileAt(o.x+o.w-1,yb)=='-'))return 'plat';return false}
function spawn(f,first){const A=ARENAS[arena],s=A.sp[f.i];f.x=first?s[0]*T+3:A.rs[0]*T-5+(f.i-1.5)*24;f.y=first?s[1]*T-f.h:A.rs[1]*T;f.vx=f.vy=0;f.dmg=first?0:0;f.inv=first?0:120;f.jumps=1;f.hitstun=0;f.atkT=f.dashT=0;f.airDash=true;if(!first)SFX.respawn()}
function hitbox(f){if(f.atkT>=8&&f.atkT<=14&&f.buf&&f.buf.ham>0)return{x:f.face>0?f.x+f.w-2:f.x-22,y:f.y,w:24,h:16,ham:1,p:{dmg:14,base:3.6,grow:.12,ang:.8}};if(f.atkT>=8&&f.atkT<=14)return{x:f.face>0?f.x+f.w-2:f.x-14,y:f.y+3,w:16,h:12,p:{dmg:8,base:2.6,grow:.085,ang:.75}};
 if(f.dashT>2)return{x:f.x-3+f.face*4,y:f.y,w:f.w+6,h:f.h,p:{dmg:11,base:3.4,grow:.1,ang:.5}};return null}
function ov(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y}
function doHits(f){const hb=hitbox(f);if(!hb)return;for(const g of F){if(g==f||g.out||g.respawn>0||g.inv>0||f.hit.has(g))continue;if(!ov(hb,g))continue;f.hit.add(g);if(friendly(f,g))continue;if(g.buf.sh>0){g.buf.sh=0;burst(g.x+5,g.y+10,'#7fe0d0',12,2);SFX.land();f.vx=-f.face*2;continue}const p=hb.p;g.dmg+=p.dmg;
 const kb=p.base+g.dmg*p.grow*(g.ground?1:1.1),dir=f.face;g.vx=dir*kb*Math.cos(p.ang);g.vy=-kb*Math.sin(p.ang)-1;g.lastHit=f.i;g.hitstun=Math.floor(6+kb*3.5);g.flash=8;g.face=-dir;g.atkT=g.dashT=0;g.ground=false;
 hitstop=Math.max(hitstop,Math.min(8,Math.floor(3+kb*.7)));addShake(2+kb*.8);burst(g.x+g.w/2,g.y+8,'#ffffff',6+kb|0,1+kb*.3);burst(g.x+g.w/2,g.y+8,PCOL[f.i],4,2);SFX.hit(kb);if(f.dashT>0)f.dashT=Math.min(f.dashT,3)}}
function updF(f,inp){if(f.out)return;if(f.respawn>0){if(--f.respawn==0)spawn(f);return}const B=f.buf;if(B.spd>0)B.spd--;if(B.sh>0)B.sh--;if(B.ham>0)B.ham--;
 if(f.inv>0)f.inv--;if(f.flash>0)f.flash--;if(f.dashCd>0)f.dashCd--;if(f.dropT>0)f.dropT--;
 const g=onGround(f);f.ground=!!g;if(f.ground){f.jumps=1;f.ff=false;f.airDash=true}
 if(readyT>0)inp={};
 if(f.hitstun>0){f.hitstun--;f.vx*=f.ground?.85:.985;if(f.hitstun%3==0)H.part&&H.part(f.x+5,f.y+10)}
 else{const mv=(inp.r?1:0)-(inp.l?1:0);
  if(f.dashT<=0){const tv=mv*2.3*(f.buf.spd>0?1.45:1),ac=f.atkT>0?(f.ground?.4:.05):(f.ground?.35:.14);f.vx+=(tv-f.vx)*ac;if(mv&&f.atkT<=0)f.face=mv}
  if(inp.upE&&f.dashT<=0){if(f.ground){f.vy=f.buf.spd>0?-6.4:-5.8;SFX.jump();burst(f.x+5,f.y+f.h,'#d8dde6',4,1)}else if(f.jumps>0){f.jumps--;f.vy=-5.2;f.ff=false;SFX.dj();burst(f.x+5,f.y+f.h,'#ffffff',6,1.2)}}
  if(!f.ground&&inp.dE&&f.vy>-1){f.ff=true}
  if(g=='plat'&&inp.dE){f.dropT=12;f.y+=1;f.ground=false}
  if(inp.ap&&f.atkT<=0&&f.dashT<=0&&f.buf.bomb){f.buf.bomb=0;f.atkT=7;PR.push({x:f.x+5+f.face*6,y:f.y+4,vx:f.face*4.2+f.vx*.4,vy:-3.2,o:f.i,t:0});SFX.swing()}
  else if(inp.ap&&f.atkT<=0&&f.dashT<=0){f.atkT=20;f.hit=new Set();f.vx+=f.face*1.2;SFX.swing()}
  if(inp.sp&&f.dashCd<=0&&f.atkT<=0&&(f.ground||f.airDash)){if(mv)f.face=mv;f.dashT=14;f.dashCd=45;if(!f.ground){f.airDash=false;f.vy=Math.min(f.vy,-1)}f.hit=new Set();SFX.dash()}}
 if(f.atkT>0)f.atkT--;
 if(f.dashT>0){f.dashT--;f.vx=f.face*(f.dashT>3?6.5:3);f.vy*=.6;f.trail.unshift([f.x,f.y]);if(f.trail.length>4)f.trail.pop()}else if(f.trail.length)f.trail.pop();
 f.vy+=f.dashT>0?.05:(f.ff?.6:.35);f.vy=Math.min(f.vy,f.ff?7.5:5);
 const vy0=f.vy;moveX(f);if(moveY(f)){f.ground=true;if(vy0>2.6)SFX.land()}f.anim+=Math.abs(f.vx)*.1;
 if(f.hit)doHits(f);
 if(f.x<-96||f.x>WW+96||f.y>WH+64||f.y<-220){f.stocks--;SFX.ko();addShake(10);H.ko&&H.ko(f);if(f.lastHit!=null&&f.lastHit!=f.i)H.kill&&H.kill(f.lastHit,f.i);f.lastHit=null;f.buf={spd:0,sh:0,ham:0,bomb:0};if(f.stocks<=0){f.out=true}else f.respawn=60;f.vx=f.vy=0;f.dmg=0}}
function stageBounds(){let l=99,r=0,tp=99;map.forEach((row,y)=>row.forEach((c,x)=>{if(c!=' '){l=Math.min(l,x);r=Math.max(r,x);if(solidCh(c))tp=Math.min(tp,y)}}));stageL=l*T;stageR=(r+1)*T;stageTop=tp*T}
function groundBelow(x,y){const tx=Math.floor(x/T);if(tx<0||tx>=map[0].length)return -1;for(let ty=Math.max(0,Math.floor(y/T));ty<map.length;ty++){if(map[ty][tx]!=' ')return ty}return -1}
function safeX(cx,y,pref){if(pref){for(let d=0;d<16;d++){const x=cx+pref*d*T;if(groundBelow(x,y)>=0)return x+pref*T}}for(let d=0;d<50;d++)for(const s of [1,-1]){const x=cx+s*d*T;if(groundBelow(x,y)>=0)return x+s*T}return WW/2}
function ai(f){const DF=[.45,1,1.7][opts.diff]||1;const o={l:0,r:0,u:0,d:0,upE:0,dE:0,ap:0,sp:0};const A=f.ai;A.j--;
 const cx=f.x+5,feet=f.y+f.h;
 if(!f.ground&&groundBelow(cx,feet)<0){if(A.gapT>0)A.gapT--;const sx=safeX(cx,Math.max(0,f.y-48),A.gapT>0?A.gapDir:0),dir=sx>cx?1:-1;if(dir>0)o.r=1;else o.l=1;
  if(f.vy>0.3&&f.jumps>0&&A.j<=0){o.upE=1;A.j=12}else if(f.jumps==0&&f.vy>0.5&&f.airDash&&f.dashCd<=0&&Math.abs(sx-cx)>24){f.face=dir;o.sp=1}return o}
 for(const it of IT){const dx=it.x-f.x,dy=it.y-f.y;if(Math.abs(dx)<90&&Math.abs(dy)<24&&!(ITEM_KINDS[it.k]=='bomb'&&f.buf.bomb)){if(dx>4)o.r=1;else if(dx<-4)o.l=1;return o}}
 let tg=null,bd=1e9;for(const g of F){if(g==f||g.out||g.respawn>0||friendly(f,g)||(opts.teams&&g.team==f.team))continue;const d=Math.hypot(g.x-f.x,g.y-f.y);if(d<bd){bd=d;tg=g}}if(!tg)return o;
 const dx=tg.x-f.x,dy=tg.y-f.y,R=Math.random()/DF;if(opts.diff==0&&A.last&&Math.random()<.4)return A.last;A.last=o;
 if(Math.abs(dx)>12){if(dx>0)o.r=1;else o.l=1}
 if(f.ground&&(o.r||o.l)){const nx=cx+(o.r?14:-14);if(groundBelow(nx,feet)<0){if(tg.y+tg.h<=feet+8&&Math.abs(dx)<260&&A.j<=0&&groundBelow(cx+(o.r?1:-1)*Math.min(Math.abs(dx),150),feet-40)>=0){o.upE=1;A.j=25;A.gapDir=o.r?1:-1;A.gapT=50}else o.l=o.r=0}}
 if((o.r||o.l)&&solid(cx+(o.r?9:-9),f.y+10)){if(f.ground&&A.j<=0){o.upE=1;A.j=14;A.gapDir=o.r?1:-1;A.gapT=40}else if(!f.ground&&f.vy>0&&f.jumps>0&&A.j<=0){o.upE=1;A.j=14}}
 const ceil=x=>{for(let yy=f.y-8;yy>f.y-72;yy-=8)if(solid(x-7,yy)||solid(x+7,yy))return true;return false};if(dy<-24&&Math.abs(dx)<140&&ceil(cx)){for(let d=1;d<14;d++){if(!ceil(cx+d*T)){o.r=1;o.l=0;break}if(!ceil(cx-d*T)){o.l=1;o.r=0;break}}}
 if(dy<-24&&f.ground&&A.j<=0&&R<.25){o.upE=1;A.j=18}else if(dy<-30&&!f.ground&&f.vy>0&&f.jumps>0&&A.j<=0){o.upE=1;A.j=18}
 if(dy>24&&f.ground&&onGround(f)=='plat'&&R<.08)o.dE=1;
 if(f.buf.bomb&&Math.abs(dx)>30&&Math.abs(dx)<110&&Math.abs(dy)<30&&R<.08&&f.atkT<=0){f.face=dx>0?1:-1;o.ap=1}
 else if(Math.abs(dx)<22&&Math.abs(dy)<16&&R<.22&&tg.inv<=0){f.face=dx>0?1:-1;o.l=o.r=0;o.ap=1}
 else if(Math.abs(dx)>40&&Math.abs(dx)<120&&Math.abs(dy)<10&&f.dashCd<=0&&R<.03&&f.ground&&groundBelow(cx+(dx>0?60:-60),feet)>=0){f.face=dx>0?1:-1;o.sp=1}
 if(R>.995&&f.ground){o.upE=1}return o}
function startFight(slots,ar,o){opts=Object.assign({stocks:3,diff:1,time:0,items:0,ff:true},o||{});arena=ar;map=ARENAS[arena].map;WW=map[0].length*T;WH=map.length*T;stageBounds();F=[];
 slots.forEach((s,i)=>{if(!s||s.type=='none')return;const f={i,cpu:s.type=='cpu',skin:s.skin,name:s.name||'',x:0,y:0,w:10,h:20,vx:0,vy:0,face:i<2?1:-1,dmg:0,stocks:opts.stocks,out:false,respawn:0,inv:0,jumps:1,atkT:0,dashT:0,dashCd:0,airDash:true,hitstun:0,flash:0,dropT:0,ground:false,ff:false,hit:null,trail:[],anim:0,ai:{j:0},lastHit:null,buf:{spd:0,sh:0,ham:0,bomb:0},team:s.team!=null?s.team:i};spawn(f,true);F.push(f)});
 readyT=100;endT=0;winner=null;hitstop=0;timer=opts.time||0;tick=0;IT=[];PR=[];itemT=Math.round((ITEM_INT[opts.items|0]||0)*.5)}
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
 for(let n=PR.length-1;n>=0;n--){const p=PR[n];p.t++;p.vy=Math.min(6,p.vy+.22);p.x+=p.vx;p.y+=p.vy;let boom=p.t>150||solid(p.x,p.y)||(p.vy>0&&tileAt(p.x,p.y)=='-');
  if(!boom)for(const g of F){if(g.i==p.o&&p.t<20||g.out||g.respawn>0)continue;if(p.x>g.x-2&&p.x<g.x+g.w+2&&p.y>g.y-2&&p.y<g.y+g.h+2){boom=true;break}}
  if(boom){explode(p.x,p.y,p.o);PR.splice(n,1)}else if(p.y>WH+60||p.x<-200||p.x>WW+200)PR.splice(n,1)}}
function rank(){return F.slice().sort((a,b)=>(b.out?0:b.stocks)-(a.out?0:a.stocks)||a.dmg-b.dmg)}
function step(getInp){tick++;if(readyT>0){readyT--;if(readyT==99||readyT==65)SFX.count();if(readyT==30)SFX.go()}
 if(hitstop>0)hitstop--;else{for(const f of F)updF(f,f.cpu?ai(f):(getInp(f.i)||{}));stepItems()}
 if(timer>0&&readyT<=0&&!endT){timer--;if(timer==0){const r=rank();winner=(r.length>1&&r[0].stocks==r[1].stocks&&r[0].dmg==r[1].dmg)?null:r[0];endT=90;SFX.game()}}
 const alive=F.filter(f=>!f.out);if(alive.length<=1&&!endT){endT=90;winner=alive[0]||null;SFX.game()}
 if(endT&&--endT==0)return 'win';return null}
// compact snapshot for the network
function snap(){return F.map(f=>[Math.round(f.x*10),Math.round(f.y*10),Math.round(f.vx*10),Math.round(f.vy*10),f.face,Math.round(f.dmg),f.stocks,(f.out?1:0)|(f.ground?2:0)|(f.cpu?4:0),f.respawn,f.inv,f.atkT,f.dashT,f.hitstun,f.flash])}
function snapX(){return {I:IT.map(i=>[i.k,Math.round(i.x),Math.round(i.y),i.life]),P:PR.map(p=>[Math.round(p.x),Math.round(p.y)]),B:F.map(f=>(f.buf.spd>0?1:0)|(f.buf.sh>0?2:0)|(f.buf.ham>0?4:0)|(f.buf.bomb?8:0))}}
function unsnapX(o){if(!o)return;IT=(o.I||[]).map(a=>({k:a[0],x:a[1],y:a[2],w:10,h:10,vy:0,life:a[3]}));PR=(o.P||[]).map(a=>({x:a[0],y:a[1]}));(o.B||[]).forEach((b,k)=>{const f=F[k];if(f)f.buf={spd:b&1,sh:b&2?1:0,ham:b&4?1:0,bomb:b&8?1:0}})}
function unsnap(a,f){f.x=a[0]/10;f.y=a[1]/10;f.vx=a[2]/10;f.vy=a[3]/10;f.face=a[4];f.dmg=a[5];f.stocks=a[6];f.out=!!(a[7]&1);f.ground=!!(a[7]&2);f.cpu=!!(a[7]&4);f.respawn=a[8];f.inv=a[9];f.atkT=a[10];f.dashT=a[11];f.hitstun=a[12];f.flash=a[13];return f}
return{ARENAS,T,PCOL,startFight,step,hitbox,onGround,snap,unsnap,snapX,unsnapX,rank,ITEM_KINDS,get items(){return IT},get projs(){return PR},
 get F(){return F},get map(){return map},get arena(){return arena},get WW(){return WW},get WH(){return WH},get readyT(){return readyT},get endT(){return endT},get winner(){return winner},get hitstop(){return hitstop},get timer(){return timer},get tick(){return tick},get opts(){return opts},
 setCPU(i,v){const f=F.find(f=>f.i==i);if(f)f.cpu=v}}}
const api={createCore,PRICES,STARTER,TIERS,tierOf,CHALLENGES,chalAdd,ITEM_KINDS,ITEM_NAMES};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PDBCore=api;
})(typeof window!=='undefined'?window:globalThis);
