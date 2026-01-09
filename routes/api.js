/**
 * routes/api.js
 * 
 * Definição de todas as rotas da API REST
 * Organizadas por funcionalidade: conteúdos, favoritos, listas, reviews, etc.
 * 
 * @author David Fernandes, João Rôlo & Sorin Revenco
 * @version 1.0
 * @date 2026
 */

const express = require('express');
const router = express.Router();

// ============================================
// IMPORTAR CONTROLLERS
// ============================================
const contentController = require('../controllers/contentController');
const reviewController = require('../controllers/reviewController');
const favoritesController = require('../controllers/favoritesController');
const listsController = require('../controllers/listsController');
const actorsController = require('../controllers/actorsController');
const directorsController = require('../controllers/directorsController');

// ============================================
// IMPORTAR MIDDLEWARE
// ============================================
const { isAuthenticated } = require('../middleware/auth');

// ============================================
// ROTAS DE CONTEÚDOS (Filmes/Séries)
// ============================================
// Listar todos os filmes/séries
router.get('/filmes', contentController.getAllContents);

// Listar géneros usados no catálogo (para filtros no Home)
router.get('/genres', contentController.getCatalogGenres);

// Pesquisar filmes/séries (usa TMDB)
router.get('/pesquisar', contentController.searchContents);

// Detalhes de um filme/série (inclui as reviews)
router.get('/filmes/:id', contentController.getContentById);

// Importar do TMDB (Pode ser pública ou protegida, deixo pública para facilitar testes)
router.get('/importar', contentController.importMoviesFromTMDB);

// Features do TMDB
router.get('/trending', contentController.getTrending);
router.get('/popular', contentController.getPopular);
router.get('/top-rated', contentController.getTopRated);

// Importar conteúdo individual por TMDB ID
router.post('/import-content', contentController.importContentByTmdbId);

// Buscar conteúdo por TMDB ID (importa automaticamente se não existir)
router.get('/filmes/tmdb/:tmdb_id', contentController.getContentByTmdbId);

// ============================================
// ROTAS DE FAVORITOS
// ============================================
// Verificar se é favorito
router.get('/favorites/check/:id', isAuthenticated, favoritesController.checkFavorite);

// Adicionar/Remover favorito (toggle)
router.post('/favorites/toggle', isAuthenticated, favoritesController.toggleFavorite);

// Listar favoritos do utilizador
router.get('/favorites', isAuthenticated, favoritesController.getUserFavorites);

// ============================================
// ROTAS DE LISTAS PERSONALIZADAS
// ============================================
// Criar lista
router.post('/lists', isAuthenticated, listsController.createList);

// Listar listas do utilizador
router.get('/lists', isAuthenticated, listsController.getUserLists);

// Obter detalhes de uma lista
router.get('/lists/:id', isAuthenticated, listsController.getListById);

// Atualizar lista
router.put('/lists/:id', isAuthenticated, listsController.updateList);

// Apagar lista
router.delete('/lists/:id', isAuthenticated, listsController.deleteList);

// Adicionar conteúdo à lista
router.post('/lists/:id/items', isAuthenticated, listsController.addItemToList);

// Remover conteúdo da lista
router.delete('/lists/:id/items/:contentId', isAuthenticated, listsController.removeItemFromList);

// ============================================
// ROTAS DE REVIEWS
// ============================================
// Adicionar Review (Só se tiver logado)
router.post('/reviews', isAuthenticated, reviewController.addReview);

// Votar na Review (Só se tiver logado)
router.post('/reviews/:reviewId/vote', isAuthenticated, reviewController.voteUtility);

// ============================================
// ROTAS DE ATORES
// ============================================
router.get('/atores', actorsController.getAllActors);
router.get('/atores/:id', actorsController.getActorById);

// ============================================
// ROTAS DE DIRETORES
// ============================================
router.get('/diretores', directorsController.getAllDirectors);
router.get('/diretores/:id', directorsController.getDirectorById);

// ============================================
// ROTA DE ESTADO (Health Check)
// ============================================
router.get('/status', (req, res) => {
    res.json({ 
        status: 'API Online',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;