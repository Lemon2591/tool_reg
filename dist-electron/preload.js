"use strict";
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('electron', {
    invoke: (channel, data) => ipcRenderer.invoke(channel, data),
});
contextBridge.exposeInMainWorld('electronAPI', {
    // Định nghĩa hàm openBrowser để React gọi
    openBrowser: (data) => ipcRenderer.invoke('launch-profile', data),
    getProfileList: (params) => ipcRenderer.invoke('get-profile-list', params),
});
