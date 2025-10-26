// Verificar si el usuario está autenticado
function requireAuth(req, res, next) {
    if (req.session && req.session.userId) {
        next();
    } else {
        res.status(401).json({
            success: false,
            message: 'No autorizado. Debes iniciar sesión.'
        });
    }
}

// Verificar si el usuario NO está autenticado (para login/register)
function requireNoAuth(req, res, next) {
    if (req.session && req.session.userId) {
        res.status(403).json({
            success: false,
            message: 'Ya tienes una sesión activa.'
        });
    } else {
        next();
    }
}

// Obtener información del usuario actual
function getCurrentUser(req, res, next) {
    if (req.session && req.session.userId) {
        req.currentUserId = req.session.userId;
    }
    next();
}

module.exports = {
    requireAuth,
    requireNoAuth,
    getCurrentUser
};