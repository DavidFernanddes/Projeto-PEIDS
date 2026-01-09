// controllers/actorsController.js
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

    // Buscar pt-PT e en-US para fallback de biografia (muitas vezes PT vem vazio)
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

// Listar todos os atores
exports.getAllActors = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM actors ORDER BY name ASC');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao listar atores' });
    }
};

// Obter detalhes de um ator
exports.getActorById = async (req, res) => {
    const { id } = req.params;
    try {
        const [actors] = await db.query('SELECT * FROM actors WHERE id = ?', [id]);
        
        if (actors.length === 0) {
            return res.status(404).json({ error: 'Ator não encontrado' });
        }

        // Enriquecer (lazy) biografia/data a partir do TMDB quando faltar na BD
        let actor = actors[0];
        const apiKey = process.env.TMDB_API_KEY;
        const needsBio = !actor.biography || String(actor.biography).trim().length === 0;
        const needsBirth = !actor.birth_date;

        if ((needsBio || needsBirth) && actor.tmdb_id && apiKey) {
            const details = await fetchPersonDetails(apiKey, actor.tmdb_id);
            if (details) {
                const biography = details.biography || actor.biography;
                const birthDate = details.birthday || actor.birth_date;
                const profilePath = details.profile_path ? `https://image.tmdb.org/t/p/w500${details.profile_path}` : actor.profile_path;

                await db.query(
                    'UPDATE actors SET biography = COALESCE(?, biography), birth_date = COALESCE(?, birth_date), profile_path = COALESCE(?, profile_path) WHERE id = ?',
                    [biography || null, birthDate || null, profilePath || null, actor.id]
                );

                actor = {
                    ...actor,
                    biography: biography || actor.biography,
                    birth_date: birthDate || actor.birth_date,
                    profile_path: profilePath || actor.profile_path,
                    biography_language: details.biography_language || null
                };
            }
        }

        // Buscar filmes/séries em que participou
        const [contents] = await db.query(
            `SELECT c.*, ca.character_name 
             FROM contents c 
             JOIN content_actors ca ON c.id = ca.content_id 
             WHERE ca.actor_id = ? 
             ORDER BY c.release_date DESC`,
            [id]
        );

        res.json({ ...actor, contents });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar ator' });
    }
};

