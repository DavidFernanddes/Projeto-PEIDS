// controllers/adminController.js
const db = require('../config/db');

// Listar tudo (versão admin, talvez com dados extra)
exports.listContents = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM contents ORDER BY id DESC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao listar conteúdos' });
    }
};

// Adicionar Filme Manualmente
exports.createContent = async (req, res) => {
    // Recebe os dados do formulário
    const { title, synopsis, type, release_date, poster_path, trailer_url } = req.body;

    if (!title || !type) {
        return res.status(400).json({ error: 'Título e Tipo são obrigatórios' });
    }

    try {
        const sql = `INSERT INTO contents (title, synopsis, type, release_date, poster_path, trailer_url) 
                     VALUES (?, ?, ?, ?, ?, ?)`;
        
        await db.query(sql, [title, synopsis, type, release_date, poster_path, trailer_url]);
        
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

// (Opcional) Editar Filme - Podes adicionar depois se tiveres tempo