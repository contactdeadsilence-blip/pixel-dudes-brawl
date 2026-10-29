// Pixel Dudes Brawl - online server: accounts (SQLite), shop, and authoritative 60 Hz match rooms over WebSocket.
'use strict';
const path=require('path'),fs=require('fs'),http=require('http'),crypto=require('crypto');
const express=require('express'),{WebSocketServer}=require('ws'),Database=require('better-sqlite3'),bcrypt=require('bcryptjs');
const PDB=require('../shared/core.js');
const PORT=+process.env.PORT||3000,DB_PATH=process.env.DB_PATH||path.join(__dirname,'..','data','brawl.db');
const NS=PDB.PRICES.length,REWARD={part:25,ko:10,place:[50,25,10,0],firstWin:100,daily:50},LOCAL={part:10,ko:5,win:25,maxKo:9,maxMatch:60,minSec:process.env.LOCAL_MIN_SEC!=null?+process.env.LOCAL_MIN_SEC:30,dayCap:400,tickets:new Map()},ONLINE_RULES={stocks:3,time:(+process.env.MATCH_TIME_S||240)*60,diff:0,items:2};
const QUICK_FILL_MS=+process.env.QUICK_FILL_MS||15000,COUNTDOWN_MS=+process.env.COUNTDOWN_MS||5000;
fs.mkdirSync(path.dirname(DB_PATH),{recursive:true});
const db=new Database(DB_PATH);db.pragma('journal_mode = WAL');
db.exec(`CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY,username TEXT UNIQUE COLLATE NOCASE,pass TEXT,coins INTEGER DEFAULT 0,unlocked TEXT,settings TEXT DEFAULT '{}',guest INTEGER DEFAULT 0,created INTEGER);
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id INTEGER,created INTEGER);
CREATE TABLE IF NOT EXISTS purchases(id INTEGER PRIMARY KEY,user_id INTEGER,skin INTEGER,price INTEGER,ts INTEGER);`);
for(const c of ['rating INTEGER DEFAULT 1000','games INTEGER DEFAULT 0','wins INTEGER DEFAULT 0'])try{db.exec('ALTER TABLE users ADD COLUMN '+c)}catch(e){}
const q={byName:db.prepare('SELECT * FROM users WHERE username=?'),byId:db.prepare('SELECT * FROM users WHERE id=?'),
 ins:db.prepare('INSERT INTO users(username,pass,coins,unlocked,guest,created) VALUES(?,?,0,?,?,?)'),
 sess:db.prepare('INSERT INTO sessions VALUES(?,?,?)'),tok:db.prepare('SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=?'),
 delTok:db.prepare('DELETE FROM sessions WHERE token=?'),setS:db.prepare('UPDATE users SET settings=? WHERE id=?'),
 coins:db.prepare('UPDATE users SET coins=coins+? WHERE id=?'),buy:db.prepare('UPDATE users SET coins=coins-?,unlocked=? WHERE id=? AND coins>=?'),
 log:db.prepare('INSERT INTO purchases(user_id,skin,price,ts) VALUES(?,?,?,?)')};
const pub=u=>({username:u.username,coins:u.coins,rating:u.rating,games:u.games,wins:u.wins,tier:PDB.tierOf(u.rating),unlocked:JSON.parse(u.unlocked||'[]'),settings:JSON.parse(u.settings||'{}'),guest:!!u.guest});
const newSession=u=>{const t=crypto.randomBytes(24).toString('hex');q.sess.run(t,u.id,Date.now());return t};
const SESS_MS=90*864e5,touchTok=db.prepare('UPDATE sessions SET created=? WHERE token=?'),ageTok=db.prepare('SELECT created FROM sessions WHERE token=?');
db.prepare('DELETE FROM sessions WHERE created<?').run(Date.now()-SESS_MS);
// sliding 90-day sessions: each use extends the expiry; expired tokens are deleted and rejected
const userOf=t=>{if(!t)return null;t=String(t);const r=ageTok.get(t);if(!r)return null;if(r.created<Date.now()-SESS_MS){q.delTok.run(t);return null}if(Date.now()-r.created>36e5)touchTok.run(Date.now(),t);return q.tok.get(t)||null};

const app=express();app.use(express.json({limit:'32kb'}));
const auth=(req,res,next)=>{const t=(req.get('authorization')||'').replace(/^Bearer /,'');const u=userOf(t);if(!u)return res.status(401).json({error:'not logged in'});req.user=u;req.token=t;next()};
app.post('/api/register',(req,res)=>{const {username,password}=req.body||{};
 if(typeof username!='string'||!/^[A-Za-z0-9_]{3,12}$/.test(username))return res.status(400).json({error:'username: 3-12 letters, digits or _'});
 if(typeof password!='string'||password.length<4||password.length>64)return res.status(400).json({error:'password: 4+ characters'});
 if(q.byName.get(username))return res.status(409).json({error:'username taken'});
 const id=q.ins.run(username,bcrypt.hashSync(password,10),JSON.stringify(PDB.STARTER),0,Date.now()).lastInsertRowid;const u=q.byId.get(id);res.json({token:newSession(u),user:pub(u)})});
app.post('/api/login',(req,res)=>{const {username,password}=req.body||{};const u=typeof username=='string'&&q.byName.get(username);
 if(!u||u.guest||typeof password!='string'||!bcrypt.compareSync(password,u.pass))return res.status(401).json({error:'wrong username or password'});res.json({token:newSession(u),user:pub(u)})});
app.post('/api/guest',(req,res)=>{let name;for(let k=0;k<20;k++){name='GUEST'+(1000+Math.floor(Math.random()*9000));if(!q.byName.get(name))break}
 const id=q.ins.run(name,null,JSON.stringify(PDB.STARTER),1,Date.now()).lastInsertRowid;const u=q.byId.get(id);res.json({token:newSession(u),user:pub(u)})});
// ===== Earning =====
db.exec('CREATE TABLE IF NOT EXISTS earn(user_id INTEGER,day TEXT,kind TEXT,amt INTEGER)');
const dayKey=()=>new Date(Date.now()-8*36e5).toISOString().slice(0,10); // Pacific-ish day
const eq={has:db.prepare('SELECT 1 FROM earn WHERE user_id=? AND day=? AND kind=?'),sum:db.prepare('SELECT COALESCE(SUM(amt),0) s FROM earn WHERE user_id=? AND day=? AND kind=?'),add:db.prepare('INSERT INTO earn VALUES(?,?,?,?)')};
function grant(uid,kind,amt){if(amt>0){q.coins.run(amt,uid);eq.add.run(uid,dayKey(),kind,amt)}return amt}
function onceToday(uid,kind,amt){return eq.has.get(uid,dayKey(),kind)?0:grant(uid,kind,amt)}
function dailyLogin(u){if(u.guest)return 0;return onceToday(u.id,'login',REWARD.daily)}
app.post('/api/daily',auth,(req,res)=>{const n=dailyLogin(req.user);res.json({bonus:n,user:pub(q.byId.get(req.user.id))})});
// ===== Daily challenges: 3 per account per day, progress tracked here =====
db.exec('CREATE TABLE IF NOT EXISTS chal(user_id INTEGER,day TEXT,slot INTEGER,cid TEXT,prog INTEGER DEFAULT 0,done INTEGER DEFAULT 0,PRIMARY KEY(user_id,day,slot))');
const CHAL=PDB.CHALLENGES,CH={get:db.prepare('SELECT * FROM chal WHERE user_id=? AND day=? ORDER BY slot'),ins:db.prepare('INSERT OR IGNORE INTO chal(user_id,day,slot,cid) VALUES(?,?,?,?)'),
 set:db.prepare('UPDATE chal SET prog=?,done=? WHERE user_id=? AND day=? AND slot=?')};
function hashStr(s){let h=2166136261;for(const c of s)h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;return h}
function chalRows(uid){const d=dayKey();let rows=CH.get.all(uid,d);if(rows.length<3){const ids=CHAL.map(c=>c.id),pick=[];let h=hashStr(uid+':'+d);
  while(pick.length<3){h=Math.imul(h^(h>>>13),2654435761)>>>0;const id=ids[h%ids.length];if(!pick.includes(id))pick.push(id)}pick.forEach((id,k)=>CH.ins.run(uid,d,k,id));rows=CH.get.all(uid,d)}return rows}
const chalView=uid=>chalRows(uid).map(r=>{const c=CHAL.find(c=>c.id==r.cid)||{txt:r.cid,n:1,r:0};return {id:r.cid,txt:c.txt,n:c.n,prog:Math.min(r.prog,c.n),done:!!r.done,reward:c.r}});
// ev: {won, kos, online, flawless, players, mode}
function chalProgress(uid,ev){const done=[];const d=dayKey();for(const r of chalRows(uid)){if(r.done)continue;const c=CHAL.find(c=>c.id==r.cid);if(!c)continue;const add=PDB.chalAdd(c,ev);if(!add)continue;
  const p=Math.min(c.n,r.prog+add),fin=p>=c.n;CH.set.run(p,fin?1:0,uid,d,r.slot);if(fin){grant(uid,'chal',c.r);done.push({txt:c.txt,reward:c.r})}}return done}
const msToReset=()=>{const n=Date.now()-8*36e5;return 864e5-(n%864e5)};
app.get('/api/challenges',auth,(req,res)=>res.json({list:chalView(req.user.id),resetIn:Math.round(msToReset()/1000)}));
// local / vs-CPU play: server issues a ticket at match start and validates the claim (time, KO caps, daily cap)
app.post('/api/local/start',auth,(req,res)=>{const id=crypto.randomBytes(12).toString('hex');LOCAL.tickets.set(id,{uid:req.user.id,at:Date.now()});
 for(const [k,v] of LOCAL.tickets)if(Date.now()-v.at>36e5)LOCAL.tickets.delete(k);res.json({ticket:id})});
app.post('/api/local/end',auth,(req,res)=>{const b=req.body||{},tk=LOCAL.tickets.get(String(b.ticket));
 if(!tk||tk.uid!=req.user.id)return res.status(400).json({error:'bad ticket'});LOCAL.tickets.delete(String(b.ticket));
 const secs=(Date.now()-tk.at)/1000,players=Math.max(0,Math.min(4,b.players|0));
 if(secs<LOCAL.minSec||players<2)return res.json({coins:0,why:'match too short',user:pub(q.byId.get(req.user.id))});
 const kos=Math.max(0,Math.min(LOCAL.maxKo,3*(players-1),b.kos|0,Math.floor(secs/5))),won=!!b.won;
 const bd={part:LOCAL.part,ko:LOCAL.ko*kos,win:won?LOCAL.win:0};let tot=Math.min(LOCAL.maxMatch,bd.part+bd.ko+bd.win);
 const left=Math.max(0,LOCAL.dayCap-eq.sum.get(req.user.id,dayKey(),'local').s);let capped=tot>left;tot=Math.min(tot,left);grant(req.user.id,'local',tot);
 bd.firstWin=won&&tot>0?onceToday(req.user.id,'firstwin',REWARD.firstWin):0;
 const chal=chalProgress(req.user.id,{won,kos,online:false,flawless:won&&!!b.flawless,players,mode:String(b.mode||'stock')});
 res.json({chal,coins:tot+bd.firstWin,breakdown:bd,capped,user:pub(q.byId.get(req.user.id))})});
app.post('/api/logout',auth,(req,res)=>{q.delTok.run(req.token);res.json({ok:true})});
app.get('/api/me',auth,(req,res)=>res.json({user:pub(req.user)}));
app.post('/api/settings',auth,(req,res)=>{const s=req.body&&req.body.settings;if(!s||typeof s!='object'||Array.isArray(s))return res.status(400).json({error:'bad settings'});
 const j=JSON.stringify(s);if(j.length>8000)return res.status(400).json({error:'settings too large'});q.setS.run(j,req.user.id);res.json({ok:true})});
app.post('/api/shop/buy',auth,(req,res)=>{const skin=req.body&&req.body.skin;
 if(!Number.isInteger(skin)||skin<0||skin>=NS)return res.status(400).json({error:'unknown skin'});
 const r=db.transaction(()=>{const u=q.byId.get(req.user.id),un=JSON.parse(u.unlocked);if(un.includes(skin))return {code:409,error:'already unlocked'};
  const price=PDB.PRICES[skin];if(u.coins<price)return {code:402,error:'not enough coins'};un.push(skin);un.sort((a,b)=>a-b);
  if(q.buy.run(price,JSON.stringify(un),u.id,price).changes!=1)return {code:402,error:'not enough coins'};q.log.run(u.id,skin,price,Date.now());return {ok:true}})();
 if(!r.ok)return res.status(r.code).json({error:r.error});res.json({user:pub(q.byId.get(req.user.id))})});
// Real-money coin packs are intentionally NOT implemented. Wire a payment provider here (e.g. Stripe Checkout + webhook that credits coins).
app.post('/api/coins/checkout',auth,(req,res)=>res.status(501).json({error:'payments not configured'}));
// ===== Ranked =====
const rq={top:db.prepare('SELECT username,rating,games,wins FROM users WHERE guest=0 AND games>0 ORDER BY rating DESC,wins DESC LIMIT 50'),
 pos:db.prepare('SELECT COUNT(*)+1 n FROM users WHERE guest=0 AND games>0 AND rating>?'),upd:db.prepare('UPDATE users SET rating=?,games=games+1,wins=wins+? WHERE id=?')};
app.get('/api/leaderboard',(req,res)=>{const t=(req.get('authorization')||'').replace(/^Bearer /,''),u=userOf(t);
 res.json({top:rq.top.all().map((r,k)=>Object.assign(r,{pos:k+1,tier:PDB.tierOf(r.rating)})),me:u&&!u.guest?{username:u.username,rating:u.rating,games:u.games,tier:PDB.tierOf(u.rating),pos:u.games?rq.pos.get(u.rating).n:null}:null})});
// Elo across placements: every pair of ranked (non-guest) humans is a game; K scaled by field size
function rateMatch(order){const P=order.filter(x=>x.uid&&!x.guest);const n=P.length;const out={};if(n<2)return out;const K=32/(n-1);
 const R=P.map(x=>q.byId.get(x.uid).rating);P.forEach((a,i)=>{let d=0;P.forEach((b,j)=>{if(i==j)return;const e=1/(1+Math.pow(10,(R[j]-R[i])/400)),sc=a.place<b.place?1:a.place>b.place?0:.5;d+=K*(sc-e)});
  const nr=Math.max(0,Math.round(R[i]+d));rq.upd.run(nr,a.won?1:0,a.uid);out[a.uid]={old:R[i],rating:nr,delta:nr-R[i],tier:PDB.tierOf(nr)}});return out}
// ===== Friends + invites =====
db.exec('CREATE TABLE IF NOT EXISTS friends(a INTEGER,b INTEGER,status INTEGER DEFAULT 0,created INTEGER,PRIMARY KEY(a,b))');
const fq={get:db.prepare('SELECT * FROM friends WHERE (a=? AND b=?) OR (a=? AND b=?)'),ins:db.prepare('INSERT OR IGNORE INTO friends(a,b,status,created) VALUES(?,?,0,?)'),
 acc:db.prepare('UPDATE friends SET status=1 WHERE a=? AND b=?'),del:db.prepare('DELETE FROM friends WHERE (a=? AND b=?) OR (a=? AND b=?)'),
 n:db.prepare('SELECT COUNT(*) n FROM friends WHERE a=? OR b=?'),
 list:db.prepare('SELECT f.a,f.b,f.status,ua.username an,ub.username bn FROM friends f JOIN users ua ON ua.id=f.a JOIN users ub ON ub.id=f.b WHERE f.a=? OR f.b=?')};
const SEEN=new Map(),WSU=new Map(),INV=new Map();const seen=u=>{if(u)SEEN.set(u.id,Date.now())};
const isOn=id=>(WSU.get(id)||0)>0||Date.now()-(SEEN.get(id)||0)<25000;
const areFriends=(x,y)=>{const r=fq.get.get(x,y,y,x);return !!(r&&r.status==1)};
function privRoomOf(uid){for(const r of rooms.values())if(!r.quick&&r.state=='lobby'&&r.slots.some(s=>s&&s.type=='human'&&s.uid==uid)&&r.slots.some(s=>!s))return r.code;return null}
const noGuest=(req,res,next)=>{if(req.user.guest)return res.status(403).json({error:'GUESTS CANNOT ADD FRIENDS'});seen(req.user);next()};
const target=(req,res)=>{const n=String((req.body||{}).name||'').trim();const t=n&&q.byName.get(n);if(!t||t.guest){res.status(404).json({error:'NO SUCH PLAYER'});return null}if(t.id==req.user.id){res.status(400).json({error:"THAT'S YOU!"});return null}return t};
app.get('/api/friends',auth,(req,res)=>{const me=req.user.id;seen(req.user);if(req.user.guest)return res.json({guest:true,friends:[],incoming:[],outgoing:[],invites:[]});
 const out={friends:[],incoming:[],outgoing:[]};for(const r of fq.list.all(me,me)){const other=r.a==me?r.b:r.a,name=r.a==me?r.bn:r.an;
  if(r.status==1)out.friends.push({name,online:isOn(other),room:privRoomOf(other)});else if(r.b==me)out.incoming.push(name);else out.outgoing.push(name)}
 out.friends.sort((x,y)=>(y.online-x.online)||x.name.localeCompare(y.name));
 const now=Date.now();out.invites=(INV.get(me)||[]).filter(i=>now-i.at<300000&&rooms.has(i.code)&&rooms.get(i.code).state=='lobby').map(i=>({from:i.from,code:i.code,at:i.at}));res.json(out)});
app.post('/api/friends/add',auth,noGuest,(req,res)=>{const t=target(req,res);if(!t)return;const me=req.user.id,r=fq.get.get(me,t.id,t.id,me);
 if(r&&r.status==1)return res.json({ok:true,msg:'ALREADY FRIENDS'});if(r&&r.a==t.id){fq.acc.run(t.id,me);return res.json({ok:true,msg:'NOW FRIENDS WITH '+t.username})}
 if(r)return res.json({ok:true,msg:'REQUEST ALREADY SENT'});if(fq.n.get(me,me).n>=100)return res.status(400).json({error:'FRIEND LIST FULL'});
 fq.ins.run(me,t.id,Date.now());res.json({ok:true,msg:'REQUEST SENT TO '+t.username})});
app.post('/api/friends/accept',auth,noGuest,(req,res)=>{const t=target(req,res);if(!t)return;const r=fq.get.get(t.id,req.user.id,-1,-1);if(!r)return res.status(404).json({error:'NO REQUEST'});fq.acc.run(t.id,req.user.id);res.json({ok:true,msg:'NOW FRIENDS WITH '+t.username})});
app.post('/api/friends/remove',auth,noGuest,(req,res)=>{const t=target(req,res);if(!t)return;fq.del.run(req.user.id,t.id,t.id,req.user.id);res.json({ok:true,msg:'REMOVED '+t.username})});
app.post('/api/friends/invite',auth,noGuest,(req,res)=>{const t=target(req,res);if(!t)return;const me=req.user.id;if(!areFriends(me,t.id))return res.status(403).json({error:'NOT FRIENDS'});
 const code=String((req.body||{}).code||'').toUpperCase(),r=rooms.get(code);if(!r||r.quick||r.state!='lobby'||!r.slots.some(s=>s&&s.uid==me))return res.status(400).json({error:'JOIN A PRIVATE ROOM FIRST'});
 const L=(INV.get(t.id)||[]).filter(i=>!(i.from==req.user.username&&i.code==code)&&Date.now()-i.at<300000);L.push({from:req.user.username,code,at:Date.now()});INV.set(t.id,L.slice(-10));res.json({ok:true,msg:'INVITED '+t.username})});
app.get('/healthz',(req,res)=>res.json({ok:true,rooms:rooms.size}));
app.use(express.static(path.join(__dirname,'..','public')));

// ===== Rooms =====
const rooms=new Map();const CODECH='ABCDEFGHJKLMNPQRSTUVWXYZ';
const mkCode=()=>{let c;do{c=Array.from({length:4},()=>CODECH[Math.floor(Math.random()*CODECH.length)]).join('')}while(rooms.has(c));return c};
const send=(ws,o)=>{if(ws&&ws.readyState==1)ws.send(JSON.stringify(o))};
function newRoom(quick){const r={code:mkCode(),quick,slots:[null,null,null,null],host:null,arena:Math.floor(Math.random()*4),mode:'stock',items:ONLINE_RULES.items,ff:false,state:'lobby',created:Date.now(),countAt:0,fillAt:quick?Date.now()+QUICK_FILL_MS:0,core:null,loop:null};rooms.set(r.code,r);return r}
const humans=r=>r.slots.filter(s=>s&&s.type=='human'&&s.ws);
function lobbyMsg(r,ws){const you=r.slots.findIndex(s=>s&&s.ws===ws),now=Date.now();
 return {t:'lobby',code:r.code,quick:r.quick,host:r.host===ws,you,arena:r.arena,mode:r.mode||'stock',items:r.items|0,ff:!!r.ff,
  slots:r.slots.map(s=>{if(!s)return null;const u=s.uid&&s.ws?q.byId.get(s.uid):null;return {type:s.type,name:s.name,skin:s.skin,host:s.ws&&s.ws===r.host,tier:u&&!u.guest?PDB.tierOf(u.rating):null,rating:u&&!u.guest?u.rating:null}}),ranked:r.quick,
  count:r.countAt?Math.max(0,Math.ceil((r.countAt-now)/1000)):-1,fill:r.quick&&r.fillAt&&!r.countAt?Math.max(0,Math.ceil((r.fillAt-now)/1000)):-1}}
const pushLobby=r=>{for(const s of humans(r))send(s.ws,lobbyMsg(r,s.ws))};
function firstOwned(u,pref){const un=JSON.parse(u.unlocked);return un.includes(pref)?pref:un[0]}
function join(r,ws){const i=r.slots.findIndex(s=>!s);if(i<0||r.state!='lobby')return false;const u=ws.user;
 r.slots[i]={type:'human',ws,uid:u.id,name:u.username,skin:firstOwned(u,ws.pref!=null?ws.pref:[0,1,2,3][i]),inp:{b:0,e:0},kos:0};if(!r.host)r.host=ws;ws.room=r;pushLobby(r);return true}
function leave(ws){const r=ws.room;if(!r)return;ws.room=null;const i=r.slots.findIndex(s=>s&&s.ws===ws);
 if(i>=0){if(r.state=='fight'){const s=r.slots[i];s.type='cpu';s.ws=null;s.name+=' (CPU)';r.core.setCPU(i,true)}else r.slots[i]=null}
 if(r.host===ws){const h=humans(r)[0];r.host=h?h.ws:null}
 if(!humans(r).length)return destroy(r);if(r.state=='lobby'){if(humans(r).length<2&&r.quick)r.countAt=0;pushLobby(r)}}
function destroy(r){if(r.loop)clearTimeout(r.loop);r.loop=null;rooms.delete(r.code)}
const CPU_NAMES=['BOLT','ZIGGY','MOCHI','RUSTY','PIXIE','TANK'];
function addCPU(r){const i=r.slots.findIndex(s=>!s);if(i<0)return;const used=r.slots.filter(Boolean).map(s=>s.skin);let sk;do{sk=Math.floor(Math.random()*NS)}while(used.includes(sk)&&used.length<NS);
 r.slots[i]={type:'cpu',name:'CPU',skin:sk,kos:0}}
function startMatch(r){r.state='fight';r.countAt=0;r.fillAt=0;if(r.quick)r.arena=Math.floor(Math.random()*4);
 const ev=[];r.ev=ev;r.slots.forEach(s=>{if(s)s.kos=0});
 r.core=PDB.createCore({sfx:(k,a)=>ev.push(a!=null?['s',k,a]:['s',k]),shake:v=>ev.push(['k',v]),burst:(x,y,c,n,sp)=>{if(ev.length<200)ev.push(['b',Math.round(x),Math.round(y),c,n,sp])},
  part:(x,y)=>{if(ev.length<200)ev.push(['p',Math.round(x),Math.round(y)])},ko:f=>ev.push(['o',f.i,Math.round(f.x),Math.round(f.y)]),
  kill:(k,v)=>{if(k!=null&&k!==v&&r.slots[k])r.slots[k].kos++}});
 const slots=r.slots.map(s=>s?{type:s.type,skin:s.skin,name:s.name}:{type:'none'});r.core.startFight(slots,r.arena,Object.assign({},ONLINE_RULES,{mode:r.mode||'stock',items:r.items|0,ff:!!r.ff}));
 humans(r).forEach(s=>send(s.ws,{t:'start',you:r.slots.indexOf(s),slots:r.slots.map(s=>s?{type:s.type,skin:s.skin,name:s.name}:null),arena:r.arena,stocks:ONLINE_RULES.stocks,mode:r.core.opts.mode,time:r.core.opts.time,items:r.items|0,ff:!!r.ff}));
 startLoop(r)}
// Fixed-step 60 Hz loop: setInterval(16.67) really fires every ~16ms (62.5 Hz) and drifts/bunches on a shared CPU, which made the
// client playback clock fall behind and jump. Track real time with an accumulator, catch up at most 4 steps, then resync.
const STEP_MS=1000/60;
function startLoop(r){let next=performance.now();const run=()=>{if(r.loop!==h)return;const now=performance.now();let n=0;
  while(now>=next&&n<4&&r.loop===h){tickRoom(r);next+=STEP_MS;n++}if(now-next>STEP_MS*4)next=now+STEP_MS;
  if(r.loop===h){h=setTimeout(run,Math.max(0,next-performance.now()-1));r.loop=h}};let h=setTimeout(run,0);r.loop=h}
const BITS=['l','r','u','d','a','s','x'],EB=['upE','dE','ap','sp','xp'];
function tickRoom(r){const c=r.core;let res;try{res=c.step(i=>{const s=r.slots[i];if(!s||!s.inp)return {};const o={};BITS.forEach((k,j)=>o[k]=!!(s.inp.b&1<<j));EB.forEach((k,j)=>o[k]=!!(s.inp.e&1<<j));s.inp.e=0;return o})}catch(e){console.error('step',e);res='win'}
 if(c.tick%2==0||res){const o={t:'snap',tick:c.tick,F:c.snap()},xs=JSON.stringify(c.snapX());if(xs!==r.lastX||c.tick-r.lastXT>=30||res){o.X=JSON.parse(xs);r.lastX=xs;r.lastXT=c.tick}
  if(c.readyT)o.readyT=c.readyT;if(c.endT)o.endT=c.endT;if(c.timer!==r.lastTm||c.tick%60==0){o.timer=c.timer;r.lastTm=c.timer}if(r.ev.length)o.ev=r.ev.splice(0);const m=JSON.stringify(o);for(const s of humans(r))if(s.ws.readyState==1)s.ws.send(m)}
 if(res=='win')endMatch(r)}
function endMatch(r){clearTimeout(r.loop);r.loop=null;const c=r.core,w=c.winner;
 const all=c.rank(),rank=all.map(f=>{const s=r.slots[f.i];let coins=0,bd=null;if(s&&s.type=='human'&&s.uid){const place=all.indexOf(f),won=w&&w.i==f.i;bd={part:REWARD.part,ko:REWARD.ko*Math.min(s.kos,9),place:w?REWARD.place[place]||0:0};coins=grant(s.uid,'online',bd.part+bd.ko+bd.place);if(won)coins+=(bd.firstWin=onceToday(s.uid,'firstwin',REWARD.firstWin))}let chal=null;if(s&&s.type=='human'&&s.uid&&s.ws){chal=chalProgress(s.uid,{won:!!(w&&w.i==f.i),kos:s.kos,online:true,flawless:!!(w&&w.i==f.i)&&f.stocks>=ONLINE_RULES.stocks,players:all.length,mode:r.mode||'stock'});s.chal=chal}return {i:f.i,name:s?s.name:'?',skin:f.skin,kos:s?s.kos:0,coins,bd}});
 if(r.quick){const rt=rateMatch(all.map((f,k)=>{const s=r.slots[f.i];return {uid:s&&s.type=='human'&&s.ws?s.uid:null,guest:s&&s.ws&&s.ws.user.guest,place:w?k:0,won:!!(w&&w.i==f.i)}}));rank.forEach(x=>{const s=r.slots[x.i];if(s&&s.uid&&rt[s.uid])x.rank=rt[s.uid]})}
 for(const s of humans(r)){const u=q.byId.get(s.uid);s.ws.user=u;send(s.ws,{t:'end',chal:s.chal||[],winner:w?w.i:null,rank,coins:u.coins});send(s.ws,{t:'user',user:pub(u)})}
 r.state='lobby';r.core=null;r.slots=r.slots.map(s=>!s||s.type!='human'||!s.ws?(r.quick||!s?null:s.type=='cpu'&&!s.uid?s:null):Object.assign(s,{kos:0,inp:{b:0,e:0}}));
 if(r.quick)r.fillAt=Date.now()+QUICK_FILL_MS;if(!humans(r).length)return destroy(r);pushLobby(r)}
setInterval(()=>{const now=Date.now();for(const r of rooms.values()){if(r.state!='lobby')continue;const n=humans(r).length;
 if(r.quick){if(n>=4){startMatch(r);continue}if(n>=2&&!r.countAt)r.countAt=now+COUNTDOWN_MS;
  if(n==1&&r.fillAt&&now>=r.fillAt){while(r.slots.some(s=>!s))addCPU(r);startMatch(r);continue}
  if(r.countAt&&now>=r.countAt){startMatch(r);continue}}
 pushLobby(r)}},500);

const server=http.createServer(app);const wss=new WebSocketServer({server,path:'/ws',maxPayload:4096,perMessageDeflate:false});
wss.on('connection',(ws,req)=>{const tok=new URL(req.url,'http://x').searchParams.get('token');const u=userOf(tok);
 if(!u){send(ws,{t:'err',m:'LOG IN FIRST',fatal:true});return ws.close()}ws.user=u;ws.room=null;WSU.set(u.id,(WSU.get(u.id)||0)+1);ws.on('close',()=>{WSU.set(u.id,Math.max(0,(WSU.get(u.id)||1)-1))});
 ws.on('message',d=>{let m;try{m=JSON.parse(d)}catch(e){return}if(!m||typeof m.t!='string')return;const r=ws.room;
  switch(m.t){
   case 'quick':{if(r)leave(ws);let room=[...rooms.values()].find(x=>x.quick&&x.state=='lobby'&&humans(x).length<4&&x.slots.some(s=>!s));if(!room)room=newRoom(true);join(room,ws);break}
   case 'create':{if(r)leave(ws);join(newRoom(false),ws);break}
   case 'join':{const room=rooms.get(String(m.code||'').toUpperCase());if(!room||room.quick){send(ws,{t:'err',m:'ROOM NOT FOUND',fatal:true});break}
    if(room.state!='lobby'){send(ws,{t:'err',m:'MATCH IN PROGRESS',fatal:true});break}if(r&&r!==room)leave(ws);if(!join(room,ws))send(ws,{t:'err',m:'ROOM FULL',fatal:true});break}
   case 'leave':leave(ws);break;
   case 'skin':{if(!r||r.state!='lobby')break;const s=r.slots.find(s=>s&&s.ws===ws);const k=m.skin;if(!s||!Number.isInteger(k))break;
    const un=JSON.parse(q.byId.get(ws.user.id).unlocked);if(!un.includes(k)){send(ws,{t:'err',m:'SKIN LOCKED'});break}s.skin=k;ws.pref=k;pushLobby(r);break}
   case 'arena':if(r&&!r.quick&&r.host===ws&&r.state=='lobby'&&Number.isInteger(m.arena)&&m.arena>=0&&m.arena<4){r.arena=m.arena;pushLobby(r)}break;
   case 'rules':if(r&&!r.quick&&r.host===ws&&r.state=='lobby'){if(PDB.MODES.some(x=>x.id==m.mode))r.mode=m.mode;if(Number.isInteger(m.items)&&m.items>=0&&m.items<4)r.items=m.items;if(m.ff!=null)r.ff=!!m.ff;pushLobby(r)}break;
   case 'addcpu':if(r&&!r.quick&&r.host===ws&&r.state=='lobby'){addCPU(r);pushLobby(r)}break;
   case 'delcpu':if(r&&!r.quick&&r.host===ws&&r.state=='lobby'){for(let i=3;i>=0;i--)if(r.slots[i]&&r.slots[i].type=='cpu'){r.slots[i]=null;break}pushLobby(r)}break;
   case 'start':if(r&&!r.quick&&r.host===ws&&r.state=='lobby'){if(r.slots.filter(Boolean).length<2)send(ws,{t:'err',m:'NEED 2+ FIGHTERS'});else startMatch(r)}break;
   case 'in':{if(!r||r.state!='fight')break;const s=r.slots.find(s=>s&&s.ws===ws);if(s){s.inp.b=(m.b|0)&127;s.inp.e|=(m.e|0)&31}break}
  }});
 ws.on('close',()=>leave(ws));ws.on('error',()=>{})});
if(require.main===module)server.listen(PORT,()=>console.log('Pixel Dudes Brawl server on http://localhost:'+PORT));
module.exports={server,app,rooms,db};
