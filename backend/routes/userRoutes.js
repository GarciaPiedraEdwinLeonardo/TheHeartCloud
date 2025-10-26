const express = require('express');
const router = express.Router();

// Importar controladores
const {
    getMyProfile,
    deleteAccount
} = require('../controllers/userController');

// Importar middlewares
const { requireAuth } = require('../middleware/authMiddleware');

// Aplicar autenticación a todas las rutas
router.use(requireAuth);

// Rutas de usuario
router.get('/profile', getMyProfile);
router.delete('/account', deleteAccount);

module.exports = router;