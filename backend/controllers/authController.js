const { query, crearUsuario, buscarUsuarioPorCorreo } = require('../config/database');
const { hashPassword, verifyPassword, hashSecurityAnswer, verifySecurityAnswer } = require('../utils/passwordUtils');

// Registrar nuevo usuario
async function registrarUsuario(req, res) {
    try {
        const { nombre_usuario, correo, password, pregunta_seguridad, respuesta_seguridad } = req.body;
        // Verificar si el correo ya existe
        const usuarioExistente = await buscarUsuarioPorCorreo(correo);
        if (usuarioExistente) {
            return res.status(409).json({
                success: false,
                message: 'Este correo ya está registrado',
                suggestion: '¿Quieres iniciar sesión?'
            });
        }
        //CORREGIDO: Verificar si el nombre de usuario ya existe
        const sqlCheckUsername = 'SELECT id FROM usuarios WHERE nombre_usuario = ?';
        const usernameResult = await query(sqlCheckUsername, [nombre_usuario]);
        if (usernameResult && usernameResult.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Este nombre de usuario ya está en uso',
                field: 'username'
            });
        }

        // Hashear contraseña y respuesta de seguridad
        const contraseñaHash = await hashPassword(password);
        const respuestaHash = await hashSecurityAnswer(respuesta_seguridad);

        // Crear usuario en la base de datos
        const result = await crearUsuario({
            nombre_usuario,
            correo,
            contraseña_hash: contraseñaHash,
            pregunta_seguridad,
            respuesta_seguridad_hash: respuestaHash
        });

        // Crear sesión
        req.session.userId = result.insertId;
        req.session.nombre_usuario = nombre_usuario;

        res.status(201).json({
            success: true,
            message: 'Cuenta creada exitosamente',
            user: {
                id: result.insertId,
                nombre_usuario: nombre_usuario,
                correo: correo
            }
        });

        } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({
            success: false,
            message: 'Error del servidor al crear la cuenta'
        });
    }
}


// Iniciar sesión
async function iniciarSesion(req, res) {
    try {
        const { correo, password, rememberMe } = req.body;

        // Buscar usuario por correo
        const usuario = await buscarUsuarioPorCorreo(correo);
        if (!usuario) {
            return res.status(401).json({
                success: false,
                message: 'Correo o contraseña incorrectos',
                field: 'email'
            });
        }

        // Verificar contraseña
        const contraseñaValida = await verifyPassword(password, usuario.contraseña_hash);
        if (!contraseñaValida) {
            return res.status(401).json({
                success: false,
                message: 'Correo o contraseña incorrectos',
                field: 'password'
            });
        }

        // Configurar sesión
        req.session.userId = usuario.id;
        req.session.nombre_usuario = usuario.nombre_usuario;

        // Configurar cookie de sesión más larga si rememberMe está activado
        if (rememberMe) {
            req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 días
        }

        res.json({
            success: true,
            message: 'Sesión iniciada correctamente',
            user: {
                id: usuario.id,
                nombre_usuario: usuario.nombre_usuario,
                correo: usuario.correo
            }
            });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error del servidor al iniciar sesión'
        });
    }
}

// Cerrar sesión
function cerrarSesion(req, res) {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error al cerrar sesión:', err);
            return res.status(500).json({
                success: false,
                message: 'Error al cerrar sesión'
            });
        }

        res.clearCookie('connect.sid'); // Limpiar cookie de sesión
        res.json({
            success: true,
            message: 'Sesión cerrada correctamente'
        });
    });
}

// Iniciar proceso de recuperación de cuenta
async function iniciarRecuperacion(req, res) {
    try {
        const { correo } = req.body;

        // Buscar usuario por correo
        const usuario = await buscarUsuarioPorCorreo(correo);
        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'El correo no está registrado'
            });
        }

        // Devolver pregunta de seguridad (sin información sensible)
        res.json({
            success: true,
            pregunta_seguridad: usuario.pregunta_seguridad,
            usuario_id: usuario.id
        });

    } catch (error) {
        console.error('Error en recuperación:', error);
        res.status(500).json({
            success: false,
            message: 'Error del servidor al procesar la recuperación'
        });
    }
}

// Verificar respuesta de seguridad
async function verificarRespuesta(req, res) {
    try {
        const { usuario_id, respuesta } = req.body;

        // Buscar usuario
        const sql = 'SELECT * FROM usuarios WHERE id = ?';
        const usuarios = await query(sql, [usuario_id]);
        
        if (usuarios.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        const usuario = usuarios[0];

        // Verificar respuesta de seguridad
        const respuestaValida = await verifySecurityAnswer(respuesta, usuario.respuesta_seguridad_hash);
        if (!respuestaValida) {
            return res.status(401).json({
                success: false,
                message: 'La respuesta de seguridad es incorrecta'
            });
        }

        // Crear token temporal para cambio de contraseña (en este caso usamos la sesión)
        req.session.recoveryUserId = usuario.id;
        req.session.recoveryAllowed = true;

        res.json({
            success: true,
            message: 'Respuesta verificada correctamente'
        });

    } catch (error) {
        console.error('Error en verificación:', error);
        res.status(500).json({
            success: false,
            message: 'Error del servidor al verificar la respuesta'
        });
    }
}

// Cambiar contraseña después de recuperación
async function cambiarContraseña(req, res) {
    try {
        const { nuevaPassword } = req.body;

        // Verificar que la recuperación está autorizada
        if (!req.session.recoveryAllowed || !req.session.recoveryUserId) {
            return res.status(403).json({
                success: false,
                message: 'No autorizado para cambiar la contraseña'
            });
        }

        const usuario_id = req.session.recoveryUserId;
         // Hashear nueva contraseña
        const nuevaContraseñaHash = await hashPassword(nuevaPassword);

        // Actualizar contraseña en la base de datos
        const sql = 'UPDATE usuarios SET contraseña_hash = ? WHERE id = ?';
        await query(sql, [nuevaContraseñaHash, usuario_id]);

        // Limpiar sesión de recuperación
        delete req.session.recoveryUserId;
        delete req.session.recoveryAllowed;

        res.json({
            success: true,
            message: 'Contraseña actualizada exitosamente'
        });

    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        res.status(500).json({
            success: false,
            message: 'Error del servidor al cambiar la contraseña'
        });
    }
}

// Verificar estado de autenticación
function verificarAuth(req, res) {
    if (req.session.userId) {
        res.json({
            authenticated: true,
            user: {
                id: req.session.userId,
                nombre_usuario: req.session.nombre_usuario
            }
        });
    } else {
        res.json({
            authenticated: false
        });
    }
}

module.exports = {
    registrarUsuario,
    iniciarSesion,
    cerrarSesion,
    iniciarRecuperacion,
    verificarRespuesta,
    cambiarContraseña,
    verificarAuth
};
