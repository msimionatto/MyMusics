<<<<<<< HEAD
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {

    selectMusic: async () => {
        return await ipcRenderer.invoke('select-music');
    },

    // Canal seguro para escutar as teclas de mídia nativas do sistema no renderer.js
    onGlobalCommand: (callback) => {
        ipcRenderer.on('global-media-command', (event, command) => callback(command));
    }

=======
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {

    // 🎵 Selecionar músicas (ajustado para o singular para bater com o HTML)
    selecionarMusica: () => 
        ipcRenderer.invoke("selecionar-musica"),

    // 📀 Listar arquivos da pasta
    listarMusicas: () => 
        ipcRenderer.invoke("listar-musicas"),

    // 💾 Salvar dados no JSON
    salvarBiblioteca: (dados) => 
        ipcRenderer.invoke("salvar-biblioteca", dados),

    // 📥 Carregar dados do JSON
    carregarBiblioteca: () => 
        ipcRenderer.invoke("carregar-biblioteca"),

    // 🖼 Extrair capa e artista
    lerMetadata: (caminho) => 
        ipcRenderer.invoke("ler-metadata", caminho),

    // 🔥 EVENTO EM TEMPO REAL
    // Escuta quando o backend avisa que a pasta de músicas mudou
    onBibliotecaAtualizada: (callback) =>
        ipcRenderer.on("biblioteca-atualizada", (event, data) => callback(data))
>>>>>>> 6309e7666f6784ec1fe6d5a5a1307b7a11e5d38a
});