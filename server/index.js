// Pixel Dudes Brawl - online server: accounts (Postgres via DATABASE_URL, else SQLite), shop, and authoritative 60 Hz match rooms over WebSocket.
'use strict';
const path=require('path'),fs=require('fs'),http=require('http'),crypto=require('crypto');
const express=require('express'),{WebSocketServer}=require('ws'),bcrypt=require('bcryptjs');
const PDB=require('../shared/core.js');
const PORT=+process.env.PORT||3000;
const NS=PDB.PRICES.length,REWARD={part:25,ko:10,place:[50,25,10,0],firstWin:100,daily:50},LOCAL={part:10,ko:5,win:25,maxKo:9,maxMatch:60,minSec:process.env.LOCAL_MIN_SEC!=null?+process.env.LOCAL_MIN_SEC:30,dayCap:400,tickets:new Map()},ONLINE_RULES={stocks:3,time:(+process.env.MATCH_TIME_S||240)*60,diff:0,items:2};
const TOUR_GAP_MS=+process.env.TOUR_GAP_MS||4000,TOUR_PRIZE={4:100,8:200},TOUR_LOCAL={4:40,8:80};
const QUICK_FILL_MS=+process.env.QUICK_FILL_MS||15000,COUNTDOWN_MS=+process.env.COUNTDOWN_MS||5000;
const db=require('./db.js')();
const SESS_MS=90*864e5;
const ADM={};const ready=db.init().then(()=>ADM.load()).then(()=>db.run('DELETE FROM sessions WHERE created<?',[Date.now()-SESS_MS])).then(()=>console.log('db ready ('+db.kind+')'));
ready.catch(e=>{console.error('DB INIT FAILED',e);process.exit(1)});
const q={byName:n=>db.get('SELECT * FROM users WHERE lower(username)=lower(?)',[n]),byId:id=>db.get('SELECT * FROM users WHERE id=?',[id]),
 ins:(n,p,un,g)=>db.get('INSERT INTO users(username,pass,coins,unlocked,guest,created) VALUES(?,?,0,?,?,?) RETURNING *',[n,p,un,g,Date.now()]),
 tok:t=>db.get('SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=?',[t]),
 delTok:t=>db.run('DELETE FROM sessions WHERE token=?',[t]),setS:(j,id)=>db.run('UPDATE users SET settings=? WHERE id=?',[j,id]),
 coins:(a,id)=>db.run('UPDATE users SET coins=coins+? WHERE id=?',[a,id])};
const pub=u=>({username:u.username,coins:u.coins,rating:u.rating,games:u.games,wins:u.wins,tier:PDB.tierOf(u.rating),unlocked:JSON.parse(u.unlocked||'[]'),settings:JSON.parse(u.settings||'{}'),guest:!!u.guest,cosm:PDB.cosParse(u.cosm),trophies:u.trophies|0,xp:u.xp|0,level:PDB.levelOf(u.xp|0).level,bio:u.bio||''});
const eqOf=u=>u?PDB.cosParse(u.cosm).eq:{};
const newSession=async u=>{const t=crypto.randomBytes(24).toString('hex');await db.run('INSERT INTO sessions(token,user_id,created) VALUES(?,?,?)',[t,u.id,Date.now()]);return t};
// sliding 90-day sessions: each use extends the expiry; expired tokens are deleted and rejected
async function userOf(t){if(!t)return null;t=String(t);const r=await db.get('SELECT created FROM sessions WHERE token=?',[t]);if(!r)return null;
 if(r.created<Date.now()-SESS_MS){await q.delTok(t);return null}if(Date.now()-r.created>36e5)await db.run('UPDATE sessions SET created=? WHERE token=?',[Date.now(),t]);return (await q.tok(t))||null}
const H=fn=>(req,res,next)=>Promise.resolve(fn(req,res,next)).catch(e=>{console.error('api',req.path,e);if(!res.headersSent)res.status(500).json({error:'server error'})});

const FEAT=require('./feat.js');const app=express();FEAT.early(app,{db,PDB,ready});app.use(express.json({limit:'32kb'}));app.use((req,res,next)=>{ready.then(()=>next(),next)});
const auth=H(async(req,res,next)=>{const t=(req.get('authorization')||'').replace(/^Bearer /,'');const u=await userOf(t);if(!u)return res.status(401).json({error:'not logged in'});req.user=u;req.token=t;next()});
app.post('/api/register',H(async(req,res)=>{const {username,password}=req.body||{};
 if(typeof username!='string'||!/^[A-Za-z0-9_]{3,12}$/.test(username))return res.status(400).json({error:'username: 3-12 letters, digits or _'});
 if(typeof password!='string'||password.length<4||password.length>64)return res.status(400).json({error:'password: 4+ characters'});
 if(await q.byName(username))return res.status(409).json({error:'username taken'});
 let u;try{u=await q.ins(username,bcrypt.hashSync(password,10),JSON.stringify(PDB.STARTER),0)}catch(e){if(/unique|UNIQUE/.test(e.message))return res.status(409).json({error:'username taken'});throw e}
 res.json({token:await newSession(u),user:pub(u)})}));
// local tournament reward: one ticket per event, min duration scales with rounds, shares the local daily cap
app.post('/api/local/tourney',auth,H(async(req,res)=>{const b=req.body||{},tk=LOCAL.tickets.get(String(b.ticket));const size=b.size===8?8:b.size===4?4:0;
 if(!size||!tk||tk.uid!=req.user.id)return res.status(400).json({error:'bad ticket'});LOCAL.tickets.delete(String(b.ticket));
 const me=async()=>pub(await q.byId(req.user.id));if(!b.won)return res.json({coins:0,user:await me()});
 if((Date.now()-tk.at)/1000<LOCAL.minSec*Math.log2(size))return res.json({coins:0,why:'too short',user:await me()});
 const used=(await db.get('SELECT COALESCE(SUM(amt),0) s FROM earn WHERE user_id=? AND day=? AND kind=?',[req.user.id,dayKey(),'local'])).s;
 const tot=Math.min(TOUR_LOCAL[size],Math.max(0,LOCAL.dayCap-used));await grant(req.user.id,'local',tot);res.json({coins:tot,capped:tot<TOUR_LOCAL[size],user:await me()})}));
app.post('/api/login',H(async(req,res)=>{const {username,password}=req.body||{};const u=typeof username=='string'&&await q.byName(username);
 if(!u||u.guest||typeof password!='string'||!bcrypt.compareSync(password,u.pass))return res.status(401).json({error:'wrong username or password'});res.json({token:await newSession(u),user:pub(u)})}));
app.post('/api/guest',H(async(req,res)=>{let u;for(let k=0;k<20&&!u;k++){const name='GUEST'+(1000+Math.floor(Math.random()*9000));if(await q.byName(name))continue;
  try{u=await q.ins(name,null,JSON.stringify(PDB.STARTER),1)}catch(e){if(!/unique|UNIQUE/.test(e.message))throw e}}
 if(!u)return res.status(503).json({error:'try again'});res.json({token:await newSession(u),user:pub(u)})}));
// ===== Earning =====
const dayKey=()=>new Date(Date.now()-8*36e5).toISOString().slice(0,10); // Pacific-ish day
const XPK={online:1,local:1,pit:1,tour:1};
async function grant(uid,kind,amt){if(amt>0){await q.coins(amt,uid);if(XPK[kind])await db.run('UPDATE users SET xp=COALESCE(xp,0)+? WHERE id=?',[amt,uid]);await db.run('INSERT INTO earn(user_id,day,kind,amt) VALUES(?,?,?,?)',[uid,dayKey(),kind,amt])}return amt}
// once-per-day bonus: the primary key on once_day makes the claim atomic (no double grant on concurrent requests)
async function onceToday(uid,kind,amt){const r=await db.run('INSERT INTO once_day(user_id,day,kind) VALUES(?,?,?) ON CONFLICT DO NOTHING',[uid,dayKey(),kind]);return r.changes==1?grant(uid,kind,amt):0}
function dailyLogin(u){if(u.guest)return 0;return onceToday(u.id,'login',REWARD.daily)}
app.post('/api/daily',auth,H(async(req,res)=>{const n=await dailyLogin(req.user);res.json({bonus:n,user:pub(await q.byId(req.user.id))})}));
// ===== Daily challenges: 3 per account per day, progress tracked here =====
const CHAL=PDB.CHALLENGES;
function hashStr(s){let h=2166136261;for(const c of s)h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;return h}
const chGet=(uid,d)=>db.all('SELECT * FROM chal WHERE user_id=? AND day=? ORDER BY slot',[uid,d]);
async function chalRows(uid){const d=dayKey();let rows=await chGet(uid,d);if(rows.length<3){const ids=CHAL.map(c=>c.id),pick=[];let h=hashStr(uid+':'+d);
  while(pick.length<3){h=Math.imul(h^(h>>>13),2654435761)>>>0;const id=ids[h%ids.length];if(!pick.includes(id))pick.push(id)}
  for(let k=0;k<3;k++)await db.run('INSERT INTO chal(user_id,day,slot,cid) VALUES(?,?,?,?) ON CONFLICT DO NOTHING',[uid,d,k,pick[k]]);rows=await chGet(uid,d)}return rows}
const chalView=async uid=>(await chalRows(uid)).map(r=>{const c=CHAL.find(c=>c.id==r.cid)||{txt:r.cid,n:1,r:0};return {id:r.cid,txt:c.txt,n:c.n,prog:Math.min(r.prog,c.n),done:!!r.done,reward:c.r}});
// ev: {won, kos, online, flawless, players, mode}
async function chalProgress(uid,ev){const done=[];const d=dayKey();for(const r of await chalRows(uid)){if(r.done)continue;const c=CHAL.find(c=>c.id==r.cid);if(!c)continue;const add=PDB.chalAdd(c,ev);if(!add)continue;
  // atomic progress; only the update that flips done 0->1 pays the reward
  const u=await db.get('UPDATE chal SET prog=MIN_FN,done=CASE WHEN prog+?>=? THEN 1 ELSE 0 END WHERE user_id=? AND day=? AND slot=? AND done=0 RETURNING done'.replace('MIN_FN',db.kind=='pg'?'LEAST(?,prog+?)':'MIN(?,prog+?)'),[c.n,add,add,c.n,uid,d,r.slot]);
  if(u&&u.done){await grant(uid,'chal',c.r);done.push({txt:c.txt,reward:c.r})}}return done}
const msToReset=()=>{const n=Date.now()-8*36e5;return 864e5-(n%864e5)};
app.get('/api/challenges',auth,H(async(req,res)=>res.json({list:await chalView(req.user.id),resetIn:Math.round(msToReset()/1000)})));
// local / vs-CPU play: server issues a ticket at match start and validates the claim (time, KO caps, daily cap)
app.post('/api/local/start',auth,(req,res)=>{const id=crypto.randomBytes(12).toString('hex');LOCAL.tickets.set(id,{uid:req.user.id,at:Date.now()});
 for(const [k,v] of LOCAL.tickets)if(Date.now()-v.at>36e5)LOCAL.tickets.delete(k);res.json({ticket:id})});
app.post('/api/local/end',auth,H(async(req,res)=>{const b=req.body||{},tk=LOCAL.tickets.get(String(b.ticket));
 if(!tk||tk.uid!=req.user.id)return res.status(400).json({error:'bad ticket'});LOCAL.tickets.delete(String(b.ticket));
 const secs=(Date.now()-tk.at)/1000,players=Math.max(0,Math.min(4,b.players|0));
 if(secs<LOCAL.minSec||players<2)return res.json({coins:0,why:'match too short',user:pub(await q.byId(req.user.id))});
 const kos=Math.max(0,Math.min(LOCAL.maxKo,3*(players-1),b.kos|0,Math.floor(secs/5))),won=!!b.won;
 const bd={part:LOCAL.part,ko:LOCAL.ko*kos,win:won?LOCAL.win:0};let tot=Math.min(LOCAL.maxMatch,bd.part+bd.ko+bd.win);
 const left=Math.max(0,LOCAL.dayCap-(await db.get('SELECT COALESCE(SUM(amt),0) s FROM earn WHERE user_id=? AND day=? AND kind=?',[req.user.id,dayKey(),'local'])).s);let capped=tot>left;tot=Math.min(tot,left);await grant(req.user.id,'local',tot);
 await FEAT.recordMatch(db,req.user.id,Number.isInteger(b.skin)?b.skin:null,kos);
 bd.firstWin=won&&tot>0?await onceToday(req.user.id,'firstwin',REWARD.firstWin):0;
 const chal=await chalProgress(req.user.id,{won,kos,online:false,flawless:won&&!!b.flawless,players,mode:String(b.mode||'stock')});
 res.json({chal,coins:tot+bd.firstWin,breakdown:bd,capped,user:pub(await q.byId(req.user.id))})}));
app.post('/api/logout',auth,H(async(req,res)=>{await q.delTok(req.token);res.json({ok:true})}));
app.get('/api/me',auth,(req,res)=>res.json({user:pub(req.user)}));
app.post('/api/settings',auth,H(async(req,res)=>{const s=req.body&&req.body.settings;if(!s||typeof s!='object'||Array.isArray(s))return res.status(400).json({error:'bad settings'});
 const j=JSON.stringify(s);if(j.length>8000)return res.status(400).json({error:'settings too large'});await q.setS(j,req.user.id);res.json({ok:true})}));
app.post('/api/shop/buy',auth,H(async(req,res)=>{const skin=req.body&&req.body.skin;
 if(!Number.isInteger(skin)||skin<0||skin>=NS)return res.status(400).json({error:'unknown skin'});
 const u=await q.byId(req.user.id),un=JSON.parse(u.unlocked);if(un.includes(skin))return res.status(409).json({error:'already unlocked'});
 if(ADM.off('skin:'+skin))return res.status(403).json({error:'item disabled'});const price=ADM.price('skin:'+skin,PDB.PRICES[skin]);if(u.coins<price)return res.status(402).json({error:'not enough coins'});un.push(skin);un.sort((a,b)=>a-b);
 // atomic compare-and-set: fails if coins dropped or unlocks changed since we read them
 const r=await db.run('UPDATE users SET coins=coins-?,unlocked=? WHERE id=? AND coins>=? AND unlocked=?',[price,JSON.stringify(un),u.id,price,u.unlocked]);
 if(r.changes!=1)return res.status(409).json({error:'try again'});await db.run('INSERT INTO purchases(user_id,skin,price,ts) VALUES(?,?,?,?)',[u.id,skin,price,Date.now()]);
 res.json({user:pub(await q.byId(req.user.id))})}));
// cosmetics: same optimistic compare-and-set guard as skins (coins and the cosm JSON must be unchanged since read)
app.post('/api/shop/item',auth,H(async(req,res)=>{const id=req.body&&req.body.item,it=typeof id=='string'&&PDB.COS_BY[id];if(!it)return res.status(400).json({error:'unknown item'});if(it.sup)return res.status(403).json({error:'buy any coin pack to unlock'});if(ADM.off('item:'+id))return res.status(403).json({error:'item disabled'});const ip=ADM.price('item:'+id,it.p);
 const u=await q.byId(req.user.id),c=PDB.cosParse(u.cosm);if(c.own.includes(id))return res.status(409).json({error:'already owned'});if(u.coins<ip)return res.status(402).json({error:'not enough coins'});
 c.own.push(id);c.eq[it.cat]=id;const r=await db.run('UPDATE users SET coins=coins-?,cosm=? WHERE id=? AND coins>=? AND cosm '+(db.kind=='pg'?'IS NOT DISTINCT FROM':'IS')+' ?',[ip,JSON.stringify(c),u.id,ip,u.cosm]);
 if(r.changes!=1)return res.status(409).json({error:'try again'});await db.run('INSERT INTO purchases(user_id,skin,price,ts,item) VALUES(?,?,?,?,?)',[u.id,-1,ip,Date.now(),id]);
 res.json({user:pub(await q.byId(req.user.id))})}));
app.post('/api/shop/equip',auth,H(async(req,res)=>{const b=req.body||{},cat=b.cat,id=b.item;if(!PDB.COS_CATS.includes(cat))return res.status(400).json({error:'unknown category'});
 const u=await q.byId(req.user.id),c=PDB.cosParse(u.cosm);if(id==null)delete c.eq[cat];else{const it=PDB.COS_BY[id];if(!it||it.cat!=cat)return res.status(400).json({error:'unknown item'});if(!c.own.includes(id))return res.status(403).json({error:'not owned'});c.eq[cat]=id}
 await db.run('UPDATE users SET cosm=? WHERE id=?',[JSON.stringify(c),u.id]);res.json({user:pub(await q.byId(req.user.id))})}));
// Real-money coin packs are intentionally NOT implemented. Wire a payment provider here (e.g. Stripe Checkout + webhook that credits coins).
FEAT.routes(app,{db,q,PDB,auth,H,pub});
// ===== Ranked =====
app.get('/api/leaderboard',H(async(req,res)=>{const t=(req.get('authorization')||'').replace(/^Bearer /,''),u=await userOf(t);
 const top=await db.all('SELECT username,rating,games,wins,xp FROM users WHERE guest=0 AND games>0 ORDER BY rating DESC,wins DESC LIMIT 50');
 const pos=u&&!u.guest&&u.games?(await db.get('SELECT COUNT(*)+1 n FROM users WHERE guest=0 AND games>0 AND rating>?',[u.rating])).n:null;
 res.json({top:top.map((r,k)=>Object.assign(r,{pos:k+1,level:PDB.levelOf(r.xp|0).level,tier:PDB.tierOf(r.rating)})),me:u&&!u.guest?{username:u.username,rating:u.rating,games:u.games,tier:PDB.tierOf(u.rating),pos}:null})}));
// Elo across placements: every pair of ranked (non-guest) humans is a game; K scaled by field size.
// CPU opponents also count (so solo-vs-bots online play ranks you), but against a fixed bot rating, half K, and EASY gains are damped + capped to stop farming.
const BOT_R=[800,1000,1200],BOT_K=16,EASY_GAIN_MULT=.5,EASY_GAIN_CAP=5;
async function rateMatch(order,diff){const P=order.filter(x=>x.uid&&!x.guest),B=order.filter(x=>x.bot);const out={};if(!P.length||(P.length<2&&!B.length))return out;
 const opp=P.length-1+B.length,K=32/opp,KB=BOT_K/opp,d0=Math.max(0,Math.min(2,diff|0)),br=BOT_R[d0];
 const R=[];for(const x of P)R.push((await q.byId(x.uid)).rating);
 for(let i=0;i<P.length;i++){const a=P[i],sc=(o)=>a.place<o.place?1:a.place>o.place?0:.5;let d=0;
  P.forEach((b,j)=>{if(i==j)return;const e=1/(1+Math.pow(10,(R[j]-R[i])/400));d+=K*(sc(b)-e)});
  let db_=0;B.forEach(b=>{const e=1/(1+Math.pow(10,(br-R[i])/400));db_+=KB*(sc(b)-e)});
  if(d0==0&&db_>0)db_=Math.min(EASY_GAIN_CAP,db_*EASY_GAIN_MULT);d+=db_;
  const nr=Math.max(0,Math.round(R[i]+d));await db.run('UPDATE users SET rating=?,games=games+1,wins=wins+? WHERE id=?',[nr,a.won?1:0,a.uid]);out[a.uid]={old:R[i],rating:nr,delta:nr-R[i],tier:PDB.tierOf(nr)}}return out}
// ===== Friends + invites =====
const fq={get:(a,b,c,d)=>db.get('SELECT * FROM friends WHERE (a=? AND b=?) OR (a=? AND b=?)',[a,b,c,d]),ins:(a,b)=>db.run('INSERT INTO friends(a,b,status,created) VALUES(?,?,0,?) ON CONFLICT DO NOTHING',[a,b,Date.now()]),
 acc:(a,b)=>db.run('UPDATE friends SET status=1 WHERE a=? AND b=?',[a,b]),del:(a,b)=>db.run('DELETE FROM friends WHERE (a=? AND b=?) OR (a=? AND b=?)',[a,b,b,a]),
 n:me=>db.get('SELECT COUNT(*) n FROM friends WHERE a=? OR b=?',[me,me]),
 list:me=>db.all('SELECT f.a,f.b,f.status,ua.username an,ub.username bn FROM friends f JOIN users ua ON ua.id=f.a JOIN users ub ON ub.id=f.b WHERE f.a=? OR f.b=?',[me,me])};
const SEEN=new Map(),WSU=new Map(),INV=new Map();const seen=u=>{if(u)SEEN.set(u.id,Date.now())};
const isOn=id=>(WSU.get(id)||0)>0||Date.now()-(SEEN.get(id)||0)<25000;
const areFriends=async(x,y)=>{const r=await fq.get(x,y,y,x);return !!(r&&r.status==1)};
function privRoomOf(uid){for(const r of rooms.values())if(!r.quick&&r.state=='lobby'&&r.slots.some(s=>s&&s.type=='human'&&s.uid==uid)&&r.slots.some(s=>!s))return r.code;return null}
const noGuest=(req,res,next)=>{if(req.user.guest)return res.status(403).json({error:'GUESTS CANNOT ADD FRIENDS'});seen(req.user);next()};
const target=async(req,res)=>{const n=String((req.body||{}).name||'').trim();const t=n&&await q.byName(n);if(!t||t.guest){res.status(404).json({error:'NO SUCH PLAYER'});return null}if(t.id==req.user.id){res.status(400).json({error:"THAT'S YOU!"});return null}return t};
app.get('/api/friends',auth,H(async(req,res)=>{const me=req.user.id;seen(req.user);if(req.user.guest)return res.json({guest:true,friends:[],incoming:[],outgoing:[],invites:[]});
 const out={friends:[],incoming:[],outgoing:[]};for(const r of await fq.list(me)){const other=r.a==me?r.b:r.a,name=r.a==me?r.bn:r.an;
  if(r.status==1)out.friends.push({name,online:isOn(other),room:privRoomOf(other)});else if(r.b==me)out.incoming.push(name);else out.outgoing.push(name)}
 out.friends.sort((x,y)=>(y.online-x.online)||x.name.localeCompare(y.name));
 const now=Date.now();out.invites=(INV.get(me)||[]).filter(i=>now-i.at<300000&&rooms.has(i.code)&&rooms.get(i.code).state=='lobby').map(i=>({from:i.from,code:i.code,at:i.at}));res.json(out)}));
app.post('/api/friends/add',auth,noGuest,H(async(req,res)=>{const t=await target(req,res);if(!t)return;const me=req.user.id,r=await fq.get(me,t.id,t.id,me);
 if(r&&r.status==1)return res.json({ok:true,msg:'ALREADY FRIENDS'});if(r&&r.a==t.id){await fq.acc(t.id,me);return res.json({ok:true,msg:'NOW FRIENDS WITH '+t.username})}
 if(r)return res.json({ok:true,msg:'REQUEST ALREADY SENT'});if((await fq.n(me)).n>=100)return res.status(400).json({error:'FRIEND LIST FULL'});
 await fq.ins(me,t.id);res.json({ok:true,msg:'REQUEST SENT TO '+t.username})}));
app.post('/api/friends/accept',auth,noGuest,H(async(req,res)=>{const t=await target(req,res);if(!t)return;const r=await fq.get(t.id,req.user.id,-1,-1);if(!r)return res.status(404).json({error:'NO REQUEST'});await fq.acc(t.id,req.user.id);res.json({ok:true,msg:'NOW FRIENDS WITH '+t.username})}));
app.post('/api/friends/remove',auth,noGuest,H(async(req,res)=>{const t=await target(req,res);if(!t)return;await fq.del(req.user.id,t.id);res.json({ok:true,msg:'REMOVED '+t.username})}));
app.post('/api/friends/invite',auth,noGuest,H(async(req,res)=>{const t=await target(req,res);if(!t)return;const me=req.user.id;if(!await areFriends(me,t.id))return res.status(403).json({error:'NOT FRIENDS'});
 const code=String((req.body||{}).code||'').toUpperCase(),r=rooms.get(code);if(!r||r.quick||r.state!='lobby'||!r.slots.some(s=>s&&s.uid==me))return res.status(400).json({error:'JOIN A PRIVATE ROOM FIRST'});
 const L=(INV.get(t.id)||[]).filter(i=>!(i.from==req.user.username&&i.code==code)&&Date.now()-i.at<300000);L.push({from:req.user.username,code,at:Date.now()});INV.set(t.id,L.slice(-10));res.json({ok:true,msg:'INVITED '+t.username})}));
app.get('/healthz',(req,res)=>res.json({ok:true,rooms:rooms.size}));
require('./admin.js')(app,{db,PDB,get rooms(){return rooms},get wss(){return wss},send:(ws,o)=>{if(ws&&ws.readyState==1)ws.send(JSON.stringify(o))},ADM});
app.use(express.static(path.join(__dirname,'..','public')));

// ===== Rooms =====
const rooms=new Map();const CODECH='ABCDEFGHJKLMNPQRSTUVWXYZ';
const mkCode=()=>{let c;do{c=Array.from({length:4},()=>CODECH[Math.floor(Math.random()*CODECH.length)]).join('')}while(rooms.has(c));return c};
const send=(ws,o)=>{if(ws&&ws.readyState==1)ws.send(JSON.stringify(o))};
function newRoom(quick,kind){const r={code:mkCode(),quick,q2:kind=='q2',tour:kind=='tour',tsize:4,T:null,ent:null,slots:kind=='tour'?Array(8).fill(null):[null,null,null,null],host:null,arena:Math.floor(Math.random()*PDB.ARENAS_N),mode:kind=='q2'?'teams':'stock',items:ONLINE_RULES.items,ff:false,state:'lobby',created:Date.now(),countAt:0,fillAt:quick?Date.now()+QUICK_FILL_MS:0,core:null,loop:null};rooms.set(r.code,r);return r}
const humans=r=>r.slots.filter(s=>s&&s.type=='human'&&s.ws);
// everyone who should get match traffic (tournament: all entrants watch every match)
const viewers=r=>r.tour&&r.ent?r.ent.filter(s=>s&&s.type=='human'&&s.ws):humans(r);
const teamOf=r=>r.slots.map((s,i)=>s&&s.team!=null?s.team:i%2);
function pickTeam(r){const c=[0,0];r.slots.forEach(s=>{if(s&&s.team!=null)c[s.team]++});return c[0]<=c[1]?0:1}
function lobbyMsg(r,ws){const you=r.slots.findIndex(s=>s&&s.ws===ws),now=Date.now();
 return {t:'lobby',code:r.code,quick:r.quick,q2:r.q2,tour:r.tour,tsize:r.tsize,T:r.T,ent:r.ent?r.ent.map(s=>({name:s.name,skin:s.skin,type:s.type})):null,tstate:r.state,host:r.host===ws,you,arena:r.arena,mode:r.mode||'stock',items:r.items|0,ff:!!r.ff,
  slots:r.slots.map(s=>{if(!s)return null;const rt=s.uid&&s.ws&&s.ws.user&&!s.ws.user.guest?s.ws.user.rating:null;return {type:s.type,name:s.name,skin:s.skin,cos:s.cos||{},team:s.team,host:s.ws&&s.ws===r.host,tier:rt!=null?PDB.tierOf(rt):null,rating:rt,lv:s.uid&&s.ws&&s.ws.user&&!s.ws.user.guest?PDB.levelOf(s.ws.user.xp|0).level:null}}),ranked:r.quick,
  count:r.countAt?Math.max(0,Math.ceil((r.countAt-now)/1000)):-1,fill:r.quick&&r.fillAt&&!r.countAt?Math.max(0,Math.ceil((r.fillAt-now)/1000)):-1}}
const pushLobby=r=>{for(const s of viewers(r))send(s.ws,lobbyMsg(r,s.ws))};
function firstOwned(u,pref){const un=JSON.parse(u.unlocked);return un.includes(pref)?pref:un[0]}
async function refreshUser(ws){if(!ws.user||!ws.user.id)return;try{const u=await q.byId(ws.user.id);if(u)ws.user=u}catch(e){}}
function join(r,ws){const i=r.slots.findIndex(s=>!s);if(i<0||r.state!='lobby')return false;const u=ws.user;
 r.slots[i]={type:'human',ws,uid:u.id,name:u.username,skin:firstOwned(u,ws.pref!=null?ws.pref:[0,1,2,3][i]),cos:eqOf(u),inp:{b:0,e:0},kos:0};r.slots[i].team=pickTeam(r);if(!r.host)r.host=ws;ws.room=r;pushLobby(r);return true}
function leave(ws){const r=ws.room;if(!r)return;ws.room=null;if(r.ent){const e=r.ent.find(s=>s&&s.ws===ws);if(e&&!(r.state=='fight'&&r.slots.includes(e))){e.type='cpu';e.ws=null;e.name+=' (CPU)'}}const i=r.slots.findIndex(s=>s&&s.ws===ws);
 if(i>=0){if(r.state=='fight'){const s=r.slots[i];s.type='cpu';s.ws=null;s.name+=' (CPU)';r.core.setCPU(i,true)}else r.slots[i]=null}
 if(r.host===ws){const h=viewers(r).find(s=>s.ws!==ws);r.host=h?h.ws:null}
 if(!viewers(r).filter(s=>s.ws!==ws).length)return destroy(r);if(r.state=='lobby'){if(humans(r).length<2&&r.quick)r.countAt=0;pushLobby(r)}}
function destroy(r){if(r.loop)clearTimeout(r.loop);if(r.tq)clearTimeout(r.tq);r.loop=null;rooms.delete(r.code)}
const CPU_NAMES=['BOLT','ZIGGY','MOCHI','RUSTY','PIXIE','TANK'];
function addCPU(r){const i=r.slots.findIndex(s=>!s);if(i<0)return;const used=r.slots.filter(Boolean).map(s=>s.skin);let sk;do{sk=Math.floor(Math.random()*NS)}while(used.includes(sk)&&used.length<NS);
 r.slots[i]={type:'cpu',name:r.tour?CPU_NAMES[i%CPU_NAMES.length]:'CPU',skin:sk,kos:0};r.slots[i].team=pickTeam(r)}
// arena theme: the host's equipped theme, if it reskins the arena being played
function roomTheme(r){const h=r.slots.find(s=>s&&s.ws&&s.ws===r.host),id=h&&h.cos&&h.cos.arena,it=id&&PDB.COS_BY[id];return it&&it.base==r.arena?id:null}
function startMatch(r){if(ADM.maint)return;r.state='fight';r.countAt=0;r.fillAt=0;if(r.quick)r.arena=Math.floor(Math.random()*PDB.ARENAS_N);
 const ev=[];r.ev=ev;r.slots.forEach(s=>{if(s)s.kos=0});
 r.core=PDB.createCore({sfx:(k,a)=>ev.push(a!=null?['s',k,a]:['s',k]),shake:v=>ev.push(['k',v]),burst:(x,y,c,n,sp)=>{if(ev.length<200)ev.push(['b',Math.round(x),Math.round(y),c,n,sp])},
  part:(x,y)=>{if(ev.length<200)ev.push(['p',Math.round(x),Math.round(y)])},ko:f=>ev.push(['o',f.i,Math.round(f.x),Math.round(f.y),f.lastHit!=null&&f.lastHit!=f.i?f.lastHit:-1]),
  kill:(k,v)=>{if(k!=null&&k!==v&&r.slots[k])r.slots[k].kos++}});
 const slots=r.slots.map(s=>s?{type:s.type,skin:s.skin,name:s.name}:{type:'none'});if(r.mode=='pit'&&!ADM.pit.on)r.mode='stock';r.core.startFight(slots,r.arena,Object.assign({},ONLINE_RULES,{pitRate:ADM.pit.rate,pitCap:ADM.pit.cap,mode:r.mode||'stock',items:r.items|0,ff:!!r.ff,teamOf:teamOf(r)},r.q2?{diff:0}:{}));
 viewers(r).forEach(s=>send(s.ws,{t:'start',you:r.slots.indexOf(s),spec:r.slots.indexOf(s)<0,tour:r.tour?{T:r.T,cur:r.cur}:null,pitCap:ADM.pit.cap,teams:teamOf(r),slots:r.slots.map(s=>s?{type:s.type,skin:s.skin,name:s.name,cos:s.cos||{},team:s.team}:null),th:roomTheme(r),arena:r.arena,stocks:ONLINE_RULES.stocks,mode:r.core.opts.mode,time:r.core.opts.time,items:r.items|0,ff:!!r.ff}));
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
  if(c.readyT)o.readyT=c.readyT;if(c.endT)o.endT=c.endT;if(c.timer!==r.lastTm||c.tick%60==0){o.timer=c.timer;r.lastTm=c.timer}if(r.ev.length)o.ev=r.ev.splice(0);const m=JSON.stringify(o);for(const s of viewers(r))if(s.ws.readyState==1)s.ws.send(m)}
 if(res=='win')endMatch(r)}
function endMatch(r){clearTimeout(r.loop);r.loop=null;r.ending=true;finishMatch(r).catch(e=>console.error('endMatch',e)).finally(()=>{r.ending=false;afterMatch(r)})}
// rewards/ratings are written to the DB (async); slots that disconnect meanwhile become CPUs as usual since state is still 'fight'
async function finishMatch(r){const c=r.core,w=c.winner;
 const all=c.rank(),rank=[];
 for(const f of all){const s=r.slots[f.i];let coins=0,bd=null;if(s&&s.type=='human'&&s.uid){const place=all.indexOf(f),won=w&&w.i==f.i;bd={part:REWARD.part,ko:REWARD.ko*Math.min(s.kos,9),place:w?REWARD.place[place]||0:0};coins=await grant(s.uid,'online',bd.part+bd.ko+bd.place);await FEAT.recordMatch(db,s.uid,f.skin,Math.min(s.kos,9));if(won)coins+=(bd.firstWin=await onceToday(s.uid,'firstwin',REWARD.firstWin))}
  if(s&&s.type=='human'&&s.uid&&s.ws){s.chal=await chalProgress(s.uid,{won:!!(w&&w.i==f.i),kos:s.kos,online:true,flawless:!!(w&&w.i==f.i)&&f.stocks>=ONLINE_RULES.stocks,players:all.length,mode:r.mode||'stock'})}if(r.mode=='pit'&&!r.tour&&w&&w.i==f.i&&s&&s.type=='human'&&s.uid&&bd){const J=c.jackpot|0,hum=r.slots.filter(x=>x&&x.type=='human'&&x.uid).length;
   // anti-farm: jackpot only pays in full when another human was in the match; vs bots/solo it pays 25%
   const pay=hum>=2?J:Math.floor(J/4);if(pay>0){bd.jackpot=await grant(s.uid,'pit',pay);coins+=bd.jackpot}}
  rank.push({i:f.i,name:s?s.name:'?',skin:f.skin,kos:s?s.kos:0,coins,bd,pit:r.mode=='pit'?f.pts|0:undefined})}
 if(!r.tour){const rt=await rateMatch(all.map((f,k)=>{const s=r.slots[f.i];return {uid:s&&s.type=='human'&&s.ws?s.uid:null,guest:s&&s.ws&&s.ws.user.guest,bot:!!(s&&s.type=='cpu'),place:w?k:0,won:!!(w&&w.i==f.i)}}),r.core&&r.core.opts?r.core.opts.diff:0);rank.forEach(x=>{const s=r.slots[x.i];if(s&&s.uid&&rt[s.uid])x.rank=rt[s.uid]})}
 for(const s of viewers(r)){const u=await q.byId(s.uid);if(!u||!s.ws)continue;s.ws.user=u;send(s.ws,{t:'end',tour:!!r.tour,chal:s.chal||[],winner:w?w.i:null,rank,coins:u.coins});send(s.ws,{t:'user',user:pub(u)})}}
function afterMatch(r){if(r.tour&&r.ent)return tourAfter(r);r.state='lobby';r.core=null;r.slots=r.slots.map(s=>!s||s.type!='human'||!s.ws?(r.quick||!s?null:s.type=='cpu'&&!s.uid?s:null):Object.assign(s,{kos:0,inp:{b:0,e:0},chal:null}));
 if(r.quick)r.fillAt=Date.now()+QUICK_FILL_MS;if(!humans(r).length)return destroy(r);pushLobby(r)}
// ===== Online tournaments: host starts, CPUs fill to 4/8, 1v1 matches run one after another, everyone watches =====
function tourStart(r){const n=r.slots.filter(Boolean).length,size=n>4?8:Math.max(4,r.tsize|0);r.tsize=size;while(r.slots.filter(Boolean).length<size)addCPU(r);
 r.ent=r.slots.filter(Boolean).slice(0,size);r.ent.forEach(s=>{s.kos=0;s.inp={b:0,e:0}});r.T=PDB.bracketNew(size);r.state='tour';tourNext(r)}
function tourNext(r){r.tq=null;if(!viewers(r).length)return destroy(r);const n=PDB.bracketNext(r.T);
 if(!n){tourChamp(r,r.ent[PDB.bracketChamp(r.T)]).catch(e=>console.error('tour',e));return}
 r.cur=n;const A=r.ent[n.a],B=r.ent[n.b];
 if(A.type!='human'&&B.type!='human'){PDB.bracketReport(r.T,n.r,n.m,Math.random()<.5?n.a:n.b);pushLobby(r);r.tq=setTimeout(()=>tourNext(r),Math.min(1500,TOUR_GAP_MS));return}
 r.slots=[A,B,null,null];A.team=0;B.team=1;r.mode='stock';if(!r.fixedArena)r.arena=Math.floor(Math.random()*PDB.ARENAS_N);startMatch(r)}
function tourAfter(r){const c=r.core,n=r.cur;let wi;if(c&&c.winner)wi=c.winner.i==0?n.a:n.b;else{const rk=c?c.rank():[];wi=rk.length&&rk[0].i==1?n.b:n.a}
 r.core=null;r.slots.forEach(s=>{if(s){s.inp={b:0,e:0};s.chal=null}});PDB.bracketReport(r.T,n.r,n.m,wi);r.state='tour';pushLobby(r);
 r.tq=setTimeout(()=>tourNext(r),TOUR_GAP_MS)}
async function tourChamp(r,c){const prize=TOUR_PRIZE[r.tsize]||100;let coins=0;
 if(c.type=='human'&&c.uid){coins=await grant(c.uid,'tour',prize);await db.run('UPDATE users SET trophies=COALESCE(trophies,0)+1 WHERE id=?',[c.uid])}
 const ent=r.ent.map(e=>({name:e.name,skin:e.skin,type:e.type})),vs=viewers(r);
 for(const s of vs){const u=await q.byId(s.uid);if(!u||!s.ws)continue;s.ws.user=u;send(s.ws,{t:'tchamp',name:c.name,skin:c.skin,you:s===c,coins:s===c?coins:0,size:r.tsize,T:r.T,ent});send(s.ws,{t:'user',user:pub(u)})}
 // back to the tournament lobby: connected humans keep seats, CPUs are cleared
 const hs=viewers(r);r.slots=Array(8).fill(null);hs.forEach((s,k)=>{r.slots[k]=s;s.team=null;s.kos=0});r.slots.forEach(s=>{if(s)s.team=pickTeam(r)});
 r.ent=null;r.T=null;r.cur=null;r.state='lobby';if(!hs.length)return destroy(r);if(!hs.some(s=>s.ws===r.host))r.host=hs[0].ws;pushLobby(r)}
setInterval(()=>{const now=Date.now();for(const r of rooms.values()){if(r.state!='lobby')continue;const n=humans(r).length;
 if(r.quick){if(n>=4){startMatch(r);continue}if(n>=2&&!r.countAt)r.countAt=now+COUNTDOWN_MS;
  if(r.q2&&r.countAt&&now>=r.countAt){while(r.slots.some(s=>!s))addCPU(r);startMatch(r);continue}
  if(n==1&&r.fillAt&&now>=r.fillAt){while(r.slots.some(s=>!s))addCPU(r);startMatch(r);continue}
  if(r.countAt&&now>=r.countAt){startMatch(r);continue}}
 pushLobby(r)}},500);

const server=http.createServer(app);const wss=new WebSocketServer({server,path:'/ws',maxPayload:4096,perMessageDeflate:false});
wss.on('connection',(ws,req)=>{const tok=new URL(req.url,'http://x').searchParams.get('token');ws.room=null;let closed=false;
 // auth is async: messages that arrive before it resolves wait on the same promise and run in order
 const authed=ready.then(()=>userOf(tok)).catch(e=>{console.error('ws auth',e);return null}).then(u=>{
  if(!u){send(ws,{t:'err',m:'LOG IN FIRST',fatal:true});ws.close();return null}if(closed)return null;ws.user=u;WSU.set(u.id,(WSU.get(u.id)||0)+1);
  ws.on('close',()=>{WSU.set(u.id,Math.max(0,(WSU.get(u.id)||1)-1))});return u});
 ws.on('close',()=>{closed=true});
 ws.on('message',async d=>{if(!await authed||closed)return;let m;try{m=JSON.parse(d)}catch(e){return}if(!m||typeof m.t!='string')return;if(['quick','create','join'].includes(m.t))await refreshUser(ws);if(ADM.maint&&['quick','quick2','create','join','tcreate'].includes(m.t)){send(ws,{t:'err',m:'MAINTENANCE - TRY LATER',fatal:true});return}const r=ws.room;
  switch(m.t){
   case 'quick':{if(r)leave(ws);let room=[...rooms.values()].find(x=>x.quick&&!x.q2&&x.state=='lobby'&&humans(x).length<4&&x.slots.some(s=>!s));if(!room)room=newRoom(true);join(room,ws);break}
   case 'create':{if(r)leave(ws);join(newRoom(false),ws);break}
   case 'join':{const room=rooms.get(String(m.code||'').toUpperCase());if(!room||room.quick){send(ws,{t:'err',m:'ROOM NOT FOUND',fatal:true});break}
    if(room.state!='lobby'){send(ws,{t:'err',m:'MATCH IN PROGRESS',fatal:true});break}if(r&&r!==room)leave(ws);if(!join(room,ws))send(ws,{t:'err',m:'ROOM FULL',fatal:true});break}
   case 'quick2':{if(r)leave(ws);let room=[...rooms.values()].find(x=>x.q2&&x.state=='lobby'&&x.slots.some(s=>!s));if(!room)room=newRoom(true,'q2');join(room,ws);break}
   case 'tcreate':{if(r)leave(ws);join(newRoom(false,'tour'),ws);break}
   case 'team':{if(!r||r.quick||r.tour||r.state!='lobby')break;let i=r.slots.findIndex(s=>s&&s.ws===ws);if(Number.isInteger(m.slot)&&r.host===ws&&r.slots[m.slot]&&r.slots[m.slot].type=='cpu')i=m.slot;const s=r.slots[i];if(!s)break;
    const t=m.team===0||m.team===1?m.team:1-(s.team|0);if(r.slots.filter(x=>x&&x!==s&&x.team===t).length>=2){send(ws,{t:'err',m:'TEAM FULL'});break}s.team=t;pushLobby(r);break}
   case 'leave':leave(ws);break;
   case 'cos':{if(!r||r.state!='lobby')break;const s=r.slots.find(s=>s&&s.ws===ws);if(!s)break;let u;try{u=await q.byId(ws.user.id)}catch(e){break}if(!u||ws.room!==r)break;ws.user=u;s.cos=eqOf(u);pushLobby(r);break}
   case 'skin':{if(!r||r.state!='lobby')break;const s=r.slots.find(s=>s&&s.ws===ws);const k=m.skin;if(!s||!Number.isInteger(k))break;
    let u;try{u=await q.byId(ws.user.id)}catch(e){break}if(!u)break;ws.user=u;const un=JSON.parse(u.unlocked);if(!un.includes(k)){send(ws,{t:'err',m:'SKIN LOCKED'});break}if(ws.room!==r||r.state!='lobby')break;s.skin=k;ws.pref=k;pushLobby(r);break}
   case 'arena':if(r&&!r.quick&&r.host===ws&&r.state=='lobby'&&Number.isInteger(m.arena)&&m.arena>=0&&m.arena<PDB.ARENAS_N){r.arena=m.arena;r.fixedArena=true;pushLobby(r)}break;
   case 'rules':if(r&&!r.quick&&r.host===ws&&r.state=='lobby'){if(PDB.MODES.some(x=>x.id==m.mode)&&!(m.mode=='pit'&&!ADM.pit.on))r.mode=m.mode;if(Number.isInteger(m.items)&&m.items>=0&&m.items<4)r.items=m.items;if(r.tour&&(m.tsize===4||m.tsize===8))r.tsize=m.tsize;if(m.ff!=null)r.ff=!!m.ff;pushLobby(r)}break;
   case 'addcpu':if(r&&!r.quick&&r.host===ws&&r.state=='lobby'){addCPU(r);pushLobby(r)}break;
   case 'delcpu':if(r&&!r.quick&&r.host===ws&&r.state=='lobby'){for(let i=r.slots.length-1;i>=0;i--)if(r.slots[i]&&r.slots[i].type=='cpu'){r.slots[i]=null;break}pushLobby(r)}break;
   case 'start':if(r&&!r.quick&&r.host===ws&&r.state=='lobby'){if(r.tour)tourStart(r);else if(r.slots.filter(Boolean).length<2)send(ws,{t:'err',m:'NEED 2+ FIGHTERS'});else startMatch(r)}break;
   case 'in':{if(!r||r.state!='fight')break;const s=r.slots.find(s=>s&&s.ws===ws);if(s){s.inp.b=(m.b|0)&127;s.inp.e|=(m.e|0)&31}break}
  }});
 ws.on('close',()=>leave(ws));ws.on('error',()=>{})});
if(require.main===module)server.listen(PORT,()=>console.log('Pixel Dudes Brawl server on http://localhost:'+PORT));
module.exports={server,app,rooms,db,ready};
