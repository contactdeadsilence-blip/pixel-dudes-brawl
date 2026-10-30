const cv=document.getElementById('c');let ctx=cv.getContext('2d');ctx.imageSmoothingEnabled=false;
const W=480,H=270,T=16,FW=16,FH=24;let camX=0,t=0;
const NAMES=["GECKO","GRAPE","ROSE","LEMON","PUMPKIN","SUNNY","SWAMPY","CHOMPY","LEAFY","SKULLY","HORNS","VIKING","TOPHAT","GINGER","SPROUT","IMP","PIRATE","GRUMPY","PEACH","BANANA","NINJA","ROBO","ZOMBIE","WIZARD","ASTRO","KNIGHT","COWBOY","ALIEN","CHEF","GHOST","FROSTY","LAVA","PANDA","GARFIELD","MARSHMALLOW","MOCHI"];const NS=NAMES.length,GC=12;
const imgs=SKINS.map(s=>{const i=new Image();i.src=s;return i});let whites=[];
const PCOL=['#e04848','#4a8fe0','#fee761','#a1e55a'];
let AC=null;function snd(f1,f2,d,type='square',v=.12){try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();const o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.setValueAtTime(f1,AC.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(20,f2),AC.currentTime+d);g.gain.setValueAtTime(v,AC.currentTime);g.gain.exponentialRampToValueAtTime(.001,AC.currentTime+d);o.connect(g);g.connect(AC.destination);o.start();o.stop(AC.currentTime+d)}catch(e){}}
const SFX={jump:()=>snd(300,600,.1),dj:()=>snd(450,900,.1),swing:()=>snd(800,300,.06,'triangle'),dash:()=>snd(200,900,.15,'sawtooth',.08),hit:k=>{snd(220-k*8,60,.12+k*.01,'square',.18)},ko:()=>{snd(600,40,.6,'sawtooth',.2)},sel:()=>snd(600,600,.05),go:()=>{[523,784].forEach((f,i)=>setTimeout(()=>snd(f,f,.15),i*100))}};
__ART__
PAL.p='#c8a070';
const PLANK=spr(["oooooooooooooooo","oeeeeeeeeeeeeeeo","oDDDDDDoDDDDDDDo","oddddddoddddddd o".replace(' ',''),"oooooooooooooooo","..o.........o...","..o.........o...","................","................","................","................","................","................","................","................","................"]);
const PUFF=spr(["..oo..",".owwo.","owwwwo","owwwwo",".owwo.","..oo.."]);
FONT['\u2191']="010111010010010";FONT['\u2193']="010010010111010";FONT['%']="101001010100101";FONT['/']="001001010100100";FONT['?']="110001010000010";FONT['+']="000010111010000";FONT['\u2190']="001011111011001";FONT['\u2192']="100110111110100";
// ===== Arenas =====
function build(w,h,ops){const g=[];for(let y=0;y<h;y++)g.push(Array(w).fill(' '));for(const [c,x0,x1,y0,y1] of ops)for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)g[y][x]=c;return g}
const ARENAS=[
{name:'MEADOW',map:build(60,34,[['#',8,51,25,26],['#',10,49,27,27],['#',13,46,28,28],['#',17,42,29,29],['#',26,33,24,24],['-',12,19,21,21],['-',40,47,21,21],['-',23,36,17,17],['-',8,14,13,13],['-',45,51,13,13],['-',26,33,9,9]]),sp:[[14,25],[24,24],[35,24],[45,25]],rs:[30,4]},
{name:'BRICK TOWERS',map:build(60,34,[['#',6,53,26,27],['#',9,50,28,28],['#',13,46,29,29],['=',14,16,19,25],['=',43,45,19,25],['-',6,13,21,21],['-',46,53,21,21],['=',24,35,18,18],['-',17,23,15,15],['-',36,42,15,15],['-',9,16,11,11],['-',43,50,11,11],['=',28,31,10,10],['-',25,34,6,6]]),sp:[[10,26],[22,26],[37,26],[49,26]],rs:[30,2]},
{name:'SKY ISLANDS',map:build(60,34,[['#',3,15,20,20],['#',4,14,21,21],['#',6,12,22,22],['#',44,56,20,20],['#',45,55,21,21],['#',47,53,22,22],['#',21,38,25,25],['#',22,37,26,26],['#',25,34,27,27],['#',27,32,28,28],['-',24,35,19,19],['-',17,22,14,14],['-',37,42,14,14],['#',9,14,11,11],['#',45,50,11,11],['-',26,33,8,8]]),sp:[[8,20],[25,25],[34,25],[51,20]],rs:[30,3]},
{name:'GRAND BRIDGE',map:build(72,38,[['#',3,22,24,27],['#',5,20,28,29],['#',8,17,30,30],['#',49,68,24,27],['#',51,66,28,29],['#',54,63,30,30],['-',23,48,24,24],['#',29,42,31,31],['#',31,40,32,32],['-',8,16,19,19],['-',55,63,19,19],['=',33,38,18,18],['-',25,31,14,14],['-',40,46,14,14],['-',11,18,12,12],['-',53,60,12,12],['-',32,39,8,8]]),sp:[[8,24],[19,24],[52,24],[63,24]],rs:[36,3]}];
let WW=960,WH=544;
let map=ARENAS[0].map,arena=0;
const solidCh=c=>c=='#'||c=='=';
function tileAt(x,y){const r=map[Math.floor(y/T)];if(!r)return ' ';return r[Math.floor(x/T)]||' '}
const solid=(x,y)=>solidCh(tileAt(x,y));
function overlapSolid(o){const xs=[o.x,o.x+o.w/2,o.x+o.w-.01],ys=[o.y,o.y+o.h/3,o.y+o.h*2/3,o.y+o.h-.01];for(const x of xs)for(const y of ys)if(solid(x,y))return true;return false}
function moveX(o){o.x+=o.vx;if(overlapSolid(o)){const s=Math.sign(o.vx);o.x-=o.vx;let n=0;while(n++<60&&!(o.x+=s*.25,overlapSolid(o))){}o.x-=s*.25;o.vx=0}}
function moveY(o){const ob=o.y+o.h;o.y+=o.vy;let landed=false;if(overlapSolid(o)){const s=Math.sign(o.vy);o.y-=o.vy;let n=0;while(n++<60&&!(o.y+=s*.25,overlapSolid(o))){}o.y-=s*.25;if(s>0)landed=true;o.vy=0}
 else if(o.vy>0&&o.dropT<=0){const r=Math.floor((o.y+o.h)/T),top=r*T;if(ob<=top+.01&&(tileAt(o.x+1,top+1)=='-'||tileAt(o.x+o.w-1,top+1)=='-')){o.y=top-o.h;o.vy=0;landed=true}}return landed}
function onGround(o){const yb=o.y+o.h+.5;if(solid(o.x+1,yb)||solid(o.x+o.w-1,yb))return true;if(o.dropT<=0&&Math.abs((o.y+o.h)%T)<.01&&(tileAt(o.x+1,yb)=='-'||tileAt(o.x+o.w-1,yb)=='-'))return 'plat';return false}
// ===== Input =====
const K={},KP={};addEventListener('keydown',e=>{if(!K[e.code])KP[e.code]=true;K[e.code]=true;if(e.code.startsWith('Arrow')||e.code=='Space'||e.code=='Slash'||e.code=='Backspace')e.preventDefault()});addEventListener('keyup',e=>K[e.code]=false);
const KEYMAP=[{l:['KeyA'],r:['KeyD'],u:['KeyW'],d:['KeyS'],a:['KeyQ'],s:['KeyE'],lab:['WASD MOVE','Q ATK  E DASH']},
{l:['KeyF'],r:['KeyH'],u:['KeyT'],d:['KeyG'],a:['KeyR'],s:['KeyY'],lab:['TFGH MOVE','R ATK  Y DASH']},
{l:['KeyJ'],r:['KeyL'],u:['KeyI'],d:['KeyK'],a:['KeyU'],s:['KeyO'],lab:['IJKL MOVE','U ATK  O DASH']},
{l:['ArrowLeft'],r:['ArrowRight'],u:['ArrowUp'],d:['ArrowDown'],a:['Slash','Numpad1'],s:['Period','Numpad2'],lab:['ARROWS MOVE','/ ATK  . DASH']}];
const DZ=.35;let padsRaw=[null,null,null,null],padPrev={},padHeld={},padConn={},lastDev='kb',lastPadPS=false,toasts=[],pauseSel=0;
function toast(m){toasts.push({m,t:100});if(toasts.length>4)toasts.splice(1,1)}
const isPS=p=>/054c|dualsense|dualshock|playstation/i.test(p&&p.id||'');
let PST=[null,null,null,null];function padState(pi){return PST[pi]}
function padCalc(pi){const p=padsRaw[pi];if(!p)return null;const b=i=>!!(p.buttons[i]&&(p.buttons[i].pressed||p.buttons[i].value>.5));const ax=p.axes[0]||0,ay=p.axes[1]||0;
 return{l:ax<-DZ||b(14),r:ax>DZ||b(15),up:ay<-DZ||b(12),dn:ay>DZ||b(13),u:b(0)||b(12)||ay<-.7,d:ay>.6||b(13),A:b(0),B:b(1),X:b(2),Y:b(3),LB:b(4),RB:b(5),BK:b(8),ST:b(9),a:b(2),s:b(1)||b(3)}}
function padEdge(pi,k){const s=padState(pi);return !!(s&&s[k]&&!padPrev[pi+k])}
function padRep(pi,k){const s=padState(pi);if(!s||!s[k])return false;const h=padHeld[pi+k]||0;return h==0||(h>16&&(h-16)%5==0)}
function anyPad(fn){for(let i=0;i<4;i++)if(padsRaw[i]&&fn(i))return true;return false}
const KEYLAB=c=>({Slash:'/',Period:'.',ArrowUp:'\u2191',ArrowDown:'\u2193',ArrowLeft:'\u2190',ArrowRight:'\u2192',Numpad1:'1',Numpad2:'2'}[c]||c.replace('Key',''));
addEventListener('keydown',e=>{lastDev='kb';KEYMAP.forEach((m,i)=>{if(['l','r','u','d','a','s'].some(k=>m[k].includes(e.code)))slots[i].dev='kb'})});
function rawInput(i){const sl=slots[i];const m=KEYMAP[i];const any=a=>a.some(k=>K[k]),anyP=a=>a.some(k=>KP[k]);
 let o={l:any(m.l),r:any(m.r),u:any(m.u),d:any(m.d),a:any(m.a),s:any(m.s),upE:anyP(m.u),dE:anyP(m.d),ap:anyP(m.a),sp:anyP(m.s)};
 if(sl.pad!=null){const p=padState(sl.pad);if(p){o.l=o.l||p.l;o.r=o.r||p.r;o.u=o.u||p.u;o.d=o.d||p.d;o.upE=o.upE||padEdge(sl.pad,'u');o.dE=o.dE||padEdge(sl.pad,'d');o.ap=o.ap||padEdge(sl.pad,'a');o.sp=o.sp||padEdge(sl.pad,'s')}}return o}
function pollPads(){const raw=navigator.getGamepads?navigator.getGamepads():[];for(let i=0;i<4;i++){const p=raw[i]&&raw[i].connected!==false?raw[i]:null;padsRaw[i]=p;const c=!!p;
  if(c&&!padConn[i])toast('CONTROLLER '+(i+1)+' CONNECTED');
  if(!c&&padConn[i]){const si=slots.findIndex(s=>s.pad===i);if(si>=0){slots[si].pad=null;slots[si].dev='kb';toast('P'+(si+1)+' CONTROLLER DISCONNECTED');if(state=='fight'){state='pause';pauseSel=0}}else toast('CONTROLLER '+(i+1)+' DISCONNECTED')}
  PST[i]=p?padCalc(i):null;padConn[i]=c;if(p){const act=p.buttons.some(b=>b&&b.pressed)||p.axes.some(a=>Math.abs(a)>DZ);if(act){lastDev='pad';lastPadPS=isPS(p);const si=slots.findIndex(s=>s.pad===i);if(si>=0)slots[si].dev='pad'}}}}
function endPads(){for(let i=0;i<4;i++){const s=padState(i)||{};for(const k of ['l','r','up','dn','u','d','A','B','X','Y','LB','RB','BK','ST','a','s']){padPrev[i+k]=!!s[k];padHeld[i+k]=s[k]?(padHeld[i+k]||0)+1:0}}}
const mL=()=>KP.ArrowLeft||KP.KeyA||anyPad(i=>padRep(i,'l')),mR=()=>KP.ArrowRight||KP.KeyD||anyPad(i=>padRep(i,'r')),mU=()=>KP.ArrowUp||KP.KeyW||anyPad(i=>padRep(i,'up')),mD=()=>KP.ArrowDown||KP.KeyS||anyPad(i=>padRep(i,'dn'));
const mOK=()=>KP.Enter||KP.Space||anyPad(i=>padEdge(i,'A')),mBack=()=>KP.Escape||anyPad(i=>padEdge(i,'B')),mStart=()=>KP.Enter||anyPad(i=>padEdge(i,'ST'));

// ===== State =====
let shakeMode=+(localStorage.getItem('pdbShake')||0),showFPS=false;const SHAKE_NAMES=['FULL','LOW','OFF'],SHAKE_K=[1,.35,0];
function addShake(v){shake=Math.max(shake,Math.min(8,v*SHAKE_K[shakeMode]))}
function setShake(m){shakeMode=m;try{localStorage.setItem('pdbShake',m)}catch(e){}}
let state='select',slots=[0,1,2,3].map(i=>({type:'none',skin:[0,4,9,16][i],pad:null,dev:'kb'})),F=[],parts=[],shake=0,hitstop=0,readyT=0,endT=0,winner=null,arenaPrev=[];
function addCPU(){const s=slots.find(s=>s.type=='none');if(s){s.type='cpu';s.skin=Math.floor(Math.random()*NS);SFX.sel()}}
function startFight(){map=ARENAS[arena].map;WW=map[0].length*T;WH=map.length*T;stageBounds();F=[];parts=[];const sp=[[8,10],[13,4],[16,4],[21,10]];
 slots.forEach((s,i)=>{if(s.type=='none')return;const f={i,cpu:s.type=='cpu',skin:s.skin,x:0,y:0,w:10,h:20,vx:0,vy:0,face:i<2?1:-1,dmg:0,stocks:3,out:false,respawn:0,inv:0,jumps:1,atkT:0,dashT:0,dashCd:0,airDash:true,hitstun:0,flash:0,dropT:0,ground:false,ff:false,hit:null,trail:[],anim:0,ai:{j:0}};spawn(f,true);F.push(f)});
 readyT=100;endT=0;winner=null;state='fight';camUpdate(true)}
function spawn(f,first){const A=ARENAS[arena],s=A.sp[f.i];f.x=first?s[0]*T+3:A.rs[0]*T-5+(f.i-1.5)*24;f.y=first?s[1]*T-f.h:A.rs[1]*T;f.vx=f.vy=0;f.dmg=first?0:0;f.inv=first?0:120;f.jumps=1;f.hitstun=0;f.atkT=f.dashT=0;f.airDash=true}
const PMAX=220;function burst(x,y,c,n,sp=2){n=Math.min(n,PMAX-parts.length);for(let k=0;k<n;k++){const a=Math.random()*6.28,v=Math.random()*sp+.5;parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-1,l:20+Math.random()*20,c})}}
// ===== Combat =====
function hitbox(f){if(f.atkT>=8&&f.atkT<=14)return{x:f.face>0?f.x+f.w-2:f.x-14,y:f.y+3,w:16,h:12,p:{dmg:8,base:2.6,grow:.085,ang:.75}};
 if(f.dashT>2)return{x:f.x-3+f.face*4,y:f.y,w:f.w+6,h:f.h,p:{dmg:11,base:3.4,grow:.1,ang:.5}};return null}
function ov(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y}
function doHits(f){const hb=hitbox(f);if(!hb)return;for(const g of F){if(g==f||g.out||g.respawn>0||g.inv>0||f.hit.has(g))continue;if(!ov(hb,g))continue;f.hit.add(g);const p=hb.p;g.dmg+=p.dmg;
 const kb=p.base+g.dmg*p.grow*(g.ground?1:1.1),dir=f.face;g.vx=dir*kb*Math.cos(p.ang);g.vy=-kb*Math.sin(p.ang)-1;g.hitstun=Math.floor(6+kb*3.5);g.flash=8;g.face=-dir;g.atkT=g.dashT=0;g.ground=false;
 hitstop=Math.max(hitstop,Math.min(8,Math.floor(3+kb*.7)));addShake(2+kb*.8);burst(g.x+g.w/2,g.y+8,'#ffffff',6+kb|0,1+kb*.3);burst(g.x+g.w/2,g.y+8,PCOL[f.i],4,2);SFX.hit(kb);if(f.dashT>0)f.dashT=Math.min(f.dashT,3)}}
function updF(f,inp){if(f.out)return;if(f.respawn>0){if(--f.respawn==0)spawn(f);return}
 if(f.inv>0)f.inv--;if(f.flash>0)f.flash--;if(f.dashCd>0)f.dashCd--;if(f.dropT>0)f.dropT--;
 const g=onGround(f);f.ground=!!g;if(f.ground){f.jumps=1;f.ff=false;f.airDash=true}
 if(readyT>0)inp={};
 if(f.hitstun>0){f.hitstun--;f.vx*=f.ground?.85:.985;if(f.hitstun%3==0&&parts.length<PMAX)parts.push({x:f.x+5,y:f.y+10,vx:0,vy:0,l:12,c:'#ffffff'})}
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
 moveX(f);if(moveY(f))f.ground=true;f.anim+=Math.abs(f.vx)*.1;
 if(f.hit)doHits(f);
 if(f.x<-96||f.x>WW+96||f.y>WH+64||f.y<-220){f.stocks--;SFX.ko();addShake(10);const bx=Math.max(cam.x+6,Math.min(cam.x+cam.vw-6,f.x)),by=Math.max(cam.y+6,Math.min(cam.y+cam.vw*.5625-6,f.y));burst(bx,by,PCOL[f.i],30,4);burst(bx,by,'#ffffff',20,3);if(f.stocks<=0){f.out=true}else f.respawn=60;f.vx=f.vy=0;f.dmg=0}}
// ===== CPU =====
let stageL=0,stageR=W,stageTop=0;
function stageBounds(){let l=99,r=0,tp=99;map.forEach((row,y)=>row.forEach((c,x)=>{if(c!=' '){l=Math.min(l,x);r=Math.max(r,x);if(solidCh(c))tp=Math.min(tp,y)}}));stageL=l*T;stageR=(r+1)*T;stageTop=tp*T}
function groundBelow(x,y){const tx=Math.floor(x/T);if(tx<0||tx>=map[0].length)return -1;for(let ty=Math.max(0,Math.floor(y/T));ty<map.length;ty++){if(map[ty][tx]!=' ')return ty}return -1}
function safeX(cx,y){for(let d=0;d<50;d++)for(const s of [1,-1]){const x=cx+s*d*T;if(groundBelow(x,y)>=0)return x+s*T}return WW/2}
function ai(f){const o={l:0,r:0,u:0,d:0,upE:0,dE:0,ap:0,sp:0};const A=f.ai;A.j--;
 const cx=f.x+5,feet=f.y+f.h;
 if(!f.ground&&groundBelow(cx,feet)<0){const sx=safeX(cx,Math.max(0,f.y-48)),dir=sx>cx?1:-1;if(dir>0)o.r=1;else o.l=1;
  if(f.vy>0.3&&f.jumps>0&&A.j<=0){o.upE=1;A.j=12}else if(f.jumps==0&&f.vy>0.5&&f.airDash&&f.dashCd<=0&&Math.abs(sx-cx)>24){f.face=dir;o.sp=1}return o}
 let tg=null,bd=1e9;for(const g of F){if(g==f||g.out||g.respawn>0)continue;const d=Math.hypot(g.x-f.x,g.y-f.y);if(d<bd){bd=d;tg=g}}if(!tg)return o;
 const dx=tg.x-f.x,dy=tg.y-f.y,R=Math.random();
 if(Math.abs(dx)>12){if(dx>0)o.r=1;else o.l=1}
 if(f.ground&&(o.r||o.l)){const nx=cx+(o.r?14:-14);if(groundBelow(nx,feet)<0){if(tg.y+tg.h<=feet+8&&Math.abs(dx)<260&&A.j<=0&&groundBelow(cx+(o.r?1:-1)*Math.min(Math.abs(dx),150),feet-40)>=0){o.upE=1;A.j=25}else o.l=o.r=0}}
 if(dy<-24&&f.ground&&A.j<=0&&R<.25){o.upE=1;A.j=18}else if(dy<-30&&!f.ground&&f.vy>0&&f.jumps>0&&A.j<=0){o.upE=1;A.j=18}
 if(dy>24&&f.ground&&onGround(f)=='plat'&&R<.08)o.dE=1;
 if(Math.abs(dx)<22&&Math.abs(dy)<16&&R<.22&&tg.inv<=0){f.face=dx>0?1:-1;o.l=o.r=0;o.ap=1}
 else if(Math.abs(dx)>40&&Math.abs(dx)<120&&Math.abs(dy)<10&&f.dashCd<=0&&R<.03&&f.ground&&groundBelow(cx+(dx>0?60:-60),feet)>=0){f.face=dx>0?1:-1;o.sp=1}
 if(R>.995&&f.ground){o.upE=1}return o}
// ===== Camera =====
const cam={x:0,y:0,vw:480,cx:480,cy:272};
function camUpdate(snap){const L=F.filter(f=>!f.out&&f.respawn<=0);let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;
 for(const f of L){const fx=Math.max(-40,Math.min(WW+40,f.x)),fy=Math.max(-60,Math.min(WH+20,f.y));x0=Math.min(x0,fx);x1=Math.max(x1,fx+f.w);y0=Math.min(y0,fy-12);y1=Math.max(y1,fy+f.h)}
 if(!L.length){x0=WW/2-100;x1=WW/2+100;y0=WH/2-60;y1=WH/2+60}
 const maxV=Math.min(960,Math.max(480,WW)),tv=Math.max(480,Math.min(maxV,Math.max(x1-x0+220,(y1-y0+150)*16/9))),tcx=(x0+x1)/2,tcy=(y0+y1)/2+8+tv*.04;
 if(snap){cam.vw=tv;cam.cx=tcx;cam.cy=tcy}else{cam.vw+=(tv-cam.vw)*(tv>cam.vw?.08:.03);cam.cx+=(tcx-cam.cx)*.1;cam.cy+=(tcy-cam.cy)*.1}
 const vw=cam.vw,vh=vw*.5625;cam.x=vw>=WW?(WW-vw)/2:Math.max(0,Math.min(WW-vw,cam.cx-vw/2));cam.y=vh>=WH?(WH-vh+40):Math.max(-48,Math.min(WH-vh+40,cam.cy-vh/2))}
const WB=document.createElement('canvas');WB.width=960;WB.height=540;const wctx=WB.getContext('2d');
function bgCanvas(){if(!BGC){const sv=camX;camX=0;drawBGcache();camX=sv}return BGC}
function drawWorld(){const vw=Math.round(cam.vw),vh=Math.round(vw*.5625);let ox=Math.round(cam.x),oy=Math.round(cam.y);
 if(shake){ox+=Math.round((Math.random()-.5)*shake);oy+=Math.round((Math.random()-.5)*shake)}
 const real=ctx;ctx=wctx;ctx.setTransform(1,0,0,1,0,0);ctx.imageSmoothingEnabled=false;
 const bg=bgCanvas(),px=(ox/Math.max(1,WW))*40;ctx.drawImage(bg,px,0,W-40,H,0,0,vw,vh);
 ctx.translate(-ox,-oy);ctx.drawImage(mapCanvas(),0,-T);F.forEach(f=>drawF(f,0));
 for(const p of parts){ctx.fillStyle=p.c;const s=p.l>15?2:1;ctx.fillRect(Math.round(p.x),Math.round(p.y),s,s)}
 ctx=real;ctx.setTransform(1,0,0,1,0,0);ctx.imageSmoothingEnabled=false;ctx.drawImage(WB,0,0,vw,vh,0,0,cv.width,cv.height);ctx.setTransform(cv.width/W,0,0,cv.height/H,0,0);
 cam.ox=ox;cam.oy=oy;cam.svw=vw;cam.svh=vh}
function drawIndicators(){const sx=W/cam.svw,sy=H/cam.svh;for(const f of F){if(f.out||f.respawn>0)continue;const x=(f.x+5-cam.ox)*sx,y=(f.y+10-cam.oy)*sy;
 if(x>=0&&x<=W&&y>=0&&y<=H)continue;const bx=Math.round(Math.max(13,Math.min(W-13,x))),by=Math.round(Math.max(32,Math.min(222,y)));
 const ring=cacheCanvas('ring'+f.i,24,24,()=>{const M=mask(24,24,(a,b)=>(a-11.5)**2+(b-11.5)**2<=100);drawMask(M,0,0,PCOL[f.i]);const I=mask(24,24,(a,b)=>(a-11.5)**2+(b-11.5)**2<=56);for(const [mx,my,fl] of I)if(fl){ctx.fillStyle='#2b2b40';ctx.fillRect(mx,my,1,1)}});
 ctx.drawImage(ring,bx-12,by-12);ctx.drawImage(imgs[f.skin],0,4,16,15,bx-8,by-8,16,15);
 const ang=Math.atan2(y-by,x-bx),tx=Math.round(bx+Math.cos(ang)*14),ty=Math.round(by+Math.sin(ang)*14);ctx.fillStyle=PAL.o;ctx.fillRect(tx-2,ty-2,5,5);ctx.fillStyle=PCOL[f.i];ctx.fillRect(tx-1,ty-1,3,3)}}
// ===== Update =====
function moveCursor(s,dc,dr){let c=s.skin%GC,r=Math.floor(s.skin/GC);const R=Math.ceil(NS/GC);c=(c+dc+GC)%GC;r=(r+dr+R)%R;let n=r*GC+c;if(n>=NS)n=NS-1;if(n!=s.skin){s.skin=n;SFX.sel()}}
function delCPU(){const s=[...slots].reverse().find(s=>s.type=='cpu');if(s){s.type='none';SFX.sel()}}
const nPlayers=()=>slots.filter(s=>s.type!='none').length;
function goArena(){if(nPlayers()>=2){state='arena';SFX.go()}else toast('NEED 2+ PLAYERS')}
function update(){t++;pollPads();if(KP.F3)showFPS=!showFPS;if((state=='fight'||state=='pause')&&(KP.F4||anyPad(i=>padEdge(i,'BK')))){setShake((shakeMode+1)%3);toast('SHAKE: '+SHAKE_NAMES[shakeMode])}if(toasts.length&&--toasts[0].t<=0)toasts.shift();
 if(state=='select'){for(let i=0;i<4;i++){const s=slots[i],inp=rawInput(i);if(s.pad!=null)continue;
   if(s.type=='none'){if(KPany(i,'a')){s.type='human';s.dev='kb';SFX.sel()}continue}
   if(s.type=='human'){moveCursor(s,(KPany(i,'r')?1:0)-(KPany(i,'l')?1:0),(KPany(i,'d')?1:0)-(KPany(i,'u')?1:0));if(KPany(i,'s')){s.type='none';SFX.sel()}}}
  for(let pi=0;pi<4;pi++){if(!padsRaw[pi])continue;const si=slots.findIndex(s=>s.pad===pi);
   if(si<0){if(padEdge(pi,'A')||padEdge(pi,'ST')){const k=slots.findIndex(s=>s.type=='none');if(k>=0){Object.assign(slots[k],{type:'human',pad:pi,dev:'pad'});toast('P'+(k+1)+' CONTROLLER CONNECTED');SFX.sel()}else toast('ALL SLOTS FULL')}continue}
   const s=slots[si];moveCursor(s,(padRep(pi,'r')?1:0)-(padRep(pi,'l')?1:0)+(padEdge(pi,'RB')?1:0)-(padEdge(pi,'LB')?1:0),(padRep(pi,'dn')?1:0)-(padRep(pi,'up')?1:0));
   if(padEdge(pi,'B')){s.type='none';s.pad=null;toast('P'+(si+1)+' LEFT');SFX.sel()}
   if(padEdge(pi,'Y'))addCPU();if(padEdge(pi,'X')||padEdge(pi,'BK'))delCPU();if(padEdge(pi,'ST'))goArena()}
  if(KP.KeyC)addCPU();if(KP.Backspace)delCPU();if(KP.Enter)goArena()}
 else if(state=='arena'){if(mL()){arena=(arena+ARENAS.length-1)%ARENAS.length;SFX.sel()}if(mR()){arena=(arena+1)%ARENAS.length;SFX.sel()}
  if(mOK()||mStart()){startFight();SFX.go()}else if(mBack()){state='select';SFX.sel()}}
 else if(state=='fight'){if(KP.Escape||anyPad(i=>padEdge(i,'ST'))){state='pause';pauseSel=0;SFX.sel()}else{
  if(readyT>0){readyT--;if(readyT==30)SFX.go()}
  if(hitstop>0)hitstop--;else{for(const f of F)updF(f,f.cpu?ai(f):rawInput(f.i))}camUpdate(false);
  const alive=F.filter(f=>!f.out);if(alive.length<=1&&!endT){endT=90;winner=alive[0]||null}if(endT&&--endT==0)state='win'}}
 else if(state=='pause'){if(mU()){pauseSel=(pauseSel+3)%4;SFX.sel()}if(mD()){pauseSel=(pauseSel+1)%4;SFX.sel()}if(pauseSel==2&&(mL()||mR())){setShake((shakeMode+(KP.ArrowLeft||KP.KeyA||anyPad(i=>padRep(i,'l'))?2:1))%3);SFX.sel()}
  if(KP.Escape||anyPad(i=>padEdge(i,'ST')||padEdge(i,'B'))){state='fight';SFX.sel()}
  else if(KP.Enter||KP.Space||anyPad(i=>padEdge(i,'A'))){if(pauseSel==0)state='fight';else if(pauseSel==1){startFight();SFX.go()}else if(pauseSel==2)setShake((shakeMode+1)%3);else state='select';SFX.sel()}}
 else if(state=='win'){if(mOK()||mStart()){startFight();SFX.go()}else if(mBack()){state='select';SFX.sel()}}
 if(state!='pause'){for(const p of parts){p.x+=p.vx;p.y+=p.vy;p.vy+=.08;p.vx*=.96;p.l--}let w=0;for(let r=0;r<parts.length;r++)if(parts[r].l>0)parts[w++]=parts[r];parts.length=w;if(shake>0)shake*=.8;if(shake<.75)shake=0}
 endPads()}
function KPany(i,k){return KEYMAP[i][k].some(c=>KP[c])}
// ===== Button glyphs =====
function ptext(s,x,y,c){ctx.fillStyle=c;let cx=x;for(const ch of String(s).toUpperCase()){const g=FONT[ch]||FONT[' '];for(let i=0;i<15;i++)if(g[i]=='1')ctx.fillRect(cx+i%3,y+Math.floor(i/3),1,1);cx+=4}}
function mask(w,h,inside){const M=[];for(let y=0;y<h;y++)for(let x=0;x<w;x++){if(inside(x,y))M.push([x,y,1]);else{let n=false;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(inside(x+dx,y+dy))n=true;if(n)M.push([x,y,0])}}return M}
const GM_CIR=mask(11,11,(x,y)=>x>=0&&y>=0&&x<11&&y<11&&(x-5)**2+(y-5)**2<=17),GM_DP=mask(11,11,(x,y)=>(x>=4&&x<=6&&y>=1&&y<=9)||(y>=4&&y<=6&&x>=1&&x<=9)),GM_PILL=mask(17,11,(x,y)=>y>=2&&y<=8&&x>=1&&x<=15&&!((x==1||x==15)&&(y==2||y==8))),GM_BUMP=mask(15,11,(x,y)=>y>=2&&y<=9&&x>=1&&x<=13&&!(y==2&&(x<=2||x>=12)));
function drawMask(M,x,y,fill){for(const [mx,my,f] of M){ctx.fillStyle=f?fill:PAL.o;ctx.fillRect(x+mx,y+my,1,1)}}
const PSYM={A:"100010101000100010101000",B:"0111010001100011000101110",X:"1111110001100011000111111",Y:"0010001010010101000111111"};
PSYM.A="1000101010001000101010001";
const XCOL={A:'#a1e55a',B:'#e04848',X:'#4a8fe0',Y:'#fee761'},PSCOL={A:'#7fb2ff',B:'#ff6b6b',X:'#f7a0c8',Y:'#a1e55a'};
function gw(g){return g.k?Math.max(11,g.k.length*4+5):g.b=='ST'?17:(g.b=='LB'||g.b=='RB')?15:11}
var glyph=function(g,x,y,ps){if(g.k){const w=gw(g);ctx.fillStyle=PAL.o;ctx.fillRect(x,y,w,11);ctx.fillStyle='#d8dde6';ctx.fillRect(x+1,y+1,w-2,8);ctx.fillStyle='#8b93a6';ctx.fillRect(x+1,y+9,w-2,1);ptext(g.k,x+Math.floor((w-(g.k.length*4-1))/2),y+2,PAL.o);return w}
 const b=g.b;if('ABXY'.includes(b)&&b.length==1){if(ps){drawMask(GM_CIR,x,y,'#3b3f52');ctx.fillStyle=PSCOL[b];const p=PSYM[b];for(let i=0;i<25;i++)if(p[i]=='1')ctx.fillRect(x+3+i%5,y+3+Math.floor(i/5),1,1)}
  else{drawMask(GM_CIR,x,y,XCOL[b]);ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(x+2,y+8,7,1);ptext(b,x+4,y+3,b=='A'||b=='Y'?PAL.o:'#ffffff')}return 11}
 if(b=='DP'){drawMask(GM_DP,x,y,'#8b93a6');ctx.fillStyle='#606c81';ctx.fillRect(x+5,y+5,1,1);ctx.fillStyle='#d8dde6';ctx.fillRect(x+5,y+2,1,1);ctx.fillRect(x+5,y+8,1,1);ctx.fillRect(x+2,y+5,1,1);ctx.fillRect(x+8,y+5,1,1);return 11}
 if(b=='ST'){drawMask(GM_PILL,x,y,'#8b93a6');ctx.fillStyle=PAL.o;for(let k=0;k<3;k++)ctx.fillRect(x+6,y+3+k*2,5,1);return 17}
 if(b=='LB'||b=='RB'){drawMask(GM_BUMP,x,y,'#606c81');ptext(b,x+4,y+4,'#ffffff');return 15}return 0}
// prompt items: [[glyph,...],label]
function promptW(items){let w=0;items.forEach(([gs,l],k)=>{gs.forEach(g=>w+=gw(g)+1);w+=2+(l?l.length*8-2:0)+(k<items.length-1?10:0)});return w}
function prompt(items,x,y,al='center',ps=lastPadPS,col='#ffffff'){const w=promptW(items);let cx=Math.round(al=='center'?x-w/2:al=='right'?x-w:x);
 items.forEach(([gs,l])=>{gs.forEach(g=>{glyph(g,cx,y,ps);cx+=gw(g)+1});cx+=2;if(l){text(l,cx,y+11,col,16);cx+=l.length*8-2}cx+=10})}
const PB=b=>({b}),KC=k=>({k});
const kcap=(i,k)=>KC(KEYLAB(KEYMAP[i][k][0]));
function slotPS(s){return s.pad!=null&&isPS(padsRaw[s.pad])}

// ===== Render caches =====
const TXC=new Map();function cacheCanvas(key,w,h,fn){let c=TXC.get(key);if(!c){if(TXC.size>600)TXC.clear();c=document.createElement('canvas');c.width=Math.max(1,w);c.height=Math.max(1,h);const real=ctx;ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;fn();ctx=real;TXC.set(key,c)}return c}
function text(s,x,y,c='#fff',sz=8,al='left'){s=String(s).toUpperCase();const k=Math.max(1,Math.round(sz/8)),w=s.length*4*k-k;const x0=Math.round(al=='center'?x-w/2:al=='right'?x-w:x),y0=Math.round(y-5*k);
 const cv=cacheCanvas('t'+k+c+'|'+s,w+2*k,7*k,()=>textRaw(s,k,6*k,c,sz,'left'));ctx.drawImage(cv,x0-k,y0-k)}
const ptextRaw=ptext;function ptextC(s,x,y,c){const cv=cacheCanvas('p'+c+'|'+s,String(s).length*4,5,()=>ptextRaw(s,0,0,c));ctx.drawImage(cv,x,y)}
const glyphRaw=glyph;glyph=function(g,x,y,ps){const w=gw(g);const cv=cacheCanvas('g'+(g.k?'k'+g.k:g.b)+(ps?1:0),w,11,()=>glyphRaw(g,0,0,ps));ctx.drawImage(cv,x,y);return w};
let BGC=null;function drawBGcache(){BGC=document.createElement('canvas');BGC.width=W;BGC.height=H;const real=ctx;ctx=BGC.getContext('2d');ctx.imageSmoothingEnabled=false;drawBGRaw();ctx=real}
function drawBG(){if(camX==0){if(!BGC)drawBGcache();ctx.drawImage(BGC,0,0)}else drawBGRaw()}
// ===== Draw =====
function drawSheet(im,x,y,face,row,fr,sc=1){ctx.save();ctx.translate(Math.round(x),Math.round(y));if(face<0){ctx.scale(-1,1);ctx.translate(-FW*sc,0)}ctx.drawImage(im,fr*FW,row*FH,FW,FH,0,0,FW*sc,FH*sc);ctx.restore()}
const mapCache=new Map();function mapCanvas(m=map){let c=mapCache.get(m);if(!c){const sv=map;map=m;c=document.createElement('canvas');c.width=m[0].length*T;c.height=m.length*T+T;const real=ctx;ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;drawMapRaw(T);ctx=real;map=sv;mapCache.set(m,c)}return c}
function drawMapRaw(oy){for(let y=0;y<map.length;y++)for(let x=0;x<map[y].length;x++){const c=map[y][x];if(c=='-')ctx.drawImage(PLANK,x*T,y*T+oy);else if(c!=' ')drawTile(c,x*T,y*T+oy,x,y)}}
function drawF(f,oy){if(f.out||f.respawn>0)return;if(f.inv>0&&Math.floor(t/3)%2)return;
 let row=1,fr=Math.floor(t/10)%4,dx=0;const act=f.atkT>=8&&f.atkT<=14;
 if(f.hitstun>0){row=0;fr=0}else if(f.dashT>0){row=2;fr=2}else if(f.atkT>0){row=2;fr=act?1:3;dx=act?f.face*3:0}else if(!f.ground){row=2;fr=1}else if(Math.abs(f.vx)>.4){row=2;fr=Math.floor(f.anim)%4}
 f.trail.forEach(([tx,ty],k)=>{ctx.globalAlpha=.35-k*.08;drawSheet(whites[f.skin],tx-3,ty-4+oy,f.face,row,fr)});ctx.globalAlpha=1;
 drawSheet(imgs[f.skin],f.x-3+dx,f.y-4+oy,f.face,row,fr);if(f.flash>0&&f.flash%4<2)drawSheet(whites[f.skin],f.x-3+dx,f.y-4+oy,f.face,row,fr);
 if(act){const hb=hitbox(f);ctx.drawImage(PUFF,Math.round(hb.x+hb.w/2-3+f.face*(14-f.atkT)),Math.round(hb.y+3+oy))}
 const ix=Math.round(f.x+2),iy=Math.round(f.y-10+oy);ctx.fillStyle=PAL.o;ctx.fillRect(ix-1,iy-1,9,4);ctx.fillRect(ix+1,iy+3,5,2);ctx.fillRect(ix+2,iy+5,3,1);ctx.fillStyle=PCOL[f.i];ctx.fillRect(ix,iy,7,2);ctx.fillRect(ix+2,iy+2,3,1);ctx.fillRect(ix+3,iy+3,1,1)}
function dmgCol(d){return d<50?'#ffffff':d<100?PAL.Y:d<150?'#f99252':'#e04848'}
function drawHUD(){const n=F.length,cw=112,gap=6,x0=Math.round((W-(n*cw+(n-1)*gap))/2);F.forEach((f,k)=>{const x=x0+k*(cw+gap),y=232;panel(x,y,cw,34);ctx.fillStyle=PCOL[f.i];ctx.fillRect(x+1,y+1,cw-2,2);
 ctx.globalAlpha=f.out?.35:1;drawSheet(imgs[f.skin],x+4,y+6,1,0,0);ctx.globalAlpha=1;text((f.cpu?'CPU':'P'+(f.i+1)),x+24,y+15,PCOL[f.i],16);
 if(f.out)text('OUT',x+cw-6,y+29,'#8b93a6',16,'right');else{text(Math.floor(f.dmg)+'%',x+cw-6,y+29,dmgCol(f.dmg),24,'right');for(let s=0;s<f.stocks;s++){ctx.fillStyle=PAL.o;ctx.fillRect(x+24+s*8,y+20,7,7);ctx.fillStyle=PCOL[f.i];ctx.fillRect(x+25+s*8,y+21,5,5)}}})}
function draw(){camX=0;ctx.setTransform(cv.width/W,0,0,cv.height/H,0,0);ctx.imageSmoothingEnabled=false;if(state=='select'||state=='arena')drawBG();ctx.save();
 if(state=='select'){text('PIXEL DUDES BRAWL',W/2,24,PAL.Y,24,'center');
  const gx=Math.round((W-GC*30)/2),gy=30;for(let n=0;n<NS;n++){const x=gx+(n%GC)*30,y=gy+Math.floor(n/GC)*33;panel(x,y,28,31);ctx.drawImage(imgs[n],0,0,FW,FH,x+6,y+4,FW,FH)}
  const corner=[[0,0],[1,0],[0,1],[1,1]];slots.forEach((s,i)=>{if(s.type=='none')return;const x=gx+(s.skin%GC)*30,y=gy+Math.floor(s.skin/GC)*33;ctx.fillStyle=PCOL[i];ctx.fillRect(x-1,y-1,30,2);ctx.fillRect(x-1,y+30,30,2);ctx.fillRect(x-1,y-1,2,33);ctx.fillRect(x+27,y-1,2,33);
   const [cx,cy]=corner[i];const tx=x-3+cx*26,ty=y-3+cy*27;ctx.fillStyle=PAL.o;ctx.fillRect(tx,ty,9,9);ctx.fillStyle=PCOL[i];ctx.fillRect(tx+1,ty+1,7,7);text(String(i+1),tx+5,ty+8,'#3b2c2e',8,'center')});
  for(let i=0;i<4;i++){const s=slots[i],x=8+i*118,y=134;panel(x,y,110,100);ctx.fillStyle=PCOL[i];ctx.fillRect(x+1,y+1,108,3);text('P'+(i+1),x+6,y+18,PCOL[i],16);
   if(s.type=='none'){prompt([[[kcap(i,'a')],'OR'],[[PB('A')],'']],x+55,y+34);text('TO JOIN',x+55,y+64,'#ffffff',16,'center')}
   else{text(s.type=='cpu'?'CPU':(s.pad!=null?(slotPS(s)?'PS PAD':'PAD'):'KEYS'),x+104,y+18,'#d8dde6',16,'right');drawSheet(imgs[s.skin],x+8,y+24,1,2,Math.floor(t/7)%4,2);text(NAMES[s.skin],x+72,y+50,PAL.Y,16,'center');
    if(s.type=='cpu')text('BOT',x+72,y+66,'#8b93a6',16,'center')}
   if(s.type!='cpu'){const ps=slotPS(s);if(s.type=='human'&&s.dev=='pad'){prompt([[[PB('DP')],'MOVE'],[[PB('A')],'JUMP']],x+55,y+72,'center',ps);prompt([[[PB('X')],'ATK'],[[PB('B')],'DASH']],x+55,y+86,'center',ps)}
    else{prompt([[[kcap(i,'u'),kcap(i,'l'),kcap(i,'d'),kcap(i,'r')],'MOVE']],x+55,y+72);prompt([[[kcap(i,'a')],'ATK'],[[kcap(i,'s')],'DASH']],x+55,y+86)}}}
  const n=nPlayers();panel(8,238,464,30);
  if(lastDev=='pad'){prompt([[[PB('A')],'JOIN'],[[PB('B')],'LEAVE'],[[PB('Y')],'ADD CPU'],[[PB('X')],'DEL CPU']],W/2,241);prompt([[[PB('LB'),PB('RB')],'PICK'],[[PB('ST')],n>=2?'FIGHT!':'NEED 2+']],W/2,254)}
  else{prompt([[[0,1,2,3].map(i=>kcap(i,'a')),'JOIN'],[[KC('C')],'ADD CPU'],[[KC('BKSP')],'DEL CPU']],W/2,241);prompt([[[KC('ENTER')],n>=2?'FIGHT!':'NEED 2+ PLAYERS']],W/2,254)}}
 else if(state=='arena'){text('CHOOSE ARENA',W/2,34,PAL.Y,32,'center');ARENAS.forEach((a,i)=>{const x=6+i*94,y=74,pw=88,ph=Math.round(88*a.map.length/a.map[0].length);if(i==arena){ctx.fillStyle=PAL.Y;ctx.fillRect(x-3,y-3,pw+6,ph+6)}ctx.fillStyle=PAL.o;ctx.fillRect(x-1,y-1,pw+2,ph+2);ctx.drawImage(arenaPrev[i],x,y,pw,ph);text(a.name,x+pw/2,y+70,i==arena?PAL.Y:'#ffffff',8,'center');text(a.map[0].length+'X'+a.map.length,x+pw/2,y+82,'#d8dde6',8,'center')});
  panel(40,214,400,30);if(lastDev=='pad')prompt([[[PB('DP')],'CHOOSE'],[[PB('A')],'FIGHT'],[[PB('B')],'BACK']],W/2,224);else prompt([[[KC('\u2190'),KC('\u2192')],'CHOOSE'],[[KC('ENTER')],'FIGHT'],[[KC('ESC')],'BACK']],W/2,224)}
 else{drawWorld();
  ctx.restore();ctx.save();drawIndicators();drawHUD();
  if(readyT>0)text(readyT>30?'READY':'GO!',W/2,110,readyT>30?'#ffffff':PAL.Y,48,'center');
  if(endT)text('GAME!',W/2,110,PAL.Y,48,'center');
  if(state=='win'){ctx.fillStyle='rgba(59,44,46,.75)';ctx.fillRect(0,0,W,H);panel(90,30,300,190);
   if(winner){text((winner.cpu?'CPU ':'P')+(winner.i+1)+' WINS!',W/2,66,PCOL[winner.i],32,'center');drawSheet(imgs[winner.skin],W/2-24,78,1,2,Math.floor(t/6)%4,3);text(NAMES[winner.skin],W/2,170,PAL.Y,16,'center')}else text('DRAW!',W/2,80,'#ffffff',32,'center');
   if(lastDev=='pad')prompt([[[PB('A')],'REMATCH'],[[PB('B')],'MENU']],W/2,196);else prompt([[[KC('ENTER')],'REMATCH'],[[KC('ESC')],'MENU']],W/2,196)}
  if(state=='fight'&&readyT<=0){if(lastDev=='pad')prompt([[[PB('ST')],'PAUSE']],W-6,6,'right');else prompt([[[KC('ESC')],'PAUSE']],W-6,6,'right')}
  if(state=='pause'){ctx.fillStyle='rgba(59,44,46,.7)';ctx.fillRect(0,0,W,H);panel(120,40,240,170);text('PAUSED',W/2,78,PAL.Y,32,'center');
   ['RESUME','RESTART','SHAKE: '+SHAKE_NAMES[shakeMode],'QUIT TO MENU'].forEach((o,k)=>{const y=100+k*20;if(k==pauseSel){ctx.fillStyle='#5d4a6e';ctx.fillRect(150,y-13,180,18);ctx.fillStyle=PAL.Y;ctx.fillRect(150,y-13,2,18);ctx.fillRect(328,y-13,2,18);text('\u2192 '+o+' \u2190',W/2,y,PAL.Y,16,'center')}else text(o,W/2,y,'#ffffff',16,'center')});
   if(lastDev=='pad')prompt([[[PB('DP')],'SELECT'],[[PB('A')],'OK'],[[PB('B')],'BACK']],W/2,184);else prompt([[[KC('\u2191'),KC('\u2193')],'SELECT'],[[KC('ENTER')],'OK'],[[KC('ESC')],'BACK']],W/2,184)}}
 toasts.slice(0,1).forEach((o,k)=>{const w=o.m.length*8+14,y=4-(o.t<10?(10-o.t)*2:0)-(o.t>94?(o.t-94)*3:0);panel(Math.round(W/2-w/2),y,w,18,'#3b3f52');text(o.m,W/2,y+14,'#ffffff',16,'center')});
 ctx.restore()}
const STEP=1000/60;let acc=0,lastT=0,fpsT=0,fpsN=0,fps=60,workMs=0;window.__work=[];
function loop(now){requestAnimationFrame(loop);if(!lastT)lastT=now;acc+=Math.min(now-lastT,100);lastT=now;
 if(acc<STEP-1)return;const t0=performance.now();let n=0;while(acc>=STEP-1&&n<3){update();for(const k in KP)delete KP[k];acc-=STEP;n++}if(n==3)acc=0;if(acc<0)acc=0;
 ctx.imageSmoothingEnabled=false;draw();fpsN++;if(now-fpsT>=500){fps=Math.round(fpsN*1000/(now-fpsT));fpsN=0;fpsT=now}
 if(showFPS){panel(2,2,62,12);text(fps+' FPS',6,12,fps>=55?'#a1e55a':'#f99252',8);text(workMs.toFixed(1)+'MS',62,12,'#d8dde6',8,'right')}
 workMs=workMs*.9+(performance.now()-t0)*.1;__work.push(performance.now()-t0);if(__work.length>2000)__work.splice(0,1000)}
Promise.all(imgs.map(i=>i.complete?1:new Promise(r=>i.onload=r))).then(()=>{whites=imgs.map(im=>{const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d');x.drawImage(im,0,0);x.globalCompositeOperation='source-in';x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);return c});
 const real=ctx;arenaPrev=ARENAS.map(a=>{const c=document.createElement('canvas');c.width=a.map[0].length*T;c.height=a.map.length*T;ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage(bgCanvas(),0,0,c.width,c.height);ctx.drawImage(mapCanvas(a.map),0,-T);return c});ctx=real;map=ARENAS[0].map;requestAnimationFrame(loop)});
window.__game={get pauseSel(){return pauseSel},get toasts(){return toasts},get state(){return state},get F(){return F},slots,addCPU,setArena:a=>arena=a};
