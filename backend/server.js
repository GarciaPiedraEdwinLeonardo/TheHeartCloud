require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');

const forumRoutes = require('./routes/forumRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares básicos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(express.static(path.join(__dirname, '../')));
app.use('/css', express.static(path.join(__dirname, '../frontend/css')));
app.use('/images', express.static(path.join(__dirname, '../frontend/images')));
app.use('/js', express.static(path.join(__dirname, '../frontend/js')));
app.use('/pages', express.static(path.join(__dirname, '../frontend/pages')));

// Configuración de sesiones
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// Middleware para mostrar info de sesión
app.use((req, res, next) => {
    console.log('📱 Sesión:', req.sessionID);
    console.log('👤 Usuario en sesión:', req.session.userId || 'No autenticado');
    next();
});

// Importar rutas de autenticación
const authRoutes = require('./routes/authRoutes');

// Usar rutas de autenticación
app.use('/api/auth', authRoutes);

// Usar rutas de foros y usuario
app.use('/api/forums', forumRoutes);
app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/register.html'));
});

app.get('/forgot-password', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/forgot-password.html'));
});

app.get('/terms', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/terms.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/dashboard.html'));
});

app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/profile.html'));
});

app.get('/forum', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/forum.html'));
});

// Rutas básicas de prueba
app.get('/api/status', (req, res) => {
    res.json({ 
        status: '✅ Servidor funcionando', 
        timestamp: new Date().toISOString(),
        session: req.sessionID 
    });
});

app.get('/api/test-db', (req, res) => {
    res.json({ 
        message: '🔌 Endpoint para probar base de datos luego',
        dbStatus: 'No configurado aún'
    });
});

app.get('/api/test-usuario', async (req, res) => {
    try {
        const { buscarUsuarioPorCorreo } = require('./config/database');
        const usuario = await buscarUsuarioPorCorreo('test@test.com');
    
        res.json({
            message: '✅ Prueba de base de datos exitosa',
            usuarioEncontrado: usuario || 'No hay usuarios de prueba'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

const { testConnection } = require('./config/database.js');

const startServer = async () => {
    try {
        // Probar conexión a la base de datos primero
        await testConnection();
        
        // Iniciar servidor
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🔥 Servidor TheHearthCloud iniciado:`);
            console.log(`   🚀 http://localhost:${PORT}`);
            console.log(`   🚀 http://127.0.0.1:${PORT}`);
            console.log(`   📁 Entorno: ${process.env.NODE_ENV || 'development'}`);
            console.log(`   🗄️  Base de datos: ${process.env.DB_NAME ? '✅ Conectada' : '❌ No configurada'}`);
            console.log(`   🔐 Endpoints de auth disponibles en: /api/auth`);
        }).on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.log(`❌ Puerto ${PORT} ocupado. Soluciones:`);
                console.log(`   1. Cerrar otros servidores: taskkill /f /im node.exe`);
                console.log(`   2. Usar otro puerto: set PORT=3001`);
                console.log(`   3. Esperar 10 segundos y reintentar`);
            } else {
                console.error('❌ Error del servidor:', err);
            }
        });
        
    } catch (error) {
        console.error('❌ Error al iniciar servidor:', error);
        process.exit(1);
    }
};

// Iniciar el servidor
startServer();