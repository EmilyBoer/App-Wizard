const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('aw', {
  mode: 'desktop',
  call: async (method, args) => {
    const r = await ipcRenderer.invoke('aw:call', method, args);
    if (r.error) throw new Error(r.error);
    return r.result;
  },
  onEvent: (fn) => ipcRenderer.on('aw:event', (_e, ev) => fn(ev)),
  pdf: (opts) => ipcRenderer.invoke('aw:pdf', opts),
  snapshot: (opts) => ipcRenderer.invoke('aw:snapshot', opts),
  reveal: (file) => ipcRenderer.invoke('aw:reveal', file),
  open: (url) => ipcRenderer.invoke('aw:open', url),
});
