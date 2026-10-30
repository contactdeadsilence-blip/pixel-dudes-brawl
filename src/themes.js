// ===== Arena themes: each arena has its own tiles, palette, sky, background and decor (same 16px outlined style) =====
function sprP(rows,p){const sv=Object.assign({},PAL);Object.assign(PAL,p);const c=spr(rows);Object.assign(PAL,sv);return c}
const GR=["oooooooooooooooo","GGGGGGGGGGGGGGGG","GGGGGGGGGGGGGGGG","GGgGGGGGGGgGGGGG","gGggGGgGGGggGGgG","dgddggdgggddggdg","DddDDdDDdDDDdDDd","DDDDDDDDDDDDDDDD","DDDeDDDDDDDDDDDD","DDDDDDDDDdDDDDDD","DDDDDDDDDDDDDeDD","DDdDDDDDDDDDDDDD","DDDDDDDeDDDDDDDD","DDDDDDDDDDDDDDDD","DDDDDdDDDDDDDdDD","DDDDDDDDDDDDDDDD"];
const BR=["oooooooooooooooo","ohhhhhhhohhhhhho","oRRRRRRRoRRRRRRo","oRRRRRRRoRRRRRRo","orrrrrrrorrrrrro","oooooooooooooooo","ohhhohhhhhhhohho","oRRRoRRRRRRRoRRo","oRRRoRRRRRRRoRRo","orrrorrrrrrrorro","oooooooooooooooo","ohhhhhhhohhhhhho","oRRRRRRRoRRRRRRo","oRRRRRRRoRRRRRRo","orrrrrrrorrrrrro","oooooooooooooooo"];
// stone wall (castle): staggered blocks, outline mortar lines in dark stone
const STONE=["oooooooooooooooo","DDDDDDDeoDDDDDDD","DDeDDDDDoDDDDeDD","DDDDDDDDoDDDDDDD","ddddddddodddddddd".slice(0,16),"oooooooooooooooo","DDDoDDDDDDDDoDDD","DeDoDDDDDDeDoDDD","DDDoDDDDDDDDoDDD","dddodddddddddddo".slice(0,16),"oooooooooooooooo","DDDDDDDeoDDDDDDD","DDDDDDDDoDDDDeDD","DDeDDDDDoDDDDDDD","ddddddddoddddddd","oooooooooooooooo"];
const STONETOP=["oooooooooooooooo","GGGGGGGGGGGGGGGG","GgGGGGgGGGGGGgGG","gggggggggggggggg","oooooooooooooooo",...STONE.slice(6,16),"oooooooooooooooo"].slice(0,16);
const SNOWTOP=["oooooooooooooooo","GGGGGGGGGGGGGGGG","GGGGGGGGGGGGGGGG","GGGGGGGGGGGGGGgG","GgGGGGgGGGGGGggG","gdgGgddgGgGgddgd","dDdgdDDdgdgdDDdD","DDdDDDDDdDDDDDDD","DDDDDDeDDDDDDDDD","DDDDDDDDDDDDdDDD","DeDDDDDDDDDDDDDD","DDDDDDDDDeDDDDDD","DDDDdDDDDDDDDDeD","DDDDDDDDDDDDDDDD","DDeDDDDDDdDDDDDD","DDDDDDDDDDDDDDDD"];
const SAND=["DDDDDDDDDDDDDDDD","eeeeeeeeeeeeeeee","DDDDDDDDDDDDDDDD","DDDDDdDDDDDDDDDD","dddddddddddddddd","DDDDDDDDDDDDDDDD","DDeDDDDDDDDDDeDD","eeeeeeeeeeeeeeee","DDDDDDDDDDDDDDDD","DDDDDDDDDDdDDDDD","dddddddddddddddd","DDDDDDDDDDDDDDDD","DDDDDDDeDDDDDDDD","eeeeeeeeeeeeeeee","DDDDDDDDDDDDDDDD","dddddddddddddddd"];
const SANDTOP=["oooooooooooooooo","GGGGGGGGGGGGGGGG","GGGGGgGGGGGGGGGG","gggggggggggggggg",...SAND.slice(4)];
const WPLANK=["oooooooooooooooo","hhhhhhhhhhhhhhho","RRRRRRRRRRRRRRRo","RRRRrRRRRRRRRRRo","rrrrrrrrrrrrrrro","oooooooooooooooo","hhhhhhhohhhhhhhh","RRRRRRRoRRRRRRRR","RRRRRRRoRRrRRRRR","rrrrrrrorrrrrrrr","oooooooooooooooo","hhhohhhhhhhhohhh","RRRoRRRRRRRRoRRR","RrRoRRRRRRRRoRRR","rrrorrrrrrrrorrr","oooooooooooooooo"];
const SPK=["................","................","................","................","................","...o.......o....","..oSo.....oSo...","..oSo.....oSo...",".oSSso...oSSso..",".oSSso...oSSso..","oSwSsso.oSwSsso.","oSSSsso.oSSSsso.","oSSSssooSSSSssso","oSSSssooSSSSssso","oooooooooooooooo","kkkkkkkkkkkkkkkk"];
const PLR=["oooooooooooooooo","oeeeeeeeeeeeeeeo","oDDDDDDoDDDDDDDo","oddddddodddddddo","oooooooooooooooo","..o.........o...","..o.........o..."].concat(Array(9).fill("................"));
const D16=a=>Array(16-a.length).fill("................").concat(a);
function stars(n,seed,col,maxY){for(let i=0;i<n;i++){const x=(i*9301+seed*49297)%233280%W,y=(i*4931+seed*7)%Math.max(8,maxY);ctx.fillStyle=col;ctx.fillRect(x,y,1,1);if(i%9==0){ctx.fillRect(x-1,y,3,1);ctx.fillRect(x,y-1,1,3)}}}
function bands(B){B.forEach(([c,y])=>{ctx.fillStyle=c;ctx.fillRect(0,Math.round(y*H/270),W,H)})}
function disc(cx,cy,r,col,ol){ctx.fillStyle=ol;for(let y=-r-1;y<=r+1;y++){const w=Math.floor(Math.sqrt(Math.max(0,(r+1)**2-y*y)));ctx.fillRect(cx-w,cy+y,2*w+1,1)}ctx.fillStyle=col;for(let y=-r;y<=r;y++){const w=Math.floor(Math.sqrt(r*r-y*y));ctx.fillRect(cx-w,cy+y,2*w+1,1)}}
function castles(par,base,col,top,seed){const cx=Math.floor(camX*par);ctx.fillStyle=col;for(let sx=-40;sx<W+40;sx+=2){const wx=sx+cx,b=Math.floor(wx/36),r=((b*7919+seed*31)%97)/97,inb=wx-b*36;
  let h=base+Math.floor(r*50)+(r>.6&&inb>8&&inb<28?40:0);if(inb%8<4&&inb>4&&inb<32)h+=5;if(inb<=4||inb>=32)h=base-6;
  ctx.fillStyle=col;ctx.fillRect(sx,H-h,2,h);ctx.fillStyle=top;ctx.fillRect(sx,H-h,2,1);
  if(r>.3&&inb%12==6&&((H-h+14)<H-base))(ctx.fillStyle='#f7c35a',ctx.fillRect(sx,H-h+12,2,3))}}
function peaks(par,base,amp,col,cap,seed){const cx=Math.floor(camX*par);for(let sx=0;sx<W;sx+=2){const wx=(sx+cx)/2;const p=Math.abs(((wx*0.04+seed)%2+2)%2-1);const h=Math.floor(base+amp*(1-p)+8*Math.sin(wx*.21+seed));
  ctx.fillStyle=col;ctx.fillRect(sx,H-h,2,h);if(h>base+amp*.55){ctx.fillStyle=cap;ctx.fillRect(sx,H-h,2,Math.min(10,h-base-amp*.55+2))}}}
function mesas(par,base,col,top,seed){const cx=Math.floor(camX*par);for(let sx=0;sx<W;sx+=2){const wx=sx+cx,b=Math.floor(wx/70),r=((b*7919+seed*13)%89)/89,inb=wx-b*70;
  let h=base;if(r>.35){const top0=base+20+Math.floor(r*55),edge=Math.min(inb,70-inb);h=edge<6?base+Math.floor((top0-base)*edge/6):top0}
  ctx.fillStyle=col;ctx.fillRect(sx,H-h,2,h);ctx.fillStyle=top;ctx.fillRect(sx,H-h,2,2);if(h>base+10){ctx.fillStyle='rgba(0,0,0,.12)';ctx.fillRect(sx,H-h+12,2,3)}}}
const SNOWCLOUD=CLOUD;
const THEMES=[
 {name:'MEADOW',top:TILE.grass,fill:TILE.dirt,brick:TILE.brick,spike:TILE.spike,decor:DECOR,bg:()=>drawBGRaw(),thumb:'#5fcde4'},
 {name:'BRICK TOWERS',
  top:sprP(STONETOP,{G:'#9aa0b8',g:'#6c6f8c',D:'#5a5874',d:'#403d58',e:'#6f6c8a'}),fill:sprP(STONE,{D:'#5a5874',d:'#403d58',e:'#6f6c8a'}),
  brick:sprP(BR,{h:'#b49ad6',R:'#7e62a8',r:'#523d78'}),plank:sprP(PLR,{e:'#8a7aa8',D:'#5e4e7e',d:'#3e3258'}),spike:sprP(SPK,{S:'#c9c2d8',s:'#857c9e',k:'#2a2240'}),
  decor:[sprP(D16(["...oo...","..oYYo..","..oyYo..","..oMyo..",".ooooooo..".slice(0,8),"..okko..","..okko..","..okko..","..okko..","..okko..",".okkkko.",".oooooo."].map(r=>r+"........")),{y:'#f7a23a',M:'#e04848',k:'#5c4a3a'}),
   sprP(D16(["oooooooo","oMMMMMMo","oMYMMYMo","oMMMMMMo","oMMYYMMo","oMMMMMMo",".oMMMMo.","..oMMo..","...oo...","...ok...","...ok...","..oooo.."].map(r=>r+"........")),{M:'#7a3aa8',k:'#5c4a3a'}),
   sprP(D16(["..oooo..",".oSSSSo.","oSoSSoSo","oSSSSSSo",".oSooSo.","..oooo.."].map(r=>r+"........")),{S:'#d8d4c4'})],
  bg:()=>{bands([['#1e1638',0],['#2c1f52',50],['#3f2a6c',105],['#59388a',150],['#74479a',190]]);stars(90,3,'#e8e0ff',H*.5);disc(W-70,48,18,'#f4efd2','#c9c2a0');ctx.fillStyle='#ddd6b4';ctx.fillRect(W-78,42,5,4);ctx.fillRect(W-64,54,4,3);
   castles(.2,70,'#2a2046','#3d3060',2);castles(.45,40,'#1b1530','#2a2046',5)},thumb:'#3f2a6c'},
 {name:'SKY ISLANDS',
  top:sprP(SNOWTOP,{G:'#ffffff',g:'#d6ecf8',d:'#9cc6e2',D:'#6f9cc4',e:'#8fb6da'}),fill:sprP(TILE.grass?GR.slice(6).concat(GR.slice(6,12)):GR,{D:'#6f9cc4',d:'#557fa8',e:'#8fb6da'}),
  brick:sprP(BR,{h:'#f2fbff',R:'#b4e0f4',r:'#74b4dc'}),plank:sprP(PLR,{e:'#ffffff',D:'#b4e0f4',d:'#7cb8dc'}),spike:sprP(SPK,{S:'#e6f8ff',s:'#8cc8e8',w:'#ffffff',k:'#4b6c8c'}),
  decor:[sprP(D16(["...oo...","..oGGo..",".oGgGGo.","..oGGo..",".oGGgGo.","oGgGGGGo","oooGGooo","..oGGo..",".oGGgGo.","oGgGGGgo","oooookoo".replace('k','o'),"...oo..."].map(r=>r+"........")),{G:'#3f7a6a',g:'#ffffff'}),
   sprP(D16(["...o....","..oSo...","..oSo...",".oSwSo..",".oSSSo..","oSSwSSo.","oooooooo"].map(r=>r+"........")),{S:'#a8e0f8',w:'#ffffff'}),
   sprP(D16(["..oooo..",".owwwwo.",".owowwo.",".owwwwo.","..oMMo..",".owwwwwo".slice(0,8),"owwwwwwo","owwwwwwo",".oooooo."].map(r=>r+"........")),{M:'#e04848'})],
  bg:()=>{bands([['#a9d8f0',0],['#bfe3f5',60],['#d4ecf8',115],['#e8f5fb',160]]);for(let i=0;i<6;i++){const x=Math.floor(((i*190-camX*.12)%1140+1140)%1140-60),y=14+(i*41)%80;ctx.drawImage(SNOWCLOUD,x,y)}
   peaks(.2,70,90,'#9bbad6','#f4fbff',1);peaks(.45,40,60,'#7d9fc2','#ffffff',3);stars(70,7,'#ffffff',H)},thumb:'#bfe3f5'},
 {name:'GRAND BRIDGE',
  top:sprP(SANDTOP,{G:'#f6cd7a',g:'#d99a4c',D:'#c97c46',d:'#a65a34',e:'#dc9458'}),fill:sprP(SAND,{D:'#c97c46',d:'#a65a34',e:'#dc9458'}),
  brick:sprP(WPLANK,{h:'#d9995a',R:'#a8683a',r:'#74421f'}),plank:sprP(PLR,{e:'#e0a868',D:'#b07440',d:'#7a4a24'}),spike:sprP(SPK,{S:'#e8d8b8',s:'#a89070',k:'#6a3a24'}),
  decor:[sprP(D16(["...oo...","..oGGo..","o.oGGo..","GooGgo.o","oGoGGooG","oGGGgoGo",".ooGGGo.","..oGgo..","..oGGo..",".oooooo."].map(r=>r+"........")),{G:'#6fae4a',g:'#4a7e34'}),
   sprP(D16(["..oooo..",".oKKKKo.","oKwKKkko","oKKKKkko","oooooooo"].map(r=>r+"........")),{K:'#c98a5a',k:'#8a5a3a',w:'#f0c090'}),
   sprP(D16([".o..o...","o.oo.o..",".oKKo...","o.oo.o..",".o..o..."].map(r=>r+"........")),{K:'#b08040'})],
  bg:()=>{bands([['#e8603a',0],['#f07a3a',55],['#f59a4a',105],['#f8b85e',150],['#fbd27a',185]]);disc(Math.round(W*.3),Math.round(H*.62),34,'#fff0a0','#ffd060');
   mesas(.2,64,'#b8603e','#d07a4e',2);mesas(.45,34,'#8a3e2e','#a8523a',6)},thumb:'#f07a3a'},
 {name:'SKY CASTLE',
  top:sprP(STONETOP,{G:'#fff2c8',g:'#e8c878',D:'#a8b4d0',d:'#7884a8',e:'#c4cce4'}),fill:sprP(STONE,{D:'#a8b4d0',d:'#7884a8',e:'#c4cce4'}),
  brick:sprP(BR,{h:'#f4f0ff',R:'#b8b0e0',r:'#7c74b0'}),plank:sprP(PLR,{e:'#f8e0a0',D:'#d0a858',d:'#906830'}),spike:sprP(SPK,{S:'#fff8d8',s:'#d0b060',k:'#5a4a7a'}),
  decor:THEMES[2].decor,
  bg:()=>{bands([['#5a7ce8',0],['#6e92f0',45],['#86aaf6',95],['#a4c4fa',145],['#c8dcfc',190]]);disc(W-90,52,20,'#fffbe0','#ffe9a0');
   const tw=(par,base,col,cap,sp,seed)=>{const cx=Math.floor(camX*par);for(let k=-1;k<W/sp+2;k++){const wx=k+Math.floor(cx/sp),x=wx*sp-cx,h=base+((wx*7919+seed)%5)*10,w=14+((wx*31+seed)%3)*6;ctx.fillStyle=col;ctx.fillRect(x,H-h,w,h);for(let m=0;m<w;m+=4)ctx.fillRect(x+m,H-h-3,2,3);ctx.fillStyle=cap;ctx.fillRect(x+w/2-5,H-h-14,10,11);ctx.fillRect(x+w/2-3,H-h-18,6,4);ctx.fillRect(x+w/2-1,H-h-22,2,4)}};
   tw(.15,60,'#8c9ee0','#7488d0',64,3);for(let i=0;i<7;i++){const x=Math.floor(((i*170-camX*.25)%1190+1190)%1190-60),y=24+(i*53)%110;ctx.drawImage(SNOWCLOUD,x,y)}
   tw(.4,34,'#6a78c0','#e08a9a',90,11);ctx.fillStyle='rgba(255,255,255,.5)';for(let i=0;i<5;i++){const x=Math.floor(((i*230-camX*.6)%1150+1150)%1150-80);ctx.fillRect(x,H-24-(i%2)*8,60,6);ctx.fillRect(x+8,H-28-(i%2)*8,40,4)}},thumb:'#6e92f0'}];
// Store arena themes (cosmetic palette variants of existing arenas; same maps/physics)
THEMES.push(
 {name:'NIGHT MEADOW',top:sprP(GR,{G:'#3a7a5a',g:'#2c5e48',d:'#4a3a5a',D:'#3a2c48',e:'#54446a'}),fill:sprP(GR.slice(6).concat(GR.slice(6,12)),{D:'#3a2c48',d:'#2c2238',e:'#54446a'}),
  brick:sprP(BR,{h:'#8a8ab8',R:'#5a5a8a',r:'#3a3a62'}),plank:sprP(PLR,{e:'#7a6a8a',D:'#54486a',d:'#3a304a'}),spike:sprP(SPK,{S:'#c8d0e8',s:'#7880a8',k:'#2a2a48'}),decor:THEMES[0].decor,
  bg:()=>{bands([['#0c1030',0],['#141a44',60],['#1e2656',120],['#283266',170]]);stars(120,5,'#ffffff',H*.6);disc(70,44,14,'#f4efd2','#c9c2a0');
   peaks(.2,60,50,'#1c3a3a','#24504a',2);peaks(.45,30,40,'#12282a','#1c3a3a',4);stars(30,9,'#d8f070',H)},thumb:'#141a44'},
 {name:'VOLCANO TOWERS',top:sprP(STONETOP,{G:'#f99252',g:'#c8483a',D:'#4a2a2a',d:'#2e1a1e',e:'#6a3a30'}),fill:sprP(STONE,{D:'#4a2a2a',d:'#2e1a1e',e:'#6a3a30'}),
  brick:sprP(BR,{h:'#f99252',R:'#b8402e',r:'#6e2420'}),plank:sprP(PLR,{e:'#8a5a48',D:'#5a3a30',d:'#3a2420'}),spike:sprP(SPK,{S:'#ffd27a',s:'#e0603a',k:'#3a1a1a'}),decor:THEMES[1].decor,
  bg:()=>{bands([['#1a0a0e',0],['#2e1016',50],['#4a1a1a',105],['#6e2a1e',150],['#a8401e',195]]);stars(60,4,'#f99252',H);disc(W-80,60,22,'#ffb050','#e0603a');
   peaks(.2,70,90,'#2a1418','#e0603a',1);castles(.45,40,'#1a0c10','#2e1418',5)},thumb:'#6e2a1e'});
const thSub=i=>{try{const id=typeof PVTH!='undefined'&&PVTH!=null?PVTH:(['ofight','oresult'].includes(state)?NET.th:(ACC.user&&ACC.user.cosm&&ACC.user.cosm.eq.arena));const it=id&&PDBCore.COS_BY[id];return it&&it.base===i?it.th:i}catch(e){return i}};
const thOfMap=m=>{const i=ARENAS.findIndex(a=>a.map===m);return thSub(i<0?0:i)};
function drawTile(c,px,py,x,y){const S=(xx,yy)=>{const r=map[yy];return r&&solidCh(r[xx]||' ')},Th=THEMES[thOfMap(map)];
 if(c=='#'){const top=y==0||!S(x,y-1);ctx.drawImage(top?Th.top:Th.fill,px,py);edge(px,py,x>0&&!S(x-1,y),!S(x+1,y),y<map.length-1&&!S(x,y+1));
  if(top&&(y==0||map[y-1][x]==' ')){const hh=(x*7349+y*131)%11;if(hh<3)ctx.drawImage(Th.decor[hh],px,py-T)}}
 else if(c=='=')ctx.drawImage(Th.brick,px,py);
 else if(c=='^')ctx.drawImage(Th.spike,px,py)}
