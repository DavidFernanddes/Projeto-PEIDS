// routes/auth.js (VERSÃO FINAL JWT)
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 1. REGISTO
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Preencha todos os campos' });
    }

    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length > 0) return res.status(400).json({ error: 'Email já registado' });

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        await db.query('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, "user")', 
            [name, email, hash]);

        res.json({ message: 'Registado com sucesso' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro no servidor' });
    }
});

// 2. LOGIN (Gera o Token)
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(401).json({ error: 'Dados incorretos' });

        const user = users[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ error: 'Dados incorretos' });

        // CRIAR TOKEN JWT
        const token = jwt.sign(
            { id: user.id, name: user.name, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Enviar Token e User
        res.json({ 
            message: 'Login OK', 
            token: token, 
            user: { name: user.name, role: user.role } 
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro no login' });
    }
});

// 3. Verificar Token (Substitui a antiga verificação de sessão)
router.get('/me', (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.json({ loggedIn: false });

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        res.json({ loggedIn: true, user: verified });
    } catch (err) {
        res.json({ loggedIn: false });
    }
});

module.exports = router;