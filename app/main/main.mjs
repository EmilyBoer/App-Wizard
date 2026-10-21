// Job Wizard desktop app (Electron).
import { app, BrowserWindow, ipcMain, dialog, shell, Menu, Tray, nativeImage, protocol, net } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createApi } from '../core/api.mjs';
import { startServer } from '../server/http.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const RENDERER = path.resolve(here, '../renderer');
let win = null;
let tray = null;
let quitting = false;

// Screens load from app://wizard/ so modern JavaScript modules work everywhere.
protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } }]);

const api = createApi({ base: path.join(app.getPath('userData'), 'data'), onEvent: (e) => win?.webContents.send('aw:event', e) });

function createWindow() {
  win = new BrowserWindow({
    width: 1360, height: 900, minWidth: 900, minHeight: 640, title: 'Job Wizard', backgroundColor: '#FFFFFF',
    icon: path.resolve(here, '../assets/icon.png'),
    webPreferences: { preload: path.join(here, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  win.loadURL('app://wizard/index.html');
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:/.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('app://')) { e.preventDefault(); shell.openExternal(url); } });
  win.on('close', (e) => {
    // Keep running in the background (tray icon) so the morning run happens.
    const s = api.session && api.store().get('settings');
    if (!quitting && s?.morningOn) { e.preventDefault(); win.hide(); }
  });
  win.on('closed', () => { win = null; });
}

function show() { if (!win) createWindow(); else { win.show(); win.focus(); } }

ipcMain.handle('aw:call', async (_e, method, args) => {
  try { return { result: (await api.call(method, args)) ?? null }; }
  catch (err) { const user = err.name === 'UserError' || err.name === 'ClaudeError'; if (!user) console.error(err); return { error: user ? err.message : `Something went wrong: ${err.message}` }; }
});

// Make a PDF from HTML with Chromium's own print engine and save it.
ipcMain.handle('aw:pdf', async (_e, { html, fileName, paper, ask }) => {
  const tmp = path.join(os.tmpdir(), `app-wizard-${Date.now()}.html`);
  fs.writeFileSync(tmp, html);
  const off = new BrowserWindow({ show: false, webPreferences: { sandbox: true, javascript: true } });
  try {
    await off.loadFile(tmp);
    await off.webContents.executeJavaScript('document.fonts.ready.then(() => true)');
    const text = await off.webContents.executeJavaScript('document.body.innerText');
    const pdf = await off.webContents.printToPDF({ pageSize: paper === 'a4' ? 'A4' : 'Letter', printBackground: true, preferCSSPageSize: true });
    const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
    const folder = path.join(app.getPath('documents'), 'Job Wizard');
    fs.mkdirSync(folder, { recursive: true });
    let file = path.join(folder, `${fileName}.pdf`);
    if (ask) {
      const r = await dialog.showSaveDialog(win, { defaultPath: file, filters: [{ name: 'PDF', extensions: ['pdf'] }] });
      if (r.canceled) return { canceled: true };
      file = r.filePath;
    }
    fs.writeFileSync(file, pdf);
    return { file, pages, text };
  } finally { off.destroy(); fs.rm(tmp, () => {}); }
});

ipcMain.handle('aw:reveal', (_e, file) => shell.showItemInFolder(file));
ipcMain.handle('aw:open', (_e, url) => { if (/^https?:/.test(url)) shell.openExternal(url); });

// Morning run: check every minute; run once a day at the chosen hour.
function scheduleMorning() {
  const tick = async () => {
    if (!api.session) return;
    const s = api.store().get('settings');
    if (!s.morningOn || !s.claudeKey) return;
    const now = new Date();
    const today = now.toLocaleDateString('en-CA');
    const last = s.lastBatch?.at ? new Date(s.lastBatch.at).toLocaleDateString('en-CA') : null;
    if (now.getHours() >= Number(s.morningHour ?? 7) && last !== today) {
      try { await api.call('batch.run', { reason: 'morning' }); } catch (e) { console.error('Morning run', e); }
    }
  };
  setInterval(tick, 60 * 1000);
  setTimeout(tick, 15 * 1000);
}

app.whenReady().then(async () => {
  protocol.handle('app', (req) => {
    const { pathname } = new URL(req.url);
    const file = path.normalize(path.join(RENDERER, decodeURIComponent(pathname)));
    if (!file.startsWith(RENDERER)) return new Response('Not found', { status: 404 });
    return net.fetch(pathToFileURL(file).toString());
  });
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    ...(process.platform === 'darwin' ? [{ role: 'appMenu' }] : []),
    { label: 'File', submenu: [{ label: 'Get applications ready now', click: () => api.call('batch.run', { reason: 'manual' }).catch(() => {}) }, { type: 'separator' }, { label: 'Quit Job Wizard', accelerator: 'CmdOrCtrl+Q', click: () => { quitting = true; app.quit(); } }] },
    { role: 'editMenu' }, { role: 'viewMenu' }, { role: 'windowMenu' },
  ]));
  const icon = nativeImage.createFromPath(path.resolve(here, '../assets/icon.png')).resize({ width: 18, height: 18 });
  tray = new Tray(icon);
  tray.setToolTip('Job Wizard');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Open Job Wizard', click: show },
    { label: 'Get applications ready now', click: () => api.call('batch.run', { reason: 'manual' }).catch(() => {}) },
    { type: 'separator' },
    { label: 'Quit', click: () => { quitting = true; app.quit(); } },
  ]));
  tray.on('click', show);
  createWindow();
  try { await startServer(api, { port: 47321 }); } catch (e) { console.warn('Browser extension connection not available:', e.message); }
  scheduleMorning();
  app.on('activate', show);
});
app.on('before-quit', () => { quitting = true; });
app.on('window-all-closed', () => { /* keep running in the tray */ });
