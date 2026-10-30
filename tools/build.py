#!/usr/bin/env python3
"""Builds the browser client.
  public/index.html                       -> online client (ONLINE=true), served by the Node server
  /workspace/pixel-platformer/index.html  -> standalone single-file build (ONLINE=false, local only)"""
import json,os,re,sys
R=os.path.dirname(os.path.abspath(__file__));P=os.path.dirname(R)
L=open(R+'/fight_orig.js').read().split('\n')
src=lambda n:open(P+'/src/'+n).read()
art=json.load(open(R+'/parts.json'))['art'].replace('function text(','function textRaw(').replace('function drawBG(','function drawBGRaw(')
def rng(a,b):return '\n'.join(L[a-1:b])
inp=rng(30,57)
inp=inp.replace("const KEYMAP=[","const DEFKEYS=[",1)
inp=inp.replace("lab:['ARROWS MOVE','/ ATK  . DASH']}];","lab:['ARROWS MOVE','/ ATK  . DASH']}];\nconst KEYMAP=DEFKEYS.map(m=>({lab:m.lab}));function loadKeys(){KEYMAP.forEach((m,i)=>{for(const k of ['l','r','u','d','a','s']){const s=SET.keys&&SET.keys[i]&&SET.keys[i][k];m[k]=Array.isArray(s)?s.slice():DEFKEYS[i][k].slice()}})}loadKeys();")
inp=inp.replace("const DZ=.35;","let DZ=SET.dz;")
inp=inp.replace("const KEYLAB=c=>(","const KEYLAB=c=>!c?'-':(").replace("[c]||c.replace('Key',''));","[c]||c.replace(/^Key|^Digit/,'').replace('Numpad','N').replace('Left','').replace('Right','').replace('Bracket','[').replace('Control','CTRL').toUpperCase().slice(0,5));")
inp=inp.replace("lastDev='kb';KEYMAP.forEach","lastDev='kb';if(state!='select')return;KEYMAP.forEach")
assert 'let DZ' in inp and 'loadKeys()' in inp
st=rng(59,63)
st=st.replace("let shakeMode=+(localStorage.getItem('pdbShake')||0),showFPS=false;const SHAKE_NAMES","const SHAKE_NAMES").replace("v*SHAKE_K[shakeMode]","v*SHAKE_K[SET.shake]").replace("function setShake(m){shakeMode=m;try{localStorage.setItem('pdbShake',m)}catch(e){}}","function setShake(m){SET.shake=m;saveSet()}")
st=st.replace("let state='select'","let state='title'")
assert 'shakeMode' not in st
sf="""function startFight(){CORE.startFight(slots.map(s=>({type:s.type,skin:s.skin})),arena,{stocks:SET.stocks,diff:SET.diff,time:SET.timer*3600,items:SET.items,mode:SET.mode||'stock',ff:!!SET.ff});syncCore();parts=[];state='fight';camUpdate(true)}
"""+L[67]  # burst / PMAX line 68
rest=rng(112,237)
def pat(a):
  return re.compile(r'\s*'.join(re.escape(x) for x in re.split(r'(?:^|\n) +',a)) if False else re.sub(r'(\\\n|^)(\\ )+',lambda m:(m.group(1))+' *',re.escape(a)))
def R1(a,b,c=1):
  global rest
  m=pat(a.strip(' ')).search(rest);assert m,a[:60];rest=rest[:m.start()]+b.strip(' ')+rest[m.end():]
def IDX(a):
  m=pat(a.strip(' ')).search(rest);assert m,a[:60];return m.start()
R1("ctx.drawImage(PLANK,x*T","ctx.drawImage(THEMES[thOfMap(map)].plank||PLANK,x*T")
# themed backgrounds, cached per theme
R1("let BGC=null;function drawBGcache(){BGC=document.createElement('canvas');BGC.width=W;BGC.height=H;const real=ctx;ctx=BGC.getContext('2d');ctx.imageSmoothingEnabled=false;drawBGRaw();ctx=real}","let BGC=null,BGCS={};function curTh(){return state=='title'?TT.th:['fight','pause','win','ofight','oresult','arena'].includes(state)||(state=='settings'&&ST.back!='menu')?arena:0}")
R1("function drawBG(){if(camX==0){if(!BGC)drawBGcache();ctx.drawImage(BGC,0,0)}else drawBGRaw()}","function drawBG(){ctx.drawImage(bgCanvas(),0,0)}")
R1("function bgCanvas(){if(!BGC){const sv=camX;camX=0;drawBGcache();camX=sv}return BGC}","function bgCanvas(th=curTh()){if(!BGC){BGCS={};BGC=1}let c=BGCS[th];if(!c){c=document.createElement('canvas');c.width=W;c.height=H;const real=ctx,sv=camX;ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;camX=0;THEMES[th].bg();camX=sv;ctx=real;BGCS[th]=c}return c}")
# camera: any aspect ratio
R1("const maxV=Math.min(960,Math.max(480,WW)),tv=Math.max(480,Math.min(maxV,Math.max(x1-x0+220,(y1-y0+150)*16/9)))","const maxV=Math.min(2*W,Math.max(W,WW)),tv=Math.max(W,Math.min(maxV,Math.max(x1-x0+220,(y1-y0+150)*W/H)))")
R1("const vw=cam.vw,vh=vw*.5625;","const vw=cam.vw,vh=vw*H/W;")
R1("const WB=document.createElement('canvas');WB.width=960;WB.height=540;const wctx=WB.getContext('2d');","const WB=document.createElement('canvas');WB.width=960;WB.height=540;let wctx=WB.getContext('2d');")
R1("function drawWorld(){const vw=Math.round(cam.vw),vh=Math.round(vw*.5625);","function drawWorld(){const vw=Math.round(cam.vw),vh=Math.round(vw*H/W);if(WB.width<vw||WB.height<vh){WB.width=Math.max(WB.width,vw+8);WB.height=Math.max(WB.height,vh+8);wctx=WB.getContext('2d')}")
R1("Math.min(222,y)","Math.min(H-48,y)")
# update()
R1("if(KP.F3)showFPS=!showFPS;if((state=='fight'||state=='pause')&&(KP.F4||anyPad(i=>padEdge(i,'BK')))){setShake((shakeMode+1)%3);toast('SHAKE: '+SHAKE_NAMES[shakeMode])}",
   "if(KP.F3){SET.fps=!SET.fps;saveSet()}if((state=='fight'||state=='pause'||state=='ofight')&&(KP.F4||anyPad(i=>padEdge(i,'BK')))){setShake((SET.shake+1)%3);toast('SHAKE: '+SHAKE_NAMES[SET.shake])}\n  playSong(['fight','pause','win','ofight','oresult'].includes(state)||(state=='settings'&&ST.back!='menu')?ARENAS[arena].name:state=='title'?'title':'menu');setDuck(state=='pause'||(state=='ofight'&&opause)||(state=='settings'&&ST.back!='menu')?.4:1);")
R1("if(state=='select'){for(let i=0;i<4;i++)","if(state=='title')updTitle();else if(UIS.has(state)||state=='ofight'||state=='oresult')updUI();\n  else if(state=='select'){if(KP.Escape){state='menu';SFX.back()}for(let i=0;i<4;i++)")
R1("if(si<0){if(padEdge(pi,'A')","if(si<0){if(padEdge(pi,'B')&&!slots.some(s=>s.type=='human')){state='menu';SFX.back();continue}if(padEdge(pi,'A')")
R1("function goArena(){if(nPlayers()>=2){state='arena';SFX.go()}","function goArena(){const bad=slots.findIndex(s=>s.type=='human'&&!owned(s.skin));if(bad>=0){toast('P'+(bad+1)+': '+NAMES[slots[bad].skin]+' IS LOCKED - SEE SHOP');SFX.err();return}if(nPlayers()>=2){state='arena';SFX.ok()}")
R1("""   if(readyT>0){readyT--;if(readyT==30)SFX.go()}
   if(hitstop>0)hitstop--;else{for(const f of F)updF(f,f.cpu?ai(f):rawInput(f.i))}camUpdate(false);
   const alive=F.filter(f=>!f.out);if(alive.length<=1&&!endT){endT=90;winner=alive[0]||null}if(endT&&--endT==0)state='win'}}""",
"""   const r=CORE.step(i=>rawInput(i));syncCore();camUpdate(false);if(r=='win')state='win'}}""")
i0=IDX("else if(state=='pause'){");i1=IDX("else if(state=='win')")
rest=rest[:i0]+"""  else if(state=='pause'){pauseSel=listNav(4,pauseSel);
   if(KP.Escape||anyPad(i=>padEdge(i,'ST')||padEdge(i,'B'))){state='fight';SFX.back()}
   else if(mOK()){SFX.ok();if(pauseSel==0)state='fight';else if(pauseSel==1){startFight();SFX.go()}else if(pauseSel==2)openSettings('pause');else{state='menu';SFX.back()}}}
"""+rest[i1:]
R1("else if(mBack()){state='select';SFX.sel()}}\n  if(state!='pause')","else if(mBack()){state='menu';SFX.back()}}\n  if(state!='pause')")
# glyphs / prompts
R1("function prompt(items,x,y,al='center',ps=lastPadPS,","function prompt(items,x,y,al='center',ps=PSM(),")
R1("function slotPS(s){return s.pad!=null&&isPS(padsRaw[s.pad])}","function slotPS(s){return SET.prompts?SET.prompts==2:s.pad!=null&&isPS(padsRaw[s.pad])}")
# HUD anchored to bottom edge, names online
R1("y=232;panel(x,y,cw,34)","y=H-38;panel(x,y,cw,34)")
R1("text((f.cpu?'CPU':'P'+(f.i+1)),x+24,y+15,PCOL[f.i],16)","text(hudName(f),x+24,y+15,PCOL[f.i],hudName(f).length>8?8:16)")
# draw()
R1("if(state=='select'||state=='arena')drawBG();ctx.save();\n  if(state=='select'){","if(state=='select'||state=='arena'||UIS.has(state))drawBG();ctx.save();\n  if(state=='title')drawTitle();else if(UIS.has(state))safe(drawUI);else if(state=='select')safe(()=>{")
R1("[[KC('ENTER')],n>=2?'FIGHT!':'NEED 2+ PLAYERS']],W/2,254)}}\n","[[KC('ENTER')],n>=2?'FIGHT!':'NEED 2+ PLAYERS']],W/2,254)}})\n")
R1("ctx.drawImage(imgs[n],0,0,FW,FH,x+6,y+4,FW,FH)}","ctx.drawImage(imgs[n],0,0,FW,FH,x+6,y+4,FW,FH);if(!owned(n))lockIcon(x,y,PRICES[n])}")
R1("text(NAMES[s.skin],x+72,y+50,PAL.Y,16,'center');","text(NAMES[s.skin],x+72,y+50,PAL.Y,16,'center');if(s.type=='human'&&!owned(s.skin))text('LOCKED',x+72,y+62,'#f99252',8,'center');")
R1("  else if(state=='arena'){text(","  else if(state=='arena')safe(()=>{text(")
R1("else if(state=='arena'){if(mL()){","else if(state=='arena'){modeKeys();if(mL()){")
R1("panel(40,214,400,30);if(lastDev=='pad')prompt([[[PB('DP')],'CHOOSE'],[[PB('A')],'FIGHT'],[[PB('B')],'BACK']],W/2,224);else prompt([[[KC('\\u2190'),KC('\\u2192')],'CHOOSE'],[[KC('ENTER')],'FIGHT'],[[KC('ESC')],'BACK']],W/2,224)","drawModePick();panel(20,222,440,30);if(lastDev=='pad')prompt([[[PB('DP')],'ARENA'],[[PB('LB'),PB('RB')],'MODE'],...(SET.mode=='teams'?[[[PB('Y')],'FF']]:[]),[[PB('A')],'FIGHT'],[[PB('B')],'BACK']],W/2,232);else prompt([[[KC('\\u2190'),KC('\\u2192')],'ARENA'],[[KC('\\u2191'),KC('\\u2193')],'MODE'],...(SET.mode=='teams'?[[[KC('F')],'FF']]:[]),[[KC('ENTER')],'FIGHT'],[[KC('ESC')],'BACK']],W/2,232)")
R1("for(let s=0;s<f.stocks;s++){ctx.fillStyle=PAL.o;","if(hudPts(f,x,y)){}else for(let s=0;s<f.stocks;s++){ctx.fillStyle=PAL.o;")
R1("ctx.drawImage(mapCanvas(),0,-T);F.forEach(f=>drawF(f,0));","ctx.drawImage(mapCanvas(),0,-T);drawItems();F.forEach(f=>drawF(f,0));drawBuffs();")
R1("[[KC('ESC')],'BACK']],W/2,232)}\n  else{drawWorld();","[[KC('ESC')],'BACK']],W/2,232)})\n  else{drawWorld();")
R1("ctx.restore();ctx.save();drawIndicators();drawHUD();","ctx.restore();ctx.save();drawIndicators();drawHUD();const tm=state=='ofight'||state=='oresult'?NET.timer:CORE.timer;if(tm>0&&(state!='fight'||CORE.opts.time)){const s=Math.ceil(tm/60);panel(W/2-26,2,52,18);text(Math.floor(s/60)+':'+String(s%60).padStart(2,'0'),W/2,16,s<=10?'#e04848':'#ffffff',16,'center')}\n   safe(()=>{")
R1("if(endT)text('GAME!',W/2,110,PAL.Y,48,'center');","if(endT)text(tm==0&&(CORE.opts.time||state!='fight')&&!(F.filter(f=>!f.out).length<=1)?'TIME!':'GAME!',W/2,110,PAL.Y,48,'center');")
R1("ctx.fillRect(0,0,W,H);panel(90,30,300,190)","ctx.fillRect(-4e3,-4e3,9e3,9e3);panel(90,30,300,190)")
R1("text((winner.cpu?'CPU ':'P')+(winner.i+1)+' WINS!',W/2,66,PCOL[winner.i],32,'center')","text(CORE.opts.teams?'TEAM '+TEAMN[winner.team&1]+' WINS!':(winner.cpu?'CPU ':'P')+(winner.i+1)+' WINS!',W/2,66,CORE.opts.teams?TEAMC[winner.team&1]:PCOL[winner.i],32,'center')")
i0=IDX("if(state=='fight'&&readyT<=0){");i1=IDX("toasts.slice(0,1)")
rest=rest[:i0]+"""   if(state=='oresult')drawResults();
   if(state=='pause'||(state=='ofight'&&opause)){const O=state=='pause'?['RESUME','RESTART','SETTINGS','QUIT TO MENU']:['RESUME','SETTINGS','LEAVE MATCH'];ctx.fillStyle='rgba(59,44,46,.7)';ctx.fillRect(-4e3,-4e3,9e3,9e3);panel(120,40,240,170);text('PAUSED',W/2,78,PAL.Y,32,'center');
    drawList(O,pauseSel,W/2,100,180,20);if(state=='ofight')text('MATCH KEEPS RUNNING ONLINE',W/2,170,'#d8dde6',8,'center');
    if(lastDev=='pad')prompt([[[PB('DP')],'SELECT'],[[PB('A')],'OK'],[[PB('B')],'BACK']],W/2,184);else prompt([[[KC('\\u2191'),KC('\\u2193')],'SELECT'],[[KC('ENTER')],'OK'],[[KC('ESC')],'BACK']],W/2,184)}})
   if((state=='fight'||state=='ofight')&&readyT<=0&&!opause){if(lastDev=='pad')prompt([[[PB('ST')],'PAUSE']],W-6,6,'right');else prompt([[[KC('ESC')],'PAUSE']],W-6,6,'right')}}
"""+rest[i1:]
rest=rest.replace("if(padEdge(pi,'B')&&!slots.some(s=>s.type=='human')){state='menu'","if(padEdge(pi,'B')){state='menu'")
rest=rest.replace("[[PB('ST')],n>=2?'FIGHT!':'NEED 2+']],W/2,254)","[[PB('ST')],n>=2?'FIGHT!':'NEED 2+'],[[PB('B')],'MENU']],W/2,254)")
rest=rest.replace("[[KC('BKSP')],'DEL CPU']],W/2,241)","[[KC('BKSP')],'DEL CPU'],[[KC('ESC')],'MENU']],W/2,241)")
rest=rest.replace("' IS LOCKED - SEE SHOP'","(ACC.user?' IS LOCKED - SEE SHOP':' IS LOCKED - LOG IN TO UNLOCK')")
rest=rest.replace("text('LOCKED',x+72,y+62,'#f99252',8,'center');","text(ACC.user?'LOCKED - SHOP':'LOG IN TO UNLOCK',x+72,y+62,'#f99252',8,'center');")

rest+="\nfunction hudName(f){if(state=='ofight'||state=='oresult'){const n=(NET.names[f.i]||'P'+(f.i+1)).slice(0,10);return f.i==NET.you?n:n}return f.cpu?'CPU':'P'+(f.i+1)}"
tail=rng(238,246).replace('arenaPrev=ARENAS.map(a=>{','arenaPrev=ARENAS.map((a,ai)=>{').replace('ctx.drawImage(bgCanvas(),0,0,c.width,c.height)','ctx.drawImage(bgCanvas(ai),0,0,c.width,c.height)').replace("if(showFPS)","if(SET.fps)").replace("window.__game={","window.__game={get NET(){return NET},get ACC(){return ACC},SET,CORE,saveSet,setState:s=>state=s,get W(){return W},get H(){return H},")
tail=tail.replace("Promise.all(imgs.map","applySet();\nPromise.all(imgs.map")
def client(online):
  return '\n'.join([L[0],L[1].replace('const W=480,H=270,','let W=480,H=270;const ').replace(';const T=16',';const T=16') ,"const ONLINE="+('true' if online else 'false')+";",L[2],L[3],L[4],src('audio.js'),art,src('themes.js'),rng(9,12),src('glue.js'),inp,'// ===== State =====',st,sf,rest,src('ui.js'),src('extra.js'),src('cosm.js'),src('tour.js')+src('sky.js'),src('title.js'),tail])
head=open(R+'/head.html').read().replace('<style>html,body{margin:0;background:#111;height:100%;display:flex;align-items:center;justify-content:center}canvas{image-rendering:pixelated;width:960px;height:540px;max-width:100vw;max-height:56.25vw}</style>',
 '<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no"><style>html,body{margin:0;padding:0;background:#000;width:100%;height:100%;overflow:hidden}canvas{position:fixed;left:0;top:0;display:block;image-rendering:pixelated;image-rendering:crisp-edges;width:100vw;height:100vh}</style>')
assert 'overflow:hidden' in head
tl=open(R+'/tail.html').read();core=open(P+'/shared/core.js').read()
def post(js):
  def X(a,b,n=None):
    nonlocal js
    c=js.count(a);assert c and (n is None or c==n),(a,c);js=js.replace(a,b)
  for a,b in [("s:['KeyE'],lab","s:['KeyE'],x:['KeyZ'],lab"),("s:['KeyY'],lab","s:['KeyY'],x:['KeyV'],lab"),("s:['KeyO'],lab","s:['KeyO'],x:['KeyP'],lab"),("s:['Period','Numpad2'],lab","s:['Period','Numpad2'],x:['Comma','Numpad3'],lab")]:X(a,b,1)
  X("['l','r','u','d','a','s']","['l','r','u','d','a','s','x']")
  X("['u','l','d','r','a','s']","['u','l','d','r','a','s','x']",1)
  X("['upE','dE','ap','sp']","['upE','dE','ap','sp','xp']",1)
  X("'LB','RB','BK','ST','a','s']","'LB','RB','BK','ST','a','s','x']",1)
  X("a:b(2),s:b(1)||b(3)}","a:b(2),s:b(1),x:b(3)}",1)
  X("sp:anyP(m.s)};","sp:anyP(m.s),x:any(m.x),xp:anyP(m.x)};",1)
  X("o.sp=o.sp||padEdge(sl.pad,'s')}","o.sp=o.sp||padEdge(sl.pad,'s');o.x=o.x||p.x;o.xp=o.xp||padEdge(sl.pad,'x')}",1)
  X("o.sp=o.sp||anyP(m.s)}","o.sp=o.sp||anyP(m.s);o.xp=o.xp||anyP(m.x)}",1)
  X("o.sp=o.sp||padEdge(pi,'s')}","o.sp=o.sp||padEdge(pi,'s');o.xp=o.xp||padEdge(pi,'x')}",1)
  X("prompt([[[PB('DP')],'MOVE'],[[PB('A')],'JUMP']],x+55,y+72,'center',ps);prompt([[[PB('X')],'ATK'],[[PB('B')],'DASH']],x+55,y+86,'center',ps)","prompt([[[PB('DP')],'MOVE'],[[PB('A')],'JUMP']],x+55,y+66,'center',ps);prompt([[[PB('X')],'ATK'],[[PB('B')],'DASH']],x+55,y+78,'center',ps);prompt([[[PB('Y')],'SPECIAL']],x+55,y+90,'center',ps)",1)
  X("'MOVE']],x+55,y+72);prompt([[[kcap(i,'a')],'ATK'],[[kcap(i,'s')],'DASH']],x+55,y+86)","'MOVE']],x+55,y+66);prompt([[[kcap(i,'a')],'ATK'],[[kcap(i,'s')],'DASH']],x+55,y+78);prompt([[[kcap(i,'x')],'SPECIAL']],x+55,y+90)",1)
  X("['s','DASH']];","['s','DASH'],['x','SPECIAL']];",1)
  X("A JUMP  X ATTACK  B DASH'","A JUMP  X ATK  B DASH  Y SPECIAL'",1)
  # ---- UI tidy (layout only): compact toasts above the footer instead of over screen titles; win-screen prompt below coin lines; select-screen lock note clear of prompts
  X("toasts.slice(0,1).forEach((o,k)=>{const w=o.m.length*8+14,y=4-(o.t<10?(10-o.t)*2:0)-(o.t>94?(o.t-94)*3:0);panel(Math.round(W/2-w/2),y,w,18,'#3b3f52');text(o.m,W/2,y+14,'#ffffff',16,'center')});",
    "toasts.slice(0,1).forEach((o,k)=>{const fs=o.m.length>52?8:o.m.length>26?8:16,w=o.m.length*(fs==8?4:8)+14,h=fs==8?14:18,inF=['fight','ofight','pause','win','oresult'].includes(state),by=inF?H-62:Math.floor((H-270)/2)+(state=='shop'?198:state=='lobby'||state=='select'?218:224),y=by+(o.t<10?(10-o.t)*2:0)+(o.t>94?(o.t-94)*3:0);panel(Math.round(W/2-w/2),y,w,h,'#3b3f52');text(o.m,W/2,y+(fs==8?10:14),'#ffffff',fs,'center')});",1)
  X("'REMATCH'],[[PB('B')],'MENU']],W/2,196)","'REMATCH'],[[PB('B')],'MENU']],W/2,207)",1)
  X("'REMATCH'],[[KC('ESC')],'MENU']],W/2,196)","'REMATCH'],[[KC('ESC')],'MENU']],W/2,207)",1)
  X("x+72,y+62,'#f99252',8,'center')","x+72,y+58,'#f99252',8,'center')",1)
  return js

for online,out in [(True,P+'/public/index.html'),(False,'/workspace/pixel-platformer/index.html')]:
  js=post(core+'\n'+client(online))
  open('/tmp/chk_'+str(online)+'.js','w').write(js)
  os.makedirs(os.path.dirname(out),exist_ok=True)
  open(out,'w').write(head+js+'\n'+tl)
  print(out,len(head+js))
