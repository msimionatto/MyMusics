const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {

    selectMusic: async () => {
        return await ipcRenderer.invoke('select-music');
    },

    // Canal seguro para escutar as teclas de mídia nativas do sistema no renderer.js
    onGlobalCommand: (callback) => {
        ipcRenderer.on('global-media-command', (event, command) => callback(command));
    }

});