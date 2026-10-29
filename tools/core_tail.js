function startFight(slots,ar,o){opts=Object.assign({stocks:3,diff:1,time:0},o||{});arena=ar;map=ARENAS[arena].map;WW=map[0].length*T;WH=map.length*T;stageBounds();F=[];
 slots.forEach((s,i)=>{if(!s||s.type=='none')return;const f={i,cpu:s.type=='cpu',skin:s.skin,name:s.name||'',x:0,y:0,w:10,h:20,vx:0,vy:0,face:i<2?1:-1,dmg:0,stocks:opts.stocks,out:false,respawn:0,inv:0,jumps:1,atkT:0,dashT:0,dashCd:0,airDash:true,hitstun:0,flash:0,dropT:0,ground:false,ff:false,hit:null,trail:[],anim:0,ai:{j:0},lastHit:null};spawn(f,true);F.push(f)});
 readyT=100;endT=0;winner=null;hitstop=0;timer=opts.time||0;tick=0}
function rank(){return F.slice().sort((a,b)=>(b.out?0:b.stocks)-(a.out?0:a.stocks)||a.dmg-b.dmg)}
function step(getInp){tick++;if(readyT>0){readyT--;if(readyT==99||readyT==65)SFX.count();if(readyT==30)SFX.go()}
 if(hitstop>0)hitstop--;else for(const f of F)updF(f,f.cpu?ai(f):(getInp(f.i)||{}));
 if(timer>0&&readyT<=0&&!endT){timer--;if(timer==0){const r=rank();winner=(r.length>1&&r[0].stocks==r[1].stocks&&r[0].dmg==r[1].dmg)?null:r[0];endT=90;SFX.game()}}
 const alive=F.filter(f=>!f.out);if(alive.length<=1&&!endT){endT=90;winner=alive[0]||null;SFX.game()}
 if(endT&&--endT==0)return 'win';return null}
// compact snapshot for the network
function snap(){return F.map(f=>[Math.round(f.x*10),Math.round(f.y*10),Math.round(f.vx*10),Math.round(f.vy*10),f.face,Math.round(f.dmg),f.stocks,(f.out?1:0)|(f.ground?2:0)|(f.cpu?4:0),f.respawn,f.inv,f.atkT,f.dashT,f.hitstun,f.flash])}
function unsnap(a,f){f.x=a[0]/10;f.y=a[1]/10;f.vx=a[2]/10;f.vy=a[3]/10;f.face=a[4];f.dmg=a[5];f.stocks=a[6];f.out=!!(a[7]&1);f.ground=!!(a[7]&2);f.cpu=!!(a[7]&4);f.respawn=a[8];f.inv=a[9];f.atkT=a[10];f.dashT=a[11];f.hitstun=a[12];f.flash=a[13];return f}
return{ARENAS,T,PCOL,startFight,step,hitbox,onGround,snap,unsnap,rank,
 get F(){return F},get map(){return map},get arena(){return arena},get WW(){return WW},get WH(){return WH},get readyT(){return readyT},get endT(){return endT},get winner(){return winner},get hitstop(){return hitstop},get timer(){return timer},get tick(){return tick},get opts(){return opts},
 setCPU(i,v){const f=F.find(f=>f.i==i);if(f)f.cpu=v}}}
const api={createCore,PRICES,STARTER};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PDBCore=api;
})(typeof window!=='undefined'?window:globalThis);
