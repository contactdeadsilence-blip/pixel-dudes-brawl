// ===== Arenas & physics live in the shared core (shared/core.js), same code the server runs =====
const CORE=PDBCore.createCore({sfx:(k,a)=>{SFX[k]&&SFX[k](a)},shake:v=>addShake(v),burst:(x,y,c,n,sp)=>burst(x,y,c,n,sp),part:(x,y)=>partFx(x,y),ko:f=>koFx(f.x,f.y,f.i),kill:(k,v)=>{if(LKOS[k]!=null)LKOS[k]++}});const LKOS=[0,0,0,0];
const ARENAS=CORE.ARENAS,PRICES=PDBCore.PRICES,STARTER=PDBCore.STARTER;let WW=960,WH=544,map=ARENAS[0].map,arena=0;
const solidCh=c=>c=='#'||c=='=';const hitbox=f=>CORE.hitbox(f);
function partFx(x,y){if(parts.length<PMAX)parts.push({x,y,vx:(Math.random()-.5)*1.6,vy:-Math.random()*1.2,l:12,c:'#ffffff'})}
function koFx(x,y,i){const bx=Math.max(cam.x+6,Math.min(cam.x+cam.vw-6,x)),by=Math.max(cam.y+6,Math.min(cam.y+cam.vw*H/W-6,y));burst(bx,by,PCOL[i],30,4);burst(bx,by,'#ffffff',20,3)}
function syncCore(){F=CORE.F;map=CORE.map;WW=CORE.WW;WH=CORE.WH;readyT=CORE.readyT;endT=CORE.endT;winner=CORE.winner;hitstop=CORE.hitstop;arena=CORE.arena}
// ===== Settings =====
const DEF_SET={master:.8,music:.6,sfx:.8,mute:false,shake:0,fullscreen:false,fps:false,scale:0,prompts:0,dz:.35,diff:1,stocks:3,timer:0,items:2,keys:null};
let SET=Object.assign({},DEF_SET);try{Object.assign(SET,JSON.parse(localStorage.getItem('pdbSettings')||'{}'));if(!localStorage.getItem('pdbSettings')&&localStorage.getItem('pdbShake')!=null)SET.shake=+localStorage.getItem('pdbShake')}catch(e){}
function saveSet(){try{localStorage.setItem('pdbSettings',JSON.stringify(SET))}catch(e){}applySet();if(typeof onSetChange=='function')onSetChange()}
function applySet(){DZ=SET.dz;auVol();applyScale()}
const PSM=()=>SET.prompts?SET.prompts==2:lastPadPS;
let PXK=2;let TYPING_HOOK=null;
// Fill the whole window: integer pixel scale (crisp) where possible; the logical canvas grows so the camera shows more world.
function applyScale(){const dpr=window.devicePixelRatio||1,dw=Math.round(innerWidth*dpr),dh=Math.round(innerHeight*dpr);
 let k=Math.min(dw/480,dh/270);if(SET.scale==0&&k>=1)k=Math.floor(k);k=Math.max(k,.25);PXK=k;
 W=Math.ceil(dw/k);H=Math.ceil(dh/k);cv.width=dw;cv.height=dh;cv.style.width=innerWidth+'px';cv.style.height=innerHeight+'px';BGC=null;ctx.imageSmoothingEnabled=false}
addEventListener('resize',()=>applyScale());
// UI layouts were designed at 480x270: draw them centred in a safe box, while backgrounds/overlays fill the screen
function safe(fn){const sw=W,sh=H,ox=Math.floor((W-480)/2),oy=Math.floor((H-270)/2);ctx.save();ctx.translate(ox,oy);W=480;H=270;try{fn()}finally{W=sw;H=sh;ctx.restore()}}
// typing / key-capture (login fields, room code, rebinding) gets keys before the game does
addEventListener('keydown',e=>{if(CAPTURE){e.preventDefault();e.stopImmediatePropagation();const c=CAPTURE;CAPTURE=null;c(e.code);return}
 if(!e.ctrlKey&&!e.metaKey&&(e.key.length==1&&e.key!=' '||e.key=='Backspace')&&typeKey(e.key=='Backspace'?'\b':e.key)){e.preventDefault();e.stopImmediatePropagation()}},true);
