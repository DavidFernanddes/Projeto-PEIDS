document.addEventListener('DOMContentLoaded', () => {
    // Só carrega filmes só na página que tem a div "conteudo-lista"
    if(document.getElementById('conteudo-lista')) {
        carregarFilmes();
    }
});

async function carregarFilmes() {
    try {
        const container = document.getElementById('conteudo-lista');
        container.innerHTML = '<p>A carregar catálogo...</p>';

        const resposta = await fetch('/api/filmes');
        const filmes = await resposta.json();

        container.innerHTML = ''; // Limpar loading

        if (filmes.length === 0) {
            container.innerHTML = '<p>Ainda não há filmes. Vá a /api/importar</p>';
            return;
        }

        filmes.forEach(filme => {
            const card = document.createElement('div');
            card.className = 'card';
            
            const imagem = filme.poster_path ? filme.poster_path : '/img/placeholder-poster.svg';

            // ATENÇÃO AO LINK NO HREF ABAIXO:
            // Agora aponta para pages/frontoffice/detalhes.html
            card.innerHTML = `
                <img src="${imagem}" alt="${filme.title}" style="width:100%; border-radius: 5px;">
                <h3>${filme.title}</h3>
                <span class="tag">${filme.type === 'movie' ? 'Filme' : 'Série'}</span>
                <p>⭐ ${filme.vote_average || 'N/A'}</p>
                
                <a href="pages/frontoffice/detalhes.html?id=${filme.id}" class="btn-detalhes" style="
                    display: block; 
                    text-align: center; 
                    background: #333; 
                    color: white; 
                    padding: 8px; 
                    text-decoration: none; 
                    margin-top: 10px; 
                    border-radius: 5px;">
                    Ver Detalhes
                </a>
            `;
            container.appendChild(card);
        });

    } catch (erro) {
        console.error('Erro:', erro);
    }
}