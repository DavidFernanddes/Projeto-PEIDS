// routes/auth.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // Importar JWT

// REGISTO (Igual, mas sem sessão)
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    // ... validações ...
    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length > 0) return res.status(400).json({ error: 'Email já existe' });

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        await db.query('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, "user")', [name, email, hash]);
        res.json({ message: 'Registado com sucesso' });
    } catch (err) {
        res.status(500).json({ error: 'Erro servidor' });
    }
});

// LOGIN (AQUI MUDAMOS PARA JWT)
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(401).json({ error: 'Dados errados' });

        const user = users[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ error: 'Dados errados' });

        // --- CRIAR TOKEN JWT ---
        // O token vai guardar o ID, Nome e Role do utilizador
        const token = jwt.sign(
            { id: user.id, name: user.name, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' } // Token expira em 24 horas
        );

        // Enviar o token para o Front-end
        res.json({ message: 'Login OK', token: token, user: { name: user.name, role: user.role } });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro no login' });
    }
});

// Endpoint auxiliar para o Front-end verificar quem é o user (descodificando o token)
// O front-end envia o token, nós dizemos "Sim, és válido"
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