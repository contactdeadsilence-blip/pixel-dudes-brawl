// ===== Accounts (online build only) =====
const ACC={token:null,user:null,checking:false};try{ACC.token=localStorage.getItem('pdbToken')||sessionStorage.getItem('pdbToken')}catch(e){}
let REMEMBER=true;try{REMEMBER=localStorage.getItem('pdbRemember')!=='0'}catch(e){}
function clearTok(){ACC.token=null;ACC.user=null;try{localStorage.removeItem('pdbToken');sessionStorage.removeItem('pdbToken')}catch(e){}}
function api(path,body){return fetch('/api/'+path,{method:body?'POST':'GET',headers:Object.assign({'Content-Type':'application/json'},ACC.token?{Authorization:'Bearer '+ACC.token}:{}),body:body?JSON.stringify(body):undefined})
 .then(async r=>{let j={};try{j=await r.json()}catch(e){}if(!r.ok){const e=new Error((j.error||('HTTP '+r.status)).toUpperCase());e.status=r.status;throw e}return j})}
function setUser(j){if(j.token){ACC.token=j.token;try{localStorage.removeItem('pdbToken');sessionStorage.removeItem('pdbToken');(REMEMBER?localStorage:sessionStorage).setItem('pdbToken',j.token)}catch(e){}}if(j.user)ACC.user=j.user;
 if(j.user&&j.user.settings&&Object.keys(j.user.settings).length&&j.fresh){Object.assign(SET,j.user.settings);try{localStorage.setItem('pdbSettings',JSON.stringify(SET))}catch(e){}loadKeys();applySet()}}
function logout(){if(ACC.token)api('logout',{}).catch(()=>{});clearTok();netClose()}
function myUnlocks(){return ACC.user?ACC.user.unlocked:STARTER}
const LOCKS=ONLINE;function owned(n){return !LOCKS||myUnlocks().includes(n)}
let setSyncTimer=null;function onSetChange(){if(!ONLINE||!ACC.user)return;clearTimeout(setSyncTimer);setSyncTimer=setTimeout(()=>{const s=Object.assign({},SET);api('settings',{settings:s}).catch(()=>{})},600)}
// auto-login with the token saved on this device; a rejected token (expired / server reset) is cleared so the login screen shows
if(ONLINE&&ACC.token){ACC.checking=true;api('me').then(j=>{j.fresh=true;setUser(j);ACC.checking=false;toast('WELCOME BACK '+ACC.user.username+'!');claimDaily()}).catch(e=>{ACC.checking=false;if(e.status==401){clearTok();toast('PLEASE LOG IN AGAIN')}})}
// ===== Small UI helpers =====
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function listNav(n,sel){if(mU()){SFX.sel();return (sel+n-1)%n}if(mD()){SFX.sel();return (sel+1)%n}return sel}
function drawList(items,sel,cx,y,w,rh=18){items.forEach((o,k)=>{const yy=y+k*rh,x=cx-w/2;if(k==sel){ctx.fillStyle='#5d4a6e';ctx.fillRect(x,yy-13,w,18);ctx.fillStyle=PAL.Y;ctx.fillRect(x,yy-13,2,18);ctx.fillRect(x+w-2,yy-13,2,18);text('\u2192 '+o+' \u2190',cx,yy,PAL.Y,16,'center')}else text(o,cx,yy,'#ffffff',16,'center')})}
function bar(pi,ki,y=252){const items=lastDev=='pad'?pi.map(([g,l])=>[g.map(PB),l]):ki.map(([g,l])=>[g.map(KC),l]);const w=promptW(items)+16;panel(Math.round(W/2-w/2),y-4,w,19);prompt(items,W/2,y)}
function coinIcon(x,y){ctx.fillStyle=PAL.o;ctx.fillRect(x+1,y,5,7);ctx.fillRect(x,y+1,7,5);ctx.fillStyle='#fee761';ctx.fillRect(x+1,y+1,5,5);ctx.fillStyle='#f99252';ctx.fillRect(x+3,y+2,1,3)}
function lockIcon(x,y,price){ctx.fillStyle='rgba(20,16,28,.6)';ctx.fillRect(x+1,y+1,26,29);const lx=x+10,ly=y+7;ctx.fillStyle=PAL.o;ctx.fillRect(lx,ly,9,12);ctx.fillStyle='#d8dde6';ctx.fillRect(lx+2,ly+1,1,4);ctx.fillRect(lx+6,ly+1,1,4);ctx.fillRect(lx+2,ly+1,5,1);ctx.fillStyle='#fee761';ctx.fillRect(lx+1,ly+5,7,6);ctx.fillStyle=PAL.o;ctx.fillRect(lx+4,ly+7,1,2);
 if(price!=null){coinIcon(x+3,y+22);text(String(price),x+12,y+29,'#fee761',8)}}
function acctBadge(x,y,al='left'){if(!ONLINE)return;const s=ACC.user?(ACC.user.username+'  '):'NOT SIGNED IN';const w=s.length*4+(ACC.user?String(ACC.user.coins).length*4+12:0)+8;const x0=al=='right'?x-w:x;panel(x0,y,w,13);text(s,x0+4,y+10,ACC.user?'#ffffff':'#8b93a6',8);if(ACC.user){const cx=x0+4+s.length*4;coinIcon(cx,y+3);text(String(ACC.user.coins),cx+9,y+10,'#fee761',8)}}
// ===== Main menu =====
let menuSel=0;const menuItems=()=>ONLINE?['LOCAL BATTLE','ONLINE','CHALLENGES','SHOP','SETTINGS']:['LOCAL BATTLE','SETTINGS'];
function updMenu(){const it=menuItems();menuSel=listNav(it.length,menuSel);if(mOK()||mStart()){const o=it[menuSel];SFX.ok();if(o=='LOCAL BATTLE')state='select';else if(o=='SETTINGS')openSettings('menu');else if(o=='ONLINE')goOnline();else if(o=='SHOP')goShop();else if(o=='CHALLENGES')goChal()}}
function goOnline(){if(ACC.checking){toast('SIGNING IN...');return}if(ACC.user){state='online';onlSel=0}else openLogin('online')}
function goShop(from){SH.back=from||state;if(ACC.user){state='shop';api('me').then(setUser).catch(()=>{})}else openLogin('shop')}
function drawMenu(){text('PIXEL DUDES',W/2,58,PAL.Y,48,'center');text('BRAWL',W/2,96,'#ffffff',32,'center');
 for(let k=0;k<4;k++){const sk=[0,1,2,3][k],x=((t*.6+k*130)%600)-60;drawSheet(imgs[sk],x,196-24,1,2,Math.floor(t/6)%4,1)}
 const it=menuItems();panel(W/2-100,108,200,it.length*20+10);drawList(it,menuSel,W/2,126,190,20);
 bar([[['DP'],'SELECT'],[['A'],'OK']],[[['\u2191','\u2193'],'SELECT'],[['ENTER'],'OK']]);text('V2',W-4,H-4,'#8b93a6',8,'right')}
// ===== Settings =====
const ST={sel:0,top:0,back:'menu',rb:null,wait:false};let CAPTURE=null;
function openSettings(back){ST.back=back;ST.sel=0;ST.top=0;ST.rb=null;state='settings'}
function closeSettings(){state=ST.back;SFX.back()}
function toggleFS(){try{if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen().catch(()=>toast('FULLSCREEN BLOCKED - PRESS F11'))}catch(e){toast('FULLSCREEN UNAVAILABLE')}}
addEventListener('fullscreenchange',()=>{SET.fullscreen=!!document.fullscreenElement});
const vbar=v=>{const n=Math.round(v*10);return '\u25a0'.repeat(0)+'['+'#'.repeat(n).replace(/#/g,'|')+'.'.repeat(10-n)+']'};
function keyStr(p){const m=KEYMAP[p];return ['u','l','d','r','a','s'].map(k=>KEYLAB(m[k][0])).join(' ')}
function setItems(){return [
 {l:'MASTER VOLUME',v:()=>Math.round(SET.master*100)+'%',ch:d=>SET.master=clamp(Math.round(SET.master*10+d)/10,0,1)},
 {l:'MUSIC VOLUME',v:()=>Math.round(SET.music*100)+'%',ch:d=>SET.music=clamp(Math.round(SET.music*10+d)/10,0,1)},
 {l:'SFX VOLUME',v:()=>Math.round(SET.sfx*100)+'%',ch:d=>{SET.sfx=clamp(Math.round(SET.sfx*10+d)/10,0,1);setTimeout(()=>SFX.coin(),10)}},
 {l:'MUTE ALL',v:()=>SET.mute?'ON':'OFF',ch:()=>SET.mute=!SET.mute},
 {l:'SCREEN SHAKE',v:()=>SHAKE_NAMES[SET.shake],ch:d=>SET.shake=(SET.shake+(d<0?2:1))%3},
 {l:'FULLSCREEN',v:()=>document.fullscreenElement?'ON':'OFF',ch:()=>toggleFS()},
 {l:'SHOW FPS',v:()=>SET.fps?'ON':'OFF',ch:()=>SET.fps=!SET.fps},
 {l:'DISPLAY',v:()=>['PIXEL PERFECT','SMOOTH FIT'][SET.scale],ch:()=>SET.scale^=1},
 {l:'BUTTON PROMPTS',v:()=>['AUTO','XBOX','PLAYSTATION'][SET.prompts],ch:d=>SET.prompts=(SET.prompts+(d<0?2:1))%3},
 {l:'STICK DEADZONE',v:()=>Math.round(SET.dz*100)+'%',ch:d=>SET.dz=clamp(Math.round((SET.dz+d*.05)*100)/100,.1,.6)},
 {l:'CPU DIFFICULTY',v:()=>['EASY','NORMAL','HARD'][SET.diff],ch:d=>SET.diff=(SET.diff+d+3)%3},
 {l:'STOCKS',v:()=>String(SET.stocks),ch:d=>SET.stocks=(SET.stocks-1+d+5)%5+1},
 {l:'MATCH TIMER',v:()=>SET.timer?SET.timer+' MIN':'OFF',ch:d=>{const o=[0,2,3,5,8];SET.timer=o[(o.indexOf(SET.timer)+d+o.length)%o.length]}},
 {l:'ITEMS',v:()=>PDBCore.ITEM_NAMES[SET.items|0],ch:d=>SET.items=((SET.items|0)+d+4)%4},
 ...[0,1,2,3].map(p=>({l:'P'+(p+1)+' KEYS',v:()=>keyStr(p),ok:()=>{ST.rb={p,sel:0}}})),
 {l:'RESET DEFAULTS',ok:()=>{Object.assign(SET,DEF_SET,{keys:null});loadKeys();toast('SETTINGS RESET')}},
 {l:'BACK',ok:()=>closeSettings()}]}
const RB_ACT=[['l','LEFT'],['r','RIGHT'],['u','UP / JUMP'],['d','DOWN / DROP'],['a','ATTACK'],['s','DASH']];
function saveKeys(){SET.keys=KEYMAP.map(m=>{const o={};for(const [k] of RB_ACT)o[k]=m[k].slice();return o});saveSet()}
function updSettings(){if(CAPTURE)return;
 if(ST.rb){const R=ST.rb,n=RB_ACT.length+2;R.sel=listNav(n,R.sel);
  if(mBack()){ST.rb=null;SFX.back();return}
  if(mOK()){if(R.sel<RB_ACT.length){const [k,lab]=RB_ACT[R.sel];ST.wait=lab;SFX.ok();CAPTURE=code=>{ST.wait=false;if(code=='Escape'){SFX.back();return}
     KEYMAP.forEach(m=>{for(const [kk] of RB_ACT)m[kk]=m[kk].filter(c=>c!=code)});KEYMAP[R.p][k]=[code];saveKeys();SFX.ok();R.sel=Math.min(R.sel+1,RB_ACT.length-1)}}
   else if(R.sel==RB_ACT.length){for(const [k] of RB_ACT)KEYMAP[R.p][k]=DEFKEYS[R.p][k].slice();saveKeys();SFX.ok();toast('P'+(R.p+1)+' KEYS RESET')}else{ST.rb=null;SFX.back()}}return}
 const it=setItems();ST.sel=listNav(it.length,ST.sel);if(ST.sel<ST.top)ST.top=ST.sel;if(ST.sel>ST.top+9)ST.top=ST.sel-9;
 const o=it[ST.sel];if(mBack()){closeSettings();return}
 const d=mL()?-1:mR()?1:0;if(d&&o.ch){o.ch(d);saveSet();SFX.sel()}else if(mOK()){if(o.ok){SFX.ok();o.ok();if(state=='settings')saveSet()}else if(o.ch){o.ch(1);saveSet();SFX.sel()}}}
function drawSettings(){text('SETTINGS',W/2,26,PAL.Y,32,'center');panel(30,34,420,190);
 if(ST.rb){const R=ST.rb;text('P'+(R.p+1)+' KEYBOARD CONTROLS',W/2,56,PCOL[R.p],16,'center');
  [...RB_ACT.map(([k,l])=>[l,KEYMAP[R.p][k].map(KEYLAB).join(' / ')||'-']),['RESET P'+(R.p+1)+' KEYS',''],['DONE','']].forEach(([l,v],k)=>{const y=80+k*17;if(k==R.sel){ctx.fillStyle='#5d4a6e';ctx.fillRect(40,y-13,400,17)}text(l,50,y,k==R.sel?PAL.Y:'#ffffff',16);text(v,430,y,'#a1e55a',16,'right')});
  text('CONTROLLERS: STICK/DPAD MOVE  A JUMP  X ATTACK  B DASH',W/2,218,'#d8dde6',8,'center');
  if(ST.wait){ctx.fillStyle='rgba(0,0,0,.7)';ctx.fillRect(-4e3,-4e3,9e3,9e3);panel(90,100,300,60);text('PRESS A KEY FOR',W/2,124,'#ffffff',16,'center');text(ST.wait,W/2,144,PAL.Y,16,'center');text('ESC TO CANCEL',W/2,156,'#8b93a6',8,'center')}
  bar([[['DP'],'SELECT'],[['A'],'REBIND'],[['B'],'BACK']],[[['\u2191','\u2193'],'SELECT'],[['ENTER'],'REBIND'],[['ESC'],'BACK']]);return}
 const it=setItems();for(let k=ST.top;k<Math.min(it.length,ST.top+10);k++){const o=it[k],y=54+(k-ST.top)*17;if(k==ST.sel){ctx.fillStyle='#5d4a6e';ctx.fillRect(36,y-13,408,17);ctx.fillStyle=PAL.Y;ctx.fillRect(36,y-13,2,17)}
  text(o.l,46,y,k==ST.sel?PAL.Y:'#ffffff',16);if(o.v){const v=o.v();text(o.ch&&k==ST.sel&&!o.ok?'\u2190 '+v+' \u2192':v,436,y,'#a1e55a',v.length>12?8:16,'right')}}
 if(ST.top>0)text('\u2191',W/2,40,'#8b93a6',8,'center');if(ST.top+10<it.length)text('\u2193',W/2,222,'#8b93a6',8,'center');
 if(ST.sel>=10&&ST.sel<=13)text('CPU / STOCKS / TIMER / ITEMS APPLY TO LOCAL MATCHES',W/2,232,'#d8dde6',8,'center');
 bar([[['DP'],'CHANGE'],[['A'],'OK'],[['B'],'BACK']],[[['\u2191','\u2193','\u2190','\u2192'],'CHANGE'],[['ENTER'],'OK'],[['ESC'],'BACK']])}
// ===== Login / register =====
const LG={sel:0,user:'',pass:'',msg:'',busy:false,after:'online'};let OSK=null;
function openLogin(after){LG.after=after;LG.sel=0;LG.msg='';state='login'}
const LG_ITEMS=['USERNAME','PASSWORD','REMEMBER ME','LOG IN','REGISTER','PLAY AS GUEST','BACK'];
function typeKey(ch){if(state=='login'&&LG.sel<2&&!LG.busy){const k=LG.sel?'pass':'user';if(ch=='\b')LG[k]=LG[k].slice(0,-1);else if(LG[k].length<(LG.sel?32:12)&&(LG.sel||/[A-Za-z0-9_]/.test(ch)))LG[k]+=LG.sel?ch:ch.toUpperCase();return true}
 if(state=='joincode'){if(ch=='\b'){JC.pos=Math.max(0,JC.pos-1);JC.code[JC.pos]='A'}else if(/[A-Za-z]/.test(ch)){JC.code[JC.pos]=ch.toUpperCase();JC.pos=Math.min(3,JC.pos+1)}SFX.sel();return true}return false}
function authDo(kind){if(LG.busy)return;if(kind!='guest'&&(!LG.user||!LG.pass)){LG.msg='ENTER USERNAME AND PASSWORD';SFX.err();return}LG.busy=true;LG.msg='...';
 api(kind,kind=='guest'?{}:{username:LG.user,password:LG.pass}).then(j=>{j.fresh=true;setUser(j);if(kind!='guest'&&REMEMBER&&window.PasswordCredential&&navigator.credentials)try{navigator.credentials.store(new PasswordCredential({id:LG.user,password:LG.pass,name:LG.user})).catch(()=>{})}catch(e){}LG.busy=false;LG.pass='';SFX.ok();toast('HI '+ACC.user.username+'!');claimDaily();if(LG.after=='shop')goShop('menu');else{state='online';onlSel=0}})
  .catch(e=>{LG.busy=false;LG.msg=e.message;SFX.err()})}
function updOSK(){const C='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_',n=C.length+2;if(mL())OSK.i=(OSK.i+n-1)%n;if(mR())OSK.i=(OSK.i+1)%n;if(mU())OSK.i=(OSK.i-10+n*10)%n;if(mD())OSK.i=(OSK.i+10)%n;
 if(anyPad(i=>padEdge(i,'A'))||KP.Enter){if(OSK.i<C.length){typeKey(LG.sel?C[OSK.i].toLowerCase():C[OSK.i]);SFX.sel()}else if(OSK.i==C.length){typeKey('\b');SFX.back()}else{OSK=null;SFX.ok()}}
 else if(anyPad(i=>padEdge(i,'X'))){typeKey('\b');SFX.back()}else if(mBack()||anyPad(i=>padEdge(i,'ST'))){OSK=null;SFX.ok()}}
function updLogin(){if(OSK){updOSK();return}if(KP.Tab)LG.sel=(LG.sel+1)%LG_ITEMS.length;LG.sel=listNav(LG_ITEMS.length,LG.sel);
 if(mBack()){state='menu';SFX.back();return}
 if(LG.sel<2&&anyPad(i=>padEdge(i,'A'))){OSK={i:0};SFX.ok();return}
 if(mOK()){if(LG.sel<2){LG.sel++;SFX.sel()}else if(LG.sel==2){REMEMBER=!REMEMBER;try{localStorage.setItem('pdbRemember',REMEMBER?'1':'0')}catch(e){}SFX.sel()}else if(LG.sel==3)authDo('login');else if(LG.sel==4)authDo('register');else if(LG.sel==5)authDo('guest');else{state='menu';SFX.back()}}}
function drawLogin(){text('ONLINE ACCOUNT',W/2,28,PAL.Y,32,'center');panel(90,38,300,182);
 LG_ITEMS.forEach((l,k)=>{const y=k<2?62+k*34:134+(k-2)*15;const on=k==LG.sel;
  if(k<2){text(l,104,y,on?PAL.Y:'#d8dde6',8);panel(104,y+3,272,18,on?'#5d4a6e':'#3b3f52');const v=k?'*'.repeat(LG.pass.length):LG.user;text(v+(on&&Math.floor(t/20)%2?'_':''),110,y+17,'#ffffff',16)}
  else{if(on){ctx.fillStyle='#5d4a6e';ctx.fillRect(140,y-12,200,15)}const L=k==2?l+': '+(REMEMBER?'ON':'OFF'):l;text(on?'\u2192 '+L+' \u2190':L,W/2,y,on?PAL.Y:'#ffffff',16,'center')}});
 if(LG.msg)text(LG.msg,W/2,214,LG.msg=='...'?'#d8dde6':'#f99252',8,'center');
 if(OSK){const C='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_'.split('').concat(['DEL','OK']);panel(60,118,360,92,'#3b3f52');C.forEach((c,k)=>{const x=72+(k%10)*34,y=136+Math.floor(k/10)*18;if(k==OSK.i){ctx.fillStyle='#5d4a6e';ctx.fillRect(x-6,y-13,30,17)}text(c,x+9,y,k==OSK.i?PAL.Y:'#ffffff',c.length>1?8:16,'center')})}
 bar(OSK?[[['A'],'TYPE'],[['X'],'DEL'],[['B'],'DONE']]:[[['DP'],'SELECT'],[['A'],LG.sel<2?'KEYBOARD':'OK'],[['B'],'BACK']],[[['TAB'],'NEXT'],[['ENTER'],'OK'],[['ESC'],'BACK']])}
// ===== Online menu / join =====
let onlSel=0;const ONL_ITEMS=['QUICK MATCH','CREATE PRIVATE ROOM','JOIN WITH CODE','SHOP','LOG OUT','BACK'];const JC={code:['A','A','A','A'],pos:0};
function updOnlineMenu(){onlSel=listNav(ONL_ITEMS.length,onlSel);if(mBack()){state='menu';SFX.back();return}
 if(mOK()){const o=ONL_ITEMS[onlSel];SFX.ok();if(o=='QUICK MATCH'){NET.lobby=null;state='lobby';netOpen({t:'quick'})}else if(o=='CREATE PRIVATE ROOM'){NET.lobby=null;state='lobby';netOpen({t:'create'})}
  else if(o=='JOIN WITH CODE'){JC.code=['A','A','A','A'];JC.pos=0;state='joincode'}else if(o=='SHOP')goShop('online');else if(o=='LOG OUT'){logout();state='menu';toast('LOGGED OUT')}else state='menu'}}
function drawOnlineMenu(){text('ONLINE',W/2,30,PAL.Y,32,'center');acctBadge(W/2,38,'center'==0?'left':'left');panel(W/2-110,54,220,ONL_ITEMS.length*18+10);drawList(ONL_ITEMS,onlSel,W/2,72,206,18);
 if(ACC.user&&ACC.user.guest)text('GUEST ACCOUNT - PROGRESS SAVED ON THIS DEVICE ONLY',W/2,230,'#8b93a6',8,'center');
 text('EARN COINS: PLAY 20  KO 15  WIN 50',W/2,220,'#fee761',8,'center');bar([[['DP'],'SELECT'],[['A'],'OK'],[['B'],'BACK']],[[['\u2191','\u2193'],'SELECT'],[['ENTER'],'OK'],[['ESC'],'BACK']])}
function updJoin(){const A='ABCDEFGHIJKLMNOPQRSTUVWXYZ';if(mL()&&!KP.KeyA){JC.pos=(JC.pos+3)%4;SFX.sel()}if(mR()&&!KP.KeyD){JC.pos=(JC.pos+1)%4;SFX.sel()}
 const cyc=d=>{JC.code[JC.pos]=A[(A.indexOf(JC.code[JC.pos])+d+26)%26];SFX.sel()};if(KP.ArrowUp||anyPad(i=>padRep(i,'up')))cyc(-1);if(KP.ArrowDown||anyPad(i=>padRep(i,'dn')))cyc(1);
 if(KP.Escape||anyPad(i=>padEdge(i,'B'))){state='online';SFX.back();return}
 if(KP.Enter||anyPad(i=>padEdge(i,'A')||padEdge(i,'ST'))){SFX.ok();NET.lobby=null;state='lobby';netOpen({t:'join',code:JC.code.join('')})}}
function drawJoin(){text('JOIN ROOM',W/2,40,PAL.Y,32,'center');panel(W/2-110,60,220,100);text('ROOM CODE',W/2,82,'#d8dde6',16,'center');
 JC.code.forEach((c,k)=>{const x=W/2-78+k*40;panel(x,92,36,44,k==JC.pos?'#5d4a6e':'#3b3f52');text(c,x+18,126,k==JC.pos?PAL.Y:'#ffffff',32,'center');if(k==JC.pos){text('\u2191',x+18,90,PAL.Y,8,'center');text('\u2193',x+18,146,PAL.Y,8,'center')}});
 bar([[['DP'],'EDIT'],[['A'],'JOIN'],[['B'],'BACK']],[[['A-Z'],'TYPE'],[['ENTER'],'JOIN'],[['ESC'],'BACK']])}
// ===== Network client =====
const NET={ws:null,q:null,lobby:null,snaps:[],rt:-1,res:null,you:-1,names:[],timer:0,lb:-1,ping:0};let opause=false;
function netSend(o){if(NET.ws&&NET.ws.readyState==1)NET.ws.send(JSON.stringify(o))}
function netOpen(first){if(NET.ws&&NET.ws.readyState<=1){if(NET.ws.readyState==1)netSend(first);else NET.q=first;return}
 const ws=NET.ws=new WebSocket((location.protocol=='https:'?'wss://':'ws://')+location.host+'/ws?token='+encodeURIComponent(ACC.token||''));NET.q=first;
 ws.onopen=()=>{if(NET.q){netSend(NET.q);NET.q=null}};ws.onmessage=e=>{let m;try{m=JSON.parse(e.data)}catch(_){return}netMsg(m)};
 ws.onclose=()=>{if(NET.ws!==ws)return;NET.ws=null;NET.lobby=null;if(['lobby','ofight','oresult'].includes(state)||(state=='settings'&&ST.back=='ofight')){toast('DISCONNECTED FROM SERVER');state=ACC.user?'online':'menu'}}}
function netClose(){if(NET.ws){const w=NET.ws;NET.ws=null;try{w.close()}catch(e){}}NET.lobby=null}
function netLeave(){netSend({t:'leave'});NET.lobby=null;state='online';opause=false}
function netMsg(m){if(m.t=='lobby'){NET.lobby=m;if(state=='online'||state=='joincode')state='lobby'}
 else if(m.t=='start'){NET.you=m.you;NET.names=m.slots.map(s=>s?s.name:'');CORE.startFight(m.slots,m.arena,{stocks:m.stocks,mode:m.mode||'stock',time:m.time||0,items:m.items|0,ff:!!m.ff});syncCore();arena=m.arena;parts=[];NET.snaps=[];NET.rt=-1;NET.lb=-1;NET.res=null;opause=false;state='ofight';camUpdate(true)}
 else if(m.t=='snap'){if(state!='ofight'&&!(state=='settings'&&ST.back=='ofight'))return;NET.snaps.push(m);if(NET.snaps.length>40)NET.snaps.shift();
  for(const e of m.ev||[]){if(e[0]=='s'){SFX[e[1]]&&SFX[e[1]](e[2])}else if(e[0]=='k')addShake(e[1]);else if(e[0]=='b')burst(e[1],e[2],e[3],e[4],e[5]);else if(e[0]=='o')koFx(e[2],e[3],e[1]);else if(e[0]=='p')partFx(e[1],e[2])}}
 else if(m.t=='end'){NET.res=m;chalToast(m.chal);if(ACC.user&&m.coins!=null)ACC.user.coins=m.coins;const r=m.rank.find(r=>r.i==NET.you);if(r&&r.coins)setTimeout(()=>SFX.coin(),900);if(state=='settings')state='oresult';else state='oresult';opause=false}
 else if(m.t=='user'){ACC.user=m.user}
 else if(m.t=='err'){toast(m.m);SFX.err();if(m.fatal&&state=='lobby')state='online'}}
function netInput(){const any=a=>a.some(k=>K[k]),anyP=a=>a.some(k=>KP[k]);const o={};
 for(const m of [KEYMAP[0],KEYMAP[3]]){for(const k of ['l','r','u','d','a','s'])o[k]=o[k]||any(m[k]);o.upE=o.upE||anyP(m.u);o.dE=o.dE||anyP(m.d);o.ap=o.ap||anyP(m.a);o.sp=o.sp||anyP(m.s)}
 for(let pi=0;pi<4;pi++){const p=padState(pi);if(!p)continue;for(const k of ['l','r','u','d','a','s'])o[k]=o[k]||p[k];o.upE=o.upE||padEdge(pi,'u');o.dE=o.dE||padEdge(pi,'d');o.ap=o.ap||padEdge(pi,'a');o.sp=o.sp||padEdge(pi,'s')}return o}
function updOFight(){if(opause){pauseSel=listNav(3,pauseSel);if(KP.Escape||anyPad(i=>padEdge(i,'ST')||padEdge(i,'B'))){opause=false;SFX.back()}
  else if(mOK()){SFX.ok();if(pauseSel==0)opause=false;else if(pauseSel==1)openSettings('ofight');else netLeave()}}
 else if(KP.Escape||anyPad(i=>padEdge(i,'ST'))){opause=true;pauseSel=0;SFX.sel()}
 const o=opause?{}:netInput();let b=0,e=0;['l','r','u','d','a','s'].forEach((k,j)=>{if(o[k])b|=1<<j});['upE','dE','ap','sp'].forEach((k,j)=>{if(o[k])e|=1<<j});if(b!=NET.lb||e){netSend({t:'in',b,e});NET.lb=b}
 interp()}
function interp(){const S=NET.snaps;if(!S.length)return;const newest=S[S.length-1].tick;
 if(NET.rt<0||Math.abs(newest-4-NET.rt)>12)NET.rt=newest-4;else{NET.rt+=1;if(NET.rt>newest-2)NET.rt=newest-2;if(NET.rt<newest-7)NET.rt+=1}
 while(S.length>3&&S[1].tick<NET.rt-6)S.shift();
 let a=S[0],c=S[S.length-1];for(let k=0;k<S.length-1;k++)if(S[k].tick<=NET.rt&&S[k+1].tick>=NET.rt){a=S[k];c=S[k+1];break}
 const al=c.tick>a.tick?clamp((NET.rt-a.tick)/(c.tick-a.tick),0,1):1,L=S[S.length-1];
 F.forEach((f,k)=>{const fa=a.F[k],fc=c.F[k];if(!fa||!fc)return;
  if(f.i==NET.you)CORE.unsnap(L.F[k],f);else{CORE.unsnap(al<.5?fa:fc,f);if(Math.abs(fa[0]-fc[0])<400&&Math.abs(fa[1]-fc[1])<400){f.x=(fa[0]+(fc[0]-fa[0])*al)/10;f.y=(fa[1]+(fc[1]-fa[1])*al)/10}}
  f.anim+=Math.abs(f.vx)*.1;if(f.dashT>0){f.trail.unshift([f.x,f.y]);if(f.trail.length>4)f.trail.pop()}else if(f.trail.length)f.trail.pop()});
 CORE.unsnapX(L.X);readyT=L.readyT;endT=L.endT;NET.timer=L.timer;camUpdate(false)}
function updResult(){if(mOK()||mStart()){SFX.ok();state=NET.lobby?'lobby':'online'}else if(mBack()){SFX.back();netLeave()}}
function drawResults(){const R=NET.res;if(!R)return;ctx.fillStyle='rgba(59,44,46,.8)';ctx.fillRect(-4e3,-4e3,9e3,9e3);panel(60,20,360,212);
 const w=R.winner!=null?R.rank.find(r=>r.i==R.winner):null;const tm=CORE.opts&&CORE.opts.teams;text(w?(tm?'TEAM '+TEAMN[w.i%2]+' WINS!':w.name+' WINS!'):'DRAW!',W/2,50,w?(tm?TEAMC[w.i%2]:PCOL[w.i]):'#ffffff',32,'center');
 R.rank.forEach((r,k)=>{const y=70+k*30;panel(76,y,328,26,r.i==NET.you?'#5d4a6e':'#3b3f52');text(String(k+1),88,y+19,PAL.Y,16,'center');drawSheet(imgs[r.skin],98,y+1,1,0,0);text(r.name,120,y+18,PCOL[r.i],16);
  text(r.kos+' KO',300,y+18,'#ffffff',16,'right');if(r.coins){coinIcon(318,y+9);text('+'+r.coins,330,y+17,'#fee761',16)}});
 const me=R.rank.find(r=>r.i==NET.you);if(me&&me.bd)text(bdText(me.bd),W/2,186,'#d8dde6',8,'center');
 if(ACC.user){coinIcon(W/2-40,196);text('TOTAL '+ACC.user.coins,W/2-30,203,'#fee761',8)}
 bar([[['A'],'CONTINUE'],[['B'],'LEAVE']],[[['ENTER'],'CONTINUE'],[['ESC'],'LEAVE']],212)}
// ===== Lobby =====
function lobbySkin(d){const L=NET.lobby;if(!L)return;const me=L.slots[L.you];if(!me)return;let s=me.skin;for(let k=0;k<NS;k++){s=(s+d+NS)%NS;if(owned(s))break}me.skin=s;netSend({t:'skin',skin:s});SFX.sel()}
function updLobby(){const L=NET.lobby;if(mBack()){SFX.back();netLeave();return}if(!L)return;
 if(mL())lobbySkin(-1);if(mR())lobbySkin(1);
 if(L.host&&!L.quick){if(KP.KeyQ||anyPad(i=>padEdge(i,'LB'))){netSend({t:'arena',arena:(L.arena+ARENAS.length-1)%ARENAS.length});SFX.sel()}if(KP.KeyE||anyPad(i=>padEdge(i,'RB'))){netSend({t:'arena',arena:(L.arena+1)%ARENAS.length});SFX.sel()}
  if(KP.KeyC||anyPad(i=>padEdge(i,'Y'))){netSend({t:'addcpu'});SFX.sel()}if(KP.Backspace||anyPad(i=>padEdge(i,'X'))){netSend({t:'delcpu'});SFX.sel()}
  const MI=PDBCore.MODES.findIndex(x=>x.id==L.mode);if(KP.KeyM||anyPad(i=>padRep(i,'up'))){netSend({t:'rules',mode:PDBCore.MODES[(MI+1)%PDBCore.MODES.length].id});SFX.sel()}
  if(KP.KeyI||anyPad(i=>padRep(i,'dn'))){netSend({t:'rules',items:((L.items|0)+1)%4});SFX.sel()}if(L.mode=='teams'&&(KP.KeyF||anyPad(i=>padEdge(i,'BK')))){netSend({t:'rules',ff:!L.ff});SFX.sel()}
  if(mStart()||anyPad(i=>padEdge(i,'A'))){netSend({t:'start'});SFX.ok()}}}
function drawLobby(){const L=NET.lobby;if(!L){text(NET.ws&&NET.ws.readyState==1?'JOINING...':'CONNECTING...',W/2,130,'#ffffff',32,'center');bar([[['B'],'CANCEL']],[[['ESC'],'CANCEL']]);return}
 text(L.quick?'QUICK MATCH':'PRIVATE ROOM',W/2,26,PAL.Y,32,'center');if(!L.quick){panel(W/2-60,32,120,22);text('CODE: '+L.code,W/2,48,'#ffffff',16,'center')}acctBadge(4,4);
 for(let i=0;i<4;i++){const s=L.slots[i],x=8+i*118,y=60;panel(x,y,110,116,i==L.you?'#5d4a6e':'#2b2b40');ctx.fillStyle=PCOL[i];ctx.fillRect(x+1,y+1,108,3);
  if(!s){text(L.quick?'SEARCHING':'EMPTY',x+55,y+60,'#8b93a6',16,'center');continue}
  text(s.name.slice(0,12),x+55,y+20,PCOL[i],s.name.length>6?8:16,'center');drawSheet(imgs[s.skin],x+39,y+28,1,2,Math.floor(t/7)%4,2);text(NAMES[s.skin],x+55,y+90,PAL.Y,16,'center');
  text(s.type=='cpu'?'CPU':i==L.you?'YOU':s.host?'HOST':'PLAYER',x+55,y+106,'#d8dde6',8,'center')}
 const A=ARENAS[L.arena];text(L.quick?'ARENA: RANDOM':'ARENA: \u2190 '+A.name+' \u2192',W/2,188,'#ffffff',16,'center');text(rulesLine(L.quick?'stock':L.mode,L.quick?2:L.items,L.ff),W/2,201,'#ffffff',8,'center');
 let st=L.count>=0?'STARTING IN '+L.count:L.quick?(L.fill>=0?'WAITING FOR PLAYERS... CPU FILL IN '+L.fill:'WAITING FOR PLAYERS...'):L.host?'START WHEN READY (2+ FIGHTERS)':'WAITING FOR HOST TO START';text(st,W/2,216,L.count>=0?PAL.Y:'#d8dde6',st.length>30?8:16,'center');
 if(L.host&&!L.quick){bar([[['LB','RB'],'ARENA'],[['UP'],'MODE'],[['DN'],'ITEMS'],...(L.mode=='teams'?[[['BK'],'FF']]:[]),[['Y','X'],'CPU'],[['A'],'START']],[[['Q','E'],'ARENA'],[['M'],'MODE'],[['I'],'ITEMS'],...(L.mode=='teams'?[[['F'],'FF']]:[]),[['C','BKSP'],'CPU'],[['ENTER'],'START']],242)}
 else bar([[['DP'],'SKIN'],[['B'],'LEAVE']],[[['\u2190','\u2192'],'SKIN'],[['ESC'],'LEAVE']],242)}
// ===== Shop =====
const SH={sel:4,back:'menu',busy:false};
function updShop(){let c=SH.sel%GC,r=Math.floor(SH.sel/GC);const R=Math.ceil(NS/GC);if(mL()){c=(c+GC-1)%GC;SFX.sel()}if(mR()){c=(c+1)%GC;SFX.sel()}if(mU()){r=(r+R-1)%R;SFX.sel()}if(mD()){r=(r+1)%R;SFX.sel()}SH.sel=Math.min(NS-1,r*GC+c);
 if(mBack()){state=SH.back=='online'?'online':'menu';SFX.back();return}
 if(KP.KeyC||anyPad(i=>padEdge(i,'Y'))){api('coins/checkout',{pack:'small'}).then(()=>toast('OK')).catch(e=>{toast(e.message);SFX.err()})}
 if(mOK()&&!SH.busy){const n=SH.sel;if(owned(n)){toast('ALREADY UNLOCKED');SFX.sel();return}if(ACC.user.coins<PRICES[n]){toast('NOT ENOUGH COINS');SFX.err();return}
  SH.busy=true;api('shop/buy',{skin:n}).then(j=>{SH.busy=false;ACC.user=j.user;SFX.unlock();setTimeout(()=>SFX.coin(),350);toast(NAMES[n]+' UNLOCKED!');burst(W/2,120,'#fee761',30,3)}).catch(e=>{SH.busy=false;toast(e.message);SFX.err()})}}
function drawShop(){text('SKIN SHOP',W/2,24,PAL.Y,32,'center');acctBadge(W-4,4,'right');const gx=Math.round((W-GC*30)/2),gy=32;
 for(let n=0;n<NS;n++){const x=gx+(n%GC)*30,y=gy+Math.floor(n/GC)*33;panel(x,y,28,31,n==SH.sel?'#5d4a6e':'#2b2b40');ctx.drawImage(imgs[n],0,0,FW,FH,x+6,y+4,FW,FH);if(!owned(n))lockIcon(x,y,PRICES[n]);
  if(n==SH.sel){ctx.fillStyle=PAL.Y;ctx.fillRect(x-1,y-1,30,2);ctx.fillRect(x-1,y+30,30,2);ctx.fillRect(x-1,y-1,2,33);ctx.fillRect(x+27,y-1,2,33)}}
 const n=SH.sel;panel(60,136,360,74);drawSheet(imgs[n],76,140,1,2,Math.floor(t/7)%4,3);text(NAMES[n],140,160,PAL.Y,24);
 if(owned(n))text('UNLOCKED',140,184,'#a1e55a',16);else{coinIcon(140,175);text(String(PRICES[n]),152,184,'#fee761',16);text(ACC.user&&ACC.user.coins>=PRICES[n]?'PRESS A / ENTER TO BUY':'EARN COINS: PLAY ONLINE OR VS CPU WHILE LOGGED IN',140,200,'#d8dde6',8)}
 bar([[['DP'],'BROWSE'],[['A'],'BUY'],[['Y'],'BUY COINS'],[['B'],'BACK']],[[['\u2190','\u2192'],'BROWSE'],[['ENTER'],'BUY'],[['C'],'BUY COINS'],[['ESC'],'BACK']],242)}
// ===== UI dispatch =====
const UIS=new Set(['menu','settings','login','online','joincode','lobby','shop']);
function drawUI(){if(state=='menu')drawMenu();else if(state=='settings')drawSettings();else if(state=='login')drawLogin();else if(state=='online')drawOnlineMenu();else if(state=='joincode')drawJoin();else if(state=='lobby')drawLobby();else if(state=='shop')drawShop()}
function updUI(){if(state=='menu')updMenu();else if(state=='settings')updSettings();else if(state=='login')updLogin();else if(state=='online')updOnlineMenu();else if(state=='joincode')updJoin();else if(state=='lobby')updLobby();else if(state=='ofight')updOFight();else if(state=='oresult'){interp();updResult()}else if(state=='shop')updShop()}
// ===== Mouse / touch BACK button (every screen except title & main menu) =====
const BACKBTN={x:4,y:4,w:58,h:18};let backClick=false;
function backBtnShown(){return !['title','menu'].includes(state)&&!(state=='ofight'&&!opause)&&!ST.wait&&!CAPTURE}
function backLabel(){return state=='fight'?'PAUSE':(state=='pause'||state=='win'||state=='select')?'MENU':'BACK'}
cv.addEventListener('pointerdown',e=>{if(!backBtnShown())return;const r=cv.getBoundingClientRect(),x=(e.clientX-r.left)*W/r.width,y=(e.clientY-r.top)*H/r.height;
 const b=BACKBTN;if(x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h){backClick=true;e.preventDefault()}});
function doBackClick(){backClick=false;if(!backBtnShown())return;
 if(state=='pause'||state=='win'||state=='select'){state='menu';SFX.back();return}
 if(state=='ofight'&&opause){netLeave();SFX.back();return}
 KP.Escape=true} // every other screen already treats Escape as back
const _updRaw=update;update=function(){if(backClick)doBackClick();_updRaw()};
const _drawRaw=draw;draw=function(){_drawRaw();if(!backBtnShown())return;ctx.save();ctx.setTransform(cv.width/W,0,0,cv.height/H,0,0);const b=BACKBTN,l=backLabel();
 panel(b.x,b.y,b.w,b.h);text(l,b.x+b.w/2,b.y+13,'#ffffff',8,'center');ctx.restore()}

// ===== Coin earning (server decides amounts) =====
function claimDaily(){if(!ACC.user||ACC.user.guest)return;api('daily',{}).then(j=>{ACC.user=j.user;if(j.bonus){toast('DAILY BONUS +'+j.bonus+' COINS');setTimeout(()=>SFX.coin(),300)}}).catch(()=>{})}
function bdText(b){const p=[];if(b.part)p.push('PLAY +'+b.part);if(b.ko)p.push('KO +'+b.ko);if(b.place)p.push('PLACE +'+b.place);if(b.win)p.push('WIN +'+b.win);if(b.firstWin)p.push('1ST WIN TODAY +'+b.firstWin);return p.join('  ')}
const LC={ticket:null,res:null,busy:false,me:-1};
const _sfRaw=startFight;startFight=function(){_sfRaw();LKOS.fill(0);LC.res=null;LC.ticket=null;LC.me=slots.findIndex(s=>s.type=='human');
 if(ONLINE&&ACC.user&&LC.me>=0)api('local/start',{}).then(j=>LC.ticket=j.ticket).catch(()=>{})};
function localClaim(){const tk=LC.ticket;LC.ticket=null;if(!tk||!ACC.user)return;LC.busy=true;
 api('local/end',{ticket:tk,players:slots.filter(s=>s.type!='none').length,kos:LKOS[LC.me]||0,won:!!(winner&&winner.i==LC.me),flawless:!!(winner&&winner.i==LC.me&&F[LC.me]&&F[LC.me].stocks>=SET.stocks),mode:typeof MODE!='undefined'?MODE.id:'stock'}).then(j=>{LC.busy=false;LC.res=j;ACC.user=j.user;chalToast(j.chal);if(j.coins)setTimeout(()=>SFX.coin(),400)}).catch(()=>{LC.busy=false})}
let _prevState=null;const _updC=update;update=function(){_updC();if(state=='win'&&_prevState!='win')localClaim();_prevState=state};
const _drawC=draw;draw=function(){_drawC();if(!ONLINE)return;ctx.save();ctx.setTransform(cv.width/W,0,0,cv.height/H,0,0);
 if(state=='menu'&&ACC.user)safe(()=>acctBadge(W-4,4,'right'));
 if(state=='win')safe(()=>{if(!ACC.user)text('LOG IN TO EARN COINS',W/2,184,'#f99252',8,'center');else if(LC.busy)text('COUNTING COINS...',W/2,184,'#d8dde6',8,'center');
  else if(LC.res){const r=LC.res;coinIcon(W/2-60,176);text('+'+r.coins+' COINS   TOTAL '+ACC.user.coins,W/2-50,183,'#fee761',8);text(r.coins?bdText(r.breakdown)+(r.capped?'  (DAILY CAP)':''):(r.why||'DAILY LOCAL CAP REACHED').toUpperCase(),W/2,192,'#d8dde6',8,'center')}});
 if(state=='select'&&!ACC.user)safe(()=>text('LOG IN VIA ONLINE TO EARN COINS + UNLOCK SKINS',W/2,133,'#f99252',8,'center'));
 ctx.restore()}
