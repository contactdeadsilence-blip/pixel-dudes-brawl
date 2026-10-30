// ===== MONEY PIT: gold piles + pit-edge stripes (world) and the shared JACKPOT counter (HUD) =====
function goldPile(cx,by,w){const h=Math.round(w/3);for(let r=0;r<h;r++){const half=Math.round((w/2)*(1-r/h));for(let x=-half;x<half;x+=3){const sh=((x+r*7+cx)&7);ctx.fillStyle=PAL.o;ctx.fillRect(cx+x-1,by-r*3-3,5,4);ctx.fillStyle=sh<2?'#fff0a0':sh<5?'#fee761':'#d8a830';ctx.fillRect(cx+x,by-r*3-2,3,2)}}
 if(Math.floor(t/20+cx)%5==0){ctx.fillStyle='#ffffff';ctx.fillRect(cx-2+((t>>3)%5),by-h*3+((t>>4)%3),1,1)}}
const _drawItemsP=drawItems;drawItems=function(){const A=ARENAS[arena];if(A&&A.pit&&map===A.map)safe(()=>{const Tt=CORE.T||16,fy=26*Tt;
  goldPile(12*Tt+20,fy,44);goldPile(48*Tt-20,fy,44);goldPile(30*Tt,fy,26);
  for(const wx of [9,48]){const x=wx*Tt,y=23*Tt;for(let k=0;k<3*Tt;k+=8){ctx.fillStyle=(k/8)%2?'#2b2b40':'#fee761';ctx.fillRect(x+k,y-3,8,3)}}});
 _drawItemsP()};
const _hudPtsP=hudPts;hudPts=function(f,x,y){const r=_hudPtsP(f,x,y);const md=CORE.opts&&CORE.opts.mode;
 if(md=='pit'&&F.length&&f===F[0])safe(()=>{const J=CORE.jackpot|0,cap=CORE.pitCap|0,s='JACKPOT '+J+'/'+cap,ps=F.map(g=>[g,String(g.pts|0)]),pw=ps.reduce((a,[g,v])=>a+v.length*4+14,0),w=Math.max(s.length*8+30,pw+8),px=Math.round(W/2-w/2),py=22;
  panel(px,py,w,30,'#3b2f12');coinIcon(px+6,py+4);text(s,px+18,py+13,J>=cap?'#ffffff':'#fee761',16);
  let cx=Math.round(W/2-pw/2)+4;for(const [g,v] of ps){ctx.fillStyle=PCOL[g.i];ctx.fillRect(cx,py+20,6,6);text(v,cx+9,py+27,g.out?'#8b93a6':'#ffffff',8);cx+=v.length*4+14}});
 return r};
