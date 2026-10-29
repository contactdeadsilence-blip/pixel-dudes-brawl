// Pixel Dudes Brawl - online server: accounts (SQLite), shop, and authoritative 60 Hz match rooms over WebSocket.
'use strict';
const path=require('path'),fs=require('fs'),http=require('http'),crypto=require('crypto');
const express=require('express'),{WebSocketServer}=require('ws'),Database=require('better-sqlite3'),bcrypt=require('bcryptjs');
const PDB=require('../shared/core.js');
const PORT=+process.env.PORT||3000,DB_PATH=process.env.DB_PATH||path.join(__dirname,'..','data','brawl.db');
const NS=PDB.PRICES.length,REWARD={part:20,ko:15,win:50},ONLINE_RULES={stocks:3,time:(+process.env.MATCH_TIME_S||240)*60,diff:1};
const QUICK_FILL_MS=+process.env.QUICK_FILL_MS||15000,COUNTDOWN_MS=+process.env.COUNTDOWN_MS||5000;
fs.mkdirSync(path.dirname(DB_PATH),{recursive:true});
const db=new Database(DB_PATH);db.pragma('journal_mode = WAL');
db.exec(`CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY,username TEXT UNIQUE COLLATE NOCASE,pass TEXT,coins INTEGER DEFAULT 0,unlocked TEXT,settings TEXT DEFAULT '{}',guest INTEGER DEFAULT 0,created INTEGER);
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id INTEGER,created INTEGER);
CREATE TABLE IF NOT EXISTS purchases(id INTEGER PRIMARY KEY,user_id INTEGER,skin INTEGER,price INTEGER,ts INTEGER);`);
const q={byName:db.prepare('SELECT * FROM users WHERE username=?'),byId:db.prepare('SELECT * FROM users WHERE id=?'),
 ins:db.prepare('INSERT INTO users(username,pass,coins,unlocked,guest,created) VALUES(?,?,0,?,?,?)'),
 sess:db.prepare('INSERT INTO sessions VALUES(?,?,?)'),tok:db.prepare('SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=?'),
 delTok:db.prepare('DELETE FROM sessions WHERE token=?'),setS:db.prepare('UPDATE users SET settings=? WHERE id=?'),
 coins:db.prepare('UPDATE users SET coins=coins+? WHERE id=?'),buy:db.prepare('UPDATE users SET coins=coins-?,unlocked=? WHERE id=? AND coins>=?'),
 log:db.prepare('INSERT INTO purchases(user_id,skin,price,ts) VALUES(?,?,?,?)')};
const pub=u=>({username:u.username,coins:u.coins,unlocked:JSON.parse(u.unlocked||'[]'),settings:JSON.parse(u.settings||'{}'),guest:!!u.guest});
const newSession=u=>{const t=crypto.randomBytes(24).toString('hex');q.sess.run(t,u.id,Date.now());return t};
const userOf=t=>t?q.tok.get(String(t)):null;

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
app.get('/healthz',(req,res)=>res.json({ok:true,rooms:rooms.size}));
app.use(express.static(path.join(__dirname,'..','public')));

// ===== Rooms =====
const rooms=new Map();const CODECH='ABCDEFGHJKLMNPQRSTUVWXYZ';
const mkCode=()=>{let c;do{c=Array.from({length:4},()=>CODECH[Math.floor(Math.random()*CODECH.length)]).join('')}while(rooms.has(c));return c};
const send=(ws,o)=>{if(ws&&ws.readyState==1)ws.send(JSON.stringify(o))};
function newRoom(quick){const r={code:mkCode(),quick,slots:[null,null,null,null],host:null,arena:Math.floor(Math.random()*4),state:'lobby',created:Date.now(),countAt:0,fillAt:quick?Date.now()+QUICK_FILL_MS:0,core:null,loop:null};rooms.set(r.code,r);return r}
const humans=r=>r.slots.filter(s=>s&&s.type=='human'&&s.ws);
function lobbyMsg(r,ws){const you=r.slots.findIndex(s=>s&&s.ws===ws),now=Date.now();
 return {t:'lobby',code:r.code,quick:r.quick,host:r.host===ws,you,arena:r.arena,
  slots:r.slots.map(s=>s?{type:s.type,name:s.name,skin:s.skin,host:s.ws&&s.ws===r.host}:null),
  count:r.countAt?Math.max(0,Math.ceil((r.countAt-now)/1000)):-1,fill:r.quick&&r.fillAt&&!r.countAt?Math.max(0,Math.ceil((r.fillAt-now)/1000)):-1}}
const pushLobby=r=>{for(const s of humans(r))send(s.ws,lobbyMsg(r,s.ws))};
function firstOwned(u,pref){const un=JSON.parse(u.unlocked);return un.includes(pref)?pref:un[0]}
function join(r,ws){const i=r.slots.findIndex(s=>!s);if(i<0||r.state!='lobby')return false;const u=ws.user;
 r.slots[i]={type:'human',ws,uid:u.id,name:u.username,skin:firstOwned(u,ws.pref!=null?ws.pref:[0,1,2,3][i]),inp:{b:0,e:0},kos:0};if(!r.host)r.host=ws;ws.room=r;pushLobby(r);return true}
function leave(ws){const r=ws.room;if(!r)return;ws.room=null;const i=r.slots.findIndex(s=>s&&s.ws===ws);
 if(i>=0){if(r.state=='fight'){const s=r.slots[i];s.type='cpu';s.ws=null;s.name+=' (CPU)';r.core.setCPU(i,true)}else r.slots[i]=null}
 if(r.host===ws){const h=humans(r)[0];r.host=h?h.ws:null}
 if(!humans(r).length)return destroy(r);if(r.state=='lobby'){if(humans(r).length<2&&r.quick)r.countAt=0;pushLobby(r)}}
function destroy(r){if(r.loop)clearInterval(r.loop);rooms.delete(r.code)}
const CPU_NAMES=['BOLT','ZIGGY','MOCHI','RUSTY','PIXIE','TANK'];
function addCPU(r){const i=r.slots.findIndex(s=>!s);if(i<0)return;const used=r.slots.filter(Boolean).map(s=>s.skin);let sk;do{sk=Math.floor(Math.random()*NS)}while(used.includes(sk)&&used.length<NS);
 r.slots[i]={type:'cpu',name:'CPU',skin:sk,kos:0}}
function startMatch(r){r.state='fight';r.countAt=0;r.fillAt=0;if(r.quick)r.arena=Math.floor(Math.random()*4);
 const ev=[];r.ev=ev;r.slots.forEach(s=>{if(s)s.kos=0});
 r.core=PDB.createCore({sfx:(k,a)=>ev.push(a!=null?['s',k,a]:['s',k]),shake:v=>ev.push(['k',v]),burst:(x,y,c,n,sp)=>{if(ev.length<200)ev.push(['b',Math.round(x),Math.round(y),c,n,sp])},
  part:(x,y)=>{if(ev.length<200)ev.push(['p',Math.round(x),Math.round(y)])},ko:f=>ev.push(['o',f.i,Math.round(f.x),Math.round(f.y)]),
  kill:(k,v)=>{if(k!=null&&k!==v&&r.slots[k])r.slots[k].kos++}});
 const slots=r.slots.map(s=>s?{type:s.type,skin:s.skin,name:s.name}:{type:'none'});r.core.startFight(slots,r.arena,ONLINE_RULES);
 humans(r).forEach(s=>send(s.ws,{t:'start',you:r.slots.indexOf(s),slots:r.slots.map(s=>s?{type:s.type,skin:s.skin,name:s.name}:null),arena:r.arena,stocks:ONLINE_RULES.stocks}));
 r.loop=setInterval(()=>tickRoom(r),1000/60)}
const BITS=['l','r','u','d','a','s'],EB=['upE','dE','ap','sp'];
function tickRoom(r){const c=r.core;let res;try{res=c.step(i=>{const s=r.slots[i];if(!s||!s.inp)return {};const o={};BITS.forEach((k,j)=>o[k]=!!(s.inp.b&1<<j));EB.forEach((k,j)=>o[k]=!!(s.inp.e&1<<j));s.inp.e=0;return o})}catch(e){console.error('step',e);res='win'}
 if(c.tick%2==0||res){const m=JSON.stringify({t:'snap',tick:c.tick,F:c.snap(),readyT:c.readyT,endT:c.endT,timer:c.timer,ev:r.ev.splice(0)});for(const s of humans(r))if(s.ws.readyState==1)s.ws.send(m)}
 if(res=='win')endMatch(r)}
function endMatch(r){clearInterval(r.loop);r.loop=null;const c=r.core,w=c.winner;
 const rank=c.rank().map(f=>{const s=r.slots[f.i];let coins=0;if(s&&s.type=='human'&&s.uid){coins=REWARD.part+REWARD.ko*s.kos+(w&&w.i==f.i?REWARD.win:0);q.coins.run(coins,s.uid)}return {i:f.i,name:s?s.name:'?',skin:f.skin,kos:s?s.kos:0,coins}});
 for(const s of humans(r)){const u=q.byId.get(s.uid);s.ws.user=u;send(s.ws,{t:'end',winner:w?w.i:null,rank,coins:u.coins});send(s.ws,{t:'user',user:pub(u)})}
 r.state='lobby';r.core=null;r.slots=r.slots.map(s=>!s||s.type!='human'||!s.ws?(r.quick||!s?null:s.type=='cpu'&&!s.uid?s:null):Object.assign(s,{kos:0,inp:{b:0,e:0}}));
 if(r.quick)r.fillAt=Date.now()+QUICK_FILL_MS;if(!humans(r).length)return destroy(r);pushLobby(r)}
setInterval(()=>{const now=Date.now();for(const r of rooms.values()){if(r.state!='lobby')continue;const n=humans(r).length;
 if(r.quick){if(n>=4){startMatch(r);continue}if(n>=2&&!r.countAt)r.countAt=now+COUNTDOWN_MS;
  if(n==1&&r.fillAt&&now>=r.fillAt){while(r.slots.some(s=>!s))addCPU(r);startMatch(r);continue}
  if(r.countAt&&now>=r.countAt){startMatch(r);continue}}
 pushLobby(r)}},500);

const server=http.createServer(app);const wss=new WebSocketServer({server,path:'/ws',maxPayload:4096});
wss.on('connection',(ws,req)=>{const tok=new URL(req.url,'http://x').searchParams.get('token');const u=userOf(tok);
 if(!u){send(ws,{t:'err',m:'LOG IN FIRST',fatal:true});return ws.close()}ws.user=u;ws.room=null;
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
   case 'addcpu':if(r&&!r.quick&&r.host===ws&&r.state=='lobby'){addCPU(r);pushLobby(r)}break;
   case 'delcpu':if(r&&!r.quick&&r.host===ws&&r.state=='lobby'){for(let i=3;i>=0;i--)if(r.slots[i]&&r.slots[i].type=='cpu'){r.slots[i]=null;break}pushLobby(r)}break;
   case 'start':if(r&&!r.quick&&r.host===ws&&r.state=='lobby'){if(r.slots.filter(Boolean).length<2)send(ws,{t:'err',m:'NEED 2+ FIGHTERS'});else startMatch(r)}break;
   case 'in':{if(!r||r.state!='fight')break;const s=r.slots.find(s=>s&&s.ws===ws);if(s){s.inp.b=(m.b|0)&63;s.inp.e|=(m.e|0)&15}break}
  }});
 ws.on('close',()=>leave(ws));ws.on('error',()=>{})});
if(require.main===module)server.listen(PORT,()=>console.log('Pixel Dudes Brawl server on http://localhost:'+PORT));
module.exports={server,app,rooms,db};
