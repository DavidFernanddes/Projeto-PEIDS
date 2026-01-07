// routes/admin.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAdmin } = require('../middleware/auth'); // Importar o porteiro

// Todas estas rotas exigem que o user seja ADMIN
// GET /api/admin/contents -> Lista filmes para gestão
router.get('/contents', isAdmin, adminController.listContents);

// POST /api/admin/contents -> Criar novo filme
router.post('/contents', isAdmin, adminController.createContent);

// DELETE /api/admin/contents/:id -> Apagar filme
router.delete('/contents/:id', isAdmin, adminController.deleteContent);

module.exports = router;