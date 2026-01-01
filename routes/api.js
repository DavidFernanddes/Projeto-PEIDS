const express = require('express');
const router = express.Router();
const db = require('../config/db');

// 1. Rota de Teste
router.get('/status', (req, res) => {
    res.json({
        status: 'OK',
        mensagem: 'API a funcionar corretamente!'
    });
});

// 2. Rota para LISTAR filmes (Usada pelo Front-end)
router.get('/filmes', async (req, res) => {
    try {
        // todos os filmes à tabela 'contents'
        const [rows] = await db.query('SELECT * FROM contents');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar filmes à BD' });
    }
});

router.get('/importar', async (req, res) => {
    const apiKey = process.env.TMDB_API_KEY;

    if (!apiKey) {
        return res.status(500).send('ERRO: Falta a TMDB_API_KEY no ficheiro .env');
    }
    
    const url = `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=pt-PT&page=1`;

    try {
        console.log("A contactar o TMDB...");
        
        // fetch nativo do Node.js
        const resposta = await fetch(url);
        
        if (!resposta.ok) {
            throw new Error(`Erro no TMDB: ${resposta.status}`);
        }

        const dados = await resposta.json();
        const filmes = dados.results;
        
        let contador = 0;

        for (const filme of filmes) {
            
            // Dados vindos da API
            const titulo = filme.title || 'Sem Título';
            const sinopse = filme.overview || '';
            // Constrói o URL da imagem (o TMDB só dá o final do link)
            const imagem = filme.poster_path ? `https://image.tmdb.org/t/p/w500${filme.poster_path}` : null;
            const data = filme.release_date || null;
            const nota = filme.vote_average || 0;

            const sql = `
                INSERT INTO contents (title, synopsis, type, poster_path, release_date, vote_average)
                VALUES (?, ?, 'movie', ?, ?, ?)
            `;

            try {
                // Tenta inserir. Se falhar (ex: filme duplicado), vai para o catch
                await db.query(sql, [titulo, sinopse, imagem, data, nota]);
                contador++;
                console.log(`Inserido: ${titulo}`);
            } catch (err) {
                // Ignora erros de duplicação silenciosamente
            }
        }

        // Resposta final para o browser
        res.send(`
            <h1>Sucesso!</h1>
            <p>Foram importados <strong>${contador}</strong> filmes novos.</p>
            <p><a href="/">Voltar à Página Inicial</a></p>
        `);

    } catch (error) {
        console.error("Erro na importação:", error);
        res.status(500).send('Erro ao importar. Verificaste a API Key no ficheiro?');
    }
});

router.get('/filmes/:id', async (req, res) => {
    const idFilme = req.params.id;

    try {
        // '?' substituído pelo idFilme para segurança
        const [rows] = await db.query('SELECT * FROM contents WHERE id = ?', [idFilme]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Filme não encontrado' });
        }

        res.json(rows[0]); 

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar o filme' });
    }
});

module.exports = router;