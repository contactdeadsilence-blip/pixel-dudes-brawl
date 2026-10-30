const {app,BrowserWindow,Menu,globalShortcut}=require('electron');const path=require('path');
const URL='https://pixel-dudes-brawl.onrender.com';
let win;
function offline(){win.loadFile(path.join(__dirname,'offline','index.html'))}
function create(){
  win=new BrowserWindow({width:1280,height:720,title:'Pixel Dudes Brawl',icon:path.join(__dirname,'build','icon.png'),backgroundColor:'#000000',autoHideMenuBar:true,webPreferences:{contextIsolation:true}});
  Menu.setApplicationMenu(null);
  let fell=false;
  win.webContents.on('did-fail-load',(e,code,desc,url,main)=>{if(main&&!fell){fell=true;offline()}});
  // Render free tier can be slow to wake: fall back if nothing loads in 25s
  const t=setTimeout(()=>{if(!fell&&win.webContents.isLoading()){fell=true;offline()}},25000);
  win.webContents.on('did-finish-load',()=>clearTimeout(t));
  win.webContents.on('before-input-event',(e,i)=>{if(i.type=='keyDown'&&i.key=='F11'){win.setFullScreen(!win.isFullScreen());e.preventDefault()}});
  win.webContents.setWindowOpenHandler(({url})=>{require('electron').shell.openExternal(url);return{action:'deny'}});
  win.loadURL(URL);
}
app.whenReady().then(()=>{create();if(app.isPackaged){try{require('electron-updater').autoUpdater.checkForUpdatesAndNotify()}catch(e){}}});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit()});
app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0)create()});
