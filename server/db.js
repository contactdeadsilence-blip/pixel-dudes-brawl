// Tiny async data layer: Postgres (pg) when DATABASE_URL is set, otherwise local SQLite (better-sqlite3).
// SQL is written with ? placeholders; converted to $1..$n for Postgres.
'use strict';
const path=require('path'),fs=require('fs');
const SCHEMA_PG=`CREATE TABLE IF NOT EXISTS users(id SERIAL PRIMARY KEY,username TEXT NOT NULL,pass TEXT,coins INTEGER DEFAULT 0,unlocked TEXT,settings TEXT DEFAULT '{}',guest INTEGER DEFAULT 0,created BIGINT,rating INTEGER DEFAULT 1000,games INTEGER DEFAULT 0,wins INTEGER DEFAULT 0);
CREATE UNIQUE INDEX IF NOT EXISTS users_lname ON users(lower(username));
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id INTEGER,created BIGINT);
CREATE TABLE IF NOT EXISTS purchases(id SERIAL PRIMARY KEY,user_id INTEGER,skin INTEGER,price INTEGER,ts BIGINT);
CREATE TABLE IF NOT EXISTS earn(user_id INTEGER,day TEXT,kind TEXT,amt INTEGER);
CREATE INDEX IF NOT EXISTS earn_ud ON earn(user_id,day,kind);
CREATE TABLE IF NOT EXISTS once_day(user_id INTEGER,day TEXT,kind TEXT,PRIMARY KEY(user_id,day,kind));
CREATE TABLE IF NOT EXISTS chal(user_id INTEGER,day TEXT,slot INTEGER,cid TEXT,prog INTEGER DEFAULT 0,done INTEGER DEFAULT 0,PRIMARY KEY(user_id,day,slot));
CREATE TABLE IF NOT EXISTS friends(a INTEGER,b INTEGER,status INTEGER DEFAULT 0,created BIGINT,PRIMARY KEY(a,b));
CREATE TABLE IF NOT EXISTS admin_kv(k TEXT PRIMARY KEY,v TEXT);
CREATE TABLE IF NOT EXISTS props(id SERIAL PRIMARY KEY,name TEXT,w INTEGER,h INTEGER,data TEXT,enabled INTEGER DEFAULT 1,created BIGINT);
ALTER TABLE users ADD COLUMN IF NOT EXISTS cosm TEXT DEFAULT '{}';
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS item TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS trophies INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS kos INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS matches INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS stats TEXT DEFAULT '{}';
CREATE TABLE IF NOT EXISTS pay(session_id TEXT PRIMARY KEY,user_id INTEGER,pack TEXT,coins INTEGER,cents INTEGER,ts BIGINT);`;
const SCHEMA_SQLITE=`CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY,username TEXT UNIQUE COLLATE NOCASE,pass TEXT,coins INTEGER DEFAULT 0,unlocked TEXT,settings TEXT DEFAULT '{}',guest INTEGER DEFAULT 0,created INTEGER);
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id INTEGER,created INTEGER);
CREATE TABLE IF NOT EXISTS purchases(id INTEGER PRIMARY KEY,user_id INTEGER,skin INTEGER,price INTEGER,ts INTEGER);
CREATE TABLE IF NOT EXISTS earn(user_id INTEGER,day TEXT,kind TEXT,amt INTEGER);
CREATE TABLE IF NOT EXISTS once_day(user_id INTEGER,day TEXT,kind TEXT,PRIMARY KEY(user_id,day,kind));
CREATE TABLE IF NOT EXISTS chal(user_id INTEGER,day TEXT,slot INTEGER,cid TEXT,prog INTEGER DEFAULT 0,done INTEGER DEFAULT 0,PRIMARY KEY(user_id,day,slot));
CREATE TABLE IF NOT EXISTS friends(a INTEGER,b INTEGER,status INTEGER DEFAULT 0,created INTEGER,PRIMARY KEY(a,b));
CREATE TABLE IF NOT EXISTS admin_kv(k TEXT PRIMARY KEY,v TEXT);
CREATE TABLE IF NOT EXISTS props(id INTEGER PRIMARY KEY,name TEXT,w INTEGER,h INTEGER,data TEXT,enabled INTEGER DEFAULT 1,created INTEGER);
CREATE TABLE IF NOT EXISTS pay(session_id TEXT PRIMARY KEY,user_id INTEGER,pack TEXT,coins INTEGER,cents INTEGER,ts INTEGER);`;
function makePg(url,opts){
 const pg=require('pg');pg.types.setTypeParser(20,v=>parseInt(v,10));pg.types.setTypeParser(1700,v=>parseFloat(v));
 const ssl=/localhost|127\.0\.0\.1/.test(url)||process.env.PGSSL=='0'?false:{rejectUnauthorized:false};
 const pool=new pg.Pool(Object.assign({connectionString:url,ssl,max:+process.env.PG_POOL||5,idleTimeoutMillis:30000},opts));
 pool.on('error',e=>console.error('pg pool',e.message));
 const cv=s=>{let n=0;return s.replace(/\?/g,()=>'$'+(++n))};
 const qy=(s,p=[])=>pool.query(cv(s),p);
 return {kind:'pg',pool,
  async init(){await qy(SCHEMA_PG)},
  async get(s,p){return (await qy(s,p)).rows[0]},
  async all(s,p){return (await qy(s,p)).rows},
  async run(s,p){const r=await qy(s,p);return {changes:r.rowCount}},
  close(){return pool.end()}};
}
function makeSqlite(file){
 const Database=require('better-sqlite3');fs.mkdirSync(path.dirname(file),{recursive:true});
 const db=new Database(file);db.pragma('journal_mode = WAL');const cache=new Map();
 const st=s=>{let x=cache.get(s);if(!x){x=db.prepare(s);cache.set(s,x)}return x};
 return {kind:'sqlite',raw:db,
  async init(){db.exec(SCHEMA_SQLITE);for(const c of ['rating INTEGER DEFAULT 1000','games INTEGER DEFAULT 0','wins INTEGER DEFAULT 0',"cosm TEXT DEFAULT '{}'",'trophies INTEGER DEFAULT 0','xp INTEGER DEFAULT 0','kos INTEGER DEFAULT 0','matches INTEGER DEFAULT 0',"bio TEXT DEFAULT ''","stats TEXT DEFAULT '{}'"])try{db.exec('ALTER TABLE users ADD COLUMN '+c)}catch(e){}try{db.exec('ALTER TABLE purchases ADD COLUMN item TEXT')}catch(e){}},
  async get(s,p=[]){return st(s).get(...p)},
  async all(s,p=[]){return st(s).all(...p)},
  async run(s,p=[]){const r=st(s).run(...p);return {changes:r.changes}},
  close(){db.close()}};
}
module.exports=function open(){const url=process.env.DATABASE_URL;
 return url?makePg(url):makeSqlite(process.env.DB_PATH||path.join(__dirname,'..','data','brawl.db'))};
