const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  invoke: (channel: any, data: any) => ipcRenderer.invoke(channel, data),
});

contextBridge.exposeInMainWorld('electronAPI', {
  // Định nghĩa hàm openBrowser để React gọi
  openBrowser: (data: any) => ipcRenderer.invoke('launch-profile', data),
});
