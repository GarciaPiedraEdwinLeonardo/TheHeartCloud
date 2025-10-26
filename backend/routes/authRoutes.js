const express = require('express');
const router = express.Router();

// Importar controladores
const {
    registrarUsuario,
    iniciarSesion,
    cerrarSesion,
    iniciarRecuperacion,
    verificarRespuesta,
    cambiarContraseña,verificarAuth
} = require('./../controllers/authController');

// Importar middlewares
const {
    validateRegister,
    validateLogin,
    validateRecovery,
    validatePasswordChange
} = require('./../middleware/validationMiddleware');

const {
    requireNoAuth,
    getCurrentUser
} = require('./../middleware/authMiddleware');

// Aplicar middleware de usuario actual a todas las rutas
router.use(getCurrentUser);

// Rutas públicas
router.post('/register', requireNoAuth, validateRegister, registrarUsuario);
router.post('/login', requireNoAuth, validateLogin, iniciarSesion);
router.post('/logout', cerrarSesion);

// Rutas de recuperación de cuenta
router.post('/recovery/init', requireNoAuth, validateRecovery, iniciarRecuperacion);
router.post('/recovery/verify', requireNoAuth, verificarRespuesta);
router.post('/recovery/change-password', requireNoAuth, validatePasswordChange, cambiarContraseña);

// Ruta para verificar estado de autenticación
router.get('/status', verificarAuth);

module.exports = router;