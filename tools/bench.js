// Net bench: 1 idle human + 3 CPUs in a private room. Reports snap bytes/s, snap rate + arrival jitter, server tick rate and cost.
'use strict';
const path=require('path'),fs=require('fs'),os=require('os');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'pdb-b-'));Object.assign(process.env,{DB_PATH:path.join(tmp,'b.db'),MATCH_TIME_S:'240',COUNTDOWN_MS:'200'});
const PDB=require('../shared/core.js'),mk=PDB.createCore;const T={step:[],snap:[],ticks:0};
PDB.createCore=function(h){const c=mk(h);const st=c.step,sn=c.snap,sx=c.snapX;
 c.step=function(){const t=process.hrtime.bigint();const r=st.apply(this,arguments);T.step.push(Number(process.hrtime.bigint()-t)/1e6);T.ticks++;return r};
 c.snap=function(){const t=process.hrtime.bigint();const r=sn.apply(this,arguments);T.snap.push(Number(process.hrtime.bigint()-t)/1e6);return r};return c};
const {server}=require('../server/index.js');const WebSocket=require('ws');const DUR=+process.env.BENCH_S||15;
(async()=>{await new Promise(r=>server.listen(0,r));const B='http://127.0.0.1:'+server.address().port;
 const g=await (await fetch(B+'/api/guest',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})).json();
 const ws=new WebSocket(B.replace('http','ws')+'/ws?token='+g.token);await new Promise(r=>ws.on('open',r));
 let started=0,bytes=0,n=0,last=0,gaps=[],t0=0,warm=0;
 ws.on('message',(d,bin)=>{const s=typeof d=='string'?d:d.toString();const m=JSON.parse(s);
  if(m.t=='lobby'&&!started){started=1;for(let i=0;i<3;i++)ws.send(JSON.stringify({t:'addcpu'}));setTimeout(()=>ws.send(JSON.stringify({t:'start'})),300)}
  if(m.t=='snap'){const now=performance.now();if(!t0){t0=now;T.step.length=0;T.snap.length=0;T.ticks=0}else{bytes+=d.length;n++;gaps.push(now-last)}last=now}});
 ws.send(JSON.stringify({t:'create'}));
 await new Promise(r=>setTimeout(r,DUR*1000+1500));const el=(last-t0)/1000;
 const p=(a,q)=>{a=[...a].sort((x,y)=>x-y);return a[Math.min(a.length-1,Math.floor(a.length*q))]||0},avg=a=>a.reduce((x,y)=>x+y,0)/(a.length||1);
 console.log(JSON.stringify({seconds:+el.toFixed(1),snapsPerSec:+(n/el).toFixed(1),bytesPerSec:Math.round(bytes/el),avgSnapBytes:Math.round(bytes/n),gapP50:+p(gaps,.5).toFixed(1),gapP99:+p(gaps,.99).toFixed(1),gapMax:+p(gaps,1).toFixed(1),
  serverTicksPerSec:+(T.ticks/el).toFixed(1),stepAvgMs:+avg(T.step).toFixed(3),stepP99Ms:+p(T.step,.99).toFixed(3),snapAvgMs:+avg(T.snap).toFixed(3)}));process.exit(0)})();
