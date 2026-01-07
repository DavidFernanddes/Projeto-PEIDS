// controllers/contentController.js
const db = require('../config/db');

// Importar filmes da API TMDB
exports.importMoviesFromTMDB = async (req, res) => {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Falta API KEY' });

    const url = `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=pt-PT&page=1`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        const filmes = data.results;
        let count = 0;

        for (const movie of filmes) {
            // Verificar duplicados
            const [exists] = await db.query('SELECT id FROM contents WHERE tmdb_id = ?', [movie.id]);
            if (exists.length > 0) continue; 

            // Inserir Filme
            const sqlFilme = `INSERT INTO contents (tmdb_id, title, synopsis, type, release_date, poster_path, backdrop_path, vote_average) VALUES (?, ?, ?, 'movie', ?, ?, ?, ?)`;
            
            await db.query(sqlFilme, [
                movie.id, 
                movie.title, 
                movie.overview, 
                movie.release_date, 
                `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
                `https://image.tmdb.org/t/p/original${movie.backdrop_path}`,
                movie.vote_average
            ]);
            count++;
        }
        res.json({ message: `Sucesso! ${count} filmes importados.` });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro na importação externa' });
    }
};

// Listar Filmes
exports.getAllContents = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM contents ORDER BY created_at DESC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao listar' });
    }
};

// Detalhes do Filme
exports.getContentById = async (req, res) => {
    const { id } = req.params;
    try {
        const [movie] = await db.query('SELECT * FROM contents WHERE id = ?', [id]);
        
        if (movie.length === 0) {
            // Se não encontrar, envia erro JSON (e não HTML)
            return res.status(404).json({ error: 'Filme não encontrado' });
        }

        // Buscar Reviews
        const [reviews] = await db.query(
            `SELECT r.*, u.name as user_name 
             FROM reviews r 
             JOIN users u ON r.user_id = u.id 
             WHERE r.content_id = ?`, 
            [id]
        );

        // Devolver tudo
        res.json({ ...movie[0], reviews });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar detalhes' });
    }
};