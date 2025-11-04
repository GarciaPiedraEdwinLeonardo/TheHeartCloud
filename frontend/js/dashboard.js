class DashboardManager {
    constructor() {
        this.apiBase = '/api';
        this.currentUser = null;
        this.recentForums = [];
        this.searchResults = [];
        this.init();
    }

    async init() {
        await this.checkAuth();
        this.setupEventListeners();
        this.loadDashboardData();
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
                this.updateUIForUser();
            } else {
                window.location.href = '/pages/login.html';
            }
        } catch (error) {
            console.error('Error verificando autenticación:', error);
            window.location.href = '/pages/login.html';
        }
    }

    updateUIForUser() {
        // Actualizar nombre de usuario
        const userNameElement = document.getElementById('userName');
        if (userNameElement && this.currentUser) {
            userNameElement.textContent = this.currentUser.nombre_usuario;
        }
    }

    setupEventListeners() {
        // Modal crear foro
        document.getElementById('createForumBtn')?.addEventListener('click', () => this.openCreateForumModal());
        document.getElementById('closeModal')?.addEventListener('click', () => this.closeCreateForumModal());
        document.getElementById('cancelCreateForum')?.addEventListener('click', () => this.closeCreateForumModal());
        document.getElementById('createForumForm')?.addEventListener('submit', (e) => this.handleCreateForum(e));

        // Búsqueda
        document.getElementById('searchBtn')?.addEventListener('click', () => this.handleSearch());
        document.getElementById('searchForums')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSearch();
            }
        });
        document.getElementById('clearSearch')?.addEventListener('click', () => this.clearSearch());

        this.setupModalCloseOnOutsideClick();   

        const searchInput = document.getElementById('searchForums');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    if (e.target.value.trim().length >= 2) {
                        this.handleSearch();
                    }
                }, 500);
            });
        }
    }

    setupMedicalPopup() {
        const popup = document.getElementById('medicalPopup');
        const closeBtn = document.getElementById('closeMedicalPopup');

        // Mostrar popup al cargar
        setTimeout(() => {
            if (popup) {
                popup.style.display = 'block';
            }
        }, 1000);

        // Cerrar popup
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                popup.style.display = 'none';
            });
        }

        // Cerrar popup al hacer clic fuera
        window.addEventListener('click', (e) => {
            if (e.target === popup) {
                popup.style.display = 'none';
            }
        });
    }

    viewForum(forumId) {
    window.location.href = `/pages/forum.html?id=${forumId}`;
    }

    async loadDashboardData() {
        try {
            await this.loadRecentForums();
        } catch (error) {
            console.error('Error cargando datos del dashboard:', error);
        }
    }

    async loadRecentForums() {
    const forumsGrid = document.getElementById('recentForums');
    
    try {
        
        if (forumsGrid) {
            forumsGrid.innerHTML = LoadingManager.createSkeletonLoader('card', 3);
        }

        const response = await fetch(`${this.apiBase}/forums/my-forums`, {
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();
            this.recentForums = data.forums || [];
            this.renderRecentForums();
        } else {
            this.showEmptyForumsState();
        }
    } catch (error) {
        console.error('Error cargando foros recientes:', error);
        this.showEmptyForumsState();
    }
}

    renderRecentForums() {
        const forumsGrid = document.getElementById('recentForums');
        
        if (!forumsGrid) return;

        if (this.recentForums.length === 0) {
            this.showEmptyForumsState();
            return;
        }

        const forumsHTML = this.recentForums.map(forum => `
            <div class="forum-card" data-forum-id="${forum.id}">
                <div class="forum-header">
                    <div class="forum-info">
                        <h3 class="forum-title">${this.escapeHtml(forum.nombre)}</h3>
                        <p class="forum-description">${this.escapeHtml(forum.descripcion)}</p>
                    </div>
                    <div class="forum-actions">
                        <button class="forum-action-btn delete" onclick="dashboard.deleteForum(${forum.id})" title="Eliminar foro">
                            🗑️
                        </button>
                    </div>
                </div>
                <div class="forum-meta">
                    <div class="forum-stats">
                        <span>📅 ${this.formatDate(forum.fecha_creacion)}</span>
                    </div>
                    <button class="btn btn-primary btn-sm" onclick="dashboard.viewForum(${forum.id})">
                        Ver Foro
                    </button>
                </div>
            </div>
        `).join('');

        forumsGrid.innerHTML = forumsHTML;
    }

    showEmptyForumsState() {
        const forumsGrid = document.getElementById('recentForums');
        if (forumsGrid) {
            forumsGrid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">💬</div>
                    <h3>No has creado foros aún</h3>
                    <p>Crea tu primer foro para empezar a conectar con la comunidad.</p>
                    <button class="btn btn-primary" onclick="dashboard.openCreateForumModal()">
                        Crear Mi Primer Foro
                    </button>
                </div>
            `;
        }
    }

    // Búsqueda de foros
    async handleSearch() {
        const searchInput = document.getElementById('searchForums');
        const searchTerm = searchInput.value.trim();
        
        if (!searchTerm) {
            this.showSearchError('Ingresa un término de búsqueda');
            return;
        }

        if (searchTerm.length > 30) {
            this.showSearchError('La búsqueda no puede exceder 30 caracteres');
            return;
        }

        try {
            this.showSearchLoading();
            
            const response = await fetch(`${this.apiBase}/forums/search?q=${encodeURIComponent(searchTerm)}`, {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                this.searchResults = data.forums || [];
                this.renderSearchResults();
            } else {
                this.showSearchError('Error en la búsqueda');
            }
        } catch (error) {
            console.error('Error en búsqueda:', error);
            this.showSearchError('Error de conexión');
        }
    }

    renderSearchResults() {
        const resultsSection = document.getElementById('searchResults');
        const resultsGrid = document.getElementById('searchResultsGrid');
        const recentSection = document.querySelector('.forums-section');

        if (!resultsSection || !resultsGrid || !recentSection) return;

        // Ocultar foros recientes, mostrar resultados
        recentSection.style.display = 'none';
        resultsSection.style.display = 'block';

        if (this.searchResults.length === 0) {
            resultsGrid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🔍</div>
                    <h3>No se encontraron foros</h3>
                    <p>No hay foros que coincidan con tu búsqueda.</p>
                </div>
            `;
            return;
        }

        const resultsHTML = this.searchResults.map(forum => `
            <div class="forum-card" data-forum-id="${forum.id}">
                <div class="forum-header">
                    <div class="forum-info">
                        <h3 class="forum-title">${this.escapeHtml(forum.nombre)}</h3>
                        <p class="forum-description">${this.escapeHtml(forum.descripcion)}</p>
                        <p class="forum-author"><small>Creado por: ${this.escapeHtml(forum.nombre_usuario)}</small></p>
                    </div>
                </div>
                <div class="forum-meta">
                    <div class="forum-stats">
                        <span>📅 ${this.formatDate(forum.fecha_creacion)}</span>
                    </div>
                    <button class="btn btn-secondary btn-sm" onclick="dashboard.viewForum(${forum.id})">
                        Ver Foro
                    </button>
                </div>
            </div>
        `).join('');

        resultsGrid.innerHTML = resultsHTML;
    }

    clearSearch() {
        const searchInput = document.getElementById('searchForums');
        const resultsSection = document.getElementById('searchResults');
        const recentSection = document.querySelector('.forums-section');

        if (searchInput) searchInput.value = '';
        if (resultsSection) resultsSection.style.display = 'none';
        if (recentSection) recentSection.style.display = 'block';
        
        this.searchResults = [];
    }

    showSearchLoading() {
        const resultsGrid = document.getElementById('searchResultsGrid');
        if (resultsGrid) {
            resultsGrid.innerHTML = `
                <div class="empty-state">
                    <div class="loading-spinner"></div>
                    <p>Buscando foros...</p>
                </div>
            `;
        }
    }

    showSearchError(message) {
        const resultsGrid = document.getElementById('searchResultsGrid');
        if (resultsGrid) {
            resultsGrid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">❌</div>
                    <h3>${message}</h3>
                </div>
            `;
        }
    }

    // Modal crear foro
    openCreateForumModal() {
        const modal = document.getElementById('createForumModal');
        if (modal) {
            modal.style.display = 'block';
            document.body.classList.add('modal-open'); // Bloquear scroll del body
            document.getElementById('forumName').focus();
            
            // Enfocar el modal para accessibility
            modal.setAttribute('aria-hidden', 'false');
        }
    }

    closeCreateForumModal() {
        const modal = document.getElementById('createForumModal');
        const form = document.getElementById('createForumForm');
        
        if (modal) {
            modal.style.display = 'none';
            modal.setAttribute('aria-hidden', 'true');
        }
        
        document.body.classList.remove('modal-open'); // Restaurar scroll del body
        
        if (form) {
            form.reset();
            this.clearFormErrors();
        }
    }

    setupModalCloseOnOutsideClick() {
        const modal = document.getElementById('createForumModal');
        
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeCreateForumModal();
                }
            });
        }

        const deleteModal = document.getElementById('deleteAccountModal');
        if (deleteModal) {
            deleteModal.addEventListener('click', (e) => {
                if (e.target === deleteModal) {
                    this.closeDeleteAccountModal();
                }
            });
        }

    }

    async handleCreateForum(e) {
        e.preventDefault();
        
        const form = e.target;
        const submitBtn = document.getElementById('submitCreateForum');
        const forumName = document.getElementById('forumName').value.trim();
        const forumDescription = document.getElementById('forumDescription').value.trim();

        // Validaciones frontend
        if (!this.validateForumForm(forumName, forumDescription)) {
            return;
        }

        try {
            this.showLoading(submitBtn, 'Creando...');
            this.clearFormErrors();

            const response = await fetch(`${this.apiBase}/forums/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    nombre: forumName,
                    descripcion: forumDescription
                }),
                credentials: 'include'
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess('Foro creado exitosamente');
                this.closeCreateForumModal();
                await this.loadRecentForums(); // Recargar la lista
            } else {
                this.showFormError(result.message, result.field);
            }

        } catch (error) {
            console.error('Error creando foro:', error);
            this.showFormError('Error de conexión al crear el foro');
        } finally {
            this.hideLoading(submitBtn, 'Crear Foro');
        }
    }

    validateForumForm(name, description) {
        let isValid = true;

        // Validar nombre (5-30 caracteres, sin símbolos)
        if (name.length < 5 || name.length > 30) {
            this.showFieldError('forumName', 'El nombre debe tener entre 5 y 30 caracteres');
            isValid = false;
        }

        if (!/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]+$/.test(name)) {
            this.showFieldError('forumName', 'El nombre no puede contener símbolos especiales');
            isValid = false;
        }

        // Validar descripción (10-200 caracteres)
        if (description.length < 10 || description.length > 200) {
            this.showFieldError('forumDescription', 'La descripción debe tener entre 10 y 200 caracteres');
            isValid = false;
        }

        return isValid;
    }

    // Eliminar foro
    async deleteForum(forumId) {
        if (!confirm('¿Estás seguro de que quieres eliminar este foro? Se eliminarán todas las publicaciones y comentarios.')) {
            return;
        }

        try {
            const response = await fetch(`${this.apiBase}/forums/${forumId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess('Foro eliminado exitosamente');
                await this.loadRecentForums(); // Recargar la lista
            } else {
                this.showError('Error al eliminar el foro: ' + result.message);
            }
        } catch (error) {
            console.error('Error eliminando foro:', error);
            this.showError('Error de conexión al eliminar el foro');
        }
    }

    viewForum(forumId) {
        // Redirigir a la página del foro (a implementar)
        window.location.href = `forum.html?id=${forumId}`;
    }

    // Utilidades
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

    clearFormErrors() {
        const errorElements = document.querySelectorAll('.form-error');
        errorElements.forEach(element => {
            element.textContent = '';
            element.style.display = 'none';
        });
    }

    showFormError(message, field = null) {
        if (field) {
            this.showFieldError(field, message);
        } else {
            // Mostrar error general
            alert(message); 
        }
    }

    showSuccess(message) {
        if (window.notifications) {
            window.notifications.success(message);
        }
    }

    showError(message) {
        if (window.notifications) {
            window.notifications.error(message);
        }
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
            month: 'short',
            day: 'numeric'
        });
    }
}

// Funciones globales para onclick
function openCreateForumModal() {
    if (window.dashboard) {
        window.dashboard.openCreateForumModal();
    }
}

// Inicializar dashboard
let dashboard;

document.addEventListener('DOMContentLoaded', () => {
    dashboard = new DashboardManager();
    window.dashboard = dashboard; // Hacer disponible globalmente
});