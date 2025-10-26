const { query } = require('../config/database');

// Obtener perfil del usuario actual
async function getMyProfile(req, res) {
    try {
        const userId = req.session.userId;
        
        const userSql = 'SELECT id, nombre_usuario, correo, fecha_registro FROM usuarios WHERE id = ?';
        const [user] = await query(userSql, [userId]);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Obtener estadísticas
        const stats = await getUserStats(userId);
        
        res.json({
            success: true,
            user: {
                ...user,
                estadisticas: stats
            }
        });
        
    } catch (error) {
        console.error('Error obteniendo perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Error del servidor al obtener el perfil'
        });
    }
}

// Obtener estadísticas del usuario
async function getUserStats(userId) {
    try {
        // Contar foros creados
        const forumsSql = 'SELECT COUNT(*) as count FROM foros WHERE usuario_id = ?';
        const forumsResult = await query(forumsSql, [userId]);
        
        // Contar publicaciones
        const postsSql = 'SELECT COUNT(*) as count FROM publicaciones WHERE usuario_id = ?';
        const postsResult = await query(postsSql, [userId]);
        
        // Contar comentarios
        const commentsSql = 'SELECT COUNT(*) as count FROM comentarios WHERE usuario_id = ?';
        const commentsResult = await query(commentsSql, [userId]);
        
        return {
            foros_creados: forumsResult[0].count,
            publicaciones: postsResult[0].count,
            comentarios: commentsResult[0].count
        };
        
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        return {
            foros_creados: 0,
            publicaciones: 0,
            comentarios: 0
        };
    }
}

// Eliminar cuenta de usuario
async function deleteAccount(req, res) {
    try {
        const userId = req.session.userId;
        const { password } = req.body;

        // Verificar contraseña
        const userSql = 'SELECT contraseña_hash FROM usuarios WHERE id = ?';
        const [user] = await query(userSql, [userId]);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        const { verifyPassword } = require('../utils/passwordUtils');
        const passwordValid = await verifyPassword(password, user.contraseña_hash);
        
        if (!passwordValid) {
            return res.status(401).json({
                success: false,
                message: 'Contraseña incorrecta'
            });
        }

        // Eliminar usuario (ON DELETE CASCADE se encargará de foros, publicaciones y comentarios)
        const deleteSql = 'DELETE FROM usuarios WHERE id = ?';
        await query(deleteSql, [userId]);

        // Destruir sesión
        req.session.destroy((err) => {
            if (err) {
                console.error('Error destruyendo sesión:', err);
            }
        });

        res.json({
            success: true,
            message: 'Cuenta eliminada exitosamente'
        });
        
    } catch (error) {
        console.error('Error eliminando cuenta:', error);
        res.status(500).json({
            success: false,
            message: 'Error del servidor al eliminar la cuenta'
        });
    }
}

module.exports = {
    getMyProfile,
    deleteAccount
};