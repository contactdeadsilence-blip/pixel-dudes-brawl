// ===== Title screen (first thing shown) =====
const VERSION='v1.3.0';
const TT={th:Math.floor(Math.random()*4),dudes:[],t:0};
function ttDude(){const d=Math.random()<.5?1:-1;return{skin:Math.floor(Math.random()*NS),x:d>0?-30:W+30,y:0,vy:0,face:d,sp:.9+Math.random()*1.4,atk:0,an:0,lane:Math.floor(Math.random()*3)}}
function updTitle(){TT.t++;if(TT.dudes.length<7&&Math.random()<.03)TT.dudes.push(ttDude());
 for(const d of TT.dudes){d.x+=d.face*d.sp;d.an+=d.sp*.12;if(d.y<0||d.vy){d.vy+=.25;d.y+=d.vy;if(d.y>=0){d.y=0;d.vy=0}}
  else if(Math.random()<.012)d.vy=-4.5;if(d.atk>0)d.atk--;else if(Math.random()<.01)d.atk=18;
  if(Math.random()<.002)d.face*=-1}
 TT.dudes=TT.dudes.filter(d=>d.x>-60&&d.x<W+60);
 if(TT.t%720==0){TT.th=(TT.th+1)%4;}
 if(TT.t>20&&(KP.Enter||KP.Space||KP.NumpadEnter||anyPad(i=>padEdge(i,'A')||padEdge(i,'ST')))){SFX.go();state='menu'}}
function drawTitle(){ctx.drawImage(bgCanvas(TT.th),0,0);
 const gy=H-34;ctx.fillStyle='rgba(0,0,0,.18)';ctx.fillRect(0,gy+20,W,H);
 for(const d of TT.dudes.slice().sort((a,b)=>a.lane-b.lane)){const y=gy-d.lane*8+d.y;let row=2,fr=Math.floor(d.an)%4;if(d.atk>0){fr=d.atk>6&&d.atk<14?1:3}else if(d.y<0)fr=1;
  ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(Math.round(d.x+4),gy-d.lane*8+20,28,3);drawSheet(imgs[d.skin],Math.round(d.x),Math.round(y-20),d.face,row,fr,2);
  if(d.atk>6&&d.atk<14)ctx.drawImage(PUFF,Math.round(d.x+16+d.face*22),Math.round(y))}
 safe(()=>{const L1='PIXEL DUDES',L2='BRAWL',sh=Math.floor(TT.t/3)%40;
  // bouncy letters, outlined (text() draws outlined glyphs), shimmer sweeps across
  const w1=L1.length*24;[...L1].forEach((ch,k)=>{const x=W/2-w1/2+k*24+12,y=72+Math.round(Math.sin(TT.t*.08+k*.6)*4);text(ch,x,y,k==sh||k==sh-1?'#ffffff':PAL.Y,48,'center')});
  const w2=L2.length*32;[...L2].forEach((ch,k)=>{const x=W/2-w2/2+k*32+16,y=118+Math.round(Math.sin(TT.t*.1+k*.9+2)*5);text(ch,x,y,k==sh-12?PAL.Y:'#ffffff',64>48?40:40,'center')});
  if(Math.floor(TT.t/30)%2==0){const ps=PSM();if(lastDev=='pad')prompt([[[PB('A')],'PRESS START']],W/2,190);else{panel(W/2-70,182,140,22);text('PRESS ENTER',W/2,198,'#ffffff',16,'center')}}});
 text(VERSION,W-4,H-6,'#ffffff',8,'right');text('THEME: '+THEMES[TT.th].name,4,H-6,'#ffffff',8)}
UIS.add('title');
