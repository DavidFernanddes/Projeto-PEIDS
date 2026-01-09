/**
 * app.js
 * 
 * Ficheiro principal da aplicação Express.js
 * Configura middleware, rotas e inicia o servidor HTTP
 * 
 * @author David Fernandes, João Rôlo & Sorin Revenco
 * @version 1.0
 * @date 2026
 */

const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');

// Carregar variáveis de ambiente do ficheiro .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARE
// ============================================

// CORS: Permitir requisições de diferentes origens (útil para desenvolvimento)
app.use(cors());

// JSON Parser: Permite ler dados JSON no req.body
app.use(express.json());

// URL Encoded Parser: Permite ler formulários HTML (application/x-www-form-urlencoded)
app.use(express.urlencoded({ extended: true }));

// ============================================
// FICHEIROS ESTÁTICOS
// ============================================
// Servir ficheiros estáticos (CSS, imagens, JS, HTML) da pasta public/
app.use(express.static(path.join(__dirname, 'public')));

// ============================================
// ROTAS
// ============================================

// Importar módulos de rotas
const apiRoutes = require('./routes/api');      // Rotas da API REST
const authRoutes = require('./routes/auth');    // Rotas de autenticação
const adminRoutes = require('./routes/admin');  // Rotas administrativas (backoffice)

// Registrar rotas
app.use('/api', apiRoutes);           // API REST: /api/*
app.use('/auth', authRoutes);         // Autenticação: /auth/*
app.use('/api/admin', adminRoutes);   // Backoffice: /api/admin/*

// Rota raiz: servir página inicial
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============================================
// INICIAR SERVIDOR
// ============================================
app.listen(PORT, () => {
    console.log(`Servidor a correr em http://localhost:${PORT}`);
    console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
});