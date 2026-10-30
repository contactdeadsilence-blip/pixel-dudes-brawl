// ===== Store cosmetics (hats, trails, KO fx, poses, name colors, arena themes) =====
let PVTH=null;const CB=PDBCore.COS_BY;
function myEq(){return ACC.user&&ACC.user.cosm?ACC.user.cosm.eq:{}}
function fCos(i){if(['ofight','oresult'].includes(state))return (NET.cos&&NET.cos[i])||{};return typeof LC!='undefined'&&i===LC.me?myEq():{}}
function nameCol(eq,def){const it=eq&&CB[eq.name];if(!it)return def;return it.c=='rainbow'?'hsl('+((t*4)%360)+',90%,65%)':it.c}
const HATS={
 hat_cap:[["..oooooo....",".oRRRRRRo...","oRRwRRRRRooo","oRRRRRRRRRRo","oooooooooooo"],{R:'#e04848',w:'#ffffff'}],
 hat_band:[["..oooooooooo","oBoBBBBBBBBo",".ooooooooooo"],{B:'#e04848'}],
 hat_viking:[["w..........w","ow.oooooo.wo",".owoYYYYoow.","..oYYYYYYo..",".oYyYyYyYYo.","oooooooooooo"],{w:'#f4efd2',Y:'#9aa0b8',y:'#fee761'}],
 hat_top:[["..oooooooo..","..oKKKKKKo..","..oKKKKKKo..","..oKKKKKKo..","..oRRRRRRo..","oooooooooooo","oKKKKKKKKKKo","oooooooooooo"],{K:'#2b2b40',R:'#e04848'}],
 hat_wizard:[[".......oo...","......oPPo..",".....oPPPo..","....oPYPPo..","...oPPPPPo..","..oPPPYPPPo.","oooooooooooo","oPPPPPPPPPPo","oooooooooooo"],{P:'#5d4a9e',Y:'#fee761'}],
 hat_crown:[[".o..o..o..o.",".oYoYooYoYo.",".oYYYYYYYYo.",".oYRYYBYYRo.",".oooooooooo."],{Y:'#fee761',R:'#e04848',B:'#5fcde4'}],
 hat_halo:[["..YYYYYYYY..",".Y........Y.","..YYYYYYYY.."],{Y:'#fee761'}]};
const HATC={};function hatImg(id){if(!HATC[id]){const h=HATS[id];if(!h)return null;const r=h[0],c=document.createElement('canvas');c.width=12;c.height=r.length;const x=c.getContext('2d');
 r.forEach((row,y)=>[...row].forEach((ch,k)=>{if(ch=='.')return;x.fillStyle=ch=='o'?PAL.o:h[1][ch];x.fillRect(k,y,1,1)}));HATC[id]=c}return HATC[id]}
// sprite-local anchor: head top centre of the 16x24 frame
const HAT_X=8,HAT_Y=5;
function drawHat(id,sx,sy,face,sc=1){const im=hatImg(id);if(!im)return;const lift=id=='hat_halo'?3+Math.round(Math.sin(t/12)):0;
 ctx.save();ctx.translate(Math.round(sx+HAT_X*sc),Math.round(sy+(HAT_Y-lift)*sc-im.height*sc+sc));ctx.scale(face<0?-sc:sc,sc);ctx.drawImage(im,-6,0);ctx.restore()}
const WPN={
 wp_bat:[[".o.","oBo","oBo","oBo","oBo","oBo",".o.","oho","oho",".o."],{B:'#c8945a',h:'#5a3a22'}],
 wp_wrench:[["o.o.o","oSoSo","oSSSo",".oSo.",".oSo.",".oSo.",".oSo.",".oSo.",".oho.",".oho.","..o.."],{S:'#b8c0d0',h:'#e04848'}],
 wp_sword:[[".o.","oWo","oWo","oWo","oWo","oWo","oWo","oWo","ooooo","oYYYo","ooooo",".oho.",".oho.","..o.."].map(r=>r.length<5?'.'+r+'.':r),{W:'#e8eef6',Y:'#fee761',h:'#5a3a22'}],
 wp_spear:[[".o.","oWo","oWo","oWo",".o.",".h.",".h.",".h.",".h.",".h.",".h.",".h.",".h.",".h.",".h.",".o."],{W:'#d0d8e4',h:'#8a5a32'}],
 wp_axe:[["..o..","oooh.","oWWho","oWWho","oooh.","..h..","..h..","..h..","..h..","..h..","..h..","..o.."],{W:'#c8d0dc',h:'#8a5a32'}],
 wp_hammer:[["ooooooo","oGGGGGo","oGGGGGo","ooohooo","...h...","...h...","...h...","...h...","...h...","...h...","...o..."],{G:'#8a90a8',h:'#8a5a32'}],
 wp_katana:[[".o.","oWo","oWo","oWo","oWo","oWo","oWo","oWo","oWo","oWo","ooo","oko","oko",".o."],{W:'#f4f8ff',k:'#2b2b40'}],
 wp_beam:[[".C.","CwC","CwC","CwC","CwC","CwC","CwC","CwC","CwC","CwC","CwC","oSo","oSo",".o."],{C:'#5fcde4',w:'#ffffff',S:'#9aa0b8'}]};
const WPC={};function wpImg(id){if(!WPC[id]){const h=WPN[id];if(!h)return null;const r=h[0],wd=Math.max(...r.map(x=>x.length)),c=document.createElement('canvas');c.width=wd;c.height=r.length;const x=c.getContext('2d');
 r.forEach((row,y)=>{const off=Math.floor((wd-row.length)/2);[...row].forEach((ch,k)=>{if(ch=='.')return;x.fillStyle=ch=='o'?PAL.o:h[1][ch];x.fillRect(k+off,y,1,1)})});WPC[id]=c}return WPC[id]}
// angle: 0 = pointing up; idle held forward-up, attack (atkT 20..0) swings from over the shoulder to forward-down
// grip at hand/waist height; held near-horizontal forward, swing from ~0.9 rad (forward-up) down to ~2.6 rad (knee), settle back
function wpAng(atkT){if(!(atkT>0))return 1.3;if(atkT>14)return 1.1-(20-atkT)*.03;if(atkT>=8)return .92+(14-atkT)*.28;return 2.6-(8-atkT)*.16}
function drawWeapon(id,hx,hy,face,ang,sc=1){const im=wpImg(id);if(!im)return;ctx.save();ctx.translate(Math.round(hx),Math.round(hy));ctx.scale(face<0?-sc:sc,sc);ctx.rotate(ang);
 if(id=='wp_beam'){ctx.globalAlpha=.35;ctx.fillStyle='#5fcde4';ctx.fillRect(-im.width/2-1,-im.height,im.width+2,im.height-3);ctx.globalAlpha=1}
 ctx.drawImage(im,-Math.floor(im.width/2),-im.height+2);ctx.restore()}
// ===== attachment anchoring: hats/weapons follow the exact body frame that was just drawn =====
// Every skin-sheet draw records where/how the body sprite went (rounded origin, facing, row, frame, scale).
// Anchors come from the frame's own pixels: head top = first row at least 8px wide, centre = that row's middle,
// so per-skin head heights, per-frame bob (idle/run/attack rows), lunge dx, idle breathing oy and left/right flips all line up.
const BODY=new WeakMap();let LASTB=null;const HAND_X=5,HAND_Y=17;
function bodyAnc(im,row,fr){let m=BODY.get(im);if(!m){if(!im||!im.complete||!im.naturalWidth)return {top:HAT_Y,cx:HAT_X};let d=null;try{const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;const x=c.getContext('2d');x.drawImage(im,0,0);d=x.getImageData(0,0,c.width,c.height).data}catch(e){}m={d,w:im.naturalWidth};BODY.set(im,m)}
 const k=row*4+fr;if(m[k])return m[k];let top=-1,cx=HAT_X,first=-1;
 if(m.d)for(let y=0;y<FH&&top<0;y++){let a=-1,b=-1,n=0;for(let x=0;x<FW;x++)if(m.d[((row*FH+y)*m.w+fr*FW+x)*4+3]>0){n++;if(a<0)a=x;b=x}if(n&&first<0)first=y;if(n>=8){top=y;cx=(a+b+1)/2}}
 if(top<0)top=first<0?HAT_Y:first;return m[k]={top,cx}}
const _dsBody=drawSheet;drawSheet=function(im,x,y,face,row,fr,sc=1){_dsBody(im,x,y,face,row,fr,sc);if(imgs.includes(im))LASTB={im,x:Math.round(x),y:Math.round(y),face:face<0?-1:1,row,fr,sc}};
function hatOn(id,B){const im=hatImg(id);if(!im||!B)return;const a=bodyAnc(B.im,B.row,B.fr),sc=B.sc,cx=B.face<0?FW-a.cx:a.cx,lift=id=='hat_halo'?3+Math.round(Math.sin(t/12)):0;
 ctx.save();ctx.translate(Math.round(B.x+cx*sc),Math.round(B.y+(a.top+1-lift)*sc-im.height*sc));ctx.scale(B.face<0?-sc:sc,sc);ctx.drawImage(im,-6,0);ctx.restore()}
function handOf(B){const a=bodyAnc(B.im,B.row,B.fr),a0=bodyAnc(B.im,1,0),sc=B.sc;return [B.x+(FW/2+B.face*HAND_X)*sc,B.y+(HAND_Y+a.top-a0.top)*sc]}
function weaponOn(id,B,ang){if(!B)return;const [hx,hy]=handOf(B);drawWeapon(id,hx,hy,B.face,ang,B.sc)}
// ===== trails: colours + motion. g = per-particle gravity, k = pixel shape, s = size =====
const TRD={tr_fire:{c:['#e04848','#f99252','#fee761'],vy:-.9},tr_ice:{c:['#ffffff','#a8e0f8','#8fb8ff'],vy:.1},tr_spark:{c:['#ffffff','#fee761','#fff0a0'],l:18,ch:.5},tr_rainbow:{c:['#e04848','#fee761','#5fcde4']},
 tr_bubble:{c:['#a8e0f8','#d8f4ff','#8fb8ff'],vy:-.4,g:-.01,k:'ring',l:26,ch:.25},tr_hearts:{c:['#ff8ad0','#e04848','#ffb8e0'],vy:-.5,g:-.01,k:'heart',l:26,ch:.25},
 tr_volt:{c:['#fee761','#ffffff','#5fcde4'],vx:2.4,vy:0,g:0,l:8},tr_smoke:{c:['#3b2f52','#5d4a6e','#2b2b40'],vy:-.3,g:-.03,s:3,l:24,ch:.6},
 tr_star:{c:['#fee761','#ffffff','#fff0a0'],vy:-.2,g:0,k:'star',l:20,ch:.35},tr_glitch:{c:['#7fe0d0','#ff4fd8','#a1e55a'],vx:0,vy:0,g:0,s:2,l:10,sq:1}};
const TRC=new Proxy({},{get:(o,k)=>(TRD[k]||TRD.tr_spark).c});
function trailCol(id){return id=='tr_rainbow'?'hsl('+((t*9)%360)+',90%,60%)':TRC[id][Math.floor(Math.random()*3)]}
function trailPart(id,x,y,list=parts){if(list.length>=PMAX)return;const d=TRD[id]||TRD.tr_spark;if(d.ch&&Math.random()<d.ch)return;
 let px=x+(Math.random()-.5)*6,py=y+(Math.random()-.5)*6;if(d.sq){px=Math.round(px/2)*2;py=Math.round(py/2)*2}
 const p={x:px,y:py,vx:(Math.random()-.5)*(d.vx!=null?d.vx:.6),vy:d.vy!=null?d.vy:-.2,l:d.l||14,c:trailCol(id)};if(d.g!=null)p.g=d.g;if(d.k)p.k=d.k;if(d.s)p.s=d.s;list.push(p)}
// particle renderer with optional shapes (used by the fight + store preview)
const PSH={heart:[[0,0],[2,0],[0,1],[1,1],[2,1],[1,2]],star:[[1,0],[0,1],[1,1],[2,1],[1,2]],ring:[[1,0],[0,1],[2,1],[1,2]]};
function drawP(p,z){ctx.fillStyle=p.c;const x=Math.round(p.x),y=Math.round(p.y);if(p.k&&PSH[p.k]){const q=z?2:1;for(const [a,b] of PSH[p.k])ctx.fillRect(x+a*q,y+b*q,q,q);return}
 const s=z||p.s||(p.l>15?2:1);ctx.fillRect(x,y,s,s)}
// ===== effect layer: rings, ghosts, skulls, black holes, delayed fireworks, KO flash (render-only, world coords) =====
let FXL=[];const PXA={ghost:[".oooo.","oWWWWo","oWoWoW","oWWWWo","oWWWWo","oWoWoW"],skull:[".oooooo.","oWWWWWWo","oWooWooW","oWooWooW","oWWWWWWo",".oWoWoW.",".oooooo."]};
function pxArt(a,x,y,c,sc=1){a.forEach((r,j)=>[...r].forEach((ch,i)=>{if(ch=='.')return;ctx.fillStyle=ch=='o'?PAL.o:c;ctx.fillRect(x+i*sc,y+j*sc,sc,sc)}))}
function addFX(e,list=FXL){if(list.length<40)list.push(Object.assign({a:0},e))}
function drawFX(list){for(const e of list){e.a++;const k=e.a/e.l;ctx.save();
 if(e.k=='ring'){ctx.globalAlpha=1-k;ctx.strokeStyle=e.c||'#ffffff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(e.x,e.y,(e.r||24)*k+2,0,6.29);ctx.stroke()}
 else if(e.k=='flash'){ctx.globalAlpha=.28*(1-k);ctx.fillStyle='#ffffff';ctx.fillRect(e.x-2000,e.y-1200,4000,2400)}
 else if(e.k=='ghost'){ctx.globalAlpha=Math.min(1,(1-k)*2);pxArt(PXA.ghost,Math.round(e.x-6+Math.sin(e.a/6)*4),Math.round(e.y-e.a*.8),'#f4f8ff',2)}
 else if(e.k=='skull'){const sc=e.a<8?1+e.a/8:2;ctx.globalAlpha=Math.min(1,(1-k)*2.5);pxArt(PXA.skull,Math.round(e.x-4*sc),Math.round(e.y-20-4*sc),'#f4efd2',Math.round(sc))}
 else if(e.k=='hole'){const r=e.a<20?e.a*.7:e.a<50?14:Math.max(0,14-(e.a-50)*1.4);ctx.fillStyle='#120a1e';ctx.beginPath();ctx.arc(e.x,e.y,r,0,6.29);ctx.fill();ctx.strokeStyle='#8a5ad8';ctx.lineWidth=2;ctx.beginPath();ctx.arc(e.x,e.y,r+2+Math.sin(e.a/3),0,6.29);ctx.stroke();
  if(e.a<50&&e.a%2==0&&e.P.length<PMAX){const an=Math.random()*6.28,d=34;e.P.push({x:e.x+Math.cos(an)*d,y:e.y+Math.sin(an)*d,vx:-Math.cos(an)*1.6+Math.sin(an)*.8,vy:-Math.sin(an)*1.6-Math.cos(an)*.8,g:0,l:20,c:Math.random()<.5?'#8a5ad8':'#ffffff'})}}
 else if(e.k=='fw'&&e.a==1){const sv=parts;parts=e.P;try{const c=['#e04848','#fee761','#5fcde4','#a1e55a','#ff8ad0'][Math.floor(Math.random()*5)];for(let n=0;n<26&&parts.length<PMAX;n++){const an=n/26*6.28;parts.push({x:e.x,y:e.y,vx:Math.cos(an)*2.4,vy:Math.sin(an)*2.4,g:.03,l:28,c})}SFX.hit&&SFX.hit(1)}finally{parts=sv}}
 ctx.restore()}
 for(let n=list.length-1;n>=0;n--)if(list[n].a>=list[n].l)list.splice(n,1)}
const ANS=new WeakMap();
// world-space draws: plain error guard (safe() would shift into the 480x270 UI box and offset attachments)
function tryq(fn){try{fn()}catch(e){}}
const _drawFc=drawF;drawF=function(f,oy){if(f.out||f.respawn>0){_drawFc(f,oy);return}
 let A=ANS.get(f);if(!A)ANS.set(f,A={g:f.ground,vy:0,fl:0});
 if(state!='pause'){if(f.ground&&!A.g&&A.vy>1.5)safe(()=>{for(let n=0;n<8&&parts.length<PMAX;n++){const d=n<4?-1:1;parts.push({x:f.x+5+d*(2+Math.random()*3),y:f.y+f.h-1,vx:d*(.4+Math.random()*.9),vy:-Math.random()*.4,g:-.01,s:2,l:16,c:n%2?'#d8dde6':'#9aa0b8'})}});
  if(f.flash>=8&&A.fl<8&&f.hitstun>=20)addFX({k:'ring',x:f.x+5,y:f.y+10,l:14,r:22,c:'#ffffff'});
  A.g=f.ground;A.vy=f.vy;A.fl=f.flash}
 // idle breathing: 1px bob when standing still
 if(f.ground&&Math.abs(f.vx)<.25&&!(f.atkT>0)&&!(f.hitstun>0)&&!(f.dashT>0)&&Math.floor((t+f.i*13)/24)%2)oy+=1;
 LASTB=null;_drawFc(f,oy);const eq=fCos(f.i),B=LASTB&&LASTB.im===imgs[f.skin]&&LASTB.sc==1?LASTB:null;
 if(eq.trail&&state!='pause'&&(f.dashT>0||Math.abs(f.vx)>1.2||Math.abs(f.vy)>2))tryq(()=>trailPart(eq.trail,f.x+5,f.y+12+oy));
 if(eq.weapon&&!(f.inv>0&&Math.floor(t/3)%2))B&&tryq(()=>weaponOn(eq.weapon,B,wpAng(f.atkT)));
 if(eq.hat&&!(f.inv>0&&Math.floor(t/3)%2))B&&tryq(()=>hatOn(eq.hat,B));
 if(eq.name&&state=='ofight'&&NET.names)tryq(()=>text(String(NET.names[f.i]||'').slice(0,10),f.x+5,f.y-14+oy,nameCol(eq),8,'center'))};
function koExtra(id,x,y,fxl=FXL){if(id=='ko_confetti'){for(let k=0;k<50&&parts.length<PMAX;k++){const a=Math.random()*6.28,v=Math.random()*4+1;parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-2,l:30+Math.random()*20,c:'hsl('+Math.floor(Math.random()*360)+',90%,60%)'})}}
 else if(id=='ko_bolt'){let bx=x;for(let yy=y-140;yy<y;yy+=3){bx+=(Math.random()-.5)*4;if(parts.length<PMAX)parts.push({x:bx,y:yy,vx:0,vy:-.08,l:16,c:yy%2?'#fee761':'#ffffff'})}addShake(8);SFX.hit&&SFX.hit()}
 else if(id=='ko_boom'){burst(x,y,'#f99252',40,5);burst(x,y,'#e04848',30,4);burst(x,y,'#fee761',20,6);addShake(12)}
 else if(id=='ko_hearts'){for(let k=0;k<22&&parts.length<PMAX;k++){const a=Math.random()*6.28,v=Math.random()*2.5+.8;parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-1.2,g:.02,k:'heart',l:40+Math.random()*20,c:k%3?'#ff8ad0':'#e04848'})}}
 else if(id=='ko_ghost'){addFX({k:'ghost',x,y,l:70},fxl);for(let k=0;k<12&&parts.length<PMAX;k++)parts.push({x:x+(Math.random()-.5)*14,y,vx:(Math.random()-.5)*.4,vy:-Math.random()*1.2,g:-.01,l:30,c:'#d8dde6'})}
 else if(id=='ko_shatter'){for(let k=0;k<36&&parts.length<PMAX;k++){const a=Math.random()*6.28,v=Math.random()*5+1.5;parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-1,g:.15,s:k%3?2:3,l:30+Math.random()*15,c:['#ffffff','#a8e0f8','#d8f4ff'][k%3]})}addFX({k:'ring',x,y,l:16,r:40,c:'#a8e0f8'},fxl);addShake(6)}
 else if(id=='ko_firework'){for(let k=0;k<3;k++)addFX({k:'fw',x:x+(k-1)*26,y:y-20-k%2*16,l:1+k*14,a:-k*14,P:parts},fxl)}
 else if(id=='ko_skull'){addFX({k:'skull',x,y,l:60},fxl);burst(x,y,'#9aa0b8',24,3);burst(x,y,'#2b2b40',16,2)}
 else if(id=='ko_hole'){addFX({k:'hole',x,y,l:62,P:parts},fxl);addShake(5)}}
const _koFxc=koFx;koFx=function(x,y,i,k){_koFxc(x,y,i);safe(()=>{const bx=Math.max(cam.x+6,Math.min(cam.x+cam.vw-6,x)),by=Math.max(cam.y+6,Math.min(cam.y+cam.vw*H/W-6,y));addFX({k:'ring',x:bx,y:by,l:22,r:56,c:PCOL[i]});addFX({k:'flash',x:bx,y:by,l:10})});if(k==null||k<0||k===i)return;const id=fCos(k).ko;if(id)safe(()=>{const bx=Math.max(cam.x+6,Math.min(cam.x+cam.vw-6,x)),by=Math.max(cam.y+6,Math.min(cam.y+cam.vw*H/W-6,y));koExtra(id,bx,by)})};
// victory poses: applied when the big (scale 3) winner sprite is drawn on the local win screen
let POSE=null;
function poseDraw(raw,id,im,x,y,face,row,fr,sc){let dy=0,dx=0;
 if(id=='po_jump'){dy=-Math.abs(Math.sin(t/8))*14;row=2;fr=1}else if(id=='po_spin'){face=Math.floor(t/6)%2?-1:1}else if(id=='po_dance'){dx=Math.sin(t/10)*6;face=Math.sin(t/10)>0?1:-1;row=2;fr=Math.floor(t/8)%4}else if(id=='po_trophy'){row=1;fr=0}
 raw(im,x+dx,y+dy,face,row,fr,sc);return [x+dx,y+dy,face]}
function trophy(x,y){ctx.fillStyle=PAL.o;ctx.fillRect(x-6,y-1,13,10);ctx.fillRect(x-2,y+8,5,5);ctx.fillRect(x-5,y+12,11,3);ctx.fillStyle='#fee761';ctx.fillRect(x-5,y,11,7);ctx.fillRect(x-1,y+7,3,5);ctx.fillRect(x-4,y+13,9,1);ctx.fillStyle='#fff0a0';ctx.fillRect(x-3,y+1,2,4)}
const _drawSheetc=drawSheet;drawSheet=function(im,x,y,face,row,fr,sc=1){
 if(sc==3&&state=='win'&&winner&&!POSE){const eq=fCos(winner.i);if(eq.pose||eq.hat){POSE=1;try{const [px,py,pf]=eq.pose?poseDraw(_drawSheetc,eq.pose,im,x,y,face,row,fr,sc):(_drawSheetc(im,x,y,face,row,fr,sc),[x,y,face]);
  if(eq.hat)hatOn(eq.hat,LASTB);if(eq.pose=='po_trophy')trophy(px+24,py-14+Math.round(Math.sin(t/10)*2))}finally{POSE=null}return}}
 _drawSheetc(im,x,y,face,row,fr,sc)};
const _drawResc=drawResults;drawResults=function(){_drawResc();const R=NET.res;if(!R||R.winner==null||!NET.slots)return;safe(()=>{const s=NET.slots[R.winner],eq=fCos(R.winner);if(!s||!(eq.pose||eq.hat))return;
 const fr=Math.floor(t/7)%4;const [px,py,pf]=eq.pose?poseDraw(_drawSheetc,eq.pose,imgs[s.skin],372,26,-1,2,fr,2):(_drawSheetc(imgs[s.skin],372,26,-1,2,fr,2),[372,26,-1]);if(eq.hat)hatOn(eq.hat,LASTB);if(eq.pose=='po_trophy')trophy(px+16,py-8)})};
// themed map/bg caches keyed by (map, theme)
const mapCacheT=new Map();const _mapCanvasc=mapCanvas;mapCanvas=function(m=map){const i=ARENAS.findIndex(a=>a.map===m);const th=i<0?0:thSub(i);if(th===i||i<0)return _mapCanvasc(m);
 const k=th;let c=mapCacheT.get(m);if(!c)mapCacheT.set(m,c={});if(!c[k]){const sv=map;map=m;const cv=document.createElement('canvas');cv.width=m[0].length*T;cv.height=m.length*T+T;const real=ctx;ctx=cv.getContext('2d');ctx.imageSmoothingEnabled=false;drawMapRaw(T);ctx=real;map=sv;c[k]=cv}return c[k]};
const _curThc=curTh;curTh=function(){const r=_curThc();return state=='title'?r:thSub(r)};
// ===== Store (tabbed) =====
const TABS=[{c:'skin',n:'SKINS'},{c:'hat',n:'HATS'},{c:'trail',n:'TRAILS'},{c:'ko',n:'KO FX'},{c:'pose',n:'POSES'},{c:'name',n:'NAMES'},{c:'arena',n:'ARENAS'},{c:'weapon',n:'WEAPONS'}];
const SH={tab:0,sel:[4,0,0,0,0,0,0,0],back:'menu',busy:false,pv:[],pt:0};
const tabItems=c=>PDBCore.COSMETICS.filter(x=>x.cat==c);
const ownC=id=>!!(ACC.user&&ACC.user.cosm&&ACC.user.cosm.own.includes(id));
const eqC=it=>myEq()[it.cat]===it.id;
function pvSkin(){const s=SH.sel[0];return owned(s)?s:(slots[0]&&owned(slots[0].skin)?slots[0].skin:0)}
function shopBuy(it){if(SH.busy)return;if(!ACC.user){toast('LOG IN TO SHOP');SFX.err();return}
 if(ownC(it.id)){SH.busy=true;api('shop/equip',{cat:it.cat,item:eqC(it)?null:it.id}).then(j=>{SH.busy=false;ACC.user=j.user;SFX.sel();toast(eqC(it)?it.n+' EQUIPPED':it.n+' REMOVED');if(NET.ws&&NET.ws.readyState==1)NET.ws.send(JSON.stringify({t:'cos'}))}).catch(e=>{SH.busy=false;toast(e.message);SFX.err()});return}
 if(it.off){toast('ITEM UNAVAILABLE');SFX.err();return}
 if(ACC.user.coins<it.p){toast('NOT ENOUGH COINS');SFX.err();return}
 SH.busy=true;api('shop/item',{item:it.id}).then(j=>{SH.busy=false;ACC.user=j.user;SFX.unlock();setTimeout(()=>SFX.coin(),350);toast(it.n+' UNLOCKED + EQUIPPED!');burst(W/2,120,'#fee761',30,3);if(NET.ws&&NET.ws.readyState==1)NET.ws.send(JSON.stringify({t:'cos'}))}).catch(e=>{SH.busy=false;toast(e.message);SFX.err()})}
function updShop(){if(mBack()){state=SH.back=='online'?'online':'menu';SFX.back();return}
 if(KP.KeyQ||anyPad(i=>padEdge(i,'LB'))){SH.tab=(SH.tab+TABS.length-1)%TABS.length;SFX.sel()}if(KP.KeyE||KP.Tab||anyPad(i=>padEdge(i,'RB'))){SH.tab=(SH.tab+1)%TABS.length;SFX.sel()}
 if(KP.KeyC||anyPad(i=>padEdge(i,'Y'))){api('coins/checkout',{pack:'small'}).then(()=>toast('OK')).catch(e=>{toast(e.message);SFX.err()})}
 const tb=SH.tab;
 if(tb==0){let s=SH.sel[0],c=s%GC,r=Math.floor(s/GC);const R=Math.ceil(NS/GC);if(mL()){c=(c+GC-1)%GC;SFX.sel()}if(mR()){c=(c+1)%GC;SFX.sel()}if(mU()){r=(r+R-1)%R;SFX.sel()}if(mD()){r=(r+1)%R;SFX.sel()}SH.sel[0]=Math.min(NS-1,r*GC+c);
  if(mOK()&&!SH.busy){const n=SH.sel[0];if(owned(n)){toast('ALREADY UNLOCKED');SFX.sel();return}if(ACC.user.coins<PRICES[n]){toast('NOT ENOUGH COINS');SFX.err();return}
   SH.busy=true;api('shop/buy',{skin:n}).then(j=>{SH.busy=false;ACC.user=j.user;SFX.unlock();setTimeout(()=>SFX.coin(),350);toast(NAMES[n]+' UNLOCKED!');burst(W/2,120,'#fee761',30,3)}).catch(e=>{SH.busy=false;toast(e.message);SFX.err()})}return}
 const L=tabItems(TABS[tb].c);let s=SH.sel[tb];if(mL()||mU()){s=(s+L.length-1)%L.length;SFX.sel()}if(mR()||mD()){s=(s+1)%L.length;SFX.sel()}SH.sel[tb]=s;
 if(mOK())shopBuy(L[s]);
 // preview particles
 const it=L[s];for(const p of SH.pv){p.x+=p.vx;p.y+=p.vy;p.vy+=(p.g!=null?p.g*.6:.05);p.l--}if(!SH.fx)SH.fx=[];if(!(it&&it.cat=='ko'))SH.fx.length=0;SH.pv=SH.pv.filter(p=>p.l>0);SH.pt++;
 if(it.cat=='trail'){trailPart(it.id,96+Math.sin(SH.pt/14)*30,190,SH.pv)}
 if(it.cat=='ko'&&SH.pt%70==1){const sv=parts;parts=SH.pv;const x=110,y=176;try{if(it.id=='ko_bolt'){let bx=x;for(let yy=y-36;yy<y;yy+=3){bx+=(Math.random()-.5)*4;parts.push({x:bx,y:yy,vx:0,vy:-.05,l:16,c:yy%2?'#fee761':'#ffffff'})}}else if(it.id!='ko_boom'){const sa=addShake;addShake=()=>{};try{koExtra(it.id,x,y,SH.fx)}finally{addShake=sa}}else{burst(x,y,'#f99252',30,3);burst(x,y,'#fee761',15,4)}}finally{parts=sv}}}
function itemIcon(it,x,y){if(state=='shop'&&SH.tab>0){const L0=tabItems(TABS[SH.tab].c);if(L0[SH.sel[SH.tab]]===it)y+=Math.round(Math.sin(t/8)*1.5)}if(it.cat=='weapon')drawWeapon(it.id,x+12,y+26,1,.6);else if(it.cat=='hat')drawHat(it.id,x+2,y+14,1,2);
 else if(it.cat=='trail'){for(let k=0;k<6;k++){ctx.fillStyle=it.id=='tr_rainbow'?'hsl('+(k*60)+',90%,60%)':TRC[it.id][k%3];ctx.fillRect(x+4+k*3,y+18-k*2,2,2)}}
 else if(it.cat=='ko'){const c={ko_bolt:'#fee761',ko_boom:'#f99252',ko_hearts:'#e04848',ko_ghost:'#f4f8ff',ko_shatter:'#a8e0f8',ko_firework:'#a1e55a',ko_skull:'#9aa0b8',ko_hole:'#8a5ad8'}[it.id]||'#ff8ad0';ctx.fillStyle=c;for(let k=0;k<8;k++){const a=k*.785;ctx.fillRect(x+13+Math.round(Math.cos(a)*7),y+15+Math.round(Math.sin(a)*7),2,2)}ctx.fillStyle='#ffffff';ctx.fillRect(x+12,y+14,3,3)}
 else if(it.cat=='pose'){if(it.id=='po_trophy')trophy(x+14,y+8);else _drawSheetc(imgs[pvSkin()],x+6,y+2,1,it.id=='po_jump'?2:1,it.id=='po_jump'?1:0,1)}
 else if(it.cat=='name'){ctx.fillStyle=PAL.o;ctx.fillRect(x+5,y+9,18,14);ctx.fillStyle=nameCol({name:it.id},'#fff');ctx.fillRect(x+6,y+10,16,12)}
 else if(it.cat=='arena'){const T0=THEMES[it.th];ctx.fillStyle=PAL.o;ctx.fillRect(x+3,y+6,22,20);ctx.fillStyle=T0.thumb;ctx.fillRect(x+4,y+7,20,18);ctx.drawImage(T0.top,0,0,16,8,x+4,y+19,20,6)}}
function drawShop(){const tb=SH.tab;text('STORE',W/2,22,PAL.Y,24,'center');acctBadge(W-4,4,'right');
 let tx=8;TABS.forEach((T0,k)=>{const w=T0.n.length*6+10;panel(tx,28,w,14,k==tb?'#5d4a6e':'#2b2b40');text(T0.n,tx+w/2,39,k==tb?PAL.Y:'#d8dde6',8,'center');tx+=w+3});
 if(tb==0){const gx=Math.round((W-GC*30)/2),gy=46;
  for(let n=0;n<NS;n++){const x=gx+(n%GC)*30,y=gy+Math.floor(n/GC)*30;panel(x,y,28,28,n==SH.sel[0]?'#5d4a6e':'#2b2b40');ctx.drawImage(imgs[n],0,0,FW,FH,x+6,y+2,FW,FH);if(!owned(n))lockIcon(x,y,PRICES[n]);
   if(n==SH.sel[0]){ctx.fillStyle=PAL.Y;ctx.fillRect(x-1,y-1,30,2);ctx.fillRect(x-1,y+27,30,2);ctx.fillRect(x-1,y-1,2,30);ctx.fillRect(x+27,y-1,2,30)}}
  const n=SH.sel[0];panel(60,140,360,72);drawSheet(imgs[n],76,142,1,2,Math.floor(t/7)%4,3);text(NAMES[n],140,162,PAL.Y,24);
  if(owned(n))text('UNLOCKED',140,186,'#a1e55a',16);else{coinIcon(140,177);text(String(PRICES[n]),152,186,'#fee761',16);text(ACC.user&&ACC.user.coins>=PRICES[n]?'PRESS A / ENTER TO BUY':'EARN COINS: PLAY ONLINE OR VS CPU WHILE LOGGED IN',140,202,'#d8dde6',8)}
  bar([[['LB','RB'],'TAB'],[['DP'],'BROWSE'],[['A'],'BUY'],[['Y'],'COINS'],[['B'],'BACK']],[[['Q','E'],'TAB'],[['\u2190','\u2192'],'BROWSE'],[['ENTER'],'BUY'],[['C'],'COINS'],[['ESC'],'BACK']],242);return}
 const L=tabItems(TABS[tb].c),s=SH.sel[tb],it=L[s],per=Math.min(L.length,13),gx=Math.round((W-per*34)/2);
 L.forEach((x0,k)=>{const x=gx+k*34,y=50;panel(x,y,30,32,k==s?'#5d4a6e':'#2b2b40');safe(()=>itemIcon(x0,x+1,y));
  if(eqC(x0))text('ON',x+15,y+30,'#a1e55a',8,'center');else if(ownC(x0.id)){ctx.fillStyle='#a1e55a';ctx.fillRect(x+23,y+3,4,2);ctx.fillRect(x+25,y+1,2,4)}else if(x0.off){ctx.fillStyle='#e04848';ctx.fillRect(x+3,y+15,24,2)}else{ctx.fillStyle='#fee761';ctx.fillRect(x+24,y+2,3,3)}
  if(k==s){ctx.fillStyle=PAL.Y;ctx.fillRect(x-1,y-1,32,2);ctx.fillRect(x-1,y+31,32,2);ctx.fillRect(x-1,y-1,2,34);ctx.fillRect(x+29,y-1,2,34)}});
 // preview
 panel(40,92,400,128);const sk=pvSkin(),fr=Math.floor(t/7)%4;
 if(it.cat=='arena'){PVTH=it.id;try{const bg=bgCanvas(it.th);ctx.drawImage(bg,0,0,W,H,52,98,150,84);const mc=mapCanvas(ARENAS[it.base].map);ctx.drawImage(mc,0,0,mc.width,mc.height,52,98+84-Math.round(150*mc.height/mc.width),150,Math.round(150*mc.height/mc.width))}finally{PVTH=null}}
 else if(it.cat=='pose'){const [px,py,pf]=poseDraw(_drawSheetc,it.id,imgs[sk],84,108,1,2,fr,3);if(myEq().hat)hatOn(myEq().hat,LASTB);if(it.id=='po_trophy')trophy(px+24,py-14)}
 else{const sv=state;_drawSheetc(imgs[sk],84,108,1,it.cat=='trail'?2:1,it.cat=='trail'?fr:0,3);const h=it.cat=='hat'?it.id:myEq().hat;const BB=LASTB;if(h)hatOn(h,BB);const wp=it.cat=='weapon'?it.id:myEq().weapon;if(wp)weaponOn(wp,BB,wpAng(20-Math.floor(t/2)%30));
  if(it.cat=='name'){const nm=ACC.user?(ACC.user.name||ACC.user.username||'PLAYER'):'PLAYER';text(nm.slice(0,12),108,104,nameCol({name:it.id}),16,'center')}}
 for(const p of SH.pv)drawP(p,p.l>12?3:2);if(SH.fx)drawFX(SH.fx);
 text(it.n,220,122,PAL.Y,16);text(TABS[tb].n,220,108,'#d8dde6',8);
 if(eqC(it))text('EQUIPPED  (A: REMOVE)',220,146,'#a1e55a',8);else if(ownC(it.id))text('OWNED  (A: EQUIP)',220,146,'#a1e55a',8);
 else if(it.off)text('UNAVAILABLE',220,146,'#e04848',16);
 else{coinIcon(220,137);text(String(it.p),232,146,'#fee761',16);text(!ACC.user?'LOG IN TO BUY':ACC.user.coins>=it.p?'PRESS A / ENTER TO BUY':'NOT ENOUGH COINS YET',220,162,'#d8dde6',8)}
 if(it.cat=='arena')text('RESKINS '+THEMES[it.base].name+' WHEN YOU PLAY IT (HOST ONLINE)',220,182,'#d8dde6',8);
 text('COSMETIC ONLY - NO GAMEPLAY EFFECT',220,206,'#8b93a8',8);
 bar([[['LB','RB'],'TAB'],[['DP'],'BROWSE'],[['A'],'BUY/EQUIP'],[['B'],'BACK']],[[['Q','E'],'TAB'],[['\u2190','\u2192'],'BROWSE'],[['ENTER'],'BUY/EQUIP'],[['ESC'],'BACK']],242)}
