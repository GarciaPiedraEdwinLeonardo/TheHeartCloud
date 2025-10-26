const express = require('express');
const router = express.Router();

// Importar controladores
const {
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
} = require('../controllers/forumController');

// Importar middlewares
const { requireAuth } = require('../middleware/authMiddleware');
const { validateForumCreation } = require('../middleware/validationMiddleware');

// Aplicar autenticación a todas las rutas
router.use(requireAuth);

// Rutas existentes de foros
router.get('/my-forums', getMyForums);
router.get('/search', searchForums);
router.post('/create', validateForumCreation, createForum);
router.delete('/:id', deleteForum);

// Nuevas rutas para foros específicos
router.get('/:id', getForumById);
router.get('/:id/posts', getForumPosts);

// Rutas para publicaciones
router.post('/:forumId/posts', createPost);
router.put('/posts/:postId', updatePost);
router.delete('/posts/:postId', deletePost);

// Rutas para comentarios
router.post('/posts/:postId/comments', createComment);
router.put('/comments/:commentId', updateComment);
router.delete('/comments/:commentId', deleteComment);

module.exports = router;