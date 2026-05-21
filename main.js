<<<<<<< HEAD
const {
    app,
    BrowserWindow,
    ipcMain,
    dialog,
    globalShortcut
} = require('electron');

const path = require('path');

let mainWindow;

/* ========================================= */
/* CREATE WINDOW */
/* ========================================= */

function createWindow() {

    mainWindow = new BrowserWindow({

        width: 1450,
        height: 850,

        minWidth: 1200,
        minHeight: 700,

        autoHideMenuBar: true,

        title: 'MYMusics',

        backgroundColor: '#0f0f15',

        icon: path.join(__dirname, 'assets', 'Logo.ico'),

        webPreferences: {

            preload: path.join(__dirname, 'preload.js'),

            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false,
            
            /* LIBERAR ACESSO A ARQUIVOS LOCAIS 
               Isso permite que o 'new Audio()' consiga ler a duração (metadata)
               dos arquivos no seu HD sem ser bloqueado pelo Chromium.
            */
            webSecurity: false 
        }
    });

    mainWindow.loadFile(
        path.join(__dirname, 'src', 'index.html')
    );

    // mainWindow.webContents.openDevTools(); // opcional debug
}

/* ========================================= */
/* APP READY & SHORTCUTS */
/* ========================================= */

app.whenReady().then(() => {

    createWindow();

    // Registrar Atalhos de Mídia Globais do Teclado
    globalShortcut.register('MediaPlayPause', () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('global-media-command', 'play-pause');
        }
    });

    globalShortcut.register('MediaNextTrack', () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('global-media-command', 'next-track');
        }
    });

    globalShortcut.register('MediaPreviousTrack', () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('global-media-command', 'prev-track');
        }
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

/* ========================================= */
/* CLOSE APP & CLEANUP */
/* ========================================= */

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Limpar os atalhos globais do sistema operacional ao fechar o app completamente
app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});

/* ========================================= */
/* SELECT MUSIC (DIALOG) */
/* ========================================= */

ipcMain.handle('select-music', async () => {

    const result = await dialog.showOpenDialog({

        title: 'Selecionar músicas',

        properties: [
            'openFile',
            'multiSelections'
        ],

        filters: [
            {
                name: 'Músicas',
                extensions: ['mp3', 'wav', 'ogg', 'flac']
            }
        ]
    });

    return result.canceled ? [] : result.filePaths;
=======
const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const mm = require("music-metadata");

// 🔥 FORÇAR ÍCONE NO WINDOWS (App ID)
if (process.platform === 'win32') {
    app.setAppUserModelId("MyMusics");
}

let win;

// 📂 Configurações de Caminhos
const pastaMusicas = path.join(__dirname, "musicas");
const caminhoDB = path.join(__dirname, "biblioteca.json");
const iconeCaminho = path.join(__dirname, "assets", "Logo.ico");

// 📁 Garantir estrutura de pastas e banco
if (!fs.existsSync(pastaMusicas)) fs.mkdirSync(pastaMusicas);

if (!fs.existsSync(caminhoDB)) {
    fs.writeFileSync(
        caminhoDB,
        JSON.stringify({ musicas: [], playlists: {} }, null, 2)
    );
}

// 🧠 FORMATAR TEMPO (Helper)
function formatarTempo(segundos) {
    if (!segundos) return "0:00";
    const min = Math.floor(segundos / 60);
    const sec = Math.floor(segundos % 60);
    return `${min}:${sec < 10 ? "0" + sec : sec}`;
}

// 🔄 SINCRONIZAÇÃO DA BIBLIOTECA
async function sincronizarBiblioteca() {
    try {
        const arquivos = fs.readdirSync(pastaMusicas)
            .filter(f => f.endsWith(".mp3") || f.endsWith(".wav"));

        const db = JSON.parse(fs.readFileSync(caminhoDB));
        let musicas = db.musicas || [];

        for (let file of arquivos) {
            const caminhoCompleto = path.join(pastaMusicas, file);

            // 🚫 ANTI DUPLICADO
            const existe = musicas.find(
                m => m.caminho === caminhoCompleto || m.nome === file
            );

            if (!existe) {
                let duracao = "--:--";
                try {
                    const metadata = await mm.parseFile(caminhoCompleto);
                    duracao = formatarTempo(metadata.format.duration);
                } catch (err) {
                    console.error("Erro ao ler metadados:", file);
                }

                musicas.push({
                    nome: file,
                    caminho: caminhoCompleto,
                    favorito: false,
                    duracao: duracao
                });
            }
        }

        // ❌ Remover arquivos que não existem mais fisicamente
        musicas = musicas.filter(m => fs.existsSync(m.caminho));
        db.musicas = musicas;

        fs.writeFileSync(caminhoDB, JSON.stringify(db, null, 2));

        // 🔥 Avisa o Frontend se a janela estiver pronta
        if (win && !win.isDestroyed()) {
            win.webContents.send("biblioteca-atualizada", db);
        }
    } catch (err) {
        console.error("Erro na sincronização:", err);
    }
}

// 🪟 CRIAÇÃO DA JANELA PRINCIPAL
function createWindow() {
    win = new BrowserWindow({
        width: 1150,
        height: 800,
        minWidth: 900,
        minHeight: 600,
        title: "MyMusics",
        icon: iconeCaminho,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    win.loadFile(path.join(__dirname, "renderer", "index.html"));
}

// 🚀 INICIALIZAÇÃO
app.whenReady().then(() => {
    createWindow();
    sincronizarBiblioteca(); // Corrigido o erro de digitação aqui

    // 👀 OBSERVAR MUDANÇAS NA PASTA
    fs.watch(pastaMusicas, (eventType) => {
        if (eventType === 'rename') {
            console.log("📂 Alteração de arquivos detectada");
            sincronizarBiblioteca();
        }
    });

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

// 🛠️ IPC HANDLERS (COMUNICAÇÃO FRONT-BACK)

// 🎵 Abrir Explorer e já retornar objeto de música completo
ipcMain.handle("selecionar-musica", async () => {
    const result = await dialog.showOpenDialog(win, {
        properties: ["openFile", "multiSelections"],
        filters: [{ name: "Áudio", extensions: ["mp3", "wav"] }]
    });

    if (result.canceled) return [];

    const musicasProcessadas = [];
    for (const caminho of result.filePaths) {
        let duracao = "--:--";
        try {
            const metadata = await mm.parseFile(caminho);
            duracao = formatarTempo(metadata.format.duration);
        } catch (err) {
            console.error("Erro ao ler metadados na seleção:", caminho);
        }

        musicasProcessadas.push({
            nome: path.basename(caminho),
            caminho: caminho,
            favorito: false,
            duracao: duracao
        });
    }
    return musicasProcessadas;
});

// 💾 Salvar Banco
ipcMain.handle("salvar-biblioteca", (event, dados) => {
    try {
        fs.writeFileSync(caminhoDB, JSON.stringify(dados, null, 2));
        return true;
    } catch (err) {
        return false;
    }
});

// 📥 Carregar Banco
ipcMain.handle("carregar-biblioteca", () => {
    try {
        return JSON.parse(fs.readFileSync(caminhoDB));
    } catch {
        return { musicas: [], playlists: {} };
    }
});

// 📀 Listagem Simples
ipcMain.handle("listar-musicas", () => {
    const arquivos = fs.readdirSync(pastaMusicas);
    return arquivos
        .filter(f => f.endsWith(".mp3") || f.endsWith(".wav"))
        .map(file => ({
            nome: file,
            caminho: path.join(pastaMusicas, file)
        }));
});

// 🖼️ Extrair Metadados (Capa e Artista) no main.js
ipcMain.handle("ler-metadata", async (event, caminho) => {
    try {
        // mm (music-metadata) analisa o arquivo de áudio
        const metadata = await mm.parseFile(caminho);
        
        return {
            artist: metadata.common.artist || "Desconhecido",
            // Verifica se existe uma imagem (picture) no array de metadados
            picture: metadata.common.picture?.[0]
                ? {
                    format: metadata.common.picture[0].format,
                    // Converte o Buffer da imagem para uma String Base64
                    data: metadata.common.picture[0].data.toString("base64")
                }
                : null
        };
    } catch (error) {
        console.error("Erro ao ler metadados:", error);
        return null;
    }
});

// Fechar quando todas as janelas forem fechadas
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
>>>>>>> 6309e7666f6784ec1fe6d5a5a1307b7a11e5d38a
});