// Headless integration test: accounts, shop validation, 2 ws clients fighting a quick match, rewards, private room + CPU.
'use strict';
const PDBP=require('../shared/core.js').PRICES;
const path=require('path'),fs=require('fs'),os=require('os'),assert=require('assert');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'pdb-'));
Object.assign(process.env,{DB_PATH:path.join(tmp,'t.db'),MATCH_TIME_S:'12',QUICK_FILL_MS:'3000',COUNTDOWN_MS:'1000',TOUR_GAP_MS:'300'});
const {server,db}=require('../server/index.js');const WebSocket=require('ws');
let B;const errors=[];process.on('uncaughtException',e=>{errors.push(e);console.error(e)});
const api=(p,body,tok)=>fetch(B+'/api/'+p,{method:body?'POST':'GET',headers:Object.assign({'Content-Type':'application/json'},tok?{Authorization:'Bearer '+tok}:{}),body:body?JSON.stringify(body):undefined}).then(async r=>({status:r.status,j:await r.json()}));
function client(tok,name){const ws=new WebSocket(B.replace('http','ws')+'/ws?token='+tok);const c={ws,name,msgs:[],snaps:0,lobby:null,start:null,end:null,you:-1,last:null};
 ws.on('message',d=>{const m=JSON.parse(d);if(m.t=='snap'){c.snaps++;c.last=m}else c.msgs.push(m);if(m.t=='lobby')c.lobby=m;if(m.t=='start'){c.start=m;c.you=m.you}if(m.t=='end')c.end=m;if(m.t=='err')c.err=m});
 c.open=new Promise(r=>ws.on('open',r));c.send=o=>ws.send(JSON.stringify(o));
 // simple bot: walk at the nearest opponent, jump if they are above, attack when close
 c.bot=setInterval(()=>{if(!c.last||c.you<0||!c.start)return;const F=c.last.F,idx=c.start.slots.slice(0,c.you).filter(Boolean).length,me=F[idx];if(!me)return;
  let best=null;F.forEach((f,k)=>{if(k!=idx&&!(f[7]&1)){const d=Math.abs(f[0]-me[0])+Math.abs(f[1]-me[1]);if(!best||d<best.d)best={f,d}}});if(!best)return;
  const dx=best.f[0]-me[0],dy=best.f[1]-me[1];let b=0,e=0;if(dx<-60)b|=1;if(dx>60)b|=2;if(dy<-200&&Math.random()<.3)e|=1;if(Math.abs(dx)<220&&Math.abs(dy)<200&&Math.random()<.5)e|=4;if(Math.random()<.03)e|=8;
  c.send({t:'in',b,e})},33);return c}
const wait=(f,ms,what)=>new Promise((res,rej)=>{const t0=Date.now(),h=setInterval(()=>{if(f()){clearInterval(h);res()}else if(Date.now()-t0>ms){clearInterval(h);rej(new Error('timeout: '+what))}},50)});
(async()=>{await new Promise(r=>server.listen(0,r));B='http://127.0.0.1:'+server.address().port;console.log('server',B);
 // --- accounts
 let r=await api('register',{username:'alice',password:'pw1234'});assert.equal(r.status,200);const A=r.j.token;assert.deepEqual(r.j.user.unlocked,[0,1,2,3]);
 r=await api('register',{username:'ALICE',password:'xxxx'});assert.equal(r.status,409,'dup username (case-insensitive)');
 r=await api('register',{username:'a',password:'xxxx'});assert.equal(r.status,400);
 r=await api('login',{username:'alice',password:'bad'});assert.equal(r.status,401);
 r=await api('login',{username:'Alice',password:'pw1234'});assert.equal(r.status,200);const A2=r.j.token;
 r=await api('me',null,A2);assert.equal(r.j.user.username,'alice');
 r=await api('settings',{settings:{music:.3,keys:null}},A2);assert.equal(r.status,200);r=await api('me',null,A);assert.equal(r.j.user.settings.music,.3);
 r=await api('guest',{});assert.equal(r.status,200);const G=r.j.token;assert(r.j.user.guest);
 r=await api('me');assert.equal(r.status,401);
 // --- shop
 r=await api('shop/buy',{skin:4},A);assert.equal(r.status,402,'not enough coins');
 r=await api('shop/buy',{skin:99},A);assert.equal(r.status,400);
 r=await api('shop/buy',{skin:1},A);assert.equal(r.status,409,'starter already owned');
 r=await api('coins/checkout',{pack:'small'},A);assert.equal(r.status,501);assert.equal(r.j.error,'payments not configured');
 console.log('accounts + shop validation OK');
 // --- quick match, 2 headless clients fight
 const c1=client(A,'alice'),c2=client(G,'guest');await Promise.all([c1.open,c2.open]);
 c1.send({t:'skin',skin:5});c1.send({t:'quick'});await wait(()=>c1.lobby,2000,'lobby1');c2.send({t:'quick'});
 await wait(()=>c1.start&&c2.start,6000,'match start');assert.equal(c1.lobby.code,c2.lobby.code);console.log('match started in room',c1.lobby.code,'arena',c1.start.arena);
 await wait(()=>c1.end&&c2.end,30000,'match end');
 console.log('match ended; snaps c1',c1.snaps,'c2',c2.snaps,'rank',JSON.stringify(c1.end.rank));
 assert(c1.snaps>150&&c2.snaps>150,'snapshot stream ~30Hz');
 const kos=c1.end.rank.reduce((a,x)=>a+x.kos,0);const meR=c1.end.rank.find(x=>x.i==c1.you);assert(meR.coins>=20);
 r=await api('me',null,A);assert.equal(r.j.user.coins,meR.coins,'coins persisted');console.log('KOs in match',kos,'alice earned',meR.coins);
 // --- buy a skin after topping up coins (simulates a few matches)
 await db.run("UPDATE users SET coins=coins+200 WHERE username='alice'");const before=(await api('me',null,A)).j.user.coins;
 r=await api('shop/buy',{skin:4},A);assert.equal(r.status,200);assert(r.j.user.unlocked.includes(4));assert.equal(r.j.user.coins,before-PDBP[4]);
 r=await api('shop/buy',{skin:4},A);assert.equal(r.status,409);console.log('skin purchase OK, coins',before,'->',before-PDBP[4]);
// --- cosmetics: validation, buy, equip
 const CB=require('../shared/core.js').COS_BY;
 r=await api('shop/item',{item:'nope'},A);assert.equal(r.status,400,'unknown item');
 r=await api('shop/item',{item:'hat_halo'},A);assert.equal(r.status,402,'unaffordable item');
 r=await api('shop/item',{item:'hat_cap'},G);assert.equal(r.status,402,'guest broke');
 await db.run("UPDATE users SET coins=coins+500 WHERE username='alice'");const cb=(await api('me',null,A)).j.user.coins;
 r=await api('shop/item',{item:'hat_crown'},A);assert.equal(r.status,200);assert(r.j.user.cosm.own.includes('hat_crown'));assert.equal(r.j.user.cosm.eq.hat,'hat_crown');assert.equal(r.j.user.coins,cb-CB.hat_crown.p);
 r=await api('shop/item',{item:'hat_crown'},A);assert.equal(r.status,409,'double buy');
 r=await api('shop/equip',{cat:'hat',item:'hat_top'},A);assert.equal(r.status,403,'equip unowned');
 r=await api('shop/equip',{cat:'trail',item:'hat_crown'},A);assert.equal(r.status,400,'wrong category');
 r=await api('shop/equip',{cat:'hat',item:null},A);assert.equal(r.status,200);assert(!r.j.user.cosm.eq.hat);
 r=await api('shop/equip',{cat:'hat',item:'hat_crown'},A);assert.equal(r.status,200);assert.equal(r.j.user.cosm.eq.hat,'hat_crown');
 const pr=await db.get("SELECT item,price FROM purchases WHERE item='hat_crown'");assert.equal(pr.price,CB.hat_crown.p);
 console.log('cosmetics buy/equip/reject OK, coins',cb,'->',r.j.user.coins);
 // --- private room with code + CPU, then disconnect mid-match -> CPU takeover
 c1.end=c2.end=null;c1.start=c2.start=null;c1.send({t:'leave'});c2.send({t:'leave'});c1.send({t:'create'});await wait(()=>c1.lobby&&!c1.lobby.quick,2000,'private room');
 const code=c1.lobby.code;assert(/^[A-Z]{4}$/.test(code));c2.send({t:'join',code});await wait(()=>c2.lobby&&c2.lobby.code==code,2000,'join');
 c1.send({t:'addcpu'});c2.send({t:'start'});c1.send({t:'start'});await wait(()=>c1.start&&c2.start,3000,'private start');
 assert.equal(c1.start.slots.filter(Boolean).length,3);assert.equal(c1.start.slots[c1.you].cos.hat,'hat_crown','cosmetics synced in start');assert.equal(c1.lobby.slots[c1.you].cos.hat,'hat_crown','cosmetics in lobby');console.log('private room',code,'with CPU started');
 await new Promise(r=>setTimeout(r,2000));clearInterval(c2.bot);c2.ws.close();await new Promise(r=>setTimeout(r,500));
 const fl=c1.last.F[1][7];assert(fl&4,'disconnected player became CPU');console.log('disconnect -> CPU takeover OK');
 await wait(()=>c1.end,30000,'private end');console.log('private match ended, winner',c1.end.winner);
 // --- bracket logic (pure)
 const PC=require('../shared/core.js');for(const n of [4,8]){const b=PC.bracketNew(n);let x,k=0;assert.equal(PC.bracketReport(b,1,0,0),false,'cannot report unfilled match');
  while(x=PC.bracketNext(b)){assert.equal(PC.bracketReport(b,x.r,x.m,99),false,'winner must be a player');assert(PC.bracketReport(b,x.r,x.m,Math.max(x.a,x.b)));assert.equal(PC.bracketReport(b,x.r,x.m,x.a),false,'no double report');k++}
  assert.equal(k,n-1,'n-1 matches');assert.equal(PC.bracketChamp(b),n-1,'top winner advanced every round');assert.equal(PC.bracketRound(b,b.rd.length-1),'FINAL')}
 assert.throws(()=>PC.bracketNew(6));console.log('bracket logic OK');
 {const C=PC.createCore({}),A=C.ARENAS.findIndex(a=>a.name=='SKY CASTLE');assert.ok(A>=4,'sky castle arena');assert.equal(PC.ARENAS_N,C.ARENAS.length);
  for(const items of [0,2]){C.startFight([0,1,2,3].map(i=>({type:'cpu',skin:i})),A,{stocks:2,diff:2,items});const xs=new Set();let n=0,r,hz=0;
   while(n<60*60*6&&!(r=C.step(()=>({})))){n++;xs.add(Math.round(C.mp.x/16));if(C.hz.ph==2)hz++}
   assert.equal(r,'win','bots finish a match on sky castle');assert.ok(xs.size>10,'platform moves');if(items)assert.ok(hz>0,'lightning strikes with items on');else assert.equal(hz,0,'no hazard when items off')}
  C.startFight([{type:'human',skin:0},{type:'human',skin:1}],A,{items:0});for(let k=0;k<120;k++)C.step(()=>({}));const sx=JSON.parse(JSON.stringify(C.snapX()));const x0=C.mp.x;for(let k=0;k<30;k++)C.step(()=>({}));assert.notEqual(C.mp.x,x0);C.unsnapX(sx);assert.ok(Math.abs(C.mp.x-x0)<.11,'mp snapshot roundtrip');
  console.log('sky castle OK')}
 // --- 2v2: private room team picking, then 2V2 quick match with bot fill
 r=await api('register',{username:'bob',password:'pw1234'});const Bt=r.j.token;const c3=client(Bt,'bob');await c3.open;
 c1.start=c1.end=null;c1.lobby=null;c1.send({t:'create'});await wait(()=>c1.lobby&&!c1.lobby.quick,2000,'2v2 room');c1.send({t:'rules',mode:'teams'});
 c3.send({t:'join',code:c1.lobby.code});await wait(()=>c3.lobby&&c3.lobby.slots.filter(Boolean).length==2,2000,'bob joined');
 assert.notEqual(c3.lobby.slots[0].team,c3.lobby.slots[1].team,'auto-balanced teams');c3.send({t:'team'});await wait(()=>c1.lobby.slots[1]&&c1.lobby.slots[1].team===c1.lobby.slots[0].team,2000,'team switch');
 c1.send({t:'addcpu'});c1.send({t:'addcpu'});await wait(()=>c1.lobby.slots.filter(Boolean).length==4,2000,'cpus');c3.send({t:'team'});await wait(()=>c3.msgs.some(m=>m.t=='err'&&m.m=='TEAM FULL'),2000,'team full');
 c1.send({t:'start'});await wait(()=>c1.start&&c3.start,3000,'2v2 start');assert.equal(c1.start.mode,'teams');assert.equal(c1.start.teams[0],c1.start.teams[1],'picked teams used');assert.equal(c1.start.ff,false,'ff off by default');
 await wait(()=>c1.end&&c3.end,30000,'2v2 end');console.log('private 2v2 with team picking OK, winner',c1.end.winner);
 c1.send({t:'leave'});c3.send({t:'leave'});c1.start=c1.end=null;c1.send({t:'quick2'});await wait(()=>c1.start,8000,'2v2 quick start');
 assert.equal(c1.start.slots.filter(Boolean).length,4);assert.equal(c1.start.mode,'teams');assert.equal(c1.start.slots.filter(s=>s&&s.type=='cpu').length,3);
 const qr=[...require('../server/index.js').rooms.values()].find(x=>x.q2);assert(qr&&qr.core.opts.diff===0,'2v2 quick bots on EASY');
 await wait(()=>c1.end,30000,'2v2 quick end');console.log('2V2 quick match with EASY bot fill OK');
 // --- online tournament: 2 humans + 2 CPU fill, sequential 1v1s, spectators, champion reward + trophy
 c1.send({t:'leave'});c1.lobby=c3.lobby=null;c1.send({t:'tcreate'});await wait(()=>c1.lobby&&c1.lobby.tour,2000,'tour room');assert.equal(c1.lobby.slots.length,8);
 c3.send({t:'join',code:c1.lobby.code});await wait(()=>c3.lobby&&c3.lobby.tour,2000,'tour join');c1.send({t:'rules',tsize:4});
 const tc=c=>c.msgs.find(m=>m.t=='tchamp');c1.send({t:'start'});await wait(()=>tc(c1)&&tc(c3),150000,'tournament champion');
 const ch=tc(c1),starts=[...c1.msgs,...c3.msgs].filter(m=>m.t=='start'&&m.tour);assert(starts.length>=2,'human matches ran');assert(starts.every(m=>m.slots.filter(Boolean).length==2),'1v1 matches');
 assert(starts.some(m=>m.spec),'spectator saw a match');assert([...c1.msgs,...c3.msgs].some(m=>m.t=='lobby'&&m.T),'bracket broadcast');
 const champ=[c1,c3].find(c=>tc(c).you);if(champ){const u=(await api('me',null,champ===c1?A:Bt)).j.user;assert.equal(u.trophies,1,'trophy');assert.equal(tc(champ).coins,100)}
 console.log('online tournament OK, champion',ch.name,champ?'(human, trophy + coins)':'(CPU)');
 // --- local tournament reward endpoint (capped like local)
 let tk=(await api('local/start',{},Bt)).j.ticket;r=await api('local/tourney',{ticket:tk,size:4,won:true},Bt);assert.equal(r.status,200);assert(r.j.coins<=40);
 r=await api('local/tourney',{ticket:tk,size:4,won:true},Bt);assert.equal(r.status,400,'ticket single use');console.log('local tournament reward OK',r.status);
 clearInterval(c3.bot);c3.ws.close();
 clearInterval(c1.bot);c1.ws.close();assert.equal(errors.length,0);console.log('ALL TESTS PASSED');process.exit(0)
})().catch(e=>{console.error('FAIL',e);process.exit(1)});
