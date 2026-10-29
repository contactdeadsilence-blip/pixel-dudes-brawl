// Headless integration test: accounts, shop validation, 2 ws clients fighting a quick match, rewards, private room + CPU.
'use strict';
const PDBP=require('../shared/core.js').PRICES;
const path=require('path'),fs=require('fs'),os=require('os'),assert=require('assert');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'pdb-'));
Object.assign(process.env,{DB_PATH:path.join(tmp,'t.db'),MATCH_TIME_S:'12',QUICK_FILL_MS:'3000',COUNTDOWN_MS:'1000'});
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
 db.prepare("UPDATE users SET coins=coins+200 WHERE username='alice'").run();const before=(await api('me',null,A)).j.user.coins;
 r=await api('shop/buy',{skin:4},A);assert.equal(r.status,200);assert(r.j.user.unlocked.includes(4));assert.equal(r.j.user.coins,before-PDBP[4]);
 r=await api('shop/buy',{skin:4},A);assert.equal(r.status,409);console.log('skin purchase OK, coins',before,'->',before-PDBP[4]);
 // --- private room with code + CPU, then disconnect mid-match -> CPU takeover
 c1.end=c2.end=null;c1.start=c2.start=null;c1.send({t:'leave'});c2.send({t:'leave'});c1.send({t:'create'});await wait(()=>c1.lobby&&!c1.lobby.quick,2000,'private room');
 const code=c1.lobby.code;assert(/^[A-Z]{4}$/.test(code));c2.send({t:'join',code});await wait(()=>c2.lobby&&c2.lobby.code==code,2000,'join');
 c1.send({t:'addcpu'});c2.send({t:'start'});c1.send({t:'start'});await wait(()=>c1.start&&c2.start,3000,'private start');
 assert.equal(c1.start.slots.filter(Boolean).length,3);console.log('private room',code,'with CPU started');
 await new Promise(r=>setTimeout(r,2000));clearInterval(c2.bot);c2.ws.close();await new Promise(r=>setTimeout(r,500));
 const fl=c1.last.F[1][7];assert(fl&4,'disconnected player became CPU');console.log('disconnect -> CPU takeover OK');
 await wait(()=>c1.end,30000,'private end');console.log('private match ended, winner',c1.end.winner);
 clearInterval(c1.bot);c1.ws.close();assert.equal(errors.length,0);console.log('ALL TESTS PASSED');process.exit(0)
})().catch(e=>{console.error('FAIL',e);process.exit(1)});
