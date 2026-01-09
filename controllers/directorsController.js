// controllers/directorsController.js
const db = require('../config/db');

async function fetchJson(url) {
    const res = await fetch(url);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const msg = data?.status_message || data?.error || `HTTP ${res.status}`;
        throw new Error(msg);
    }
    return data;
}

async function fetchPersonDetails(apiKey, tmdbPersonId) {
    if (!apiKey || !tmdbPersonId) return null;

    const base = `https://api.themoviedb.org/3/person/${tmdbPersonId}?api_key=${apiKey}`;

    const pt = await fetchJson(`${base}&language=pt-PT`).catch(() => null);
    const en = await fetchJson(`${base}&language=en-US`).catch(() => null);

    const ptBio = pt?.biography && String(pt.biography).trim().length > 0 ? pt.biography : null;
    const enBio = en?.biography && String(en.biography).trim().length > 0 ? en.biography : null;

    return {
        biography: ptBio || enBio || null,
        biography_language: ptBio ? 'pt-PT' : (enBio ? 'en-US' : null),
        birthday: pt?.birthday || en?.birthday || null,
        profile_path: pt?.profile_path || en?.profile_path || null,
    };
}

// Listar todos os diretores
exports.getAllDirectors = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM directors ORDER BY name ASC');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao listar diretores' });
    }
};

// Obter detalhes de um diretor
exports.getDirectorById = async (req, res) => {
    const { id } = req.params;
    try {
        const [directors] = await db.query('SELECT * FROM directors WHERE id = ?', [id]);
        
        if (directors.length === 0) {
            return res.status(404).json({ error: 'Diretor não encontrado' });
        }

        // Enriquecer (lazy) biografia/data a partir do TMDB quando faltar na BD
        let director = directors[0];
        const apiKey = process.env.TMDB_API_KEY;
        const needsBio = !director.biography || String(director.biography).trim().length === 0;
        const needsBirth = !director.birth_date;

        if ((needsBio || needsBirth) && director.tmdb_id && apiKey) {
            const details = await fetchPersonDetails(apiKey, director.tmdb_id);
            if (details) {
                const biography = details.biography || director.biography;
                const birthDate = details.birthday || director.birth_date;
                const profilePath = details.profile_path ? `https://image.tmdb.org/t/p/w500${details.profile_path}` : director.profile_path;

                await db.query(
                    'UPDATE directors SET biography = COALESCE(?, biography), birth_date = COALESCE(?, birth_date), profile_path = COALESCE(?, profile_path) WHERE id = ?',
                    [biography || null, birthDate || null, profilePath || null, director.id]
                );

                director = {
                    ...director,
                    biography: biography || director.biography,
                    birth_date: birthDate || director.birth_date,
                    profile_path: profilePath || director.profile_path,
                    biography_language: details.biography_language || null
                };
            }
        }

        // Buscar filmes/séries que dirigiu
        const [contents] = await db.query(
            `SELECT c.* 
             FROM contents c 
             JOIN content_directors cd ON c.id = cd.content_id 
             WHERE cd.director_id = ? 
             ORDER BY c.release_date DESC`,
            [id]
        );

        res.json({ ...director, contents });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar diretor' });
    }
};

