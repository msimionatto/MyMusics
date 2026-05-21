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
});