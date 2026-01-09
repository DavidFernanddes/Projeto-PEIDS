// controllers/reviewController.js
const db = require('../config/db');

// Adicionar uma Review
exports.addReview = async (req, res) => {
    const { content_id, rating, comment } = req.body;
    const user_id = req.user.id; // Vem do token JWT decodificado pelo middleware

    if (!rating || !comment) {
        return res.status(400).json({ error: 'Classificação e comentário são obrigatórios.' });
    }

    try {
        // Verificar se já fez review para este filme
        const [existing] = await db.query(
            'SELECT id FROM reviews WHERE user_id = ? AND content_id = ?', 
            [user_id, content_id]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: 'Já fizeste uma review a este título!' });
        }

        // Inserir Review (a data será automaticamente definida pelo DEFAULT CURRENT_TIMESTAMP)
        await db.query(
            'INSERT INTO reviews (user_id, content_id, rating, comment) VALUES (?, ?, ?, ?)',
            [user_id, content_id, rating, comment]
        );

        res.json({ message: 'Review adicionada com sucesso!' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao gravar review.' });
    }
};

// Votar na utilidade da Review ("Esta review foi útil")
exports.voteUtility = async (req, res) => {
    const { reviewId } = req.params;
    const user_id = req.user.id;

    try {
        // 1. Verificar se a review pertence ao próprio utilizador
        const [review] = await db.query(
            'SELECT user_id FROM reviews WHERE id = ?',
            [reviewId]
        );

        if (review.length === 0) {
            return res.status(404).json({ error: 'Review não encontrada.' });
        }

        if (review[0].user_id === user_id) {
            return res.status(400).json({ error: 'Não podes votar na tua própria review.' });
        }

        // 2. Verificar se o user já votou nesta review
        const [voted] = await db.query(
            'SELECT * FROM review_votes WHERE user_id = ? AND review_id = ?',
            [user_id, reviewId]
        );

        if (voted.length > 0) {
            return res.status(400).json({ error: 'Já votaste nesta review.' });
        }

        // 3. Registar o voto na tabela de controlo
        await db.query('INSERT INTO review_votes (user_id, review_id) VALUES (?, ?)', [user_id, reviewId]);

        // 4. Incrementar o contador na tabela reviews
        await db.query('UPDATE reviews SET utility_counter = utility_counter + 1 WHERE id = ?', [reviewId]);

        res.json({ message: 'Voto registado!' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao votar.' });
    }
};