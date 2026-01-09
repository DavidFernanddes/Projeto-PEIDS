// controllers/favoritesController.js
const db = require('../config/db');

// Verificar se um conteúdo é favorito do utilizador
exports.checkFavorite = async (req, res) => {
    const { id } = req.params;
    const user_id = req.user.id;

    try {
        // Verificar se id é um ID interno ou tmdb_id
        let internalId = id;
        
        let [content] = await db.query('SELECT id FROM contents WHERE id = ?', [id]);
        if (content.length === 0) {
            [content] = await db.query('SELECT id FROM contents WHERE tmdb_id = ?', [id]);
            if (content.length === 0) {
                return res.json({ isFavorite: false });
            }
            internalId = content[0].id;
        } else {
            internalId = content[0].id;
        }

        const [rows] = await db.query(
            'SELECT * FROM favorites WHERE user_id = ? AND content_id = ?',
            [user_id, internalId]
        );

        res.json({ isFavorite: rows.length > 0 });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao verificar favorito' });
    }
};

// Adicionar/Remover favorito (toggle)
exports.toggleFavorite = async (req, res) => {
    const { contentId } = req.body;
    const user_id = req.user.id;

    if (!contentId) {
        return res.status(400).json({ error: 'ID do conteúdo é obrigatório' });
    }

    try {
        // Verificar se contentId é um ID interno ou tmdb_id
        let internalId = contentId;
        
        // Tentar buscar por ID interno primeiro
        let [content] = await db.query('SELECT id FROM contents WHERE id = ?', [contentId]);
        
        // Se não encontrar, tentar por tmdb_id
        if (content.length === 0) {
            [content] = await db.query('SELECT id FROM contents WHERE tmdb_id = ?', [contentId]);
            if (content.length === 0) {
                return res.status(404).json({ error: 'Conteúdo não encontrado na base de dados. O conteúdo precisa estar importado primeiro.' });
            }
            internalId = content[0].id;
        } else {
            internalId = content[0].id;
        }

        // Verificar se já é favorito
        const [existing] = await db.query(
            'SELECT id FROM favorites WHERE user_id = ? AND content_id = ?',
            [user_id, internalId]
        );

        if (existing.length > 0) {
            // Remover dos favoritos
            await db.query(
                'DELETE FROM favorites WHERE user_id = ? AND content_id = ?',
                [user_id, internalId]
            );
            res.json({ message: 'Removido dos favoritos', isFavorite: false });
        } else {
            // Adicionar aos favoritos
            await db.query(
                'INSERT INTO favorites (user_id, content_id) VALUES (?, ?)',
                [user_id, internalId]
            );
            res.json({ message: 'Adicionado aos favoritos', isFavorite: true });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar favorito' });
    }
};

// Listar favoritos do utilizador
exports.getUserFavorites = async (req, res) => {
    const user_id = req.user.id;

    try {
        const [rows] = await db.query(
            `SELECT c.*, f.created_at as favorited_at 
             FROM favorites f 
             JOIN contents c ON f.content_id = c.id 
             WHERE f.user_id = ? 
             ORDER BY f.created_at DESC`,
            [user_id]
        );

        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao listar favoritos' });
    }
};

