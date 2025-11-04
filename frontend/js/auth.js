class AuthManager {
    constructor() {
        this.apiBase = '/api/auth';
        this.init();
    }

    init() {
        this.setupLoginForm();
        this.setupRegisterForm();
        this.checkAuthStatus();
    }

    // Verificar estado de autenticación
    async checkAuthStatus() {
        try {
            const response = await fetch(`${this.apiBase}/status`, {
                credentials: 'include'
            });
            
            const data = await response.json();
            
            if (data.authenticated) {
                this.updateUIForAuthenticatedUser(data.user);
            } else {
                this.updateUIForGuest();
            }
        } catch (error) {
            console.error('Error verificando autenticación:', error);
        }
    }

    // Configurar formulario de login
    setupLoginForm() {
        const loginForm = document.getElementById('loginForm');
        if (!loginForm) return;

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleLogin();
        });

        // Toggle de visibilidad de contraseña
        this.setupPasswordToggles();
    }

    // Configurar formulario de registro
    setupRegisterForm() {
        const registerForm = document.getElementById('registerForm');
        if (!registerForm) return;

        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleRegister();
        });

        // Validación en tiempo real
        this.setupRealTimeValidation();

        this.setupPasswordToggles();
    }

    setupPasswordToggles() {
        const toggles = document.querySelectorAll('.password-toggle');
        
        toggles.forEach(toggle => {
            toggle.addEventListener('click', function() {
                const input = this.parentElement.querySelector('input');
                if (!input) return;
                
                const isPassword = input.type === 'password';
                input.type = isPassword ? 'text' : 'password';
                this.textContent = isPassword ? '🙈' : '👁️';
                
                // Mantener el foco en el input
                input.focus();
            });
        });
    }

    // Manejar login
    async handleLogin() {
        const form = document.getElementById('loginForm');
        const submitBtn = document.getElementById('loginBtn');
        const generalError = document.getElementById('generalError');

        try {
            // Limpiar errores
            this.clearErrors();
            this.showLoading(submitBtn, 'Iniciando sesión...');

            LoadingManager.showFullScreenLoader('Iniciando sesión...');

            const formData = new FormData(form);
            const data = {
                correo: formData.get('email'),
                password: formData.get('password'),
                rememberMe: formData.get('rememberMe') === 'on'
            };

            const response = await fetch(`${this.apiBase}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
                credentials: 'include'
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess('Sesión iniciada correctamente');
                setTimeout(() => {
                    window.location.href = '/pages/dashboard.html';
                }, 1000);
            } else {
                this.showError(generalError, result.message);
                if (result.field) {
                    this.showFieldError(result.field, result.message);
                }
            }

        } catch (error) {
            console.error('Error en login:', error);
            this.showError(generalError, 'Error de conexión. Intenta nuevamente.');
        } finally {
            this.hideLoading(submitBtn, 'Iniciar Sesión');
            LoadingManager.hideFullScreenLoader();
        }
    }

    // Manejar registro
    async handleRegister() {
        const form = document.getElementById('registerForm');
        const submitBtn = document.getElementById('registerBtn');
        const generalError = document.getElementById('generalError');

        try {
            // Limpiar errores
            this.clearErrors();
            this.showLoading(submitBtn, 'Creando cuenta...');

            const formData = new FormData(form);
            const data = {
                nombre_usuario: formData.get('username'),
                correo: formData.get('email'),
                password: formData.get('password'),
                confirmPassword: formData.get('confirmPassword'),
                pregunta_seguridad: formData.get('securityQuestion'),
                respuesta_seguridad: formData.get('securityAnswer'),
                acepto_terminos: formData.get('acceptTerms') === 'on'
            };

            const response = await fetch(`${this.apiBase}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
                credentials: 'include'
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess('Cuenta creada exitosamente');
                setTimeout(() => {
                    window.location.href = '/pages/dashboard.html';
                }, 1500);
            } else {
                this.showError(generalError, result.message);
                if (result.field) {
                    this.showFieldError(result.field, result.message);
                }
                if (result.errors) {
                    result.errors.forEach(error => {
                        this.showError(generalError, error);
                    });
                }
            }

        } catch (error) {
            console.error('Error en registro:', error);
            this.showError(generalError, 'Error de conexión. Intenta nuevamente.');
        } finally {
            this.hideLoading(submitBtn, 'Crear Cuenta');
        }
    }

    // Validación en tiempo real para registro
    setupRealTimeValidation() {
        const usernameInput = document.getElementById('username');
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirmPassword');

        if (usernameInput) {
            usernameInput.addEventListener('blur', () => this.validateUsername());
        }

        if (emailInput) {
            emailInput.addEventListener('blur', () => this.validateEmail());
        }

        if (passwordInput && confirmPasswordInput) {
            confirmPasswordInput.addEventListener('input', () => this.validatePasswordMatch());
        }
    }

    // Validar nombre de usuario
    validateUsername() {
        const username = document.getElementById('username').value;
        const errorElement = document.getElementById('usernameError');

        if (!username) {
            this.showError(errorElement, 'El nombre de usuario es requerido');
            return false;
        }

        if (username.length < 5 || username.length > 15) {
            this.showError(errorElement, 'Debe tener entre 5 y 15 caracteres');
            return false;
        }

        if (!/^[a-zA-Z0-9]+$/.test(username)) {
            this.showError(errorElement, 'Solo letras y números permitidos');
            return false;
        }

        this.hideError(errorElement);
        return true;
    }

    // Validar email
    validateEmail() {
        const email = document.getElementById('email').value;
        const errorElement = document.getElementById('emailError');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!email) {
            this.showError(errorElement, 'El correo electrónico es requerido');
            return false;
        }

        if (!emailRegex.test(email)) {
            this.showError(errorElement, 'Formato de correo inválido');
            return false;
        }

        this.hideError(errorElement);
        return true;
    }

    // Validar coincidencia de contraseñas
    validatePasswordMatch() {
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const errorElement = document.getElementById('confirmPasswordError');

        if (password && confirmPassword && password !== confirmPassword) {
            this.showError(errorElement, 'Las contraseñas no coinciden');
            return false;
        }

        this.hideError(errorElement);
        return true;
    }

    // Utilidades
    setupPasswordToggles() {
        const toggles = document.querySelectorAll('.password-toggle');
        
        toggles.forEach(toggle => {
            toggle.addEventListener('click', function() {
                const input = this.parentElement.querySelector('input');
                const isPassword = input.type === 'password';
                
                input.type = isPassword ? 'text' : 'password';
                this.textContent = isPassword ? '🙈' : '👁️';
            });
        });
    }

    showLoading(button, text) {
        if (button.querySelector('.btn-loading')) {
            button.disabled = true;
            button.querySelector('.btn-loading').style.display = 'flex';
            button.querySelector('.btn-text').style.display = 'none';
        } else {
            button.disabled = true;
            button.textContent = text;
        }
    }

    hideLoading(button, originalText) {
        if (button.querySelector('.btn-loading')) {
            button.disabled = false;
            button.querySelector('.btn-loading').style.display = 'none';
            button.querySelector('.btn-text').style.display = 'block';
        } else {
            button.disabled = false;
            button.textContent = originalText;
        }
    }

    showError(element, message) {
        if (element) {
            element.textContent = message;
            element.style.display = 'block';
        }
    }

    hideError(element) {
        if (element) {
            element.textContent = '';
            element.style.display = 'none';
        }
    }

    showFieldError(fieldName, message) {
        const errorElement = document.getElementById(`${fieldName}Error`);
        if (errorElement) {
            this.showError(errorElement, message);
        }
    }

    clearErrors() {
        const errorElements = document.querySelectorAll('.form-error');
        errorElements.forEach(element => {
            this.hideError(element);
        });
    }

    showSuccess(message) {
        if (window.notifications) {
            window.notifications.success(message);
        }
    }

    updateUIForAuthenticatedUser(user) {
        // Actualizar navegación para usuario autenticado
        const nav = document.querySelector('.nav');
        if (nav) {
            nav.innerHTML = `
                <a href="/pages/dashboard.html" class="nav-link">Principal</a>
                <a href="/pages/profile.html" class="nav-link">Mi Perfil</a>
                <a href="#" class="nav-link login-btn" id="logoutBtn">Cerrar Sesión</a>
            `;
            
            document.getElementById('logoutBtn').addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogout();
            });
        }
    }

    updateUIForGuest() {
        // UI por defecto para invitados
    }

    async handleLogout() {
        try {
            await fetch(`${this.apiBase}/logout`, {
                method: 'POST',
                credentials: 'include'
            });
            
            window.location.href = '/index.html';
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    }

// Validar que no tenga emojis ni caracteres especiales
validateNoEmojis(input) {
    const value = input.value;
    const errorElement = document.getElementById(`${input.id}Error`);
    
    // Expresión regular que bloquea emojis y caracteres especiales
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
    const specialCharRegex = /[<>$#@!%^&*()+={}\[\]:;"'|\\~`]/;
    
    if (emojiRegex.test(value)) {
        this.showError(errorElement, 'No se permiten emojis');
        input.classList.add('invalid');
        return false;
    }
    
    if (specialCharRegex.test(value)) {
        this.showError(errorElement, 'No se permiten caracteres especiales');
        input.classList.add('invalid');
        return false;
    }
    
    if (/\s/.test(value) && input.id === 'password') {
        this.showError(errorElement, 'La contraseña no puede contener espacios');
        input.classList.add('invalid');
        return false;
    }
    
    this.hideError(errorElement);
    input.classList.remove('invalid');
    return true;
}

// Validar pregunta de seguridad
validateSecurityQuestion(input) {
    const value = input.value;
    const errorElement = document.getElementById(`${input.id}Error`);
    
    // Permitir letras, números, espacios, acentos y signos de puntuación básicos
    const allowedRegex = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s¿?¡!., ]+$/;
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}]/gu;
    
    if (emojiRegex.test(value)) {
        this.showError(errorElement, 'La pregunta no puede contener emojis');
        input.classList.add('invalid');
        return false;
    }
    
    if (!allowedRegex.test(value)) {
        this.showError(errorElement, 'Solo se permiten letras, números y signos de puntuación básicos');
        input.classList.add('invalid');
        return false;
    }
    
    this.hideError(errorElement);
    input.classList.remove('invalid');
    return true;
}

// Validar respuesta de seguridad
validateSecurityAnswer(input) {
    const value = input.value;
    const errorElement = document.getElementById(`${input.id}Error`);
    
    // Solo letras, números y espacios (case-insensitive)
    const allowedRegex = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s]+$/;
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}]/gu;
    
    if (emojiRegex.test(value)) {
        this.showError(errorElement, 'La respuesta no puede contener emojis');
        input.classList.add('invalid');
        return false;
    }
    
    if (!allowedRegex.test(value)) {
        this.showError(errorElement, 'Solo se permiten letras, números y espacios');
        input.classList.add('invalid');
        return false;
    }
    
    this.hideError(errorElement);
    input.classList.remove('invalid');
    return true;
}

}

function validateNoEmojis(input) {
    const authManager = window.authManager;
    if (authManager) {
        authManager.validateNoEmojis(input);
    }
}

function validateSecurityQuestion(input) {
    const authManager = window.authManager;
    if (authManager) {
        authManager.validateSecurityQuestion(input);
    }
}

function validateSecurityAnswer(input) {
    const authManager = window.authManager;
    if (authManager) {
        authManager.validateSecurityAnswer(input);
    }
}

// Asegurar que authManager esté disponible globalmente
let authManager;
document.addEventListener('DOMContentLoaded', () => {
    authManager = new AuthManager();
    window.authManager = authManager;
});