const { query } = require('../config/database');


// Obtener foros del usuario actual
async function getMyForums(req, res) {
    try {
        const userId = req.session.userId;
        
        const sql = `
            SELECT f.*, u.nombre_usuario 
            FROM foros f 
            JOIN usuarios u ON f.usuario_id = u.id 
            WHERE f.usuario_id = ? 
            ORDER BY f.fecha_creacion DESC 
            LIMIT 10
        `;
        
        const forums = await query(sql, [userId]);
        
        res.json({
            success: true,
            forums: forums
        });
        
    } catch (error) {
        console.error('Error obteniendo foros:', error);
        res.status(500).json({
            success: false,
            message: 'Error del servidor al obtener foros'
        });
    }
}

// Buscar foros
async function searchForums(req, res) {
    try {
        const searchTerm = req.query.q;
        
        if (!searchTerm || searchTerm.length > 30) {
            return res.status(400).json({
                success: false,
                message: 'Término de búsqueda inválido'
            });
        }

        const sql = `
            SELECT f.*, u.nombre_usuario 
            FROM foros f 
            JOIN usuarios u ON f.usuario_id = u.id 
            WHERE f.nombre LIKE ? 
            ORDER BY f.fecha_creacion DESC
        `;
        
        const forums = await query(sql, [`%${searchTerm}%`]);
        
        res.json({
            success: true,
            forums: forums
        });
        
    } catch (error) {
        console.error('Error buscando foros:', error);
        res.status(500).json({
            success: false,
            message: 'Error del servidor en la búsqueda'
        });
    }
}

// Crear nuevo foro
async function createForum(req, res) {
    try {
        const { nombre, descripcion } = req.body;
        const userId = req.session.userId;

        // Verificar si el nombre ya existe
        const checkSql = 'SELECT id FROM foros WHERE nombre = ?';
        const existingForums = await query(checkSql, [nombre]);
        
        if (existingForums.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Ya existe un foro con ese nombre',
                field: 'forumName'
            });
        }

        // Crear foro
        const insertSql = `
            INSERT INTO foros (nombre, descripcion, usuario_id) 
            VALUES (?, ?, ?)
        `;
        
        const result = await query(insertSql, [nombre, descripcion, userId]);
        
        res.status(201).json({
            success: true,
            message: 'Foro creado exitosamente',
            forumId: result.insertId
        });
        
    } catch (error) {
        console.error('Error creando foro:', error);
        res.status(500).json({
            success: false,
            message: 'Error del servidor al crear el foro'
        });
    }
}

// Eliminar foro
async function deleteForum(req, res) {
    try {
        const forumId = req.params.id;
        const userId = req.session.userId;

        // Verificar que el usuario es el propietario
        const checkSql = 'SELECT usuario_id FROM foros WHERE id = ?';
        const forums = await query(checkSql, [forumId]);
        
        if (forums.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Foro no encontrado'
            });
        }

        if (forums[0].usuario_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para eliminar este foro'
            });
        }

        // Eliminar foro (ON DELETE CASCADE se encargará de publicaciones y comentarios)
        const deleteSql = 'DELETE FROM foros WHERE id = ?';
        await query(deleteSql, [forumId]);
        
        res.json({
            success: true,
            message: 'Foro eliminado exitosamente'
        });
        
    } catch (error) {
        console.error('Error eliminando foro:', error);
        res.status(500).json({
            success: false,
            message: 'Error del servidor al eliminar el foro'
        });
    }
}

// Obtener foro por ID
async function getForumById(req, res) {
    try {
        const forumId = req.params.id;

        const sql = `
            SELECT f.*, u.nombre_usuario 
            FROM foros f 
            JOIN usuarios u ON f.usuario_id = u.id 
            WHERE f.id = ?
        `;
        
        const forums = await query(sql, [forumId]);
        
        if (forums.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Foro no encontrado'
            });
        }

        res.json({
            success: true,
            forum: forums[0]
        });
        
    } catch (error) {
        console.error('Error obteniendo foro:', error);
        res.status(500).json({
            success: false,
            message: 'Error del servidor al obtener el foro'
        });
    }
}

// Obtener publicaciones de un foro
async function getForumPosts(req, res) {
    try {
        const forumId = req.params.id;

        // Verificar que el foro existe
        const forumCheck = await query('SELECT id FROM foros WHERE id = ?', [forumId]);
        if (forumCheck.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Foro no encontrado'
            });
        }

        // Obtener publicaciones con información del autor
        const postsSql = `
            SELECT p.*, u.nombre_usuario 
            FROM publicaciones p 
            JOIN usuarios u ON p.usuario_id = u.id 
            WHERE p.foro_id = ? 
            ORDER BY p.fecha_publicacion DESC
        `;
        
        const posts = await query(postsSql, [forumId]);

        // Obtener comentarios para cada publicación
        for (let post of posts) {
            const commentsSql = `
                SELECT c.*, u.nombre_usuario 
                FROM comentarios c 
                JOIN usuarios u ON c.usuario_id = u.id 
                WHERE c.publicacion_id = ? 
                ORDER BY c.fecha_comentario ASC
            `;
            
            const comments = await query(commentsSql, [post.id]);
            post.comentarios = comments;
        }

        res.json({
            success: true,
            posts: posts
        });
        
    } catch (error) {
        console.error('Error obteniendo publicaciones:', error);
        res.status(500).json({
            success: false,
            message: 'Error del servidor al obtener publicaciones'
        });
    }
}

// Crear publicación
async function createPost(req, res) {
    try {
        const { contenido } = req.body;
        const forumId = req.params.forumId;
        const userId = req.session.userId;

        // Validar longitud del contenido
        if (!contenido || contenido.length < 10 || contenido.length > 300) {
            return res.status(400).json({
                success: false,
                message: 'La publicación debe tener entre 10 y 300 caracteres'
            });
        }

        // Verificar que el foro existe
        const forumCheck = await query('SELECT id FROM foros WHERE id = ?', [forumId]);
        if (forumCheck.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Foro no encontrado'
            });
        }

        // Crear publicación
        const insertSql = `
            INSERT INTO publicaciones (contenido, usuario_id, foro_id) 
            VALUES (?, ?, ?)
        `;
        
        const result = await query(insertSql, [contenido, userId, forumId]);

        // Obtener la publicación creada con información del autor
        const postSql = `
            SELECT p.*, u.nombre_usuario 
            FROM publicaciones p 
            JOIN usuarios u ON p.usuario_id = u.id 
            WHERE p.id = ?
        `;
        
        const newPost = await query(postSql, [result.insertId]);
        
        res.status(201).json({
            success: true,
            message: 'Publicación creada exitosamente',
            post: newPost[0]
        });
        
    } catch (error) {
        console.error('Error creando publicación:', error);
        res.status(500).json({
            success: false,
            message: 'Error del servidor al crear la publicación'
        });
    }
}

// Actualizar publicación
async function updatePost(req, res) {
    try {
        const postId = req.params.postId;
        const { contenido } = req.body;
        const userId = req.session.userId;

        // Validar longitud del contenido
        if (!contenido || contenido.length < 10 || contenido.length > 300) {
            return res.status(400).json({
                success: false,
                message: 'La publicación debe tener entre 10 y 300 caracteres'
            });
        }

        // Verificar que la publicación existe y pertenece al usuario
        const postCheck = await query('SELECT usuario_id FROM publicaciones WHERE id = ?', [postId]);
        if (postCheck.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Publicación no encontrada'
            });
        }

        if (postCheck[0].usuario_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para editar esta publicación'
            });
        }

        // Actualizar publicación
        const updateSql = `
            UPDATE publicaciones 
            SET contenido = ?, fecha_actualizacion = CURRENT_TIMESTAMP 
            WHERE id = ?
        `;
        
        await query(updateSql, [contenido, postId]);
        
        res.json({
            success: true,
            message: 'Publicación actualizada exitosamente'
        });
        
    } catch (error) {
        console.error('Error actualizando publicación:', error);
        res.status(500).json({
            success: false,
            message: 'Error del servidor al actualizar la publicación'
        });
    }
}

// Eliminar publicación
async function deletePost(req, res) {
    try {
        const postId = req.params.postId;
        const userId = req.session.userId;

        // Verificar que la publicación existe y pertenece al usuario
        const postCheck = await query('SELECT usuario_id FROM publicaciones WHERE id = ?', [postId]);
        if (postCheck.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Publicación no encontrada'
            });
        }

        if (postCheck[0].usuario_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para eliminar esta publicación'
            });
        }

        // Eliminar publicación (ON DELETE CASCADE se encargará de los comentarios)
        const deleteSql = 'DELETE FROM publicaciones WHERE id = ?';
        await query(deleteSql, [postId]);
        
        res.json({
            success: true,
            message: 'Publicación eliminada exitosamente'
        });
        
    } catch (error) {
        console.error('Error eliminando publicación:', error);
        res.status(500).json({
            success: false,
            message: 'Error del servidor al eliminar la publicación'
        });
    }
}

// Crear comentario
async function createComment(req, res) {
    try {
        const postId = req.params.postId;
        const { contenido } = req.body;
        const userId = req.session.userId;

        // Validar longitud del contenido
        if (!contenido || contenido.length < 5 || contenido.length > 150) {
            return res.status(400).json({
                success: false,
                message: 'El comentario debe tener entre 5 y 150 caracteres'
            });
        }

        // Verificar que la publicación existe
        const postCheck = await query('SELECT id FROM publicaciones WHERE id = ?', [postId]);
        if (postCheck.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Publicación no encontrada'
            });
        }

        // Crear comentario
        const insertSql = `
            INSERT INTO comentarios (contenido, usuario_id, publicacion_id) 
            VALUES (?, ?, ?)
        `;
        
        const result = await query(insertSql, [contenido, userId, postId]);

        // Obtener el comentario creado con información del autor
        const commentSql = `
            SELECT c.*, u.nombre_usuario 
            FROM comentarios c 
            JOIN usuarios u ON c.usuario_id = u.id 
            WHERE c.id = ?
        `;
        
        const newComment = await query(commentSql, [result.insertId]);
        
        res.status(201).json({
            success: true,
            message: 'Comentario creado exitosamente',
            comment: newComment[0]
        });
        
    } catch (error) {
        console.error('Error creando comentario:', error);
        res.status(500).json({
            success: false,
            message: 'Error del servidor al crear el comentario'
        });
    }
}

// Actualizar comentario
async function updateComment(req, res) {
    try {
        const commentId = req.params.commentId;
        const { contenido } = req.body;
        const userId = req.session.userId;

        // Validar longitud del contenido
        if (!contenido || contenido.length < 5 || contenido.length > 150) {
            return res.status(400).json({
                success: false,
                message: 'El comentario debe tener entre 5 y 150 caracteres'
            });
        }

        // Verificar que el comentario existe y pertenece al usuario
        const commentCheck = await query('SELECT usuario_id FROM comentarios WHERE id = ?', [commentId]);
        if (commentCheck.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Comentario no encontrado'
            });
        }

        if (commentCheck[0].usuario_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para editar este comentario'
            });
        }

        // Actualizar comentario
        const updateSql = `
            UPDATE comentarios 
            SET contenido = ?, fecha_actualizacion = CURRENT_TIMESTAMP 
            WHERE id = ?
        `;
        
        await query(updateSql, [contenido, commentId]);
        
        res.json({
            success: true,
            message: 'Comentario actualizado exitosamente'
        });
        
    } catch (error) {
        console.error('Error actualizando comentario:', error);
        res.status(500).json({
            success: false,
            message: 'Error del servidor al actualizar el comentario'
        });
    }
}

// Eliminar comentario
async function deleteComment(req, res) {
    try {
        const commentId = req.params.commentId;
        const userId = req.session.userId;

        // Verificar que el comentario existe y pertenece al usuario
        const commentCheck = await query('SELECT usuario_id FROM comentarios WHERE id = ?', [commentId]);
        if (commentCheck.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Comentario no encontrado'
            });
        }

        if (commentCheck[0].usuario_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para eliminar este comentario'
            });
        }

        // Eliminar comentario
        const deleteSql = 'DELETE FROM comentarios WHERE id = ?';
        await query(deleteSql, [commentId]);
        
        res.json({
            success: true,
            message: 'Comentario eliminado exitosamente'
        });
        
    } catch (error) {
        console.error('Error eliminando comentario:', error);
        res.status(500).json({
            success: false,
            message: 'Error del servidor al eliminar el comentario'
        });
    }
}

module.exports = {
    getMyForums,
    searchForums,
    createForum,
    deleteForum,
    getForumById,
    getForumPosts,
    createPost,
    updatePost,
    deletePost,
    createComment,
    updateComment,
    deleteComment
};