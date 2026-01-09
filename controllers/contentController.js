/**
 * controllers/contentController.js
 * 
 * Controlador responsável pela gestão de conteúdos (filmes e séries).
 * Inclui funcionalidades de listagem, pesquisa, importação da TMDB e gestão de detalhes.
 * 
 * @author David Fernandes, João Rôlo & Sorin Revenco
 * @version 1.0
 * @date 2026
 */

const db = require('../config/db');

/**
 * Helper Functions - Funções auxiliares para importação e gestão de dados
 */

/**
 * Obtém ou cria um género na base de dados
 * @param {string} genreName - Nome do género
 * @returns {Promise<number>} ID do género na BD
 */
async function getOrCreateGenre(genreName) {
    if (!genreName || typeof genreName !== 'string') return null;
    
    const [existing] = await db.query('SELECT id FROM genres WHERE name = ?', [genreName.trim()]);
    if (existing.length > 0) return existing[0].id;
    
    const [result] = await db.query('INSERT INTO genres (name) VALUES (?)', [genreName.trim()]);
    return result.insertId;
}

/**
 * Faz uma requisição HTTP e retorna os dados JSON
 * @param {string} url - URL da requisição
 * @returns {Promise<Object>} Dados JSON da resposta
 * @throws {Error} Se a requisição falhar
 */
async function fetchJson(url) {
    try {
    const res = await fetch(url);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const msg = data?.status_message || data?.error || `HTTP ${res.status}`;
        throw new Error(msg);
    }
    return data;
    } catch (error) {
        console.error(`Erro ao fazer fetch para ${url}:`, error.message);
        throw error;
    }
}

/**
 * Busca o URL do trailer de um conteúdo na TMDB
 * @param {string} apiKey - API Key do TMDB
 * @param {string} mediaType - Tipo de media ('movie' ou 'tv')
 * @param {number} tmdbId - ID do conteúdo no TMDB
 * @returns {Promise<string|null>} URL do trailer ou null se não encontrado
 */
async function fetchTrailerUrl(apiKey, mediaType, tmdbId) {
    try {
        const videosUrl = `https://api.themoviedb.org/3/${mediaType}/${tmdbId}/videos?api_key=${apiKey}&language=pt-PT`;
        const videosData = await fetchJson(videosUrl);
        // Procura primeiro por trailer oficial, depois qualquer trailer do YouTube
        const youtubeTrailer = (videosData.results || []).find(v => 
            v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
        );
        return youtubeTrailer ? `https://www.youtube.com/watch?v=${youtubeTrailer.key}` : null;
    } catch (error) {
        console.warn(`Erro ao buscar trailer para ${mediaType} ${tmdbId}:`, error.message);
        return null;
    }
}

/**
 * Obtém ou cria um ator na base de dados
 * Se o ator já existir (por tmdb_id), retorna o ID existente
 * Caso contrário, cria um novo registo
 * @param {Object} actorData - Dados do ator {id, name, profile_path}
 * @returns {Promise<number|null>} ID do ator na BD ou null se dados inválidos
 */
async function getOrCreateActor(actorData) {
    if (!actorData || !actorData.id || !actorData.name) return null;
    
    // Validar que o nome não está vazio após trim (importante para caracteres especiais/japoneses)
    const trimmedName = String(actorData.name || '').trim();
    if (trimmedName.length === 0) {
        console.warn(`Ator com ID ${actorData.id} tem nome vazio, ignorando...`);
        return null;
    }
    
    const [existing] = await db.query('SELECT id FROM actors WHERE tmdb_id = ?', [actorData.id]);
    if (existing.length > 0) return existing[0].id;
    
    const profilePath = actorData.profile_path 
        ? `https://image.tmdb.org/t/p/w500${actorData.profile_path}` 
        : null;
    
    const [result] = await db.query(
        'INSERT INTO actors (tmdb_id, name, profile_path) VALUES (?, ?, ?)',
        [actorData.id, trimmedName, profilePath]
    );
    return result.insertId;
}

/**
 * Obtém ou cria um diretor na base de dados
 * Se o diretor já existir (por tmdb_id), retorna o ID existente
 * Caso contrário, cria um novo registo
 * @param {Object} directorData - Dados do diretor {id, name, profile_path}
 * @returns {Promise<number|null>} ID do diretor na BD ou null se dados inválidos
 */
async function getOrCreateDirector(directorData) {
    if (!directorData || !directorData.id || !directorData.name) return null;
    
    // Validar que o nome não está vazio após trim (importante para caracteres especiais/japoneses)
    const trimmedName = String(directorData.name || '').trim();
    if (trimmedName.length === 0) {
        console.warn(`Diretor com ID ${directorData.id} tem nome vazio, ignorando...`);
        return null;
    }
    
    const [existing] = await db.query('SELECT id FROM directors WHERE tmdb_id = ?', [directorData.id]);
    if (existing.length > 0) return existing[0].id;
    
    const profilePath = directorData.profile_path 
        ? `https://image.tmdb.org/t/p/w500${directorData.profile_path}` 
        : null;
    
    const [result] = await db.query(
        'INSERT INTO directors (tmdb_id, name, profile_path) VALUES (?, ?, ?)',
        [directorData.id, trimmedName, profilePath]
    );
    return result.insertId;
}

/**
 * Busca detalhes de um conteúdo na TMDB com fallback para inglês
 * Tenta primeiro em português (pt-PT), se a sinopse estiver vazia, usa inglês como fallback
 * @param {string} apiKey - API Key do TMDB
 * @param {string} mediaType - Tipo de media ('movie' ou 'tv')
 * @param {number} tmdbId - ID do conteúdo no TMDB
 * @returns {Promise<Object>} Objeto com {primary: dadosPT, fallback: dadosEN}
 */
async function fetchContentDetailsWithFallback(apiKey, mediaType, tmdbId) {
    const base = `https://api.themoviedb.org/3/${mediaType}/${tmdbId}?api_key=${apiKey}`;
    
    // Tentar primeiro em português
    const pt = await fetchJson(`${base}&language=pt-PT`).catch(() => null);
    
    // Se tiver sinopse em português, usar apenas PT
    if (pt && pt.overview && String(pt.overview).trim().length > 0) {
        return { primary: pt, fallback: null };
    }

    // Fallback para inglês se sinopse PT estiver vazia
    const en = await fetchJson(`${base}&language=en-US`).catch(() => null);
    return { primary: pt || {}, fallback: en };
}

/**
 * Importa um conteúdo específico da TMDB para a base de dados
 * Esta função realiza uma importação completa incluindo:
 * - Detalhes do conteúdo (título, sinopse, datas, ratings, etc.)
 * - Trailer (se disponível)
 * - Géneros
 * - Elenco principal (primeiros 10 atores)
 * - Diretores/Criadores
 * 
 * @param {number} tmdbId - ID do conteúdo no TMDB
 * @param {string} type - Tipo de conteúdo ('movie' ou 'series')
 * @returns {Promise<number>} ID do conteúdo na base de dados
 * @throws {Error} Se a API key estiver faltando ou o conteúdo não for encontrado
 */
async function importSingleContent(tmdbId, type) {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) throw new Error('Falta API KEY do TMDB');

    const mediaType = type === 'movie' ? 'movie' : 'tv';
    
    // 1. Buscar detalhes do conteúdo (com fallback para inglês se necessário)
    const { primary: detailsPt, fallback: detailsEn } = await fetchContentDetailsWithFallback(apiKey, mediaType, tmdbId);
    const detailsData = detailsPt || {};
    const fallbackData = detailsEn || {};

    if (!detailsData.id) {
        throw new Error(`Conteúdo não encontrado no TMDB (ID: ${tmdbId}, Tipo: ${type})`);
    }

    // 2. Verificar se já existe na base de dados
    const [exists] = await db.query('SELECT id FROM contents WHERE tmdb_id = ? AND type = ?', [tmdbId, type]);
    if (exists.length > 0) {
        console.log(`Conteúdo ${tmdbId} (${type}) já existe na BD, retornando ID existente`);
        return exists[0].id;
    }

    // 3. Buscar trailer
    const trailerUrl = await fetchTrailerUrl(apiKey, mediaType, tmdbId);

    // 4. Preparar sinopse (usar PT se disponível, senão EN, senão mensagem padrão)
    const synopsis =
        (detailsData.overview && String(detailsData.overview).trim().length > 0)
            ? detailsData.overview.trim()
            : ((fallbackData.overview && String(fallbackData.overview).trim().length > 0)
                ? fallbackData.overview.trim()
                : 'Sinopse não disponível.');

    // 5. Preparar dados para inserção
    const title = detailsData.title || detailsData.name || 'Título não disponível';
    const releaseDate = detailsData.release_date || detailsData.first_air_date || null;
    const posterPath = detailsData.poster_path 
        ? `https://image.tmdb.org/t/p/w500${detailsData.poster_path}` 
        : null;
    const backdropPath = detailsData.backdrop_path 
        ? `https://image.tmdb.org/t/p/original${detailsData.backdrop_path}` 
        : null;
    const voteAverage = parseFloat(detailsData.vote_average) || 0;
    const duration = type === 'movie' 
        ? (detailsData.runtime || null) 
        : (detailsData.number_of_episodes || null);

    // 6. Inserir conteúdo na base de dados
    const [result] = await db.query(
        `INSERT INTO contents (tmdb_id, title, synopsis, type, release_date, poster_path, backdrop_path, vote_average, duration, trailer_url) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [tmdbId, title, synopsis, type, releaseDate, posterPath, backdropPath, voteAverage, duration, trailerUrl]
    );

    const contentId = result.insertId;
    console.log(`Conteúdo importado: ${title} (ID: ${contentId})`);

    // 7. Importar géneros
    if (detailsData.genres && Array.isArray(detailsData.genres) && detailsData.genres.length > 0) {
        for (const genre of detailsData.genres) {
            if (genre && genre.name) {
            const genreId = await getOrCreateGenre(genre.name);
                if (genreId) {
                    await db.query('INSERT IGNORE INTO content_genres (content_id, genre_id) VALUES (?, ?)', 
                        [contentId, genreId]);
                }
            }
        }
    }

    // 8. Importar elenco e diretores
    try {
    const creditsUrl = `https://api.themoviedb.org/3/${mediaType}/${tmdbId}/credits?api_key=${apiKey}`;
    const creditsData = await fetchJson(creditsUrl);

        // 8.1 Diretores/Criadores
    if (type === 'movie') {
            // Para filmes: buscar diretores do crew
            const directors = (creditsData.crew || []).filter(p => 
                p.job === 'Director' || p.job === 'Co-Director'
            );
            for (const director of directors.slice(0, 5)) { // Até 5 diretores
                if (director && director.id && director.name) {
                    const directorId = await getOrCreateDirector({ 
                        id: director.id, 
                        name: director.name, 
                        profile_path: director.profile_path 
                    });
            if (directorId) {
                        await db.query('INSERT IGNORE INTO content_directors (content_id, director_id) VALUES (?, ?)', 
                            [contentId, directorId]);
                    }
            }
        }
    } else {
            // Para séries: buscar criadores de múltiplas fontes
            // 1. Primeiro tentar created_by do endpoint principal (mais confiável para séries)
            let creators = [];
            try {
                const tvDetailsUrl = `https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${apiKey}&language=pt-PT`;
                const tvDetailsData = await fetchJson(tvDetailsUrl);
                creators = tvDetailsData.created_by || [];
                console.log(`Série ${tmdbId}: ${creators.length} criadores do endpoint principal`);
            } catch (error) {
                console.warn(`Erro ao buscar detalhes da série ${tmdbId} para criadores:`, error.message);
            }
            
            // 2. Se não houver no endpoint principal, tentar credits
            if (creators.length === 0) {
                creators = creditsData.created_by || [];
                console.log(`Série ${tmdbId}: ${creators.length} criadores do endpoint credits`);
            }
            
            // 3. Se ainda não houver, tentar buscar no crew com job "Creator" ou "Series Creator"
            if (creators.length === 0) {
                const crewCreators = (creditsData.crew || []).filter(p => 
                    p.job === 'Creator' || p.job === 'Series Creator' || p.job === 'Executive Producer'
                );
                creators = crewCreators;
                console.log(`Série ${tmdbId}: ${creators.length} criadores do crew`);
            }
            
            // Importar criadores encontrados
            for (const creator of creators.slice(0, 5)) {
                if (creator && creator.id && creator.name && String(creator.name).trim().length > 0) {
                    const directorId = await getOrCreateDirector({ 
                        id: creator.id, 
                        name: creator.name.trim(), 
                        profile_path: creator.profile_path 
                    });
            if (directorId) {
                        await db.query('INSERT IGNORE INTO content_directors (content_id, director_id) VALUES (?, ?)', 
                            [contentId, directorId]);
                    }
            }
        }
    }

        // 8.2 Elenco principal (primeiros 10 atores para ter mais informação)
        const mainCast = (creditsData.cast || []).slice(0, 10);
    for (const actor of mainCast) {
            if (actor && actor.id && actor.name) {
                const actorId = await getOrCreateActor({ 
                    id: actor.id, 
                    name: actor.name, 
                    profile_path: actor.profile_path 
                });
        if (actorId) {
            await db.query('INSERT IGNORE INTO content_actors (content_id, actor_id, character_name) VALUES (?, ?, ?)', 
                        [contentId, actorId, actor.character ? actor.character.trim() : null]);
        }
            }
        }
    } catch (error) {
        console.warn(`Erro ao importar elenco/diretores para ${tmdbId}:`, error.message);
        // Continuar mesmo se falhar - o conteúdo já foi inserido
    }

    return contentId;
}

/**
 * Importa múltiplos filmes e séries da API TMDB em lote
 * Importa conteúdos populares e opcionalmente os melhor classificados
 * 
 * @param {Object} req - Request object
 * @param {Object} req.query - Query parameters
 * @param {string} req.query.pages - Número de páginas a importar (default: 2, max: 10)
 * @param {string} req.query.top_rated - Incluir top rated? ('1' ou '0', default: '1')
 * @param {Object} res - Response object
 * @returns {Promise<void>}
 */
exports.importMoviesFromTMDB = async (req, res) => {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'Falta API KEY do TMDB' });
    }

    try {
        let countMovies = 0;
        let countSeries = 0;
        let errors = [];
        
        // Configurar parâmetros de importação
        const pages = Math.max(1, Math.min(parseInt(req.query.pages || '2', 10) || 2, 10)); // default 2, max 10
        const includeTopRated = String(req.query.top_rated || '1') !== '0'; // default on

        /**
         * Função auxiliar para importar uma coleção (popular ou top_rated)
         * @param {string} mediaType - 'movie' ou 'tv'
         * @param {string} endpoint - 'popular' ou 'top_rated'
         * @param {string} type - 'movie' ou 'series'
         */
        async function importCollection(mediaType, endpoint, type) {
            for (let page = 1; page <= pages; page++) {
                try {
                const url = `https://api.themoviedb.org/3/${mediaType}/${endpoint}?api_key=${apiKey}&language=pt-PT&page=${page}`;
                const data = await fetchJson(url);
                    
                    if (!data.results || !Array.isArray(data.results)) {
                        console.warn(`Sem resultados na página ${page} de ${endpoint} (${type})`);
                        continue;
                    }
                    
                    for (const item of data.results) {
                    const tmdbId = item.id;
                    if (!tmdbId) continue;

                        // Verificar se já existe (evitar duplicados)
                        const [exists] = await db.query('SELECT id FROM contents WHERE tmdb_id = ? AND type = ?', 
                            [tmdbId, type]);
                        if (exists.length > 0) {
                            console.log(`Conteúdo ${tmdbId} (${type}) já existe, ignorando...`);
                            continue;
                        }

                        // Importar conteúdo
                        try {
                    await importSingleContent(tmdbId, type);
                    if (type === 'movie') countMovies++;
                    else countSeries++;
                        } catch (importError) {
                            console.error(`Erro ao importar ${tmdbId} (${type}):`, importError.message);
                            errors.push({ tmdbId, type, error: importError.message });
                        }
                    }
                } catch (pageError) {
                    console.error(`Erro na página ${page} de ${endpoint} (${type}):`, pageError.message);
                    errors.push({ page, endpoint, type, error: pageError.message });
                }
            }
        }

        // Importar conteúdos populares
        console.log('Iniciando importação de conteúdos populares...');
        await importCollection('movie', 'popular', 'movie');
        await importCollection('tv', 'popular', 'series');

        // Importar top rated (opcional)
        if (includeTopRated) {
            console.log('Iniciando importação de conteúdos melhor classificados...');
            await importCollection('movie', 'top_rated', 'movie');
            await importCollection('tv', 'top_rated', 'series');
        }

        // Preparar resposta
        const response = {
            message: `Importação concluída! ${countMovies} filmes e ${countSeries} séries importados.`,
            pages,
            top_rated: includeTopRated,
            imported: {
                movies: countMovies,
                series: countSeries,
                total: countMovies + countSeries
            }
        };

        // Adicionar erros se houver
        if (errors.length > 0) {
            response.warnings = `${errors.length} erros durante a importação`;
            response.errors = errors.slice(0, 10); // Limitar a 10 erros na resposta
        }

        res.json(response);

    } catch (error) {
        console.error('Erro crítico na importação:', error);
        res.status(500).json({ 
            error: 'Erro na importação externa',
            details: error.message 
        });
    }
}

// Importar conteúdo individual por TMDB ID
exports.importContentByTmdbId = async (req, res) => {
    const { tmdbId, type } = req.body;
    
    if (!tmdbId || !type) {
        return res.status(400).json({ error: 'tmdbId e type são obrigatórios' });
    }

    try {
        const contentId = await importSingleContent(tmdbId, type);
        res.json({ message: 'Conteúdo importado com sucesso', contentId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message || 'Erro ao importar conteúdo' });
    }
};

// Listar Filmes
exports.getAllContents = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                c.*,
                GROUP_CONCAT(DISTINCT g.name ORDER BY g.name SEPARATOR '|') AS genres
            FROM contents c
            LEFT JOIN content_genres cg ON cg.content_id = c.id
            LEFT JOIN genres g ON g.id = cg.genre_id
            GROUP BY c.id
            ORDER BY c.created_at DESC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao listar' });
    }
};

// Listar géneros usados no catálogo (para filtros)
exports.getCatalogGenres = async (req, res) => {
    const { type = 'all' } = req.query; // all | movie | series
    try {
        let sql = `
            SELECT 
                g.id,
                g.name,
                COUNT(DISTINCT c.id) AS count
            FROM genres g
            JOIN content_genres cg ON cg.genre_id = g.id
            JOIN contents c ON c.id = cg.content_id
        `;
        const params = [];
        if (type === 'movie' || type === 'series') {
            sql += ` WHERE c.type = ? `;
            params.push(type);
        }
        sql += `
            GROUP BY g.id, g.name
            ORDER BY g.name ASC
        `;

        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao listar géneros' });
    }
};

// Pesquisar filmes/séries usando TMDB
exports.searchContents = async (req, res) => {
    const { query } = req.query;
    const apiKey = process.env.TMDB_API_KEY;

    if (!query) {
        return res.status(400).json({ error: 'Parâmetro de pesquisa é obrigatório' });
    }

    if (!apiKey) {
        return res.status(500).json({ error: 'Falta API KEY do TMDB' });
    }

    try {
        // Pesquisar na API TMDB
        const searchUrl = `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&language=pt-PT&query=${encodeURIComponent(query)}`;
        const response = await fetch(searchUrl);
        const data = await response.json();

        // Filtrar apenas filmes e séries
        const results = (data.results || []).filter(item => 
            (item.media_type === 'movie' || item.media_type === 'tv')
        ).map(item => ({
            tmdb_id: item.id,
            title: item.title || item.name,
            synopsis: item.overview,
            type: item.media_type === 'movie' ? 'movie' : 'series',
            release_date: item.release_date || item.first_air_date,
            poster_path: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
            backdrop_path: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : null,
            vote_average: item.vote_average
        }));

        res.json(results);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao pesquisar' });
    }
};

// Trending (dia/semana)
exports.getTrending = async (req, res) => {
    const apiKey = process.env.TMDB_API_KEY;
    const { time_window = 'day' } = req.query; // day ou week

    if (!apiKey) {
        return res.status(500).json({ error: 'Falta API KEY do TMDB' });
    }

    try {
        const url = `https://api.themoviedb.org/3/trending/all/${time_window}?api_key=${apiKey}&language=pt-PT`;
        const response = await fetch(url);
        const data = await response.json();

        const results = (data.results || []).filter(item => 
            (item.media_type === 'movie' || item.media_type === 'tv')
        ).map(item => ({
            tmdb_id: item.id,
            title: item.title || item.name,
            synopsis: item.overview,
            type: item.media_type === 'movie' ? 'movie' : 'series',
            release_date: item.release_date || item.first_air_date,
            poster_path: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
            backdrop_path: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : null,
            vote_average: item.vote_average
        }));

        res.json(results);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar trending' });
    }
};

// Popular
exports.getPopular = async (req, res) => {
    const apiKey = process.env.TMDB_API_KEY;
    const { type = 'all' } = req.query; // all, movie, tv

    if (!apiKey) {
        return res.status(500).json({ error: 'Falta API KEY do TMDB' });
    }

    try {
        let url;
        if (type === 'all') {
            // Combinar popular movies e tv
            const [moviesRes, tvRes] = await Promise.all([
                fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=pt-PT&page=1`),
                fetch(`https://api.themoviedb.org/3/tv/popular?api_key=${apiKey}&language=pt-PT&page=1`)
            ]);
            const moviesData = await moviesRes.json();
            const tvData = await tvRes.json();
            
            const allResults = [
                ...(moviesData.results || []).map(item => ({ ...item, media_type: 'movie' })),
                ...(tvData.results || []).map(item => ({ ...item, media_type: 'tv' }))
            ];

            const results = allResults.map(item => ({
                tmdb_id: item.id,
                title: item.title || item.name,
                synopsis: item.overview,
                type: item.media_type === 'movie' ? 'movie' : 'series',
                release_date: item.release_date || item.first_air_date,
                poster_path: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
                backdrop_path: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : null,
                vote_average: item.vote_average
            }));

            return res.json(results);
        } else {
            const mediaType = type === 'movie' ? 'movie' : 'tv';
            url = `https://api.themoviedb.org/3/${mediaType}/popular?api_key=${apiKey}&language=pt-PT&page=1`;
        }

        const response = await fetch(url);
        const data = await response.json();

        const results = (data.results || []).map(item => ({
            tmdb_id: item.id,
            title: item.title || item.name,
            synopsis: item.overview,
            type: type === 'movie' ? 'movie' : 'series',
            release_date: item.release_date || item.first_air_date,
            poster_path: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
            backdrop_path: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : null,
            vote_average: item.vote_average
        }));

        res.json(results);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar popular' });
    }
};

// Top Rated
exports.getTopRated = async (req, res) => {
    const apiKey = process.env.TMDB_API_KEY;
    const { type = 'all' } = req.query; // all, movie, tv

    if (!apiKey) {
        return res.status(500).json({ error: 'Falta API KEY do TMDB' });
    }

    try {
        let url;
        if (type === 'all') {
            const [moviesRes, tvRes] = await Promise.all([
                fetch(`https://api.themoviedb.org/3/movie/top_rated?api_key=${apiKey}&language=pt-PT&page=1`),
                fetch(`https://api.themoviedb.org/3/tv/top_rated?api_key=${apiKey}&language=pt-PT&page=1`)
            ]);
            const moviesData = await moviesRes.json();
            const tvData = await tvRes.json();
            
            const allResults = [
                ...(moviesData.results || []).map(item => ({ ...item, media_type: 'movie' })),
                ...(tvData.results || []).map(item => ({ ...item, media_type: 'tv' }))
            ];

            const results = allResults.map(item => ({
                tmdb_id: item.id,
                title: item.title || item.name,
                synopsis: item.overview,
                type: item.media_type === 'movie' ? 'movie' : 'series',
                release_date: item.release_date || item.first_air_date,
                poster_path: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
                backdrop_path: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : null,
                vote_average: item.vote_average
            }));

            return res.json(results);
        } else {
            const mediaType = type === 'movie' ? 'movie' : 'tv';
            url = `https://api.themoviedb.org/3/${mediaType}/top_rated?api_key=${apiKey}&language=pt-PT&page=1`;
        }

        const response = await fetch(url);
        const data = await response.json();

        const results = (data.results || []).map(item => ({
            tmdb_id: item.id,
            title: item.title || item.name,
            synopsis: item.overview,
            type: type === 'movie' ? 'movie' : 'series',
            release_date: item.release_date || item.first_air_date,
            poster_path: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
            backdrop_path: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : null,
            vote_average: item.vote_average
        }));

        res.json(results);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar top rated' });
    }
};

// Buscar conteúdo por TMDB ID (para quando não existe na BD)
exports.getContentByTmdbId = async (req, res) => {
    const { tmdb_id } = req.params;
    const apiKey = process.env.TMDB_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Falta API KEY do TMDB' });
    }

    try {
        // Primeiro tentar buscar na BD
        const [existing] = await db.query('SELECT * FROM contents WHERE tmdb_id = ?', [tmdb_id]);
        if (existing.length > 0) {
            return res.json(existing[0]);
        }

        // Se não existir, importar automaticamente
        // Determinar o tipo (precisamos fazer uma busca para saber)
        const searchUrl = `https://api.themoviedb.org/3/find/${tmdb_id}?api_key=${apiKey}&external_source=imdb_id`;
        // Melhor: tentar movie primeiro, depois tv
        let type = 'movie';
        let detailsUrl = `https://api.themoviedb.org/3/movie/${tmdb_id}?api_key=${apiKey}&language=pt-PT`;
        let response = await fetch(detailsUrl);
        
        if (!response.ok) {
            type = 'series';
            detailsUrl = `https://api.themoviedb.org/3/tv/${tmdb_id}?api_key=${apiKey}&language=pt-PT`;
            response = await fetch(detailsUrl);
        }

        if (!response.ok) {
            return res.status(404).json({ error: 'Conteúdo não encontrado no TMDB' });
        }

        // Importar o conteúdo
        const contentId = await importSingleContent(tmdb_id, type);
        
        // Buscar o conteúdo importado
        const [content] = await db.query('SELECT * FROM contents WHERE id = ?', [contentId]);
        res.json(content[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar conteúdo' });
    }
};

// Detalhes de um filme/série
exports.getContentById = async (req, res) => {
    const { id } = req.params;
    const apiKey = process.env.TMDB_API_KEY;
    try {
        let [movie] = await db.query('SELECT * FROM contents WHERE id = ?', [id]);
        if (movie.length === 0) {
            [movie] = await db.query('SELECT * FROM contents WHERE tmdb_id = ?', [id]);
        }
        // Se não existir na BD, tentar importar automaticamente do TMDB (resolve links por tmdb_id)
        if (movie.length === 0 && apiKey) {
            let type = 'movie';
            const movieUrl = `https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}&language=pt-PT`;
            const tvUrl = `https://api.themoviedb.org/3/tv/${id}?api_key=${apiKey}&language=pt-PT`;

            try {
                await fetchJson(movieUrl);
            } catch {
                type = 'series';
                await fetchJson(tvUrl);
            }

            const contentId = await importSingleContent(id, type);
            [movie] = await db.query('SELECT * FROM contents WHERE id = ?', [contentId]);
        }

        if (movie.length === 0) {
            return res.status(404).json({ error: 'Conteúdo não encontrado' });
        }

        const content = movie[0];
        const contentId = content.id;
        const tmdbId = content.tmdb_id;
        const contentType = content.type;

        // Se a sinopse foi gravada como placeholder (por falta de pt-PT), tentar enriquecer com fallback en-US
        if (tmdbId && apiKey && (!content.synopsis || String(content.synopsis).trim() === '' || String(content.synopsis).trim() === 'Sinopse não disponível.')) {
            try {
                const mediaType = contentType === 'movie' ? 'movie' : 'tv';
                const { primary: pt, fallback: en } = await fetchContentDetailsWithFallback(apiKey, mediaType, tmdbId);
                const candidate = (pt?.overview && String(pt.overview).trim().length > 0)
                    ? pt.overview
                    : ((en?.overview && String(en.overview).trim().length > 0) ? en.overview : null);
                if (candidate) {
                    await db.query('UPDATE contents SET synopsis = ? WHERE id = ?', [candidate, contentId]);
                    content.synopsis = candidate;
                }
            } catch {
                // ignore
            }
        }

        // Buscar géneros
        const [genres] = await db.query(
            `SELECT g.name FROM genres g 
             JOIN content_genres cg ON g.id = cg.genre_id 
             WHERE cg.content_id = ?`,
            [contentId]
        );

        // Buscar atores da BD
        let [actors] = await db.query(
            `SELECT a.id, a.name, a.profile_path, ca.character_name 
             FROM actors a 
             JOIN content_actors ca ON a.id = ca.actor_id 
             WHERE ca.content_id = ? 
             ORDER BY ca.id ASC
             LIMIT 10`,
            [contentId]
        );

        // Buscar diretores da BD
        let [directors] = await db.query(
            `SELECT d.id, d.name, d.profile_path 
             FROM directors d 
             JOIN content_directors cd ON d.id = cd.director_id 
             WHERE cd.content_id = ?
             ORDER BY cd.id ASC`,
            [contentId]
        );

        // Se não houver diretores/atores na BD mas tiver tmdb_id, buscar da TMDB em tempo real
        if (tmdbId && apiKey && (actors.length === 0 || directors.length === 0)) {
            console.log(`Buscando elenco/diretores da TMDB para ${contentType} ${tmdbId} (BD: ${actors.length} atores, ${directors.length} diretores)`);
            try {
                const tmdbMediaType = contentType === 'series' ? 'tv' : 'movie';
                const creditsUrl = `https://api.themoviedb.org/3/${tmdbMediaType}/${tmdbId}/credits?api_key=${apiKey}`;
                const creditsData = await fetchJson(creditsUrl);
                console.log(`TMDB Credits: ${creditsData.cast?.length || 0} atores, ${creditsData.crew?.length || 0} crew, ${creditsData.created_by?.length || 0} criadores`);

                // Se não houver diretores na BD, buscar da TMDB
                if (directors.length === 0) {
                    console.log(`Buscando diretores para ${contentType} ${tmdbId}...`);
                    if (contentType === 'movie') {
                        const tmdbDirectors = (creditsData.crew || []).filter(p => 
                            p.job === 'Director' || p.job === 'Co-Director'
                        );
                        for (const director of tmdbDirectors.slice(0, 5)) {
                            if (director && director.id && director.name) {
                                const directorId = await getOrCreateDirector({ 
                                    id: director.id, 
                                    name: director.name, 
                                    profile_path: director.profile_path 
                                });
                                if (directorId) {
                                    await db.query('INSERT IGNORE INTO content_directors (content_id, director_id) VALUES (?, ?)', 
                                        [contentId, directorId]);
                                    // Adicionar ao array de diretores
                                    const [newDir] = await db.query('SELECT id, name, profile_path FROM directors WHERE id = ?', [directorId]);
                                    if (newDir.length > 0) {
                                        directors.push(newDir[0]);
                                    }
                                }
                            }
                        }
                    } else {
                        // Para séries: buscar criadores de múltiplas fontes
                        let creators = [];
                        
                        // 1. Primeiro tentar endpoint principal da série (mais confiável)
                        try {
                            const tvDetailsUrl = `https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${apiKey}&language=pt-PT`;
                            const tvDetailsData = await fetchJson(tvDetailsUrl);
                            creators = tvDetailsData.created_by || [];
                            console.log(`Série ${tmdbId}: ${creators.length} criadores do endpoint principal`);
                        } catch (error) {
                            console.warn(`Erro ao buscar detalhes da série ${tmdbId}:`, error.message);
                        }
                        
                        // 2. Se não houver no endpoint principal, tentar credits
                        if (creators.length === 0) {
                            creators = creditsData.created_by || [];
                            console.log(`Série ${tmdbId}: ${creators.length} criadores do endpoint credits`);
                        }
                        
                        // 3. Se ainda não houver, tentar buscar no crew
                        if (creators.length === 0) {
                            const crewCreators = (creditsData.crew || []).filter(p => 
                                p.job === 'Creator' || p.job === 'Series Creator' || 
                                p.job === 'Executive Producer' || p.job === 'Show Creator'
                            );
                            creators = crewCreators;
                            console.log(`Série ${tmdbId}: ${creators.length} criadores do crew`);
                        }
                        
                        // Importar criadores encontrados
                        for (const creator of creators.slice(0, 5)) {
                            if (creator && creator.id && creator.name && String(creator.name).trim().length > 0) {
                                const directorId = await getOrCreateDirector({ 
                                    id: creator.id, 
                                    name: creator.name.trim(), 
                                    profile_path: creator.profile_path 
                                });
                                if (directorId) {
                                    await db.query('INSERT IGNORE INTO content_directors (content_id, director_id) VALUES (?, ?)', 
                                        [contentId, directorId]);
                                    // Adicionar ao array de diretores
                                    const [newDir] = await db.query('SELECT id, name, profile_path FROM directors WHERE id = ?', [directorId]);
                                    if (newDir.length > 0) {
                                        directors.push(newDir[0]);
                                    }
                                }
                            }
                        }
                    }
                    console.log(`Diretores encontrados: ${directors.length}`);
                }

                // Se não houver atores na BD, buscar da TMDB
                if (actors.length === 0) {
                    console.log(`Buscando elenco para ${contentType} ${tmdbId}...`);
                    const mainCast = (creditsData.cast || []).slice(0, 10);
                    for (const actor of mainCast) {
                        if (actor && actor.id && actor.name) {
                            const actorId = await getOrCreateActor({ 
                                id: actor.id, 
                                name: actor.name, 
                                profile_path: actor.profile_path 
                            });
                            if (actorId) {
                                await db.query('INSERT IGNORE INTO content_actors (content_id, actor_id, character_name) VALUES (?, ?, ?)', 
                                    [contentId, actorId, actor.character ? actor.character.trim() : null]);
                                // Adicionar ao array de atores
                                const [newActor] = await db.query(
                                    'SELECT id, name, profile_path FROM actors WHERE id = ?', 
                                    [actorId]
                                );
                                if (newActor.length > 0) {
                                    const [castInfo] = await db.query(
                                        'SELECT character_name FROM content_actors WHERE content_id = ? AND actor_id = ?',
                                        [contentId, actorId]
                                    );
                                    actors.push({
                                        ...newActor[0],
                                        character_name: castInfo.length > 0 ? castInfo[0].character_name : null
                                    });
                                }
                            }
                        }
                    }
                    console.log(`Atores encontrados: ${actors.length}`);
                }
            } catch (error) {
                console.warn(`Erro ao buscar elenco/diretores da TMDB para ${tmdbId}:`, error.message);
                // Continuar mesmo se falhar - já temos os dados da BD se existirem
            }
        } else if (!tmdbId) {
            console.log(`⚠ Conteúdo ${contentId} não tem tmdb_id - não é possível buscar elenco/diretores da TMDB`);
        }

        // Buscar reviews
        const [reviews] = await db.query(
            `SELECT r.*, u.name as user_name, u.id as user_id,
             (SELECT COUNT(*) FROM review_votes WHERE review_id = r.id) as utility_counter
             FROM reviews r 
             JOIN users u ON r.user_id = u.id 
             WHERE r.content_id = ? 
             ORDER BY r.review_date DESC`,
            [contentId]
        );

        let trailer = null;
        let trailer_key = null;
        let similarContent = [];
        let recommendations = [];

        // Buscar dados adicionais da TMDB (trailer, similares, recomendações)
        if (tmdbId && apiKey) {
            const tmdbMediaType = contentType === 'series' ? 'tv' : 'movie';
            
            // Fetch Trailers (com tratamento de erro individual)
            try {
                const videosUrl = `https://api.themoviedb.org/3/${tmdbMediaType}/${tmdbId}/videos?api_key=${apiKey}&language=pt-PT`;
            const videosResponse = await fetch(videosUrl);
                if (videosResponse.ok) {
            const videosData = await videosResponse.json();
                    const youtubeTrailer = (videosData.results || []).find(v => 
                        v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
                    );
            if (youtubeTrailer) {
                trailer = `https://www.youtube.com/watch?v=${youtubeTrailer.key}`;
                trailer_key = youtubeTrailer.key;
                    }
                }
            } catch (error) {
                console.warn(`Erro ao buscar trailer para ${tmdbId}:`, error.message);
                // Continuar mesmo se falhar
            }

            // Fetch Similar Content (com tratamento de erro individual)
            try {
                const similarUrl = `https://api.themoviedb.org/3/${tmdbMediaType}/${tmdbId}/similar?api_key=${apiKey}&language=pt-PT&page=1`;
            const similarResponse = await fetch(similarUrl);
                if (similarResponse.ok) {
            const similarData = await similarResponse.json();
                    if (similarData.results && Array.isArray(similarData.results) && similarData.results.length > 0) {
                        similarContent = similarData.results.slice(0, 6).map(item => ({
                id: item.id,
                tmdb_id: item.id,
                            title: item.title || item.name || 'Sem título',
                poster_path: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
                            release_date: item.release_date || item.first_air_date || null,
                            type: contentType, // Usar o tipo do conteúdo atual (movie ou series)
                            vote_average: item.vote_average || 0
            }));
                        console.log(`✓ Similares carregados: ${similarContent.length} itens para ${tmdbId}`);
                    } else {
                        console.log(`⚠ Sem resultados similares para ${tmdbId}`);
                    }
                } else {
                    console.warn(`⚠ Resposta não OK ao buscar similares para ${tmdbId}: ${similarResponse.status}`);
                }
            } catch (error) {
                console.warn(`✗ Erro ao buscar similares para ${tmdbId}:`, error.message);
                // Continuar mesmo se falhar - recommendations ainda podem funcionar
            }

            // Fetch Recommendations (com tratamento de erro individual)
            try {
                const recommendationsUrl = `https://api.themoviedb.org/3/${tmdbMediaType}/${tmdbId}/recommendations?api_key=${apiKey}&language=pt-PT&page=1`;
            const recommendationsResponse = await fetch(recommendationsUrl);
                if (recommendationsResponse.ok) {
            const recommendationsData = await recommendationsResponse.json();
                    if (recommendationsData.results && Array.isArray(recommendationsData.results) && recommendationsData.results.length > 0) {
                        recommendations = recommendationsData.results.slice(0, 6).map(item => ({
                id: item.id,
                tmdb_id: item.id,
                            title: item.title || item.name || 'Sem título',
                poster_path: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
                            release_date: item.release_date || item.first_air_date || null,
                            type: contentType, // Usar o tipo do conteúdo atual (movie ou series)
                            vote_average: item.vote_average || 0
                        }));
                        console.log(`✓ Recomendações carregadas: ${recommendations.length} itens para ${tmdbId}`);
                    } else {
                        console.log(`⚠ Sem resultados de recomendações para ${tmdbId}`);
                    }
                } else {
                    console.warn(`⚠ Resposta não OK ao buscar recomendações para ${tmdbId}: ${recommendationsResponse.status}`);
                }
            } catch (error) {
                console.warn(`✗ Erro ao buscar recomendações para ${tmdbId}:`, error.message);
                // Continuar mesmo se falhar - similar ainda pode funcionar
            }
        }

        // Garantir que arrays são sempre retornados (mesmo que vazios)
        const response = {
            ...content,
            genres: genres || [],
            actors: actors || [],
            directors: directors || [],
            reviews: reviews || [],
            trailer: trailer || null,
            trailer_key: trailer_key || null,
            similarContent: similarContent || [],
            // alias para compatibilidade com o front-end
            similar: similarContent || [],
            recommendations: recommendations || []
        };

        // Log final para debug
        console.log(`Resposta getContentById ${contentId}: ${response.actors.length} atores, ${response.directors.length} diretores, ${response.similar.length} similares, ${response.recommendations.length} recomendações`);

        res.json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar detalhes' });
    }
};
