// ===== Audio: procedural chiptune + SFX (WebAudio) =====
const AU={c:null,master:null,mus:null,sfx:null,noise:null,song:null,songName:null,step:0,next:0,timer:null,duck:1,echo:null};
function auInit(){if(AU.c){if(AU.c.state=='suspended')AU.c.resume();return}
 try{const c=AU.c=new (window.AudioContext||window.webkitAudioContext)();
  AU.master=c.createGain();AU.master.connect(c.destination);AU.mus=c.createGain();AU.mus.connect(AU.master);AU.sfx=c.createGain();AU.sfx.connect(AU.master);
  const d=c.createDelay(1);d.delayTime.value=.18;const fb=c.createGain();fb.gain.value=.28;const wet=c.createGain();wet.gain.value=.35;d.connect(fb);fb.connect(d);d.connect(wet);wet.connect(AU.mus);AU.echo=d;
  const n=c.createBuffer(1,c.sampleRate,c.sampleRate),dd=n.getChannelData(0);for(let i=0;i<dd.length;i++)dd[i]=Math.random()*2-1;AU.noise=n;
  auVol();AU.timer=setInterval(auSched,25);if(AU.want)playSong(AU.want,true)}catch(e){AU.c=null}}
function auVol(){if(!AU.c)return;const S=typeof SET!='undefined'?SET:{master:.8,music:.6,sfx:.8,mute:false},t=AU.c.currentTime;
 AU.master.gain.setTargetAtTime(S.mute?0:S.master,t,.02);AU.mus.gain.setTargetAtTime(S.music*.55*AU.duck,t,.05);AU.sfx.gain.setTargetAtTime(S.sfx,t,.02)}
['keydown','pointerdown','touchstart'].forEach(e=>addEventListener(e,auInit,{passive:true}));
function tone(f1,f2,d,type='square',v=.12,dl=0,dest){const c=AU.c;if(!c)return;const t=c.currentTime+dl,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(f1,t);if(f2!=f1)o.frequency.exponentialRampToValueAtTime(Math.max(20,f2),t+d);
 g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(dest||AU.sfx);o.start(t);o.stop(t+d+.02)}
function nz(d,v=.15,ft='lowpass',f=2000,dl=0,dest,f2){const c=AU.c;if(!c)return;const t=c.currentTime+dl,s=c.createBufferSource(),fl=c.createBiquadFilter(),g=c.createGain();s.buffer=AU.noise;s.loop=true;fl.type=ft;fl.frequency.setValueAtTime(f,t);if(f2)fl.frequency.exponentialRampToValueAtTime(f2,t+d);
 g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+d);s.connect(fl);fl.connect(g);g.connect(dest||AU.sfx);s.start(t,Math.random()*.5);s.stop(t+d+.02)}
let sfxLast={};function lim(k,ms){const n=performance.now();if(sfxLast[k]&&n-sfxLast[k]<ms)return false;sfxLast[k]=n;return true}
const SFX={
 jump:()=>{tone(280,620,.11,'square',.09)},
 dj:()=>{tone(420,980,.12,'square',.08);tone(840,1500,.08,'triangle',.05,.03)},
 swing:()=>{if(!lim('sw',40))return;nz(.07,.09,'highpass',3000,0,null,900);tone(700,300,.06,'triangle',.05)},
 hit:k=>{k=Math.max(1,Math.min(14,k||3));const v=.1+k*.012;tone(240-k*9,55,.1+k*.012,'square',v);nz(.08+k*.012,.12+k*.015,'lowpass',2600-k*80,0,null,300);if(k>6){tone(110,35,.25+k*.01,'sine',.22);nz(.25,.1,'bandpass',600,.02)}},
 dash:()=>{tone(180,900,.14,'sawtooth',.06);nz(.12,.06,'bandpass',1200,0,null,4000)},
 ko:()=>{if(!lim('ko',80))return;tone(700,40,.7,'sawtooth',.16);tone(90,30,.6,'sine',.3);nz(.8,.22,'lowpass',3000,0,null,120);[0,1,2].forEach(i=>tone(1200-i*200,600-i*100,.08,'square',.05,.05+i*.07))},
 respawn:()=>{[523,659,784,1047].forEach((f,i)=>tone(f,f,.09,'triangle',.08,i*.06))},
 land:()=>{if(!lim('land',60))return;nz(.06,.07,'lowpass',500);tone(120,60,.05,'sine',.07)},
 sel:()=>{if(!lim('sel',30))return;tone(620,620,.04,'square',.05)},
 ok:()=>{tone(660,660,.05,'square',.07);tone(990,990,.08,'square',.07,.05)},
 back:()=>{tone(520,300,.09,'square',.06)},
 count:()=>{tone(440,440,.14,'square',.1);tone(220,220,.14,'triangle',.08)},
 go:()=>{tone(880,880,.3,'square',.1);tone(1320,1320,.3,'triangle',.06);tone(440,440,.3,'triangle',.08)},
 game:()=>{[523,659,784,1047,784,1047].forEach((f,i)=>tone(f,f,i==5?.5:.12,'square',.09,i*.1));nz(.5,.08,'highpass',5000,.5)},
 unlock:()=>{[784,988,1175,1568,1976].forEach((f,i)=>tone(f,f,.12,'square',.07,i*.07));nz(.6,.04,'highpass',7000,.3)},
 coin:()=>{tone(988,988,.07,'square',.08);tone(1319,1319,.25,'square',.08,.07)},
 err:()=>{tone(150,140,.18,'square',.09);tone(155,145,.18,'sawtooth',.05)}};
// --- music ---
const SC={maj:[0,2,4,5,7,9,11],min:[0,2,3,5,7,8,10],dor:[0,2,3,5,7,9,10],lyd:[0,2,4,6,7,9,11],mix:[0,2,4,5,7,9,10],hij:[0,1,4,5,7,8,10],hmin:[0,2,3,5,7,8,11]};
// lead: 16 steps per bar, chars 0-9,a-d = scale degree from lead octave, '-' hold, '.' rest
const SONGS={
 menu:{bpm:108,root:57,sc:'maj',prog:[0,4,5,3,0,4,5,3],arp:1,
  lead:['4-2-4-5-7---5-4-','4---6-4-1---.-..','5-4-5-7-9---7-5-','4-2-0-2-3---.---','4-2-4-5-7---9-7-','8-7-6-4-6---4-1-','5-4-5-7-9-7-5-4-','2---1---0-------'],
  bass:'x...x.o.x...x.o.',k:'x.......x.......',s:'....x.......x...',h:'..x...x...x...x.'},
 title:{bpm:126,root:55,sc:'mix',prog:[0,6,3,4,0,6,3,4],arp:2,
  lead:['7-.-7-9-b---9-7-','6---4-6-8---6-4-','7-.-7-9-b-c-e-c-','b-------9-------','c-b-9-7-9---7-6-','4-6-7-9-b---9-7-','7-9-b-c-e---c-b-','e---c---b---9---'],
  bass:'x.ox..o.x.ox..o.',k:'x...x...x...x.x.',s:'....x.......x...',h:'x.xxx.xxx.xxx.xx'},
 MEADOW:{bpm:138,root:60,sc:'maj',prog:[0,3,4,0,5,3,4,4],arp:1,
  lead:['0-2-4-7-6-4-2-4-','5---3-5-7---5-3-','4-6-8-6-4-1-4-6-','7---4---0---.---','5-7-9-7-5-4-2-4-','3-5-7-5-3-0-3-5-','4-4-6-4-8-6-4-1-','4---6---8---b---'],
  bass:'x.o.x.o.x.o.x.o.',k:'x...x...x...x...',s:'....x.......x..x',h:'xxxxxxxxxxxxxxxx'},
 'BRICK TOWERS':{bpm:144,root:57,sc:'hmin',prog:[0,5,6,0,0,5,3,4],arp:0,
  lead:['7-7-.-7-9-7-6-4-','5---5-7-8---7-5-','6-6-.-6-8-6-4-3-','4-------7-------','7-7-.-7-9-a-b-9-','a---9-7-5---7-8-','7-5-3-5-7-5-3-2-','1---4---6---8---'],
  bass:'xxo.xxo.xxo.xfox',k:'x..x..x.x..x..x.',s:'....x.......x...',h:'x.x.x.x.x.x.x.x.'},
 'SKY ISLANDS':{bpm:120,root:62,sc:'lyd',prog:[0,1,4,0,5,1,4,4],arp:2,
  lead:['7-----9-a---9-7-','8-----7-6-4-----','6---8---b---9---','7---------------','b---a---9---7---','8---9---a---8---','6-8-9-b-a-9-8-6-','7-------4-------'],
  bass:'x.......o...f...',k:'x.........x.....',s:'........x.......',h:'..x...x...x...xx'},
 'GRAND BRIDGE':{bpm:156,root:52,sc:'hij',prog:[0,6,5,6,0,6,5,4],arp:1,
  lead:['7---7-9-a---9-7-','6---4-6-7---6-4-','5---5-7-8---7-5-','6-------9-------','b-a-9-7-a-9-7-6-','9-7-6-4-6---4-6-','5-7-8-a-c-a-8-7-','8---7---6---4---'],
  bass:'x.xox.xox.xox.xo',k:'x...x...x...x.x.',s:'....x.......x...',h:'xx.xxx.xxx.xxx.x'}};
function playSong(name,force){AU.want=name;if(!AU.c||(!force&&AU.songName==name))return;AU.songName=name;AU.song=SONGS[name]||SONGS.menu;AU.step=0;AU.next=AU.c.currentTime+.08}
function stopSong(){AU.want=null;AU.song=null;AU.songName=null}
function setDuck(v){if(AU.duck!=v){AU.duck=v;auVol()}}
function midi(m){return 440*Math.pow(2,(m-69)/12)}
function degN(S,d,oct){const s=SC[S.sc],l=s.length;return S.root+12*oct+s[((d%l)+l)%l]+12*Math.floor(d/l)}
function mnote(f,t,d,type,v,echo){const c=AU.c,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(f,t);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.006);g.gain.setTargetAtTime(v*.55,t+.02,.08);g.gain.setTargetAtTime(0,t+d-.01,.02);o.connect(g);g.connect(AU.mus);if(echo)g.connect(AU.echo);o.start(t);o.stop(t+d+.1)}
function mdrum(k,t){const c=AU.c;if(k=='k'){const o=c.createOscillator(),g=c.createGain();o.frequency.setValueAtTime(150,t);o.frequency.exponentialRampToValueAtTime(40,t+.12);g.gain.setValueAtTime(.5,t);g.gain.exponentialRampToValueAtTime(.001,t+.15);o.connect(g);g.connect(AU.mus);o.start(t);o.stop(t+.16)}
 else{const s=c.createBufferSource(),fl=c.createBiquadFilter(),g=c.createGain();s.buffer=AU.noise;fl.type=k=='s'?'bandpass':'highpass';fl.frequency.value=k=='s'?1800:7000;const d=k=='s'?.12:.03;g.gain.setValueAtTime(k=='s'?.3:.1,t);g.gain.exponentialRampToValueAtTime(.001,t+d);s.connect(fl);fl.connect(g);g.connect(AU.mus);s.start(t,Math.random()*.5);s.stop(t+d+.01);if(k=='s')mnote(180,t,.06,'triangle',.12)}}
function auSched(){const c=AU.c,S=AU.song;if(!c||!S)return;const sd=60/S.bpm/4;if(AU.next<c.currentTime-.3)AU.next=c.currentTime+.05;
 while(AU.next<c.currentTime+.15){const st=AU.step,i=st%16,bar=Math.floor(st/16)%S.prog.length,ch=S.prog[bar],t=AU.next;
  const L=S.lead[bar%S.lead.length],cc=L[i];if(cc!='-'&&cc!='.'){let n=1;while(i+n<16&&L[i+n]=='-')n++;mnote(midi(degN(S,parseInt(cc,16),1)),t,n*sd*.95,'square',.075,1)}
  const B=S.bass[i];if(B!='.'){const d=B=='o'?ch+7:B=='f'?ch+4:ch;mnote(midi(degN(S,d,-1)),t,sd*1.6,'triangle',.28)}
  if(S.arp&&(S.arp==1||i%2==0)){const tri=[ch,ch+2,ch+4,ch+7];mnote(midi(degN(S,tri[(i>>(S.arp==2?1:0))%4],0)),t,sd*.8,'square',.025)}
  if(S.k[i]=='x')mdrum('k',t);if(S.s[i]=='x')mdrum('s',t);if(S.h[i]=='x')mdrum('h',t);
  AU.step++;AU.next+=sd}}
