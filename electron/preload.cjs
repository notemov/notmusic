const { contextBridge, ipcRenderer } = require('electron');

const ALLOWED_CHANNELS = [
  'media:togglePlay',
  'media:playNext',
  'media:playPrevious',
  'app:minimize',
  'app:maximize',
  'app:close',
];

contextBridge.exposeInMainWorld('electronAPI', {
  send: (channel, ...args) => {
    if (ALLOWED_CHANNELS.includes(channel)) {
      ipcRenderer.send(channel, ...args);
    }
  },
  on: (channel, callback) => {
    if (ALLOWED_CHANNELS.includes(channel)) {
      const subscription = (_event, ...args) => callback(...args);
      ipcRenderer.on(channel, subscription);
      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    }
    return () => {};
  },
});
