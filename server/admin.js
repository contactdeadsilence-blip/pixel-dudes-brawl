// Admin portal API: every /api/admin/* route requires the ADMIN_KEY (header x-admin-key). Disabled entirely if ADMIN_KEY is unset.
'use strict';
const crypto=require('crypto'),path=require('path'),express=require('express');
module.exports=function mount(app,ctx){const {db,PDB,send}=ctx;const W=()=>ctx.wss;
 const ADM=ctx.ADM;ADM.maint=false;ADM.banner='';ADM.ov={};
 const KEY=process.env.ADMIN_KEY||'';
 const safeEq=(a,b)=>{a=Buffer.from(String(a));b=Buffer.from(String(b));return a.length==b.length&&crypto.timingSafeEqual(a,b)};
 const guard=(req,res,next)=>{if(!KEY||KEY.length<16)return res.status(503).json({error:'admin disabled (ADMIN_KEY not set)'});
  if(!safeEq(req.get('x-admin-key')||'',KEY))return res.status(401).json({error:'bad admin key'});next()};
 const H=fn=>(req,res,next)=>Promise.resolve(fn(req,res,next)).catch(e=>{console.error('admin',req.path,e);if(!res.headersSent)res.status(500).json({error:'server error'})});
 // load persisted overrides/flags (admin_kv: k TEXT PRIMARY KEY, v TEXT)
 ADM.load=async()=>{for(const r of await db.all('SELECT k,v FROM admin_kv',[])){try{const v=JSON.parse(r.v);if(r.k=='maint')ADM.maint=!!v;else if(r.k=='banner')ADM.banner=String(v||'');else if(r.k.startsWith('ov:'))ADM.ov[r.k.slice(3)]=v}catch(e){}}};
 const kvSet=(k,v)=>db.run('INSERT INTO admin_kv(k,v) VALUES(?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v',[k,JSON.stringify(v)]);
 // public helpers used by the shop: key 'skin:N' or 'item:ID'
 ADM.price=(key,def)=>{const o=ADM.ov[key];return o&&Number.isInteger(o.p)?o.p:def};
 ADM.off=key=>{const o=ADM.ov[key];return !!(o&&o.off)};
 const broadcastAll=o=>{for(const ws of W().clients)send(ws,o)};
 app.get('/api/shop/config',(req,res)=>res.json({ov:ADM.ov,banner:ADM.banner,maint:ADM.maint}));
 app.get('/api/props',H(async(req,res)=>res.json({props:await db.all('SELECT id,name,w,h FROM props WHERE enabled=1 ORDER BY id',[])})));
 app.get('/api/props/:id.png',H(async(req,res)=>{const r=await db.get('SELECT data FROM props WHERE id=?',[+req.params.id|0]);if(!r)return res.status(404).end();
  res.set({'Content-Type':'image/png','Cache-Control':'public, max-age=300'}).send(Buffer.from(r.data,'base64'))}));
 app.get('/admin',(req,res)=>res.sendFile(path.join(__dirname,'admin.html')));
 const A=express.Router();A.use(guard);
 A.get('/stats',H(async(req,res)=>{const players=[];for(const ws of W().clients)if(ws.user)players.push({id:ws.user.id,name:ws.user.username,room:ws.room?ws.room.code:null});
  const u=await db.get('SELECT COUNT(*) AS n FROM users',[]);
  res.json({online:players.length,players,rooms:[...ctx.rooms.values()].map(r=>({code:r.code,state:r.state,quick:!!r.quick,tour:!!r.tour,humans:r.slots.filter(s=>s&&s.type=='human').length})),users:+u.n,maint:ADM.maint,banner:ADM.banner})}));
 A.post('/broadcast',H(async(req,res)=>{const m=String((req.body||{}).msg||'').slice(0,60).toUpperCase();ADM.banner=m;await kvSet('banner',m);if(m)broadcastAll({t:'notice',m});res.json({ok:true,banner:m})}));
 A.post('/maintenance',H(async(req,res)=>{ADM.maint=!!(req.body||{}).on;await kvSet('maint',ADM.maint);if(ADM.maint)broadcastAll({t:'notice',m:'MAINTENANCE: NO NEW MATCHES'});res.json({ok:true,maint:ADM.maint})}));
 A.post('/kick',H(async(req,res)=>{const id=+(req.body||{}).id;let n=0;if(!Number.isInteger(id))return res.status(400).json({error:'bad id'});
  for(const ws of W().clients)if(ws.user&&ws.user.id===id){send(ws,{t:'err',m:'KICKED BY ADMIN',fatal:true});ws.close();n++}res.json({ok:true,kicked:n})}));
 A.get('/items',(req,res)=>{const list=PDB.PRICES.map((p,i)=>({key:'skin:'+i,name:'SKIN '+i,base:p})).concat(PDB.COSMETICS.map(c=>({key:'item:'+c.id,name:c.cat+': '+(c.name||c.id),base:c.p})));
  res.json({items:list.map(x=>Object.assign(x,{price:ADM.price(x.key,x.base),off:ADM.off(x.key)}))})});
 A.post('/item',H(async(req,res)=>{const b=req.body||{},key=String(b.key||'');const m=/^skin:(\d+)$/.exec(key),c=/^item:(.+)$/.exec(key);
  if(!(m&&+m[1]<PDB.PRICES.length)&&!(c&&PDB.COS_BY[c[1]]))return res.status(400).json({error:'unknown item'});
  const cur=ADM.ov[key]||{},o={p:cur.p,off:!!cur.off};
  if(b.price!==undefined){if(b.price===null)delete o.p;else{if(!Number.isInteger(b.price)||b.price<0||b.price>100000)return res.status(400).json({error:'price must be an integer 0-100000'});o.p=b.price}}
  if(b.off!==undefined)o.off=!!b.off;ADM.ov[key]=o;await kvSet('ov:'+key,o);res.json({ok:true,key,o})}));
 // PNG prop upload: JSON {name, png:base64}. Stored in DB (not disk). Must be a PNG, max 128x128 px, max 64 KB.
 A.post('/prop',express.json({limit:'120kb'}),H(async(req,res)=>{const b=req.body||{},name=String(b.name||'').replace(/[^\w -]/g,'').slice(0,24);let buf;
  try{buf=Buffer.from(String(b.png||'').replace(/^data:image\/png;base64,/,''),'base64')}catch(e){}
  if(!name)return res.status(400).json({error:'name required'});
  if(!buf||buf.length<24||buf.length>65536||buf.readUInt32BE(0)!==0x89504e47||buf.toString('ascii',12,16)!='IHDR')return res.status(400).json({error:'must be a PNG under 64 KB'});
  const w=buf.readUInt32BE(16),h=buf.readUInt32BE(20);if(w<1||h<1||w>128||h>128)return res.status(400).json({error:'PNG must be at most 128x128 px (got '+w+'x'+h+')'});
  await db.run('INSERT INTO props(name,w,h,data,enabled,created) VALUES(?,?,?,?,1,?)',[name,w,h,buf.toString('base64'),Date.now()]);
  res.json({ok:true,props:await db.all('SELECT id,name,w,h,enabled FROM props ORDER BY id',[])})}));
 A.get('/props',H(async(req,res)=>res.json({props:await db.all('SELECT id,name,w,h,enabled FROM props ORDER BY id',[])})));
 A.post('/prop/toggle',H(async(req,res)=>{const b=req.body||{};await db.run('UPDATE props SET enabled=? WHERE id=?',[b.on?1:0,+b.id|0]);res.json({ok:true})}));
 A.post('/prop/delete',H(async(req,res)=>{await db.run('DELETE FROM props WHERE id=?',[+(req.body||{}).id|0]);res.json({ok:true})}));
 app.use('/api/admin',A);
};
