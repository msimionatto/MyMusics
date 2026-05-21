/* ==========================================================================
   MYMUSICS PLAYER - CORE RENDERER PROCESS
   Autor: Marcos Simionatto
   Ano: 2026
   ========================================================================== */

/* ========================================= */
/* ELEMENTOS DO DOM                          */
/* ========================================= */

// Navegação e Sidebar
const brandBtn          = document.getElementById('brandBtn');
const homeBtn           = document.getElementById('homeBtn');
const favoritesBtn      = document.getElementById('favoritesBtn');
const addMusicBtn       = document.getElementById('addMusicBtn');
const createPlaylistBtn = document.getElementById('createPlaylistBtn');
const searchPlaylist    = document.getElementById('searchPlaylist');
const playlistList      = document.getElementById('playlistList');

// Área Principal e Header
const mainTitle        = document.getElementById('mainTitle');
const mainSubtitle     = document.getElementById('mainSubtitle');
const mainDisplayLogo  = document.getElementById('mainDisplayLogo');
const backBtn          = document.getElementById('backBtn');
const editPlaylistBtn  = document.getElementById('editPlaylistBtn');
const musicContainer   = document.getElementById('musicContainer');
const searchMusic      = document.getElementById('searchMusic');

// Player de Áudio
const audioPlayer   = document.getElementById('audioPlayer');
const currentMusic  = document.getElementById('currentMusic');
const playPauseBtn  = document.getElementById('playPauseBtn');
const nextBtn       = document.getElementById('nextBtn');
const prevBtn       = document.getElementById('prevBtn');
const shuffleBtn    = document.getElementById('shuffleBtn');
const repeatBtn     = document.getElementById('repeatBtn');
const progressBar   = document.getElementById('progressBar');
const currentTime   = document.getElementById('currentTime');
const duration      = document.getElementById('duration');
const volumeBar     = document.getElementById('volumeBar');

// Equalizador
const toggleEqBtn      = document.getElementById('toggleEqBtn');
const equalizerDrawer  = document.getElementById('equalizerDrawer');
const eqPreset         = document.getElementById('eqPreset');
const eqSliders        = document.querySelectorAll('.eq-slider');

// Modal de Playlist
const playlistModal   = document.getElementById('playlistModal');
const playlistName    = document.getElementById('playlistName');
const playlistDesc    = document.getElementById('playlistDesc');
const playlistImage   = document.getElementById('playlistImage');
const savePlaylist    = document.getElementById('savePlaylist');
const cancelPlaylist  = document.getElementById('cancelPlaylist');
const deletePlaylist  = document.getElementById('deletePlaylist');
const modalTitle      = document.getElementById('modalTitle');

// Painel de Letras (Lyrics Sidebar)
const lyricsSidebar   = document.getElementById('lyricsSidebar');
const toggleLyricsBtn = document.getElementById('toggleLyricsBtn');
const lyricArtistThumb= document.getElementById('lyricArtistThumb');
const lyricTrackName  = document.getElementById('lyricTrackName');
const lyricArtistName = document.getElementById('lyricArtistName');
const lyricsScroller  = document.getElementById('lyricsScroller');

/* ========================================= */
/* ESTADO DA APLICAÇÃO                       */
/* ========================================= */

let playlists = JSON.parse(localStorage.getItem('playlists')) || [];
let musics    = JSON.parse(localStorage.getItem('musics')) || [];

let currentIndex     = 0;
let currentView      = "home";
let currentPlaylist  = null;
let editingPlaylistId = null;

// Modos de reprodução
let isRepeating = false;
let isShuffling = false;

// Nós e contexto da Web Audio API
let audioCtx    = null;
let audioSource = null;
let filters     = {};

// Mapeamento de Presets (Ganhos em dB de -12 a 12 para as 5 bandas)
const presets = {
    flat:  [0, 0, 0, 0, 0],
    bass:  [8, 4, 0, -2, -4],
    pop:   [-2, 2, 5, 3, -1],
    rock:  [5, 3, -1, 3, 6],
    metal: [4, 2, -3, 4, 5],
    vocal: [-4, -2, 4, 6, 2]
};

/* ========================================= */
/* PERSISTÊNCIA (LOCALSTORAGE)               */
/* ========================================= */

function saveState() {
    localStorage.setItem('playlists', JSON.stringify(playlists));
    localStorage.setItem('musics', JSON.stringify(musics));
}

/* ========================================= */
/* SISTEMA DE NAVEGAÇÃO / CLIQUES            */
/* ========================================= */

brandBtn.onclick     = () => renderHome();
homeBtn.onclick      = () => renderHome();
favoritesBtn.onclick = () => renderFavorites();

backBtn.onclick = () => {
    currentPlaylist = null;
    renderHome();
};

// Alternar Visibilidade do Painel de Letras
toggleLyricsBtn.onclick = () => {
    lyricsSidebar.classList.toggle('collapsed');
    
    if (lyricsSidebar.classList.contains('collapsed')) {
        toggleLyricsBtn.textContent = "🎤";
    } else {
        toggleLyricsBtn.textContent = "➡️";
    }
};

/* ========================================= */
/* UTILS & RENDERIZAÇÃO DE INTERFACE         */
/* ========================================= */

function setHeader(title, subtitle, logo = "../assets/Logo.png") {
    mainTitle.textContent = title;
    mainSubtitle.textContent = subtitle;
    mainDisplayLogo.src = logo;
}

function renderEmptyState(title, desc) {
    musicContainer.innerHTML = `
        <div class="empty-state">
            <h2>${title}</h2>
            <p>${desc}</p>
        </div>
    `;
}

// Obtém a lista atual de músicas com base na tela em que o usuário está navegando
function getCurrentQueue() {
    if (currentView === "favorites") {
        return musics.filter(m => m.favorite);
    } else if (currentView === "playlist" && currentPlaylist) {
        return musics.filter(m => currentPlaylist.musics.includes(m.path));
    }
    return musics; // default: home (todas)
}

/* ========================================= */
/* VISUALIZAÇÃO DE TELAS (VIEWS)             */
/* ========================================= */

function renderHome(filterText = "") {
    currentView = "home";
    currentPlaylist = null;
    editPlaylistBtn.style.display = "none";
    
    setHeader("Sua Biblioteca", filterText ? `Resultados para: "${filterText}"` : "Todas as músicas adicionadas aparecerão aqui");
    musicContainer.innerHTML = "";

    const filteredMusics = musics.filter(m => 
        m.name.toLowerCase().includes(filterText.toLowerCase())
    );

    if (filteredMusics.length === 0) {
        renderEmptyState(
            filterText ? "Nenhum resultado encontrado" : "Nenhuma música encontrada", 
            filterText ? "Tente buscar por outro nome." : "Adicione músicas para começar."
        );
    } else {
        filteredMusics.forEach(createMusicCard);
    }
}

function renderFavorites(filterText = "") {
    currentView = "favorites";
    currentPlaylist = null;
    editPlaylistBtn.style.display = "none";
    
    setHeader("Favoritos", "Suas músicas favoritas ❤️");
    musicContainer.innerHTML = "";
    
    const favs = musics.filter(m => 
        m.favorite && m.name.toLowerCase().includes(filterText.toLowerCase())
    );

    if (favs.length === 0) {
        renderEmptyState("Sem favoritos", "Marque músicas com ❤️ para vê-las aqui.");
    } else {
        favs.forEach(createMusicCard);
    }
}

function openPlaylistView(playlist) {
    currentView = "playlist";
    currentPlaylist = playlist;
    editPlaylistBtn.style.display = "block";
    
    setHeader(playlist.name, playlist.description || "Sua playlist", playlist.image || "../assets/Logo.png");
    musicContainer.innerHTML = "";
    
    const musicsInPlaylist = musics.filter(m => playlist.musics.includes(m.path));

    if (musicsInPlaylist.length === 0) {
        renderEmptyState("Playlist vazia", "Adicione músicas usando o botão '+'.");
    } else {
        musicsInPlaylist.forEach(createMusicCard);
    }
    
    editPlaylistBtn.onclick = () => openPlaylistModal(playlist);
}

/* ========================================= */
/* LÓGICA DE BUSCA REAL-TIME                 */
/* ========================================= */

searchMusic.oninput = () => {
    const term = searchMusic.value;
    if (currentView === "home") renderHome(term);
    else if (currentView === "favorites") renderFavorites(term);
};

searchPlaylist.oninput = () => {
    renderPlaylists(searchPlaylist.value);
};

/* ========================================= */
/* GESTÃO DE PLAYLISTS (CRUD)                */
/* ========================================= */

createPlaylistBtn.onclick = () => openPlaylistModal();

function openPlaylistModal(playlist = null) {
    playlistModal.classList.add('active');
    if (playlist) {
        modalTitle.textContent = "Editar Playlist";
        playlistName.value = playlist.name;
        playlistDesc.value = playlist.description || "";
        editingPlaylistId = playlist.id;
        deletePlaylist.style.display = "block";
    } else {
        modalTitle.textContent = "Criar Playlist";
        playlistName.value = "";
        playlistDesc.value = "";
        playlistImage.value = "";
        editingPlaylistId = null;
        deletePlaylist.style.display = "none";
    }
}

cancelPlaylist.onclick = () => playlistModal.classList.remove('active');

savePlaylist.onclick = async () => {
    if (!playlistName.value.trim()) return alert("Dê um nome para a playlist!");
    
    let imageBase64 = null;
    if (playlistImage.files[0]) imageBase64 = await toBase64(playlistImage.files[0]);

    if (editingPlaylistId) {
        const index = playlists.findIndex(p => p.id === editingPlaylistId);
        if (index !== -1) {
            playlists[index].name = playlistName.value;
            playlists[index].description = playlistDesc.value;
            if (imageBase64) playlists[index].image = imageBase64;
            if (currentPlaylist?.id === editingPlaylistId) openPlaylistView(playlists[index]);
        }
    } else {
        playlists.push({
            id: Date.now().toString(),
            name: playlistName.value,
            description: playlistDesc.value,
            image: imageBase64,
            musics: []
        });
    }
    saveState();
    renderPlaylists();
    playlistModal.classList.remove('active');
};

deletePlaylist.onclick = () => {
    playlists = playlists.filter(p => p.id !== editingPlaylistId);
    saveState();
    renderPlaylists();
    playlistModal.classList.remove('active');
    renderHome();
};

function renderPlaylists(filterText = "") {
    playlistList.innerHTML = "";
    
    const filtered = playlists.filter(p => 
        p.name.toLowerCase().includes(filterText.toLowerCase())
    );

    filtered.forEach(p => {
        const li = document.createElement("li");
        li.classList.add("playlist-item");
        li.innerHTML = `
            <div class="playlist-thumb">${p.image ? `<img src="${p.image}">` : "🎵"}</div>
            <div class="playlist-text">
                <strong>${p.name}</strong><br>
                <small>${p.musics.length} músicas</small>
            </div>
        `;
        li.onclick = () => openPlaylistView(p);
        playlistList.appendChild(li);
    });
}

/* ========================================= */
/* CONSTRUÇÃO DO ACERVO DE MÚSICAS            */
/* ========================================= */

addMusicBtn.onclick = async () => {
    const files = await window.electronAPI.selectMusic();
    if (!files || !files.length) return;

    for (const file of files) {
        if (!musics.some(m => m.path === file)) {
            const tempAudio = new Audio();
            tempAudio.src = file;
            
            tempAudio.onloadedmetadata = () => {
                const rawName = file.split("\\").pop().split("/").pop();
                const cleanName = rawName.replace(/\.[^/.]+$/, "");

                musics.push({
                    name: cleanName,
                    path: file,
                    favorite: false,
                    duration: formatTime(tempAudio.duration)
                });
                saveState();
                renderHome();
            };
        }
    }
};

function createMusicCard(music) {
    const card = document.createElement("div");
    card.classList.add("music-card");

    card.innerHTML = `
        <div class="music-left">
            <div class="music-cover"></div>
            <div class="music-details">
                <div class="music-name-row" style="display: flex; align-items: center; gap: 10px;">
                    <h3>${music.name}</h3>
                    <span class="music-duration" style="font-size: 12px; color: #b3b3b3;">${music.duration || "--:--"}</span>
                </div>
            </div>
        </div>
        <div class="music-actions">
            <button class="delete-music-btn" title="Excluir música">🗑️</button>
            <button class="fav-btn ${music.favorite ? 'active' : ''}">${music.favorite ? '❤️' : '🤍'}</button>
            <button class="add-to-playlist">+</button>
        </div>
        <div class="playlist-popup">
            <h4>Adicionar à Playlist</h4>
            <div class="playlist-options"></div>
        </div>
    `;

    const deleteBtn = card.querySelector(".delete-music-btn");
    const favBtn    = card.querySelector(".fav-btn");
    const addBtn    = card.querySelector(".add-to-playlist");
    const popup     = card.querySelector(".playlist-popup");

    deleteBtn.onclick = (e) => {
        e.stopPropagation();
        if (confirm(`Deseja remover "${music.name}" da sua biblioteca?`)) {
            musics = musics.filter(m => m.path !== music.path);
            playlists.forEach(p => {
                p.musics = p.musics.filter(path => path !== music.path);
            });
            saveState();
            if (currentView === "home") renderHome();
            else if (currentView === "favorites") renderFavorites();
            else if (currentView === "playlist") openPlaylistView(currentPlaylist);
            renderPlaylists();
        }
    };

    favBtn.onclick = (e) => {
        e.stopPropagation();
        music.favorite = !music.favorite;
        favBtn.classList.toggle("active");
        favBtn.textContent = music.favorite ? '❤️' : '🤍';
        saveState();
        if (currentView === "favorites" && !music.favorite) card.remove();
    };

    addBtn.onclick = (e) => {
        e.stopPropagation();
        document.querySelectorAll('.playlist-popup').forEach(p => p !== popup && p.classList.remove('active'));
        popup.classList.toggle("active");
        renderPlaylistChecklist(music, card.querySelector(".playlist-options"));
    };

    card.onclick = (e) => {
        if (e.target.closest('.music-actions') || e.target.closest('.playlist-popup')) return;
        
        // Localiza o índice correto baseado na fila atual que o usuário está visualizando
        const currentQueue = getCurrentQueue();
        const queueIndex = currentQueue.findIndex(m => m.path === music.path);
        if (queueIndex !== -1) {
            playMusic(queueIndex);
        }
    };

    musicContainer.appendChild(card);
}

function renderPlaylistChecklist(music, container) {
    container.innerHTML = "";
    if (playlists.length === 0) {
        container.innerHTML = `<p class="no-data">Nenhuma playlist.</p>`;
        return;
    }
    playlists.forEach(p => {
        const item = document.createElement("div");
        item.classList.add("playlist-check-item");
        const isChecked = p.musics.includes(music.path);
        item.innerHTML = `
            <input type="checkbox" id="chk-${p.id}-${music.name}" ${isChecked ? 'checked' : ''}>
            <label for="chk-${p.id}-${music.name}">${p.name}</label>
        `;
        
        item.querySelector('input').onchange = (e) => {
            if (e.target.checked) {
                if (!p.musics.includes(music.path)) p.musics.push(music.path);
            } else {
                p.musics = p.musics.filter(path => path !== music.path);
            }
            saveState();
            renderPlaylists();
        };
        container.appendChild(item);
    });
}

// Fecha popups de playlist ao clicar fora
document.addEventListener('click', () => {
    document.querySelectorAll('.playlist-popup').forEach(p => p.classList.remove('active'));
});

/* ========================================= */
/* MOTOR AUDIO / EQUALIZADOR (WEB AUDIO API) */
/* ========================================= */

function initEqualizer() {
    if (audioCtx) return;

    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    audioSource = audioCtx.createMediaElementSource(audioPlayer);

    const frequencies = [60, 230, 910, 4000, 14000];
    let lastFilter = audioSource;

    frequencies.forEach((freq) => {
        const filter = audioCtx.createBiquadFilter();
        
        if (freq === 60) {
            filter.type = 'lowshelf';
        } else if (freq === 14000) {
            filter.type = 'highshelf';
        } else {
            filter.type = 'peaking';
        }

        filter.frequency.value = freq;
        filter.Q.value = 1.0;
        filter.gain.value = 0;

        lastFilter.connect(filter);
        lastFilter = filter;
        filters[freq] = filter;
    });

    lastFilter.connect(audioCtx.destination);

    // Sincronização retroativa: Se um preset foi escolhido ANTES do motor ligar, aplica agora!
    if (eqPreset.value !== "flat") {
        applyPresetValues(eqPreset.value);
    }
}

// Função dedicada para injetar os DBs nos Sliders visuais e nos Nós do Web Audio simultaneamente
function applyPresetValues(presetKey) {
    const selectedPreset = presets[presetKey];
    if (!selectedPreset) return;

    eqSliders.forEach((slider, idx) => {
        const freq = slider.dataset.frequency;
        const dbValue = selectedPreset[idx];
        
        // Atualiza a UI do controle deslizante
        slider.value = dbValue;
        
        // Atualiza o ganho de áudio em tempo real (se o contexto já existir)
        if (filters[freq]) {
            filters[freq].gain.value = dbValue;
        }
    });
}

// Manipulação direta via Sliders manuais
eqSliders.forEach((slider) => {
    slider.oninput = (e) => {
        const freq = e.target.dataset.frequency;
        const val = parseFloat(e.target.value);
        
        if (filters[freq]) {
            filters[freq].gain.value = val;
        }
        // Se mexeu em um slider individual, desmarca o seletor de preset ativo
        eqPreset.value = "flat";
    };
});

// Resposta reativa imediata ao alternar o Select de estilos musicais
eqPreset.onchange = (e) => {
    applyPresetValues(e.target.value);
};

toggleEqBtn.onclick = () => {
    equalizerDrawer.classList.toggle('active');
    toggleEqBtn.classList.toggle('active', equalizerDrawer.classList.contains('active'));
};

/* ========================================= */
/* CORE ENGINE DO PLAYER & AGENT DE LETRAS  */
/* ========================================= */

function playMusic(index) {
    const currentQueue = getCurrentQueue();
    const music = currentQueue[index];
    if (!music) return;
    
    initEqualizer();
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    currentIndex = index;
    audioPlayer.src = music.path;
    audioPlayer.play();
    
    currentMusic.textContent = music.name;
    fetchAndRenderLyrics(music);
    
    playPauseBtn.textContent = "⏸";
}

/**
 * Motor de busca híbrido com codificação estrita de URL e Fallback corrigido
 */
async function fetchAndRenderLyrics(music) {
    if (!music) return;

    let artist = "";
    let track = music.name;

    // Divide "Artista - Música" se houver hífen no nome do arquivo local
    if (music.name.includes("-")) {
        const parts = music.name.split("-");
        artist = parts[0].trim();
        track = parts.slice(1).join("-").trim();
    } else {
        // Fallback inteligente para termos famosos se o nome do arquivo for direto
        const lowerName = music.name.toLowerCase();
        if (lowerName.includes("poker face")) artist = "Lady Gaga";
        else if (lowerName.includes("i gotta feeling")) artist = "Black Eyed Peas";
    }

    // Injeta nos campos textuais da Sidebar
    lyricTrackName.textContent = track;
    lyricArtistName.textContent = artist || "Arquivo Local";
    lyricsScroller.innerHTML = `<p class="lyric-line loading">Buscando letra no Letras.mus.br... 🌐</p>`;
    lyricsScroller.scrollTop = 0;

    if (!navigator.onLine) {
        lyricsScroller.innerHTML = `<p class="lyric-line error">Sem conexão com a internet.</p>`;
        return;
    }

    // Codifica os parâmetros para evitar que quebras de espaço estraguem a URL do Electron
    const encodedArtist = encodeURIComponent(artist);
    const encodedTrack = encodeURIComponent(track);

    // --- TENTATIVA 1: API Direct Lyrics (Servidor estável) ---
    try {
        const letrasUrl = `https://api.lyrics.ovh/v1/${encodedArtist}/${encodedTrack}`;
        const response = await fetch(letrasUrl);
        
        if (response.ok) {
            const data = await response.json();
            if (data.lyrics) {
                // Formata quebras de linha para exibição no HTML da sidebar
                const formattedLyrics = data.lyrics
                    .replace(/\r\n/g, '<br>')
                    .replace(/\n/g, '<br>');
                
                lyricsScroller.innerHTML = `<div class="lyrics-text-content" style="line-height: 1.8; font-size: 15px; color: #e1e1e1; text-align: center;">${formattedLyrics}</div>`;
                return; 
            }
        }
    } catch (letrasErr) {
        console.warn("Servidor primário falhou. Alternando para o backup...", letrasErr);
    }

    // --- TENTATIVA 2: Fallback para Vagalume API (Chave Pública Corrigida) ---
    try {
        lyricsScroller.innerHTML = `<p class="lyric-line loading">Alternando para o servidor de backup... 🔄</p>`;
        
        const vagalumeUrl = `https://api.vagalume.com.br/search.php?art=${encodedArtist}&mus=${encodedTrack}&apikey=36caaa55569eedfa64ca140fa55cbef3`;
        const response = await fetch(vagalumeUrl);
        
        if (response.ok) {
            const data = await response.json();
            if ((data.type === 'exact' || data.type === 'aprox') && data.mus && data.mus[0]) {
                const musicData = data.mus[0];
                
                lyricTrackName.textContent = musicData.name;
                lyricArtistName.textContent = data.art.name;

                const formattedLyrics = musicData.text
                    .replace(/\r\n/g, '<br>')
                    .replace(/\n/g, '<br>');
                
                lyricsScroller.innerHTML = `<div class="lyrics-text-content" style="line-height: 1.8; font-size: 15px; color: #e1e1e1; text-align: center;">${formattedLyrics}</div>`;
                return;
            }
        }
    } catch (vagalumeErr) {
        console.error("Ambos os servidores de música falharam:", vagalumeErr);
    }

    // --- SE AMBOS FALHAREM OU NÃO ENCONTRAREM NADA ---
    if (artist) {
        lyricsScroller.innerHTML = `
            <p class="lyric-line placeholder" style="text-align: center; padding: 20px; color: #b3b3b3;">
                Letra não encontrada para:<br><strong style="color: #fff;">${artist} - ${track}</strong>.<br><br>
                <small>Verifique se o nome do arquivo bate com o título oficial no Spotify.</small>
            </p>`;
    } else {
        lyricsScroller.innerHTML = `
            <p class="lyric-line placeholder" style="text-align: center; padding: 20px; color: #b3b3b3;">
                Não foi possível identificar o artista.<br><br>
                <small>Dica: Renomeie o arquivo para: "Artista - Nome da Música"</small>
            </p>`;
    }
}

function togglePlayPause() {
    if (audioPlayer.paused) {
        initEqualizer();
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        audioPlayer.play();
        playPauseBtn.textContent = "⏸";
    } else {
        audioPlayer.pause();
        playPauseBtn.textContent = "▶";
    }
}

playPauseBtn.onclick = () => togglePlayPause();

function nextTrack() {
    const currentQueue = getCurrentQueue();
    if (currentQueue.length === 0) return;
    
    if (isShuffling) {
        let randomIndex;
        do {
            randomIndex = Math.floor(Math.random() * currentQueue.length);
        } while (randomIndex === currentIndex && currentQueue.length > 1);
        
        currentIndex = randomIndex;
    } else {
        currentIndex = (currentIndex + 1) % currentQueue.length;
    }
    
    playMusic(currentIndex);
}

function prevTrack() {
    const currentQueue = getCurrentQueue();
    if (currentQueue.length === 0) return;
    
    if (isShuffling) {
        let randomIndex;
        do {
            randomIndex = Math.floor(Math.random() * currentQueue.length);
        } while (randomIndex === currentIndex && currentQueue.length > 1);
        
        currentIndex = randomIndex;
    } else {
        currentIndex = (currentIndex - 1 + currentQueue.length) % currentQueue.length;
    }
    
    playMusic(currentIndex);
}

nextBtn.onclick = () => nextTrack();
prevBtn.onclick = () => prevTrack();

shuffleBtn.onclick = () => {
    isShuffling = !isShuffling;
    shuffleBtn.classList.toggle('active', isShuffling);
};

repeatBtn.onclick = () => {
    isRepeating = !isRepeating;
    repeatBtn.classList.toggle('active', isRepeating);
};

/* ========================================= */
/* EVENT LISTENERS DO MOTOR AUDIO            */
/* ========================================= */

audioPlayer.onended = () => {
    if (isRepeating) {
        audioPlayer.currentTime = 0;
        audioPlayer.play();
    } else {
        nextTrack();
    }
};

audioPlayer.ontimeupdate = () => {
    if (audioPlayer.duration) {
        progressBar.value = (audioPlayer.currentTime / audioPlayer.duration) * 100 || 0;
        currentTime.textContent = formatTime(audioPlayer.currentTime);
        duration.textContent = formatTime(audioPlayer.duration);
    }
};

progressBar.oninput = () => audioPlayer.currentTime = (progressBar.value / 100) * audioPlayer.duration;
volumeBar.oninput    = () => audioPlayer.volume = volumeBar.value;

/* ========================================= */
/* ATALHOS GLOBAIS (IPC INTERCEPTOR)         */
/* ========================================= */

if (window.electronAPI && window.electronAPI.onGlobalCommand) {
    window.electronAPI.onGlobalCommand((command) => {
        switch(command) {
            case 'play-pause':
                togglePlayPause();
                break;
            case 'next-track':
                nextTrack();
                break;
            case 'prev-track':
                prevTrack();
                break;
        }
    });
}

/* ========================================= */
/* CONVERSORES E FORMATADORES                */
/* ========================================= */

function formatTime(t) {
    if (!t || isNaN(t)) return "0:00";
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
}

function toBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

/* ========================================= */
/* INICIALIZAÇÃO                             */
/* ========================================= */

renderHome();
renderPlaylists();