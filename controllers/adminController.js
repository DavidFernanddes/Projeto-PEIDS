// controllers/adminController.js
const db = require('../config/db');

// Listar tudo (versão admin, talvez com dados extra)
exports.listContents = async (req, res) => {
    try {
        const { type } = req.query; // Filtro por tipo
        let query = 'SELECT * FROM contents';
        const params = [];
        
        if (type && (type === 'movie' || type === 'series')) {
            query += ' WHERE type = ?';
            params.push(type);
        }
        
        query += ' ORDER BY id DESC';
        
        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao listar conteúdos' });
    }
};

// Adicionar Filme Manualmente
exports.createContent = async (req, res) => {
    const { title, synopsis, type, release_date, poster_path, trailer_url } = req.body;

    if (!title || !type) {
        return res.status(400).json({ error: 'Título e Tipo são obrigatórios' });
    }

    try {
        const safeSynopsis = (synopsis === null || synopsis === undefined) ? '' : String(synopsis);
        const sql = `INSERT INTO contents (title, synopsis, type, release_date, poster_path, trailer_url) 
                     VALUES (?, ?, ?, ?, ?, ?)`;
        
        await db.query(sql, [title, safeSynopsis, type, release_date || null, poster_path || null, trailer_url || null]);
        
        res.json({ message: 'Conteúdo criado com sucesso!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar conteúdo' });
    }
};

// Apagar Filme
exports.deleteContent = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM contents WHERE id = ?', [id]);
        res.json({ message: 'Conteúdo apagado com sucesso' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao apagar' });
    }
};

// Gestão de Utilizadores
exports.listUsers = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT id, name, email, role, created_at, 
             (SELECT COUNT(*) FROM reviews WHERE user_id = users.id) as review_count,
             (SELECT COUNT(*) FROM favorites WHERE user_id = users.id) as favorite_count
             FROM users ORDER BY created_at DESC`
        );
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao listar utilizadores' });
    }
};

exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        // Verificar se não é o próprio admin
        const [user] = await db.query('SELECT role FROM users WHERE id = ?', [id]);
        if (user.length === 0) {
            return res.status(404).json({ error: 'Utilizador não encontrado' });
        }
        if (user[0].role === 'admin') {
            return res.status(400).json({ error: 'Não podes apagar um administrador' });
        }
        
        await db.query('DELETE FROM users WHERE id = ?', [id]);
        res.json({ message: 'Utilizador apagado com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao apagar utilizador' });
    }
};

exports.updateUserRole = async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!role || (role !== 'user' && role !== 'admin')) {
        return res.status(400).json({ error: 'Role inválido' });
    }
    
    try {
        await db.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
        res.json({ message: 'Role atualizado com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar role' });
    }
};

// Gestão de Reviews
exports.listReviews = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT r.*, u.name as user_name, u.email as user_email, c.title as content_title
             FROM reviews r
             JOIN users u ON r.user_id = u.id
             JOIN contents c ON r.content_id = c.id
             ORDER BY r.review_date DESC`
        );
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao listar reviews' });
    }
};

exports.deleteReview = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM reviews WHERE id = ?', [id]);
        res.json({ message: 'Review apagada com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao apagar review' });
    }
};
