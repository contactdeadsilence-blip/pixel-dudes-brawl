// ===== Feature pack: XP/levels, public profiles, coin packs =====
const lvOf=xp=>PDBCore.levelOf(xp|0);
const _fxSetUser=setUser;setUser=function(j){const old=ACC.user&&!ACC.user.guest?ACC.user.level:null;_fxSetUser(j);const nu=ACC.user;if(old&&nu&&nu.level>old){LVUP.lv=nu.level;LVUP.t=180;SFX.ok()}};
const LVUP={lv:0,t:0};
UIS.add('profile');UIS.add('packs');
ONL_ITEMS.splice(ONL_ITEMS.indexOf('LOG OUT'),0,'MY PROFILE','FIND PLAYER');
const PF={data:null,err:null,name:'',sel:0,back:'online'};
function goProfile(name,back){PF.data=null;PF.err=null;PF.name=name;PF.sel=0;PF.back=back||state;state='profile';
 fetch('/api/profile/'+encodeURIComponent(name)).then(r=>r.json().then(j=>{if(!r.ok)throw new Error(j.error||'error');PF.data=j})).catch(e=>PF.err=String(e.message||'COULD NOT LOAD').toUpperCase())}
function pfItems(){const me=ACC.user&&PF.data&&ACC.user.username==PF.data.username&&!ACC.user.guest;return me?['SHARE PAGE','EDIT BIO','BACK']:['SHARE PAGE','BACK']}
function updProfile(){const it=pfItems();PF.sel=listNav(it.length,PF.sel);if(mBack()){SFX.back();state=PF.back;return}if(!mOK())return;const o=PF.data?it[PF.sel]:'BACK';SFX.ok();
 if(o=='BACK'){state=PF.back;return}
 if(o=='SHARE PAGE'){const u=location.origin+'/u/'+encodeURIComponent(PF.data.username);try{navigator.clipboard&&navigator.clipboard.writeText(u)}catch(e){}window.open(u,'_blank');toast('LINK COPIED');return}
 if(o=='EDIT BIO'){const b=prompt('Your bio (120 characters max):',PF.data.bio||'');if(b==null)return;api('profile/bio',{bio:b}).then(j=>{if(j.user)setUser(j);PF.data.bio=j.bio;toast('BIO SAVED')}).catch(e=>toast('COULD NOT SAVE'))}}
function wrapTxt(s,n){const out=[];let l='';for(const w of String(s).split(' ')){if((l+' '+w).trim().length>n){if(l)out.push(l);l=w}else l=(l+' '+w).trim()}if(l)out.push(l);return out}
function drawProfile(){text('PLAYER PROFILE',W/2,26,PAL.Y,32,'center');panel(40,34,400,190);const D=PF.data;
 if(!D){text(PF.err||'LOADING...',W/2,130,'#ffffff',16,'center')}else{
  drawSheet(imgs[D.skin]||imgs[0],62,50,1,2,Math.floor(t/7)%4,3);
  text(D.username,120,58,nameCol({name:D.eq&&D.eq.name},'#ffffff'),16);text('LV '+D.level,120,74,'#a1e55a',16);tierBadge(D.tier,190,73,'left');if(D.supporter)text('\u2665 SUPPORTER',250,73,'#ff8ad0',8);
  const bw=300,p=D.xpNeed?D.xpInto/D.xpNeed:1;ctx.fillStyle='#2b2b40';ctx.fillRect(120,80,bw,7);ctx.fillStyle='#a1e55a';ctx.fillRect(120,80,Math.round(bw*p),7);text(D.xpInto+' / '+D.xpNeed+' XP',120,97,'#8b93a6',8);
  const st=[['WINS',D.wins],['KOS',D.kos],['MATCHES',D.matches],['RATING',D.rating],['FAVORITE',D.fav!=null?NAMES[D.fav]:'-'],['JOINED',D.joined?new Date(D.joined).toISOString().slice(0,10):'-']];
  st.forEach((s,k)=>{const x=60+(k%3)*130,y=118+Math.floor(k/3)*24;text(s[0],x,y,'#8b93a6',8);text(String(s[1]),x,y+12,'#ffffff',8)});
  const eq=D.eq||{},nm=id=>id?((PDBCore.COS_BY[id]||{}).n||id):'NONE';text('HAT '+nm(eq.hat)+'   TRAIL '+nm(eq.trail),60,174,'#d8dde6',8);
  wrapTxt(D.bio||'NO BIO YET',62).slice(0,2).forEach((l,k)=>text(l,60,190+k*11,D.bio?'#ffffff':'#8b93a6',8));
  const it=pfItems();it.forEach((o,k)=>{const x=W/2+(k-(it.length-1)/2)*110;if(k==PF.sel){ctx.fillStyle='#5d4a6e';ctx.fillRect(x-50,207,100,14)}text(o,x,218,k==PF.sel?PAL.Y:'#ffffff',8,'center')})}
 bar([[['DP'],'SELECT'],[['A'],'OK'],[['B'],'BACK']],[[['\u2190','\u2192'],'SELECT'],[['ENTER'],'OK'],[['ESC'],'BACK']])}
// leaderboard: pick a row to open their profile
LBD.sel=0;
updLeader=function(){if(mBack()){SFX.back();state='online';return}const n=LBD.data?LBD.data.top.length:0;
 if(mOK()){if(n){SFX.ok();goProfile(LBD.data.top[LBD.sel].username,'leader')}else{SFX.back();state='online'}return}
 if(mU()&&LBD.sel>0){LBD.sel--;SFX.sel()}if(mD()&&LBD.sel<n-1){LBD.sel++;SFX.sel()}if(LBD.sel<LBD.scroll)LBD.scroll=LBD.sel;if(LBD.sel>LBD.scroll+8)LBD.scroll=LBD.sel-8};
// coin packs (only listed when the server has Stripe configured)
const PK={on:false,list:[],sel:0,busy:false};
if(ONLINE)fetch('/api/shop/packs').then(r=>r.json()).then(j=>{if(j.enabled&&j.packs.length){PK.on=true;PK.list=j.packs;ONL_ITEMS.splice(ONL_ITEMS.indexOf('SHOP')+1,0,'COIN PACKS')}}).catch(()=>{});
function updPacks(){const n=PK.list.length+1;PK.sel=listNav(n,PK.sel);if(mBack()||(mOK()&&PK.sel==PK.list.length)){SFX.back();state='online';return}
 if(mOK()&&!PK.busy){if(!ACC.user||ACC.user.guest){toast('MAKE AN ACCOUNT TO BUY COINS');SFX.err();return}SFX.ok();PK.busy=true;
  api('shop/checkout',{pack:PK.list[PK.sel].id}).then(j=>{if(!j.url)throw new Error(j.error);location.href=j.url}).catch(e=>{PK.busy=false;toast(String(e.message||'CHECKOUT FAILED').toUpperCase());SFX.err()})}}
function drawPacks(){text('COIN PACKS',W/2,28,PAL.Y,32,'center');acctBadge(W-4,4,'right');panel(W/2-120,40,240,PK.list.length*26+40);
 PK.list.forEach((p,k)=>{const y=48+k*26,s=k==PK.sel;if(s){ctx.fillStyle='#5d4a6e';ctx.fillRect(W/2-114,y,228,22)}coinIcon(W/2-104,y+5);text(p.coins+' COINS',W/2-88,y+16,s?PAL.Y:'#ffffff',16);text(p.price.replace('$','')+' USD',W/2+106,y+16,'#a1e55a',16,'right')});
 const y=48+PK.list.length*26,s=PK.sel==PK.list.length;text('BACK',W/2,y+16,s?PAL.Y:'#ffffff',16,'center');
 text(PK.busy?'OPENING SECURE CHECKOUT...':'ANY PURCHASE UNLOCKS THE SUPPORTER NAME COLOR',W/2,y+40,'#ff8ad0',8,'center');text('PAYMENTS BY STRIPE',W/2,y+52,'#8b93a6',8,'center');
 bar([[['DP'],'SELECT'],[['A'],'BUY'],[['B'],'BACK']],[[['\u2191','\u2193'],'SELECT'],[['ENTER'],'BUY'],[['ESC'],'BACK']])}
// returning from Stripe Checkout
(function(){const P=new URLSearchParams(location.search);if(!P.has('paid'))return;const sid=P.get('sid');history.replaceState(null,'',location.pathname);
 if(P.get('paid')!='1'){setTimeout(()=>toast('PURCHASE CANCELLED'),500);return}let n=0;const go=()=>{if(!ACC.token){if(++n<40)setTimeout(go,250);return}
  api('shop/confirm',{sid}).then(j=>{if(j.user)setUser(j);toast('THANKS! COINS ADDED')}).catch(()=>toast('PAYMENT RECEIVED - COINS SOON'))};go()})();
const _fxUpdOnl=updOnlineMenu;updOnlineMenu=function(){const o=ONL_ITEMS[onlSel];if(mOK()&&(o=='MY PROFILE'||o=='FIND PLAYER'||o=='COIN PACKS')){SFX.ok();
  if(o=='COIN PACKS'){PK.sel=0;PK.busy=false;state='packs'}else if(o=='MY PROFILE'){if(ACC.user.guest){toast('GUESTS HAVE NO PROFILE');SFX.err()}else goProfile(ACC.user.username,'online')}
  else{const n=prompt('Find player by username:');if(n&&n.trim())goProfile(n.trim(),'online')}return}_fxUpdOnl()};
const _fxUpdUI=updUI;updUI=function(){if(state=='profile')updProfile();else if(state=='packs')updPacks();else _fxUpdUI()};
const _fxDrawUI=drawUI;drawUI=function(){if(state=='profile')drawProfile();else if(state=='packs')drawPacks();else _fxDrawUI();
 if(LVUP.t>0){LVUP.t--;const a=Math.min(1,LVUP.t/30);ctx.globalAlpha=a;panel(W/2-90,100,180,50,'#5d4a6e');text('LEVEL UP!',W/2,124,PAL.Y,32,'center');text('YOU ARE NOW LV '+LVUP.lv,W/2,142,'#a1e55a',8,'center');ctx.globalAlpha=1}};
