// ===== SKY CASTLE: moving platform + lightning hazard (world-space) =====
const _drawItemsS=drawItems;drawItems=function(){const M=CORE.mp,Z=CORE.hz;
 if(M){const x=Math.round(M.x),y=Math.round(M.y),w=Math.round(M.w);ctx.fillStyle=PAL.o;ctx.fillRect(x-1,y-1,w+2,7);ctx.fillStyle='#f8e0a0';ctx.fillRect(x,y,w,3);ctx.fillStyle='#d0a858';ctx.fillRect(x,y+3,w,2);
  ctx.fillStyle='#906830';for(let k=4;k<w;k+=8)ctx.fillRect(x+k,y,1,5);ctx.fillStyle='#ffffff';ctx.fillRect(x+2,y,w-4,1);
  ctx.fillStyle='rgba(255,255,255,'+(.35+.25*Math.sin(t/6))+')';ctx.fillRect(x+4,y+6,w-8,2);ctx.fillRect(x+10,y+9,w-20,1)}
 if(Z&&Z.ph==1){const x=Z.x;if(Math.floor(t/5)%2){ctx.fillStyle='rgba(254,231,97,.28)';ctx.fillRect(x-9,0,18,WH)}ctx.fillStyle='#fee761';ctx.fillRect(x-1,4,3,6);ctx.fillRect(x-1,12,3,2)}
 if(Z&&Z.ph==2){let bx=Z.x;ctx.fillStyle='rgba(255,255,255,.35)';ctx.fillRect(Z.x-9,0,18,WH);for(let y=0;y<WH;y+=6){const nx=Z.x+Math.round(Math.sin(y*.7+t)*4);ctx.fillStyle=PAL.o;ctx.fillRect(Math.min(bx,nx)-2,y,Math.abs(nx-bx)+5,7);ctx.fillStyle=y%12?'#fee761':'#ffffff';ctx.fillRect(Math.min(bx,nx)-1,y,Math.abs(nx-bx)+3,6);bx=nx}}
 _drawItemsS()};
