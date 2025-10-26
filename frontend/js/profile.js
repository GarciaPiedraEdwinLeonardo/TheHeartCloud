class ProfileManager {
    constructor() {
        this.apiBase = '/api';
        this.currentUser = null;
        this.init();
    }

    async init() {
        await this.checkAuth();
        this.setupEventListeners();
        this.loadProfileData();
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
        // Cerrar sesión
        document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleLogout();
        });

        // Eliminar cuenta
        document.getElementById('deleteAccountBtn')?.addEventListener('click', () => this.openDeleteAccountModal());
        document.getElementById('closeDeleteModal')?.addEventListener('click', () => this.closeDeleteAccountModal());
        document.getElementById('cancelDelete')?.addEventListener('click', () => this.closeDeleteAccountModal());
        document.getElementById('deleteAccountForm')?.addEventListener('submit', (e) => this.handleDeleteAccount(e));

        // Toggle de visibilidad de contraseña
        this.setupPasswordToggle();

        // Cerrar modal al hacer clic fuera del contenido
        this.setupModalCloseOnOutsideClick();

    }

    setupPasswordToggle() {
        const toggle = document.getElementById('passwordToggle');
        const passwordInput = document.getElementById('confirmPassword');

        if (toggle && passwordInput) {
            toggle.addEventListener('click', () => {
                const isPassword = passwordInput.type === 'password';
                passwordInput.type = isPassword ? 'text' : 'password';
                toggle.textContent = isPassword ? '🙈' : '👁️';
            });
        }
    }

    async loadProfileData() {
        try {
            const response = await fetch(`${this.apiBase}/users/profile`, {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                this.renderProfileData(data.user);
            } else {
                this.showError('Error cargando el perfil');
            }
        } catch (error) {
            console.error('Error cargando perfil:', error);
            this.showError('Error de conexión al cargar el perfil');
        }
    }

    renderProfileData(user) {
        // Información personal
        document.getElementById('profileUsername').textContent = user.nombre_usuario;
        document.getElementById('profileEmail').textContent = user.correo;
        document.getElementById('profileMemberSince').textContent = this.formatDate(user.fecha_registro);

        // Estadísticas
        if (user.estadisticas) {
            document.getElementById('statsForums').textContent = user.estadisticas.foros_creados;
            document.getElementById('statsPosts').textContent = user.estadisticas.publicaciones;
            document.getElementById('statsComments').textContent = user.estadisticas.comentarios;
        }
    }

    // Cerrar sesión
    async handleLogout() {
        if (!confirm('¿Estás seguro de que quieres cerrar sesión?')) {
            return;
        }

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
            // Forzar redirección incluso si hay error
            window.location.href = '/index.html';
        }
    }

    // Eliminar cuenta
    openDeleteAccountModal() {
        const modal = document.getElementById('deleteAccountModal');
        if (modal) {
            modal.style.display = 'block';
            document.body.classList.add('modal-open'); // Bloquear scroll del body
            document.getElementById('confirmPassword').focus();
            
            // Enfocar el modal para accessibility
            modal.setAttribute('aria-hidden', 'false');
        }
    }

    closeDeleteAccountModal() {
        const modal = document.getElementById('deleteAccountModal');
        const form = document.getElementById('deleteAccountForm');
        
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
        const modal = document.getElementById('deleteAccountModal');
        
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeDeleteAccountModal();
                }
            });
        }
    }

    async handleDeleteAccount(e) {
        e.preventDefault();
        
        const form = e.target;
        const submitBtn = document.getElementById('confirmDelete');
        const password = document.getElementById('confirmPassword').value;

        if (!password) {
            this.showFieldError('password', 'La contraseña es requerida');
            return;
        }

        if (!confirm('¿ESTÁS ABSOLUTAMENTE SEGURO? Esta acción NO se puede deshacer y eliminará permanentemente toda tu información.')) {
            return;
        }

        try {
            this.showLoading(submitBtn, 'Eliminando...');
            this.clearFormErrors();

            const response = await fetch(`${this.apiBase}/users/account`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    password: password
                }),
                credentials: 'include'
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess('Cuenta eliminada exitosamente');
                setTimeout(() => {
                    window.location.href = '/index.html';
                }, 2000);
            } else {
                this.showFieldError('password', result.message);
            }

        } catch (error) {
            console.error('Error eliminando cuenta:', error);
            this.showError('Error de conexión al eliminar la cuenta');
        } finally {
            this.hideLoading(submitBtn, 'Eliminar Cuenta Permanentemente');
        }
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

    showSuccess(message) {
        // Temporal - implementar sistema de notificaciones toast
        alert('✅ ' + message);
    }

    showError(message) {
        alert('❌ ' + message);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

// Inicializar perfil
document.addEventListener('DOMContentLoaded', () => {
    new ProfileManager();
});