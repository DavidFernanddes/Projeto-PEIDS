const express = require('express');
const path = require('path');
const dotenv = require('dotenv');

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// --- 1. MIDDLEWARE (A PARTE QUE TE FALTA/ESTÁ MAL) ---
// Estas linhas têm de estar ANTES das rotas!
app.use(express.json()); // Permite ler JSON (req.body)
app.use(express.urlencoded({ extended: true })); // Permite ler formulários normais

// --- 3. FICHEIROS ESTÁTICOS (CSS, IMAGENS, JS) ---
app.use(express.static(path.join(__dirname, 'public')));

// --- 4. ROTAS ---
const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin'); // Se já tiveres o backoffice

app.use('/api', apiRoutes);
app.use('/auth', authRoutes);
app.use('/api/admin', adminRoutes); // Rota do backoffice

// Rota para a raiz (opcional, mas boa prática)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- 5. INICIAR SERVIDOR ---
app.listen(PORT, () => {
    console.log(`Servidor a correr em http://localhost:${PORT}`);
});