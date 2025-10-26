class ForumManager {
    constructor() {
        this.apiBase = '/api';
        this.currentUser = null;
        this.currentForum = null;
        this.posts = [];
        this.editingPostId = null;
        this.editingCommentId = null;        
        this.editingCommentPostId = null;    
        this.init();
    }

    async init() {
        await this.checkAuth();
        this.setupEventListeners();
        await this.loadForumData();
        this.setupMedicalPopup();
    }

    async checkAuth() {
        try {
            const response = await fetch('/api/auth/status', {
                credentials: 'include'
            });
            
            const data = await response.json();
            
            if (data.authenticated) {
                this.currentUser = data.user;
            } else {
                window.location.href = '/pages/login.html';
            }
        } catch (error) {
            console.error('Error verificando autenticación:', error);
            window.location.href = '/pages/login.html';
        }
    }

    setupEventListeners() {
        // Crear publicación
        document.getElementById('createPostForm')?.addEventListener('submit', (e) => this.handleCreatePost(e));

        // Contador de caracteres en tiempo real
        document.getElementById('postContent')?.addEventListener('input', () => this.updatePostCharCounter());
        document.getElementById('editPostContent')?.addEventListener('input', () => this.updateEditPostCharCounter());
        
        // Eliminar foro
        document.getElementById('deleteForumBtn')?.addEventListener('click', () => this.openDeleteForumModal());
        document.getElementById('closeDeleteForumModal')?.addEventListener('click', () => this.closeDeleteForumModal());
        document.getElementById('cancelDeleteForum')?.addEventListener('click', () => this.closeDeleteForumModal());
        document.getElementById('confirmDeleteForum')?.addEventListener('click', () => this.handleDeleteForum());

        // Modales de edición
        document.getElementById('closeEditPostModal')?.addEventListener('click', () => this.closeEditPostModal());
        document.getElementById('cancelEditPost')?.addEventListener('click', () => this.closeEditPostModal());
        document.getElementById('editPostForm')?.addEventListener('submit', (e) => this.handleEditPost(e));

        // Modales de eliminación de publicación
        document.getElementById('closeDeletePostModal')?.addEventListener('click', () => this.closeDeletePostModal());
        document.getElementById('cancelDeletePost')?.addEventListener('click', () => this.closeDeletePostModal());
        document.getElementById('confirmDeletePost')?.addEventListener('click', () => this.handleDeletePost());

        // Modal editar comentario
        document.getElementById('closeEditCommentModal')?.addEventListener('click', () => this.closeEditCommentModal());
        document.getElementById('cancelEditComment')?.addEventListener('click', () => this.closeEditCommentModal());
        document.getElementById('editCommentForm')?.addEventListener('submit', (e) => this.handleEditComment(e));

        // Contador de caracteres en tiempo real para comentarios
        document.getElementById('editCommentContent')?.addEventListener('input', () => this.updateCommentCharCounter());

        // Cerrar sesión
        document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleLogout();
        });

        this.setupModalCloseOnOutsideClick();
    }

    setupMedicalPopup() {
    const popup = document.getElementById('medicalPopup');
    const closeBtn = document.getElementById('closeMedicalPopup');

    // Cerrar popup
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            if (popup) {
                popup.style.display = 'none';
            }
        });
    }

    // Cerrar popup al hacer clic fuera
    window.addEventListener('click', (e) => {
        if (e.target === popup) {
            popup.style.display = 'none';
        }
    });
}

    async loadForumData() {
        const forumId = this.getForumIdFromURL();
        if (!forumId) {
            this.showError('ID de foro no especificado');
            return;
        }

        try {
            await this.loadForumInfo(forumId);
            await this.loadPosts(forumId);
            this.initializeCharCounters();
        } catch (error) {
            console.error('Error cargando datos del foro:', error);
            this.showError('Error cargando el foro');
        }
    }

    initializeCharCounters() {
    this.updatePostCharCounter();
    this.updateEditPostCharCounter();
    this.updateCommentCharCounter();
}

    getForumIdFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

    async loadForumInfo(forumId) {
        try {
            const response = await fetch(`${this.apiBase}/forums/${forumId}`, {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Error cargando información del foro');
            }

            const data = await response.json();
            
            if (data.success) {
                this.currentForum = data.forum;
                this.renderForumInfo();
            } else {
                this.showError(data.message || 'Foro no encontrado');
            }

        } catch (error) {
            console.error('Error cargando info del foro:', error);
            throw error;
        }
    }

    renderForumInfo() {
        if (!this.currentForum) return;

        document.getElementById('forumTitle').textContent = this.currentForum.nombre;
        document.getElementById('forumDescription').textContent = this.currentForum.descripcion;
        document.getElementById('forumAuthor').textContent = `Creado por: ${this.currentForum.nombre_usuario}`;
        document.getElementById('forumDate').textContent = `Fecha: ${this.formatDate(this.currentForum.fecha_creacion)}`;

        if (this.currentUser && this.currentForum.usuario_id === this.currentUser.id) {
            document.getElementById('forumActions').style.display = 'block';
        }
    }

    async loadPosts(forumId) {
        try {
            const response = await fetch(`${this.apiBase}/forums/${forumId}/posts`, {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Error cargando publicaciones');
            }

            const data = await response.json();
            
            if (data.success) {
                this.posts = data.posts || [];
                this.renderPosts();
            } else {
                this.showError(data.message || 'Error cargando publicaciones');
            }

        } catch (error) {
            console.error('Error cargando publicaciones:', error);
            throw error;
        }
    }

    renderPosts() {
        const postsContainer = document.getElementById('postsContainer');
        const postsCount = document.getElementById('postsCount');

        if (!postsContainer || !postsCount) return;

        postsCount.textContent = `${this.posts.length} publicación${this.posts.length !== 1 ? 'es' : ''}`;

        if (this.posts.length === 0) {
            postsContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">💬</div>
                    <h3>No hay publicaciones aún</h3>
                    <p>Sé el primero en compartir algo en este foro.</p>
                </div>
            `;
            return;
        }

        const postsHTML = this.posts.map(post => `
            <div class="post-card" data-post-id="${post.id}">
                <div class="post-header">
                    <div class="post-info">
                        <div class="post-author">${this.escapeHtml(post.nombre_usuario)}</div>
                        <div class="post-date">${this.formatDate(post.fecha_publicacion)}${post.fecha_actualizacion ? ` (editado: ${this.formatDate(post.fecha_actualizacion)})` : ''}</div>
                    </div>
                    ${this.currentUser && post.usuario_id === this.currentUser.id ? `
                        <div class="post-actions">
                            <button class="post-action-btn edit" onclick="forum.openEditPostModal(${post.id})" title="Editar publicación">
                                ✏️
                            </button>
                            <button class="post-action-btn delete" onclick="forum.openDeletePostModal(${post.id})" title="Eliminar publicación">
                                🗑️
                            </button>
                        </div>
                    ` : ''}
                </div>
                <div class="post-content">${this.escapeHtml(post.contenido)}</div>
                
                <!-- Sección de comentarios -->
                <div class="comments-section">
                    <div class="comments-header">
                        <h4>Comentarios</h4>
                        <span class="comments-count">${post.comentarios ? post.comentarios.length : 0} comentarios</span>
                    </div>
                    
                    <!-- Formulario de comentario -->
                    <form class="comment-form" onsubmit="forum.handleCreateComment(event, ${post.id})">
                        <textarea 
                            class="comment-input" 
                            placeholder="Escribe un comentario..." 
                            required
                            minlength="5"
                            maxlength="150"
                        ></textarea>
                        <button type="submit" class="comment-submit">Comentar</button>
                    </form>
                    
                    <!-- Lista de comentarios -->
                    <div class="comments-list" id="comments-${post.id}">
                        ${post.comentarios && post.comentarios.length > 0 ? 
                            post.comentarios.map(comment => `
                                <div class="comment-card">
                                    <div class="comment-header">
                                        <div class="comment-info">
                                            <div class="comment-author">${this.escapeHtml(comment.nombre_usuario)}</div>
                                            <div class="comment-date">${this.formatDate(comment.fecha_comentario)}${comment.fecha_actualizacion ? ` (editado)` : ''}</div>
                                        </div>
                                        ${this.currentUser && comment.usuario_id === this.currentUser.id ? `
                                            <div class="comment-actions">
                                                <button class="comment-action-btn edit" onclick="forum.openEditCommentModal(${comment.id}, ${post.id})" title="Editar comentario">
                                                    ✏️
                                                </button>
                                                <button class="comment-action-btn delete" onclick="forum.openDeleteCommentModal(${comment.id}, ${post.id})" title="Eliminar comentario">
                                                    🗑️
                                                </button>
                                            </div>
                                        ` : ''}
                                    </div>
                                    <div class="comment-content">${this.escapeHtml(comment.contenido)}</div>
                                </div>
                            `).join('') : 
                            '<div class="empty-state" style="padding: var(--space-md); font-size: 0.9rem;">No hay comentarios aún</div>'
                        }
                    </div>
                </div>
            </div>
        `).join('');

        postsContainer.innerHTML = postsHTML;
    }

    // ===== PUBLICACIONES =====

    async handleCreatePost(e) {
        e.preventDefault();
        
        const form = e.target;
        const submitBtn = document.getElementById('createPostBtn');
        const postContent = document.getElementById('postContent').value.trim();

        if (!this.validatePostContent(postContent)) {
            return;
        }

        try {
            this.showLoading(submitBtn, 'Publicando...');
            this.clearFormErrors();

            const response = await fetch(`${this.apiBase}/forums/${this.currentForum.id}/posts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contenido: postContent
                }),
                credentials: 'include'
            });

            const result = await response.json();

            if (result.success) {
                await this.loadPosts(this.currentForum.id);
                form.reset();
                this.showSuccess('Publicación creada exitosamente');
            } else {
                this.showError(result.message || 'Error al crear la publicación');
            }

        } catch (error) {
            console.error('Error creando publicación:', error);
            this.showError('Error de conexión al crear la publicación');
        } finally {
            this.hideLoading(submitBtn, 'Publicar');
        }
    }

    openEditPostModal(postId) {
        const post = this.posts.find(p => p.id === postId);
        if (!post) return;

        this.editingPostId = postId;
        document.getElementById('editPostContent').value = post.contenido;
        document.getElementById('editPostModal').style.display = 'block';
        document.body.classList.add('modal-open');
    }

    closeEditPostModal() {
        document.getElementById('editPostModal').style.display = 'none';
        document.body.classList.remove('modal-open');
        this.editingPostId = null;
        document.getElementById('editPostForm').reset();
        this.clearFormErrors();
    }

    async handleEditPost(e) {
        e.preventDefault();
        
        const submitBtn = document.getElementById('submitEditPost');
        const postContent = document.getElementById('editPostContent').value.trim();

        if (!this.validatePostContent(postContent, 'editPostContent')) {
            return;
        }

        try {
            this.showLoading(submitBtn, 'Guardando...');
            this.clearFormErrors();

            const response = await fetch(`${this.apiBase}/forums/posts/${this.editingPostId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contenido: postContent
                }),
                credentials: 'include'
            });

            const result = await response.json();

            if (result.success) {
                await this.loadPosts(this.currentForum.id);
                this.closeEditPostModal();
                this.showSuccess('Publicación actualizada exitosamente');
            } else {
                this.showError(result.message || 'Error al actualizar la publicación');
            }

        } catch (error) {
            console.error('Error editando publicación:', error);
            this.showError('Error de conexión al actualizar la publicación');
        } finally {
            this.hideLoading(submitBtn, 'Guardar Cambios');
        }
    }

    openDeletePostModal(postId) {
        this.editingPostId = postId;
        document.getElementById('deletePostModal').style.display = 'block';
        document.body.classList.add('modal-open');
    }

    closeDeletePostModal() {
        document.getElementById('deletePostModal').style.display = 'none';
        document.body.classList.remove('modal-open');
        this.editingPostId = null;
    }

    async handleDeletePost() {
        if (!this.editingPostId) return;

        try {
            const submitBtn = document.getElementById('confirmDeletePost');
            this.showLoading(submitBtn, 'Eliminando...');

            const response = await fetch(`${this.apiBase}/forums/posts/${this.editingPostId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            const result = await response.json();

            if (result.success) {
                await this.loadPosts(this.currentForum.id);
                this.closeDeletePostModal();
                this.showSuccess('Publicación eliminada exitosamente');
            } else {
                this.showError(result.message || 'Error al eliminar la publicación');
            }

        } catch (error) {
            console.error('Error eliminando publicación:', error);
            this.showError('Error de conexión al eliminar la publicación');
        } finally {
            this.hideLoading(submitBtn, 'Eliminar Publicación');
        }
    }


    // Contador para nueva publicación
updatePostCharCounter() {
    const textarea = document.getElementById('postContent');
    const counter = document.getElementById('charCount');
    
    if (textarea && counter) {
        const length = textarea.value.length;
        counter.textContent = length;
        
        // Cambiar color según la cantidad de caracteres
        if (length > 300) {
            counter.style.color = 'var(--error)';
        } else if (length > 250) {
            counter.style.color = 'var(--warning)';
        } else {
            counter.style.color = 'var(--gray-dark)';
        }
    }
}

// Contador para editar publicación
updateEditPostCharCounter() {
    const textarea = document.getElementById('editPostContent');
    const counter = document.getElementById('editCharCount');
    
    if (textarea && counter) {
        const length = textarea.value.length;
        counter.textContent = length;
        
        // Cambiar color según la cantidad de caracteres
        if (length > 300) {
            counter.style.color = 'var(--error)';
        } else if (length > 250) {
            counter.style.color = 'var(--warning)';
        } else {
            counter.style.color = 'var(--gray-dark)';
        }
    }
}

    // ===== COMENTARIOS =====

    async handleCreateComment(e, postId) {
        e.preventDefault();
        
        const form = e.target;
        const commentInput = form.querySelector('.comment-input');
        const commentContent = commentInput.value.trim();

        if (!commentContent || commentContent.length < 5 || commentContent.length > 150) {
            this.showError('El comentario debe tener entre 5 y 150 caracteres');
            return;
        }

        try {
            const response = await fetch(`${this.apiBase}/forums/posts/${postId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contenido: commentContent
                }),
                credentials: 'include'
            });

            const result = await response.json();

            if (result.success) {
                await this.loadPosts(this.currentForum.id);
                form.reset();
            } else {
                this.showError(result.message || 'Error al crear el comentario');
            }

        } catch (error) {
            console.error('Error creando comentario:', error);
            this.showError('Error de conexión al crear el comentario');
        }
    }


// Abrir modal para editar comentario
openEditCommentModal(commentId, postId) {
    console.log('📝 Abriendo modal para editar comentario:', commentId, 'en publicación:', postId);
    
    // Encontrar el comentario en los posts cargados
    let targetComment = null;
    let targetPost = null;
    
    for (const post of this.posts) {
        if (post.comentarios) {
            const comment = post.comentarios.find(c => c.id === commentId);
            if (comment) {
                targetComment = comment;
                targetPost = post;
                break;
            }
        }
    }
    
    if (!targetComment) {
        console.error('❌ Comentario no encontrado:', commentId);
        this.showError('Comentario no encontrado');
        return;
    }

    // Guardar IDs para usar después
    this.editingCommentId = commentId;
    this.editingCommentPostId = targetPost.id;

    // Llenar el modal con el contenido actual
    document.getElementById('editCommentContent').value = targetComment.contenido;
    this.updateCommentCharCounter();
    
    // Mostrar modal
    document.getElementById('editCommentModal').style.display = 'block';
    document.body.classList.add('modal-open');
    
    console.log('✅ Modal de edición de comentario abierto');
}

// Cerrar modal de edición de comentario
closeEditCommentModal() {
    document.getElementById('editCommentModal').style.display = 'none';
    document.body.classList.remove('modal-open');
    this.editingCommentId = null;
    this.editingCommentPostId = null;
    document.getElementById('editCommentForm').reset();
    this.clearFormErrors();
}

// Manejar envío del formulario de edición de comentario
async handleEditComment(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submitEditComment');
    const commentContent = document.getElementById('editCommentContent').value.trim();

    // Validar contenido
    if (!this.validateCommentContent(commentContent, 'editCommentContent')) {
        return;
    }

    try {
        this.showLoading(submitBtn, 'Guardando...');
        this.clearFormErrors();

        console.log('🔄 Actualizando comentario:', this.editingCommentId);
        console.log('📝 Nuevo contenido:', commentContent);

        // Llamar al endpoint para actualizar comentario
        const response = await fetch(`${this.apiBase}/forums/comments/${this.editingCommentId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contenido: commentContent
            }),
            credentials: 'include'
        });

        const result = await response.json();
        console.log('📊 Resultado de actualización:', result);

        if (result.success) {
            // Recargar los posts para mostrar los cambios
            await this.loadPosts(this.currentForum.id);
            this.closeEditCommentModal();
            this.showSuccess('Comentario actualizado exitosamente');
        } else {
            this.showError(result.message || 'Error al actualizar el comentario');
        }

    } catch (error) {
        console.error('❌ Error editando comentario:', error);
        this.showError('Error de conexión al actualizar el comentario');
    } finally {
        this.hideLoading(submitBtn, 'Guardar Cambios');
    }
}

// Validar contenido de comentario
validateCommentContent(content, fieldId = 'editCommentContent') {
    const errorElement = document.getElementById(`${fieldId}Error`);
    
    if (!content) {
        this.showFieldError(fieldId, 'El comentario no puede estar vacío');
        return false;
    }

    if (content.length < 5 || content.length > 150) {
        this.showFieldError(fieldId, 'El comentario debe tener entre 5 y 150 caracteres');
        return false;
    }

    this.hideError(errorElement);
    return true;
}

// Actualizar contador de caracteres para comentarios
updateCommentCharCounter() {
    const textarea = document.getElementById('editCommentContent');
    const counter = document.getElementById('editCommentCharCount');
    
    if (textarea && counter) {
        const length = textarea.value.length;
        counter.textContent = length;
        
        // Cambiar color si se excede
        if (length > 150) {
            counter.style.color = 'var(--error)';
        } else if (length > 130) {
            counter.style.color = 'var(--warning)';
        } else {
            counter.style.color = 'var(--gray-dark)';
        }
    }
}

setupModalCloseOnOutsideClick() {
    const modals = document.querySelectorAll('.modal');
    
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
                document.body.classList.remove('modal-open');
                
                // Resetear IDs de edición si se cierra el modal
                if (modal.id === 'editCommentModal') {
                    this.editingCommentId = null;
                    this.editingCommentPostId = null;
                }
            }
        });
    });
}

    openDeleteCommentModal(commentId, postId) {
        this.editingCommentId = commentId;
        if (confirm('¿Estás seguro de que quieres eliminar este comentario?')) {
            this.handleDeleteComment(commentId, postId);
        }
    }

    async handleDeleteComment(commentId, postId) {
        try {
            const response = await fetch(`${this.apiBase}/forums/comments/${commentId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            const result = await response.json();

            if (result.success) {
                await this.loadPosts(this.currentForum.id);
                this.showSuccess('Comentario eliminado exitosamente');
            } else {
                this.showError(result.message || 'Error al eliminar el comentario');
            }

        } catch (error) {
            console.error('Error eliminando comentario:', error);
            this.showError('Error de conexión al eliminar el comentario');
        }
    }

    // ===== ELIMINAR FORO =====

    openDeleteForumModal() {
        document.getElementById('deleteForumModal').style.display = 'block';
        document.body.classList.add('modal-open');
    }

    closeDeleteForumModal() {
        document.getElementById('deleteForumModal').style.display = 'none';
        document.body.classList.remove('modal-open');
    }

    async handleDeleteForum() {
        if (!this.currentForum) return;

        try {
            const submitBtn = document.getElementById('confirmDeleteForum');
            this.showLoading(submitBtn, 'Eliminando...');

            const response = await fetch(`${this.apiBase}/forums/${this.currentForum.id}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess('Foro eliminado exitosamente');
                setTimeout(() => {
                    window.location.href = '/pages/dashboard.html';
                }, 1500);
            } else {
                this.showError(result.message || 'Error al eliminar el foro');
            }

        } catch (error) {
            console.error('Error eliminando foro:', error);
            this.showError('Error de conexión al eliminar el foro');
        } finally {
            this.hideLoading(submitBtn, 'Eliminar Foro Permanentemente');
        }
    }

    // ===== UTILIDADES =====

    validatePostContent(content, fieldId = 'postContent') {
        const errorElement = document.getElementById(`${fieldId}Error`);
        
        if (!content) {
            this.showFieldError(fieldId, 'El contenido de la publicación es requerido');
            return false;
        }

        if (content.length < 10 || content.length > 300) {
            this.showFieldError(fieldId, 'La publicación debe tener entre 10 y 300 caracteres');
            return false;
        }

        this.hideError(errorElement);
        return true;
    }

    async handleLogout() {
        if (!confirm('¿Estás seguro de que quieres cerrar sesión?')) return;

        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });

            const data = await response.json();

            if (data.success) {
                window.location.href = '/index.html';
            } else {
                this.showError('Error al cerrar sesión');
            }
        } catch (error) {
            console.error('Error cerrando sesión:', error);
            window.location.href = '/index.html';
        }
    }

    setupModalCloseOnOutsideClick() {
        const modals = document.querySelectorAll('.modal');
        
        modals.forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                    document.body.classList.remove('modal-open');
                }
            });
        });
    }

    // Utilidades de UI
    showLoading(button, text) {
        if (!button) return;
        
        button.disabled = true;
        const btnText = button.querySelector('.btn-text');
        const btnLoading = button.querySelector('.btn-loading');
        
        if (btnText && btnLoading) {
            btnText.style.display = 'none';
            btnLoading.style.display = 'flex';
        } else {
            button.textContent = text;
        }
    }

    hideLoading(button, originalText) {
        if (!button) return;
        
        button.disabled = false;
        const btnText = button.querySelector('.btn-text');
        const btnLoading = button.querySelector('.btn-loading');
        
        if (btnText && btnLoading) {
            btnText.style.display = 'block';
            btnLoading.style.display = 'none';
        } else {
            button.textContent = originalText;
        }
    }

    showFieldError(fieldName, message) {
        const errorElement = document.getElementById(`${fieldName}Error`);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    hideError(element) {
        if (element) {
            element.textContent = '';
            element.style.display = 'none';
        }
    }

    clearFormErrors() {
        const errorElements = document.querySelectorAll('.form-error');
        errorElements.forEach(element => {
            this.hideError(element);
        });
    }

    showSuccess(message) {
        alert('✅ ' + message);
    }

    showError(message) {
        alert('❌ ' + message);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Inicializar foro
let forum;

document.addEventListener('DOMContentLoaded', () => {
    forum = new ForumManager();
    window.forum = forum;
});