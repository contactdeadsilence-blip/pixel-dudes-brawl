// Payments (Stripe Checkout coin packs), XP/levels helpers, public profiles.
'use strict';
const express=require('express');
const DEF_PACKS=[{id:'p500',coins:500,cents:99},{id:'p1200',coins:1200,cents:199},{id:'p3000',coins:3000,cents:499},{id:'p7000',coins:7000,cents:999}];
function packs(){try{const p=JSON.parse(process.env.PDB_PACKS||'null');if(Array.isArray(p)&&p.length)return p}catch(e){}return DEF_PACKS}
let _stripe;function stripe(){const k=process.env.STRIPE_SECRET_KEY;if(!k)return null;if(!_stripe){const S=require('stripe');const o={};
 if(process.env.STRIPE_API_HOST){const u=new URL(process.env.STRIPE_API_HOST);o.host=u.hostname;o.port=u.port;o.protocol=u.protocol.replace(':','')}_stripe=S(k,o)}return _stripe}
const SUPPORTER='nc_supporter';
const BAD=/\b(fuck\w*|shit\w*|bitch\w*|cunt\w*|nigg\w*|fag\w*|retard\w*|whore\w*|slut\w*|dick|cock|pussy|rape\w*|kys)\b/gi;
function cleanBio(s){return String(s||'').replace(/[\u0000-\u001f<>]/g,'').replace(/\s+/g,' ').replace(BAD,m=>'*'.repeat(m.length)).trim().slice(0,120)}
// fulfil once: the PRIMARY KEY on pay.session_id makes the grant idempotent across webhook retries
async function fulfil(ctx,sess){const {db,PDB}=ctx;if(!sess||sess.payment_status!=='paid')return false;const md=sess.metadata||{},uid=+md.uid,coins=+md.coins;if(!uid||!coins)return false;
 const r=await db.run('INSERT INTO pay(session_id,user_id,pack,coins,cents,ts) VALUES(?,?,?,?,?,?) ON CONFLICT DO NOTHING',[sess.id,uid,String(md.pack||''),coins,sess.amount_total|0,Date.now()]);if(r.changes!=1)return false;
 await db.run('UPDATE users SET coins=coins+? WHERE id=?',[coins,uid]);
 const u=await db.get('SELECT cosm FROM users WHERE id=?',[uid]);if(u){const c=PDB.cosParse(u.cosm);if(!c.own.includes(SUPPORTER)){c.own.push(SUPPORTER);await db.run('UPDATE users SET cosm=? WHERE id=?',[JSON.stringify(c),uid])}}return true}
// must be mounted BEFORE express.json so the raw body is available for signature checks
function early(app,ctx){app.post('/api/stripe/webhook',express.raw({type:'*/*',limit:'256kb'}),async(req,res)=>{const s=stripe(),sec=process.env.STRIPE_WEBHOOK_SECRET;if(!s||!sec)return res.status(503).send('not configured');
 let ev;try{ev=s.webhooks.constructEvent(req.body,req.get('stripe-signature')||'',sec)}catch(e){return res.status(400).send('bad signature')}
 try{await ctx.ready;if(ev.type==='checkout.session.completed'||ev.type==='checkout.session.async_payment_succeeded')await fulfil(ctx,ev.data.object);res.json({received:true})}catch(e){console.error('webhook',e);res.status(500).send('error')}})}
function routes(app,ctx){const {db,q,PDB,auth,H,pub}=ctx;
 app.get('/api/shop/packs',(req,res)=>res.json({enabled:!!process.env.STRIPE_SECRET_KEY,packs:packs().map(p=>({id:p.id,coins:p.coins,price:'$'+(p.cents/100).toFixed(2)}))}));
 app.post('/api/shop/checkout',auth,H(async(req,res)=>{const s=stripe();if(!s)return res.status(503).json({error:'payments not configured'});if(req.user.guest)return res.status(403).json({error:'make an account to buy coins'});
  const p=packs().find(x=>x.id===(req.body||{}).pack);if(!p)return res.status(400).json({error:'unknown pack'});
  const base=process.env.PUBLIC_URL||(req.protocol+'://'+req.get('host'));
  const sess=await s.checkout.sessions.create({mode:'payment',line_items:[p.price?{price:p.price,quantity:1}:{price_data:{currency:'usd',unit_amount:p.cents,product_data:{name:p.coins+' Coins - Pixel Dudes Brawl'}},quantity:1}],
   client_reference_id:String(req.user.id),metadata:{uid:String(req.user.id),coins:String(p.coins),pack:p.id},success_url:base+'/?paid=1&sid={CHECKOUT_SESSION_ID}',cancel_url:base+'/?paid=0'});
  res.json({url:sess.url,id:sess.id})}));
 // fallback when the webhook is slow: the success redirect can confirm the session (still idempotent)
 app.post('/api/shop/confirm',auth,H(async(req,res)=>{const s=stripe(),id=String((req.body||{}).sid||'');if(!s||!/^cs_/.test(id))return res.status(400).json({error:'bad session'});
  const sess=await s.checkout.sessions.retrieve(id);if(!sess||String(sess.metadata&&sess.metadata.uid)!==String(req.user.id))return res.status(403).json({error:'not yours'});
  const got=await fulfil(ctx,sess);res.json({granted:got,user:pub(await q.byId(req.user.id))})}));
 app.post('/api/profile/bio',auth,H(async(req,res)=>{if(req.user.guest)return res.status(403).json({error:'guests cannot set a bio'});const b=cleanBio((req.body||{}).bio);await db.run('UPDATE users SET bio=? WHERE id=?',[b,req.user.id]);res.json({bio:b,user:pub(await q.byId(req.user.id))})}));
 app.get('/api/profile/:name',H(async(req,res)=>{const p=await profileOf(ctx,req.params.name);if(!p)return res.status(404).json({error:'no such player'});res.json(p)}));
 app.get('/u/:name',H(async(req,res)=>{const p=await profileOf(ctx,req.params.name);res.set('Content-Type','text/html');res.status(p?200:404).send(page(p,req.params.name))}));}
async function profileOf(ctx,name){const {q,PDB}=ctx;const u=typeof name=='string'&&/^[A-Za-z0-9_]{1,16}$/.test(name)&&await q.byName(name);if(!u||u.guest)return null;
 const st=stats(u),L=PDB.levelOf(u.xp|0),c=PDB.cosParse(u.cosm),fav=Object.entries(st.sk||{}).sort((a,b)=>b[1]-a[1])[0];
 return {username:u.username,level:L.level,xp:u.xp|0,xpInto:L.into,xpNeed:L.need,wins:u.wins|0,games:u.games|0,matches:u.matches|0,kos:u.kos|0,rating:u.rating,tier:PDB.tierOf(u.rating),trophies:u.trophies|0,
  fav:fav?+fav[0]:null,eq:c.eq,skin:st.last!=null?st.last:(fav?+fav[0]:0),bio:u.bio||'',joined:+u.created||null,supporter:c.own.includes(SUPPORTER)}}
function stats(u){try{return JSON.parse(u.stats||'{}')||{}}catch(e){return {}}}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function page(p,name){const NAMES=require('../shared/names.json');if(!p)return `<!doctype html><meta name=viewport content="width=device-width"><title>Player not found</title><body style="background:#14101c;color:#fff;font-family:monospace;text-align:center;padding:40px"><h1>No player "${esc(name)}"</h1><a style="color:#fee761" href="/">Play Pixel Dudes Brawl</a>`;
 const pct=p.xpNeed?Math.round(100*p.xpInto/p.xpNeed):100,nm=i=>i==null?'-':NAMES[i]||('#'+i),it=id=>id?esc(id.replace(/^[a-z]+_/,'').toUpperCase()):'NONE';
 const row=(k,v)=>`<div class=r><span>${k}</span><b>${esc(v)}</b></div>`;
 return `<!doctype html><html><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><title>${esc(p.username)} - Pixel Dudes Brawl</title>
<meta property="og:title" content="${esc(p.username)} - LV ${p.level} on Pixel Dudes Brawl"><meta property="og:description" content="${esc(p.bio||(p.wins+' wins, '+p.kos+' KOs'))}">
<style>body{background:#14101c;color:#fff;font-family:monospace;margin:0;display:flex;justify-content:center}.c{max-width:440px;width:100%;padding:24px}h1{color:#fee761;margin:0 0 4px;font-size:32px}.lv{display:inline-block;background:#5d4a6e;padding:2px 8px;border-radius:4px}
.bar{height:14px;background:#2b2b40;border-radius:7px;overflow:hidden;margin:8px 0 2px}.bar i{display:block;height:100%;background:#a1e55a;width:${pct}%}.r{display:flex;justify-content:space-between;border-bottom:1px solid #2b2b40;padding:6px 0}
.bio{background:#2b2b40;padding:10px;border-radius:6px;margin:12px 0;white-space:pre-wrap}a.b{display:block;text-align:center;background:#fee761;color:#14101c;padding:12px;border-radius:6px;font-weight:bold;text-decoration:none;margin-top:18px}</style></head><body><div class=c>
<h1>${esc(p.username)}</h1><span class=lv>LV ${p.level}</span> <span style="color:#d8dde6">${esc(p.tier)}</span>${p.supporter?' <span style="color:#ff8ad0">&#9829; SUPPORTER</span>':''}
<div class=bar><i></i></div><small style="color:#8b93a6">${p.xpInto} / ${p.xpNeed} XP to LV ${p.level+1}</small>
${p.bio?`<div class=bio>${esc(p.bio)}</div>`:''}
${row('WINS',p.wins)}${row('KOS',p.kos)}${row('MATCHES',p.matches)}${row('RATING',p.rating)}${row('TROPHIES',p.trophies)}${row('FAVORITE',nm(p.fav))}${row('SKIN',nm(p.skin))}${row('HAT',it(p.eq.hat))}${row('TRAIL',it(p.eq.trail))}${row('JOINED',p.joined?new Date(p.joined).toISOString().slice(0,10):'-')}
<a class=b href="/">PLAY PIXEL DUDES BRAWL</a></div></body></html>`}
// record a finished match for profile stats (kos, matches, favourite skin)
async function recordMatch(db,uid,skin,kos){const u=await db.get('SELECT stats FROM users WHERE id=?',[uid]);const st=stats(u||{});st.sk=st.sk||{};if(Number.isInteger(skin)&&skin>=0&&skin<64){st.sk[skin]=(st.sk[skin]|0)+1;st.last=skin}
 await db.run('UPDATE users SET matches=COALESCE(matches,0)+1,kos=COALESCE(kos,0)+?,stats=? WHERE id=?',[Math.max(0,kos|0),JSON.stringify(st),uid])}
module.exports={early,routes,recordMatch,fulfil,packs,cleanBio};
