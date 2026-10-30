const {app,BrowserWindow,Menu,globalShortcut}=require('electron');const path=require('path');
const URL='https://pixel-dudes-brawl.onrender.com';
let win,splash;
function offline(){win.loadFile(path.join(__dirname,'offline','index.html'))}
function create(){
  splash=new BrowserWindow({width:520,height:300,frame:false,resizable:false,center:true,backgroundColor:'#000000',alwaysOnTop:true,show:true});splash.loadFile(path.join(__dirname,'splash.html'));
  const t0=Date.now();
  win=new BrowserWindow({show:false,width:1280,height:720,title:'Pixel Dudes Brawl',icon:path.join(__dirname,'build','icon.png'),backgroundColor:'#000000',autoHideMenuBar:true,webPreferences:{contextIsolation:true}});
  Menu.setApplicationMenu(null);
  let fell=false;
  win.webContents.on('did-fail-load',(e,code,desc,url,main)=>{if(main&&!fell){fell=true;offline()}});
  // Render free tier can be slow to wake: fall back if nothing loads in 25s
  const t=setTimeout(()=>{if(!fell&&win.webContents.isLoading()){fell=true;offline()}},25000);
  let shown=false;const reveal=()=>{if(shown)return;shown=true;setTimeout(()=>{if(splash&&!splash.isDestroyed())splash.close();win.show()},Math.max(0,2500-(Date.now()-t0)))};
  win.webContents.on('did-finish-load',()=>{clearTimeout(t);reveal()});setTimeout(reveal,30000);
  win.webContents.on('before-input-event',(e,i)=>{if(i.type=='keyDown'&&i.key=='F11'){win.setFullScreen(!win.isFullScreen());e.preventDefault()}});
  win.webContents.setWindowOpenHandler(({url})=>{require('electron').shell.openExternal(url);return{action:'deny'}});
  win.loadURL(URL+'/?nosplash');
}
app.whenReady().then(()=>{create();if(app.isPackaged){try{require('electron-updater').autoUpdater.checkForUpdatesAndNotify()}catch(e){}}});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit()});
app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0)create()});
