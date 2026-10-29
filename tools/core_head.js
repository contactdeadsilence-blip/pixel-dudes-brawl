// Pixel Dudes Brawl - shared game simulation (runs in the browser AND on the Node server)
(function(root){
const PRICES=[0,0,0,0,150,150,150,200,200,200,250,250,250,300,300,300,400,400,500,500,750];
const STARTER=[0,1,2,3];
function createCore(H){H=H||{};
const W=480,T=16;const PCOL=['#e04848','#4a8fe0','#fee761','#a1e55a'];
const SFX=new Proxy({},{get:(_,k)=>a=>{H.sfx&&H.sfx(k,a)}});
function addShake(v){H.shake&&H.shake(v)}
function burst(x,y,c,n,sp){H.burst&&H.burst(x,y,c,n,sp)}
let F=[],map=null,arena=0,WW=960,WH=544,readyT=0,endT=0,winner=null,hitstop=0,timer=0,tick=0,opts={stocks:3,diff:1,time:0};
let stageL=0,stageR=W,stageTop=0;
