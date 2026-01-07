// routes/api.js
const express = require('express');
const router = express.Router();

// Importar Controllers
const contentController = require('../controllers/contentController'); // Lembra-te de ter este ficheiro criado (passo anterior)
const reviewController = require('../controllers/reviewController');

// Importar Middleware de Segurança
const { isAuthenticated } = require('../middleware/auth');

// --- ROTAS DE CONTEÚDOS (Filmes/Séries) ---
// Listar todos os filmes
router.get('/filmes', contentController.getAllContents);

// Detalhes de um filme (inclui as reviews)
router.get('/filmes/:id', contentController.getContentById);

// Importar do TMDB (Pode ser pública ou protegida, deixo pública para facilitar testes)
router.get('/importar', contentController.importMoviesFromTMDB);


// --- ROTAS DE REVIEWS ---
// Adicionar Review (Só se tiver logado)
router.post('/reviews', isAuthenticated, reviewController.addReview);

// Votar na Review (Só se tiver logado)
router.post('/reviews/:reviewId/vote', isAuthenticated, reviewController.voteUtility);


// --- ROTA DE ESTADO (Teste) ---
router.get('/status', (req, res) => {
    res.json({ status: 'API Online', user: req.session.user || 'Visitante' });
});

module.exports = router;