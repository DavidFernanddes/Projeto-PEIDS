// routes/admin.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAdmin } = require('../middleware/auth');

// Conteúdos
router.get('/contents', isAdmin, adminController.listContents);
router.post('/contents', isAdmin, adminController.createContent);
router.delete('/contents/:id', isAdmin, adminController.deleteContent);

// Utilizadores
router.get('/users', isAdmin, adminController.listUsers);
router.delete('/users/:id', isAdmin, adminController.deleteUser);
router.put('/users/:id/role', isAdmin, adminController.updateUserRole);

// Reviews
router.get('/reviews', isAdmin, adminController.listReviews);
router.delete('/reviews/:id', isAdmin, adminController.deleteReview);

module.exports = router;
