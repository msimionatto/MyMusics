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
});