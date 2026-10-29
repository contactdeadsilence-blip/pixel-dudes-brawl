// Pixel Dudes Brawl - shared game simulation (runs in the browser AND on the Node server)
(function(root){
const PRICES=[0,0,0,0,150,150,150,200,200,200,250,250,250,300,300,300,400,400,500,500,750];
const STARTER=[0,1,2,3];
function createCore(H){H=H||{};
const W=480,T=16;const PCOL=['#e04848','#4a8fe0','#fee761','#a1e55a'];
const SFX=new Proxy({},{get:(_,k)=>a=>{H.sfx&&H.sfx(k,a)}});
function addShake(v){H.shake&&H.shake(v)}
function burst(x,y,c,n,sp){H.burst&&H.burst(x,y,c,n,sp)}
let F=[],map=null,arena=0,WW=960,WH=544,readyT=0,endT=0,winner=null,hitstop=0,timer=0,tick=0,opts={stocks:3,diff:1,time:0};
let stageL=0,stageR=W,stageTop=0;
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
function hitbox(f){if(f.atkT>=8&&f.atkT<=14)return{x:f.face>0?f.x+f.w-2:f.x-14,y:f.y+3,w:16,h:12,p:{dmg:8,base:2.6,grow:.085,ang:.75}};
 if(f.dashT>2)return{x:f.x-3+f.face*4,y:f.y,w:f.w+6,h:f.h,p:{dmg:11,base:3.4,grow:.1,ang:.5}};return null}
function ov(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y}
function doHits(f){const hb=hitbox(f);if(!hb)return;for(const g of F){if(g==f||g.out||g.respawn>0||g.inv>0||f.hit.has(g))continue;if(!ov(hb,g))continue;f.hit.add(g);const p=hb.p;g.dmg+=p.dmg;
 const kb=p.base+g.dmg*p.grow*(g.ground?1:1.1),dir=f.face;g.vx=dir*kb*Math.cos(p.ang);g.vy=-kb*Math.sin(p.ang)-1;g.lastHit=f.i;g.hitstun=Math.floor(6+kb*3.5);g.flash=8;g.face=-dir;g.atkT=g.dashT=0;g.ground=false;
 hitstop=Math.max(hitstop,Math.min(8,Math.floor(3+kb*.7)));addShake(2+kb*.8);burst(g.x+g.w/2,g.y+8,'#ffffff',6+kb|0,1+kb*.3);burst(g.x+g.w/2,g.y+8,PCOL[f.i],4,2);SFX.hit(kb);if(f.dashT>0)f.dashT=Math.min(f.dashT,3)}}
function updF(f,inp){if(f.out)return;if(f.respawn>0){if(--f.respawn==0)spawn(f);return}
 if(f.inv>0)f.inv--;if(f.flash>0)f.flash--;if(f.dashCd>0)f.dashCd--;if(f.dropT>0)f.dropT--;
 const g=onGround(f);f.ground=!!g;if(f.ground){f.jumps=1;f.ff=false;f.airDash=true}
 if(readyT>0)inp={};
 if(f.hitstun>0){f.hitstun--;f.vx*=f.ground?.85:.985;if(f.hitstun%3==0)H.part&&H.part(f.x+5,f.y+10)}
 else{const mv=(inp.r?1:0)-(inp.l?1:0);
  if(f.dashT<=0){const tv=mv*2.3,ac=f.atkT>0?(f.ground?.4:.05):(f.ground?.35:.14);f.vx+=(tv-f.vx)*ac;if(mv&&f.atkT<=0)f.face=mv}
  if(inp.upE&&f.dashT<=0){if(f.ground){f.vy=-5.8;SFX.jump();burst(f.x+5,f.y+f.h,'#d8dde6',4,1)}else if(f.jumps>0){f.jumps--;f.vy=-5.2;f.ff=false;SFX.dj();burst(f.x+5,f.y+f.h,'#ffffff',6,1.2)}}
  if(!f.ground&&inp.dE&&f.vy>-1){f.ff=true}
  if(g=='plat'&&inp.dE){f.dropT=12;f.y+=1;f.ground=false}
  if(inp.ap&&f.atkT<=0&&f.dashT<=0){f.atkT=20;f.hit=new Set();f.vx+=f.face*1.2;SFX.swing()}
  if(inp.sp&&f.dashCd<=0&&f.atkT<=0&&(f.ground||f.airDash)){if(mv)f.face=mv;f.dashT=14;f.dashCd=45;if(!f.ground){f.airDash=false;f.vy=Math.min(f.vy,-1)}f.hit=new Set();SFX.dash()}}
 if(f.atkT>0)f.atkT--;
 if(f.dashT>0){f.dashT--;f.vx=f.face*(f.dashT>3?6.5:3);f.vy*=.6;f.trail.unshift([f.x,f.y]);if(f.trail.length>4)f.trail.pop()}else if(f.trail.length)f.trail.pop();
 f.vy+=f.dashT>0?.05:(f.ff?.6:.35);f.vy=Math.min(f.vy,f.ff?7.5:5);
 const vy0=f.vy;moveX(f);if(moveY(f)){f.ground=true;if(vy0>2.6)SFX.land()}f.anim+=Math.abs(f.vx)*.1;
 if(f.hit)doHits(f);
 if(f.x<-96||f.x>WW+96||f.y>WH+64||f.y<-220){f.stocks--;SFX.ko();addShake(10);H.ko&&H.ko(f);if(f.lastHit!=null&&f.lastHit!=f.i)H.kill&&H.kill(f.lastHit,f.i);f.lastHit=null;if(f.stocks<=0){f.out=true}else f.respawn=60;f.vx=f.vy=0;f.dmg=0}}
function stageBounds(){let l=99,r=0,tp=99;map.forEach((row,y)=>row.forEach((c,x)=>{if(c!=' '){l=Math.min(l,x);r=Math.max(r,x);if(solidCh(c))tp=Math.min(tp,y)}}));stageL=l*T;stageR=(r+1)*T;stageTop=tp*T}
function groundBelow(x,y){const tx=Math.floor(x/T);if(tx<0||tx>=map[0].length)return -1;for(let ty=Math.max(0,Math.floor(y/T));ty<map.length;ty++){if(map[ty][tx]!=' ')return ty}return -1}
function safeX(cx,y,pref){if(pref){for(let d=0;d<16;d++){const x=cx+pref*d*T;if(groundBelow(x,y)>=0)return x+pref*T}}for(let d=0;d<50;d++)for(const s of [1,-1]){const x=cx+s*d*T;if(groundBelow(x,y)>=0)return x+s*T}return WW/2}
function ai(f){const DF=[.45,1,1.7][opts.diff]||1;const o={l:0,r:0,u:0,d:0,upE:0,dE:0,ap:0,sp:0};const A=f.ai;A.j--;
 const cx=f.x+5,feet=f.y+f.h;
 if(!f.ground&&groundBelow(cx,feet)<0){if(A.gapT>0)A.gapT--;const sx=safeX(cx,Math.max(0,f.y-48),A.gapT>0?A.gapDir:0),dir=sx>cx?1:-1;if(dir>0)o.r=1;else o.l=1;
  if(f.vy>0.3&&f.jumps>0&&A.j<=0){o.upE=1;A.j=12}else if(f.jumps==0&&f.vy>0.5&&f.airDash&&f.dashCd<=0&&Math.abs(sx-cx)>24){f.face=dir;o.sp=1}return o}
 let tg=null,bd=1e9;for(const g of F){if(g==f||g.out||g.respawn>0)continue;const d=Math.hypot(g.x-f.x,g.y-f.y);if(d<bd){bd=d;tg=g}}if(!tg)return o;
 const dx=tg.x-f.x,dy=tg.y-f.y,R=Math.random()/DF;if(opts.diff==0&&A.last&&Math.random()<.4)return A.last;A.last=o;
 if(Math.abs(dx)>12){if(dx>0)o.r=1;else o.l=1}
 if(f.ground&&(o.r||o.l)){const nx=cx+(o.r?14:-14);if(groundBelow(nx,feet)<0){if(tg.y+tg.h<=feet+8&&Math.abs(dx)<260&&A.j<=0&&groundBelow(cx+(o.r?1:-1)*Math.min(Math.abs(dx),150),feet-40)>=0){o.upE=1;A.j=25;A.gapDir=o.r?1:-1;A.gapT=50}else o.l=o.r=0}}
 if((o.r||o.l)&&solid(cx+(o.r?9:-9),f.y+10)){if(f.ground&&A.j<=0){o.upE=1;A.j=14;A.gapDir=o.r?1:-1;A.gapT=40}else if(!f.ground&&f.vy>0&&f.jumps>0&&A.j<=0){o.upE=1;A.j=14}}
 const ceil=x=>{for(let yy=f.y-8;yy>f.y-72;yy-=8)if(solid(x-7,yy)||solid(x+7,yy))return true;return false};if(dy<-24&&Math.abs(dx)<140&&ceil(cx)){for(let d=1;d<14;d++){if(!ceil(cx+d*T)){o.r=1;o.l=0;break}if(!ceil(cx-d*T)){o.l=1;o.r=0;break}}}
 if(dy<-24&&f.ground&&A.j<=0&&R<.25){o.upE=1;A.j=18}else if(dy<-30&&!f.ground&&f.vy>0&&f.jumps>0&&A.j<=0){o.upE=1;A.j=18}
 if(dy>24&&f.ground&&onGround(f)=='plat'&&R<.08)o.dE=1;
 if(Math.abs(dx)<22&&Math.abs(dy)<16&&R<.22&&tg.inv<=0){f.face=dx>0?1:-1;o.l=o.r=0;o.ap=1}
 else if(Math.abs(dx)>40&&Math.abs(dx)<120&&Math.abs(dy)<10&&f.dashCd<=0&&R<.03&&f.ground&&groundBelow(cx+(dx>0?60:-60),feet)>=0){f.face=dx>0?1:-1;o.sp=1}
 if(R>.995&&f.ground){o.upE=1}return o}
function startFight(slots,ar,o){opts=Object.assign({stocks:3,diff:1,time:0},o||{});arena=ar;map=ARENAS[arena].map;WW=map[0].length*T;WH=map.length*T;stageBounds();F=[];
 slots.forEach((s,i)=>{if(!s||s.type=='none')return;const f={i,cpu:s.type=='cpu',skin:s.skin,name:s.name||'',x:0,y:0,w:10,h:20,vx:0,vy:0,face:i<2?1:-1,dmg:0,stocks:opts.stocks,out:false,respawn:0,inv:0,jumps:1,atkT:0,dashT:0,dashCd:0,airDash:true,hitstun:0,flash:0,dropT:0,ground:false,ff:false,hit:null,trail:[],anim:0,ai:{j:0},lastHit:null};spawn(f,true);F.push(f)});
 readyT=100;endT=0;winner=null;hitstop=0;timer=opts.time||0;tick=0}
function rank(){return F.slice().sort((a,b)=>(b.out?0:b.stocks)-(a.out?0:a.stocks)||a.dmg-b.dmg)}
function step(getInp){tick++;if(readyT>0){readyT--;if(readyT==99||readyT==65)SFX.count();if(readyT==30)SFX.go()}
 if(hitstop>0)hitstop--;else for(const f of F)updF(f,f.cpu?ai(f):(getInp(f.i)||{}));
 if(timer>0&&readyT<=0&&!endT){timer--;if(timer==0){const r=rank();winner=(r.length>1&&r[0].stocks==r[1].stocks&&r[0].dmg==r[1].dmg)?null:r[0];endT=90;SFX.game()}}
 const alive=F.filter(f=>!f.out);if(alive.length<=1&&!endT){endT=90;winner=alive[0]||null;SFX.game()}
 if(endT&&--endT==0)return 'win';return null}
// compact snapshot for the network
function snap(){return F.map(f=>[Math.round(f.x*10),Math.round(f.y*10),Math.round(f.vx*10),Math.round(f.vy*10),f.face,Math.round(f.dmg),f.stocks,(f.out?1:0)|(f.ground?2:0)|(f.cpu?4:0),f.respawn,f.inv,f.atkT,f.dashT,f.hitstun,f.flash])}
function unsnap(a,f){f.x=a[0]/10;f.y=a[1]/10;f.vx=a[2]/10;f.vy=a[3]/10;f.face=a[4];f.dmg=a[5];f.stocks=a[6];f.out=!!(a[7]&1);f.ground=!!(a[7]&2);f.cpu=!!(a[7]&4);f.respawn=a[8];f.inv=a[9];f.atkT=a[10];f.dashT=a[11];f.hitstun=a[12];f.flash=a[13];return f}
return{ARENAS,T,PCOL,startFight,step,hitbox,onGround,snap,unsnap,rank,
 get F(){return F},get map(){return map},get arena(){return arena},get WW(){return WW},get WH(){return WH},get readyT(){return readyT},get endT(){return endT},get winner(){return winner},get hitstop(){return hitstop},get timer(){return timer},get tick(){return tick},get opts(){return opts},
 setCPU(i,v){const f=F.find(f=>f.i==i);if(f)f.cpu=v}}}
const api={createCore,PRICES,STARTER};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PDBCore=api;
})(typeof window!=='undefined'?window:globalThis);
