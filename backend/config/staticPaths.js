const path = require('path');

const projectRoot = path.join(__dirname, '../');

const staticPaths = {
    // Rutas principales
    '/': path.join(projectRoot, 'index.html'),
    
    // Páginas
    '/login': path.join(projectRoot, 'frontend/pages/login.html'),
    '/register': path.join(projectRoot, 'frontend/pages/register.html'),
    '/forgot-password': path.join(projectRoot, 'frontend/pages/forgot-password.html'),
    '/terms': path.join(projectRoot, 'frontend/pages/terms.html'),
    '/dashboard': path.join(projectRoot, 'frontend/pages/dashboard.html'),
    '/profile': path.join(projectRoot, 'frontend/pages/profile.html'),
    '/forum': path.join(projectRoot, 'frontend/pages/forum.html'),
    
    // Assets estáticos
    '/favicon.ico': path.join(projectRoot, 'frontend/images/favicon.png'),
    '/images/favicon.png': path.join(projectRoot, 'frontend/images/favicon.png'),
    
    // Directorios estáticos
    '/css': path.join(projectRoot, 'frontend/css'),
    '/images': path.join(projectRoot, 'frontend/images'),
    '/js': path.join(projectRoot, 'frontend/js'),
    '/pages': path.join(projectRoot, 'frontend/pages')
};

module.exports = staticPaths;