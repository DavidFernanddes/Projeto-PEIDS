// middleware/auth.js
const jwt = require('jsonwebtoken');

module.exports = {
    // Verificar se o Token é válido
    isAuthenticated: (req, res, next) => {
        // O cliente envia: "Authorization: Bearer <token>"
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Tira a palavra 'Bearer'

        if (!token) {
            return res.status(401).json({ error: 'Acesso negado. Token em falta.' });
        }

        try {
            // Verifica a assinatura do token
            const verified = jwt.verify(token, process.env.JWT_SECRET);
            req.user = verified; // Guarda os dados do user no pedido (req.user em vez de req.session.user)
            next();
        } catch (err) {
            res.status(400).json({ error: 'Token inválido' });
        }
    },

    // Verificar se é Admin
    isAdmin: (req, res, next) => {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) return res.status(401).json({ error: 'Acesso negado.' });

        try {
            const verified = jwt.verify(token, process.env.JWT_SECRET);
            if (verified.role === 'admin') {
                req.user = verified;
                next();
            } else {
                res.status(403).json({ error: 'Acesso restrito a Admins.' });
            }
        } catch (err) {
            res.status(400).json({ error: 'Token inválido' });
        }
    }
};