const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '3DWIN1109',
    database: process.env.DB_NAME || 'TheHearthCloud',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 20,
    queueLimit: 0,
};

// Pool de conexiones
const pool = mysql.createPool(dbConfig);

const queryCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

async function query(sql, params = [], useCache = false) {
    try {
        // Generar clave de cache
        const cacheKey = useCache ? `${sql}-${JSON.stringify(params)}` : null;
        
        if (useCache && cacheKey && queryCache.has(cacheKey)) {
            const cached = queryCache.get(cacheKey);
            if (Date.now() - cached.timestamp < CACHE_TTL) {
                console.log('Usando cache para query');
                return cached.data;
            }
        }const [results] = await pool.execute(sql, params);
        
        if (useCache && cacheKey) {
            queryCache.set(cacheKey, {
                data: results,
                timestamp: Date.now()
            });
        }
        
        return results;
    } catch (error) {
        console.error('❌ Error en query:', error.message);
        throw error;
    }
}

// Limpiar cache periódicamente
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of queryCache.entries()) {
        if (now - value.timestamp > CACHE_TTL) {
            queryCache.delete(key);
        }
    }
}, CACHE_TTL);

// Función para probar conexión
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Conexión a MySQL exitosa');
        
        // Verificar tablas
        const [tables] = await connection.execute('SHOW TABLES');
        console.log('Tablas en la base de datos:', tables.map(t => t.Tables_in_thehearthcloud));
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Error conectando a MySQL:', error.message);
        return false;
    }
}

// Función para ejecutar queries
async function query(sql, params = []) {
    try {
        const [results] = await pool.execute(sql, params);
        return results;
    } catch (error) {
        console.error('Error en query:', error.message);
        throw error;
    }
}

// Función específica para usuarios
async function crearUsuario(usuarioData) {
    const { nombre_usuario, correo, contraseña_hash, pregunta_seguridad, respuesta_seguridad_hash } = usuarioData;
    
    const sql = `INSERT INTO usuarios (nombre_usuario, correo, contraseña_hash, pregunta_seguridad, respuesta_seguridad_hash) 
    VALUES (?, ?, ?, ?, ?)`;
    try {
        const [result] = await pool.execute(sql, [
            nombre_usuario, 
            correo, 
            contraseña_hash, 
            pregunta_seguridad, 
            respuesta_seguridad_hash
        ]);
        return result;
    } catch (error) {
        console.error('Error en crearUsuario:', error);
        throw error;
    }
}

// Función para buscar usuario por correo
async function buscarUsuarioPorCorreo(correo) {
    try {
        const sql = 'SELECT * FROM usuarios WHERE correo = ?';
        const [users] = await pool.execute(sql, [correo]);
        return users[0]; // Devuelve el primer usuario o undefined
    } catch (error) {
        console.error('Error en buscarUsuarioPorCorreo:', error);
        throw error;
    }
}

module.exports = {
    pool,
    query,
    testConnection,
    crearUsuario,
    buscarUsuarioPorCorreo,
};