const btnAdd = document.getElementById("addMusicBtn");
const lista = document.getElementById("lista");
const player = document.getElementById("player");

// 🎵 lista de músicas carregadas
let musicas = [];

// 🎧 renderizar lista
function renderizarLista() {
  lista.innerHTML = "";

  musicas.forEach((musica, index) => {
    const li = document.createElement("li");

    li.textContent = musica.nome;

    li.addEventListener("click", () => {
      player.src = musica.caminho;
      player.play();
    });

    lista.appendChild(li);
  });
}

// ➕ botão adicionar música
btnAdd.addEventListener("click", async () => {
  const arquivos = await window.api.selecionarMusicas();

  if (arquivos.length === 0) return;

  arquivos.forEach((caminho) => {
    const nome = caminho.split("\\").pop();

    musicas.push({
      nome: nome,
      caminho: caminho
    });
  });

  renderizarLista();
});