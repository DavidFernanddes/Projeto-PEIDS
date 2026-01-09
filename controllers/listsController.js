// controllers/listsController.js
const db = require('../config/db');

// Criar lista personalizada
exports.createList = async (req, res) => {
    const { name, description } = req.body;
    const user_id = req.user.id;

    if (!name) {
        return res.status(400).json({ error: 'Nome da lista é obrigatório' });
    }

    try {
        const [result] = await db.query(
            'INSERT INTO personal_lists (user_id, name, description) VALUES (?, ?, ?)',
            [user_id, name, description || null]
        );

        res.json({ message: 'Lista criada com sucesso', listId: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar lista' });
    }
};

// Listar listas do utilizador
exports.getUserLists = async (req, res) => {
    const user_id = req.user.id;

    try {
        const [rows] = await db.query(
            `SELECT l.*, COUNT(li.id) as item_count 
             FROM personal_lists l 
             LEFT JOIN list_items li ON l.id = li.list_id 
             WHERE l.user_id = ? 
             GROUP BY l.id 
             ORDER BY l.created_at DESC`,
            [user_id]
        );

        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao listar listas' });
    }
};

// Obter detalhes de uma lista (com itens)
exports.getListById = async (req, res) => {
    const { id } = req.params;
    const user_id = req.user.id;

    try {
        // Verificar se a lista pertence ao utilizador
        const [list] = await db.query(
            'SELECT * FROM personal_lists WHERE id = ? AND user_id = ?',
            [id, user_id]
        );

        if (list.length === 0) {
            return res.status(404).json({ error: 'Lista não encontrada' });
        }

        // Buscar itens da lista
        const [items] = await db.query(
            `SELECT c.*, li.added_at 
             FROM list_items li 
             JOIN contents c ON li.content_id = c.id 
             WHERE li.list_id = ? 
             ORDER BY li.added_at DESC`,
            [id]
        );

        res.json({ ...list[0], items });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar lista' });
    }
};

// Atualizar lista
exports.updateList = async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;
    const user_id = req.user.id;

    try {
        // Verificar se a lista pertence ao utilizador
        const [list] = await db.query(
            'SELECT * FROM personal_lists WHERE id = ? AND user_id = ?',
            [id, user_id]
        );

        if (list.length === 0) {
            return res.status(404).json({ error: 'Lista não encontrada' });
        }

        await db.query(
            'UPDATE personal_lists SET name = ?, description = ? WHERE id = ?',
            [name || list[0].name, description !== undefined ? description : list[0].description, id]
        );

        res.json({ message: 'Lista atualizada com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar lista' });
    }
};

// Apagar lista
exports.deleteList = async (req, res) => {
    const { id } = req.params;
    const user_id = req.user.id;

    try {
        // Verificar se a lista pertence ao utilizador
        const [list] = await db.query(
            'SELECT * FROM personal_lists WHERE id = ? AND user_id = ?',
            [id, user_id]
        );

        if (list.length === 0) {
            return res.status(404).json({ error: 'Lista não encontrada' });
        }

        await db.query('DELETE FROM personal_lists WHERE id = ?', [id]);

        res.json({ message: 'Lista apagada com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao apagar lista' });
    }
};

// Adicionar conteúdo à lista
exports.addItemToList = async (req, res) => {
    const { id } = req.params;
    const { contentId } = req.body;
    const user_id = req.user.id;

    if (!contentId) {
        return res.status(400).json({ error: 'ID do conteúdo é obrigatório' });
    }

    try {
        // Verificar se a lista pertence ao utilizador
        const [list] = await db.query(
            'SELECT * FROM personal_lists WHERE id = ? AND user_id = ?',
            [id, user_id]
        );

        if (list.length === 0) {
            return res.status(404).json({ error: 'Lista não encontrada' });
        }

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

        // Verificar se já existe
        const [existing] = await db.query(
            'SELECT * FROM list_items WHERE list_id = ? AND content_id = ?',
            [id, internalId]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: 'Conteúdo já está na lista' });
        }

        await db.query(
            'INSERT INTO list_items (list_id, content_id) VALUES (?, ?)',
            [id, internalId]
        );

        res.json({ message: 'Conteúdo adicionado à lista' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao adicionar conteúdo' });
    }
};

// Remover conteúdo da lista
exports.removeItemFromList = async (req, res) => {
    const { id, contentId } = req.params;
    const user_id = req.user.id;

    try {
        // Verificar se a lista pertence ao utilizador
        const [list] = await db.query(
            'SELECT * FROM personal_lists WHERE id = ? AND user_id = ?',
            [id, user_id]
        );

        if (list.length === 0) {
            return res.status(404).json({ error: 'Lista não encontrada' });
        }

        await db.query(
            'DELETE FROM list_items WHERE list_id = ? AND content_id = ?',
            [id, contentId]
        );

        res.json({ message: 'Conteúdo removido da lista' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao remover conteúdo' });
    }
};

