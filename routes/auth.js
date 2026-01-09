// routes/auth.js (VERSÃO FINAL JWT)
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim().toLowerCase());
}

// 1. REGISTO
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    const cleanName = String(name || '').trim();
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanPassword = String(password || '');

    if (!cleanName || !cleanEmail || !cleanPassword) {
        return res.status(400).json({ error: 'Preencha todos os campos.' });
    }
    if (cleanName.length < 2) {
        return res.status(400).json({ error: 'Nome muito curto.' });
    }
    if (!isValidEmail(cleanEmail)) {
        return res.status(400).json({ error: 'Email inválido.' });
    }
    if (cleanPassword.length < 6) {
        return res.status(400).json({ error: 'Password deve ter pelo menos 6 caracteres.' });
    }
    if (!process.env.JWT_SECRET) {
        return res.status(500).json({ error: 'Configuração em falta no servidor (JWT_SECRET).' });
    }

    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [cleanEmail]);
        if (users.length > 0) return res.status(400).json({ error: 'Email já registado' });

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(cleanPassword, salt);

        await db.query('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, "user")', 
            [cleanName, cleanEmail, hash]);

        res.json({ message: 'Registado com sucesso' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro no servidor' });
    }
});

// 2. LOGIN (Gera o Token)
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanPassword = String(password || '');

    if (!cleanEmail || !cleanPassword) {
        return res.status(400).json({ error: 'Email e password são obrigatórios.' });
    }
    if (!isValidEmail(cleanEmail)) {
        return res.status(400).json({ error: 'Email inválido.' });
    }
    if (!process.env.JWT_SECRET) {
        return res.status(500).json({ error: 'Configuração em falta no servidor (JWT_SECRET).' });
    }

    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [cleanEmail]);
        if (users.length === 0) return res.status(401).json({ error: 'Dados incorretos' });

        const user = users[0];
        const match = await bcrypt.compare(cleanPassword, user.password);
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

// 4. LOGIN COM GOOGLE
router.get('/google/client-id', (req, res) => {
    const raw = process.env.GOOGLE_CLIENT_ID;
    const clientId = raw ? String(raw).trim() : null;
    res.json({ clientId });
});

router.post('/google', async (req, res) => {
    const { token: googleToken } = req.body;

    if (!googleToken) {
        return res.status(400).json({ error: 'Token do Google é obrigatório' });
    }

    try {
        const clientId = process.env.GOOGLE_CLIENT_ID ? String(process.env.GOOGLE_CLIENT_ID).trim() : '';
        if (!clientId) {
            return res.status(500).json({ error: 'Falta GOOGLE_CLIENT_ID no servidor' });
        }
        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ error: 'Falta JWT_SECRET no servidor' });
        }

        const client = new OAuth2Client(clientId);
        
        // Verificar o token do Google
        const ticket = await client.verifyIdToken({
            idToken: googleToken,
            audience: clientId
        });

        const payload = ticket.getPayload();
        const { sub: googleId, email, name, picture } = payload;

        // Verificar se o utilizador já existe
        let [users] = await db.query('SELECT * FROM users WHERE email = ? OR google_id = ?', [email, googleId]);
        
        let user;
        
        if (users.length > 0) {
            // Utilizador existe - atualizar google_id se necessário
            user = users[0];
            if (!user.google_id) {
                await db.query('UPDATE users SET google_id = ? WHERE id = ?', [googleId, user.id]);
            }
        } else {
            // Criar novo utilizador
            const randomPassword = crypto.randomBytes(32).toString('hex');
            const passwordHash = await bcrypt.hash(randomPassword, 10);
            const [result] = await db.query(
                'INSERT INTO users (name, email, password, google_id, role) VALUES (?, ?, ?, ?, "user")',
                [name, email, passwordHash, googleId]
            );
            user = { id: result.insertId, name, email, role: 'user' };
        }

        // Criar token JWT
        const token = jwt.sign(
            { id: user.id, name: user.name, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login com Google OK',
            token: token,
            user: { name: user.name, role: user.role }
        });

    } catch (err) {
        console.error('Erro no login Google:', err);
        res.status(401).json({ error: 'Token do Google inválido' });
    }
});

module.exports = router;