/**
 * middleware/auth.js
 * 
 * Middleware de autenticação e autorização
 * Verifica tokens JWT e controla acesso a rotas protegidas
 * 
 * @author David Fernandes, João Rôlo & Sorin Revenco
 * @version 1.0
 * @date 2026
 */

const jwt = require('jsonwebtoken');

module.exports = {
    /**
     * Middleware: Verificar se o utilizador está autenticado
     * Extrai e valida o token JWT do header Authorization
     * Adiciona req.user com dados do utilizador se válido
     * 
     * @param {Object} req - Request object
     * @param {Object} req.headers - Headers da requisição
     * @param {string} req.headers.authorization - Header com formato "Bearer <token>"
     * @param {Object} res - Response object
     * @param {Function} next - Next middleware function
     * @returns {void}
     */
    isAuthenticated: (req, res, next) => {
        // O cliente envia: "Authorization: Bearer <token>"
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Tira a palavra 'Bearer'

        if (!token) {
            return res.status(401).json({ error: 'Acesso negado. Token em falta.' });
        }

        try {
            if (!process.env.JWT_SECRET) {
                console.error('JWT_SECRET não está configurado!');
                return res.status(500).json({ error: 'Erro de configuração do servidor.' });
            }

            // Verifica a assinatura do token
            const verified = jwt.verify(token, process.env.JWT_SECRET);
            req.user = verified; // Guarda os dados do user no pedido (req.user em vez de req.session.user)
            next();
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ error: 'Token expirado. Faz login novamente.' });
            } else if (err.name === 'JsonWebTokenError') {
                return res.status(401).json({ error: 'Token inválido. Faz login novamente.' });
            }
            console.error('Erro ao verificar token:', err);
            res.status(401).json({ error: 'Erro ao verificar autenticação.' });
        }
    },

    /**
     * Middleware: Verificar se o utilizador é administrador
     * Verifica autenticação E se o role é 'admin'
     * 
     * @param {Object} req - Request object
     * @param {Object} req.headers - Headers da requisição
     * @param {string} req.headers.authorization - Header com formato "Bearer <token>"
     * @param {Object} res - Response object
     * @param {Function} next - Next middleware function
     * @returns {void}
     */
    isAdmin: (req, res, next) => {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Acesso negado. Token em falta.' });
        }

        try {
            if (!process.env.JWT_SECRET) {
                console.error('JWT_SECRET não está configurado!');
                return res.status(500).json({ error: 'Erro de configuração do servidor.' });
            }

            const verified = jwt.verify(token, process.env.JWT_SECRET);
            
            if (verified.role === 'admin') {
                req.user = verified;
                next();
            } else {
                res.status(403).json({ error: 'Acesso restrito a Admins. O teu role é: ' + (verified.role || 'user') });
            }
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ error: 'Token expirado. Faz login novamente.' });
            } else if (err.name === 'JsonWebTokenError') {
                return res.status(401).json({ error: 'Token inválido. Faz login novamente.' });
            }
            console.error('Erro ao verificar token admin:', err);
            res.status(401).json({ error: 'Erro ao verificar autenticação.' });
        }
    }
};