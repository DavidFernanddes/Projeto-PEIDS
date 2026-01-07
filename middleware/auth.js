// middleware/auth.js
module.exports = {
    // Verifica se o utilizador está logado (para reviews, favoritos, etc)
    isAuthenticated: (req, res, next) => {
        if (req.session.user) {
            return next();
        }
        res.status(401).json({ error: 'Acesso negado. Faça login.' });
    },

    // Verifica se é ADMIN (para o Backoffice)
    isAdmin: (req, res, next) => {
        // Verifica se está logado E se a role é 'admin'
        if (req.session.user && req.session.user.role === 'admin') {
            return next();
        }
        // Se não for admin, bloqueia
        res.status(403).json({ error: 'Acesso restrito a Administradores.' });
    }
};