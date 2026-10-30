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
 text(VERSION,W-4,H-6,'#ffffff',8,'right');text('THEME: '+THEMES[TT.th].name,4,H-6,'#ffffff',8);drawStudio()}
UIS.add('title');

// ===== Studio splash (web + desktop), ~2s, skippable =====
(function(){if(typeof document=='undefined'||/[?&]nosplash/.test(location.search))return;const d=document.createElement('div');
d.style.cssText='position:fixed;inset:0;background:#000;z-index:99999;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:opacity .4s';
const i=new Image();i.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjE0MCAzMjAgNDEwIDQwMCI+PGcgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmIiBzdHJva2UtbGluZWNhcD0icm91bmQiPjxwYXRoIHN0cm9rZS13aWR0aD0iNSIgZD0iTTIyOCA0NTggUTM0NSAzNDAgNDY1IDQ1MiIvPjxwYXRoIHN0cm9rZS13aWR0aD0iNSIgZD0iTTI0NSA0NTggUTM0NSA1NDAgNDUwIDQ1OCIvPjxwYXRoIHN0cm9rZS13aWR0aD0iNSIgZD0iTTM0NSAzMzYgVjU1NSIvPjxnIHN0cm9rZS13aWR0aD0iMi42Ij48cGF0aCBkPSJNMjc0LjkgNDIwLjAgUTI3MS40IDQxNC40IDI2NS43IDQxMi43Ii8+PHBhdGggZD0iTTI5MS40IDQxMS4wIFEyODguNiA0MDUuMCAyODMuMSA0MDIuNyIvPjxwYXRoIGQ9Ik0zMDcuOSA0MDQuMyBRMzA1LjggMzk4LjAgMzAwLjYgMzk1LjEiLz48cGF0aCBkPSJNMzI0LjQgMzk5LjkgUTMyMy4xIDM5My40IDMxOC4zIDM4OS45Ii8+PHBhdGggZD0iTTM2OS41IDM5OS4yIFEzNzAuNiAzOTIuNyAzNjcuNCAzODcuNyIvPjxwYXRoIGQ9Ik0zODYuMSA0MDMuMSBRMzg4LjAgMzk2LjggMzg1LjQgMzkxLjQiLz48cGF0aCBkPSJNNDAyLjggNDA5LjMgUTQwNS40IDQwMy4yIDQwMy41IDM5Ny42Ii8+PHBhdGggZD0iTTQxOS41IDQxNy43IFE0MjIuOCA0MTEuOSA0MjEuNSA0MDYuMSIvPjxwYXRoIGQ9Ik0yNjkuMSA0NzUuMyBRMjY1LjcgNDgwLjkgMjU5LjkgNDgyLjUiLz48cGF0aCBkPSJNMjgzLjIgNDgzLjIgUTI4MC4zIDQ4OS4xIDI3NC43IDQ5MS4yIi8+PHBhdGggZD0iTTI5Ny4zIDQ4OS42IFEyOTQuOSA0OTUuOCAyODkuNSA0OTguNSIvPjxwYXRoIGQ9Ik0zMTEuNSA0OTQuMyBRMzA5LjcgNTAwLjcgMzA0LjcgNTAzLjkiLz48cGF0aCBkPSJNMzI1LjggNDk3LjQgUTMyNC44IDUwNC4wIDMyMC4xIDUwNy43Ii8+PHBhdGggZD0iTTM3MC45IDQ5Ni42IFEzNzIuMSA1MDMuMCAzNjkuMCA1MDguMSIvPjxwYXRoIGQ9Ik0zODUuNCA0OTMuMSBRMzg3LjMgNDk5LjQgMzg0LjggNTA0LjgiLz48cGF0aCBkPSJNMzk5LjkgNDg3LjkgUTQwMi40IDQ5NC4wIDQwMC40IDQ5OS42Ii8+PHBhdGggZD0iTTQxNC40IDQ4MS4xIFE0MTcuNCA0ODYuOSA0MTUuOSA0OTIuNyIvPjwvZz48L2c+PGcgZmlsbD0iI2ZmZiIgZm9udC1mYW1pbHk9IkhlbHZldGljYSxBcmlhbCxzYW5zLXNlcmlmIiBmb250LXdlaWdodD0iNzAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj48dGV4dCB4PSIzNDUiIHk9IjY0MCIgZm9udC1zaXplPSIzMiIgbGV0dGVyLXNwYWNpbmc9IjExIj5ERUFEIFNJTEVOQ0U8L3RleHQ+PHRleHQgeD0iMzUwIiB5PSI2OTAiIGZvbnQtc2l6ZT0iMTciIGxldHRlci1zcGFjaW5nPSIxNCI+U1RVRElPUzwvdGV4dD48L2c+PC9zdmc+';i.style.cssText='width:min(60vw,520px);max-height:60vh;opacity:0;transition:opacity .8s';d.appendChild(i);
const add=()=>{document.body.appendChild(d);requestAnimationFrame(()=>requestAnimationFrame(()=>i.style.opacity=1))};document.body?add():addEventListener('DOMContentLoaded',add);
let done=false;const end=()=>{if(done)return;done=true;d.style.opacity=0;setTimeout(()=>d.remove(),400);removeEventListener('keydown',end,true)};
d.addEventListener('pointerdown',end);addEventListener('keydown',end,true);setTimeout(end,2000);
(function gp(){if(done)return;const p=navigator.getGamepads?[...navigator.getGamepads()]:[];if(p.some(g=>g&&g.buttons.some(b=>b.pressed)))end();else requestAnimationFrame(gp)})()})();
