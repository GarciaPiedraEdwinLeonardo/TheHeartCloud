class RecoveryManager {
    constructor() {
        this.apiBase = '/api/auth';
        this.currentStep = 1;
        this.userData = {};
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.showStep(1);
    }

    setupEventListeners() {
        // Paso 1: Continuar con el correo
        document.getElementById('continueBtn')?.addEventListener('click', () => this.handleEmailStep());
        
        // Paso 2: Volver y verificar respuesta
        document.getElementById('backBtn')?.addEventListener('click', () => this.showStep(1));
        document.getElementById('verifyAnswerBtn')?.addEventListener('click', () => this.handleSecurityStep());
        
        // Paso 3: Volver y cambiar contraseña
        document.getElementById('backToSecurityBtn')?.addEventListener('click', () => this.showStep(2));
        document.getElementById('resetPasswordBtn')?.addEventListener('click', (e) => this.handlePasswordStep(e));
        
        // Toggles de contraseña
        this.setupPasswordToggles();
        
        // Enter key support
        this.setupEnterKeySupport();
    }


    // Paso 1: Verificar correo y obtener pregunta de seguridad
    async handleEmailStep() {
        const emailInput = document.getElementById('recoveryEmail');
        const continueBtn = document.getElementById('continueBtn');
        const emailError = document.getElementById('emailError');

        try {
            this.clearErrors();
            this.showLoading(continueBtn, 'Verificando...');

            const email = emailInput.value.trim();

            if (!this.validateEmail(email)) {
                this.hideLoading(continueBtn, 'Continuar');
                return;
            }

            const response = await fetch(`${this.apiBase}/recovery/init`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ correo: email }),
                credentials: 'include'
            });

            const result = await response.json();

            if (result.success) {
                this.userData = {
                    email: email,
                    usuario_id: result.usuario_id,
                    pregunta_seguridad: result.pregunta_seguridad
                };

                // Mostrar pregunta de seguridad
                document.getElementById('securityQuestionText').textContent = result.pregunta_seguridad;
                
                this.showStep(2);
            } else {
                this.showError(emailError, result.message);
            }

        } catch (error) {
            console.error('Error en recuperación:', error);
            this.showError(emailError, 'Error de conexión. Intenta nuevamente.');
        } finally {
            this.hideLoading(continueBtn, 'Continuar');
        }
    }

    // Paso 2: Verificar respuesta de seguridad
    async handleSecurityStep() {
        const answerInput = document.getElementById('securityAnswer');
        const verifyBtn = document.getElementById('verifyAnswerBtn');
        const answerError = document.getElementById('securityAnswerError');

        try {
            this.clearErrors();
            this.showLoading(verifyBtn, 'Verificando...');

            const answer = answerInput.value.trim();

            if (!this.validateSecurityAnswer(answer)) {
                this.hideLoading(verifyBtn, 'Verificar Respuesta');
                return;
            }

            if (!this.userData.usuario_id) {
            this.showError(answerError, 'Error: ID de usuario no encontrado');
            return;
            }

            const response = await fetch(`${this.apiBase}/recovery/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    usuario_id: this.userData.usuario_id,
                    respuesta: answer
                }),
                credentials: 'include'
            });

            const result = await response.json();

            if (result.success) {
                this.showStep(3);
            } else {
                this.showError(answerError, result.message);
            }

        } catch (error) {
            console.error('Error en verificación:', error);
            this.showError(answerError, 'Error de conexión. Intenta nuevamente.');
        } finally {
            this.hideLoading(verifyBtn, 'Verificar Respuesta');
        }
    }

    // Paso 3: Cambiar contraseña
    async handlePasswordStep(e) {
        e.preventDefault();
        
        const newPasswordInput = document.getElementById('newPassword');
        const confirmPasswordInput = document.getElementById('confirmNewPassword');
        const resetBtn = document.getElementById('resetPasswordBtn');
        const generalError = document.getElementById('generalError');

        try {
            this.clearErrors();
            this.showLoading(resetBtn, 'Cambiando contraseña...');

            const newPassword = newPasswordInput.value;
            const confirmPassword = confirmPasswordInput.value;

            if (!this.validateNewPassword(newPassword, confirmPassword)) {
                this.hideLoading(resetBtn, 'Cambiar Contraseña');
                return;
            }

            const response = await fetch(`${this.apiBase}/recovery/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    nuevaPassword: newPassword,
                    confirmarPassword: confirmPassword
                }),
                credentials: 'include'
            });

            const result = await response.json();

            if (result.success) {
                this.showStep(4); // Mostrar éxito
            } else {
                this.showError(generalError, result.message);
            }

        } catch (error) {
            console.error('Error al cambiar contraseña:', error);
            this.showError(generalError, 'Error de conexión. Intenta nuevamente.');
        } finally {
            this.hideLoading(resetBtn, 'Cambiar Contraseña');
        }
    }

    // Validaciones
    validateEmail(email) {
        const errorElement = document.getElementById('emailError');
        
        if (!email) {
            this.showError(errorElement, 'El correo electrónico es requerido');
            return false;
        }
        
        if (!this.isValidEmail(email)) {
            this.showError(errorElement, 'Por favor, ingresa un correo válido');
            return false;
        }
        
        this.hideError(errorElement);
        return true;
    }

    validateSecurityAnswer(answer) {
        const errorElement = document.getElementById('securityAnswerError');
        
        if (!answer) {
            this.showError(errorElement, 'La respuesta de seguridad es requerida');
            return false;
        }
        
        if (answer.length < 2 || answer.length > 60) {
            this.showError(errorElement, 'La respuesta debe tener entre 2 y 60 caracteres');
            return false;
        }
        
        this.hideError(errorElement);
        return true;
    }

    validateNewPassword(password, confirmPassword) {
        const passwordError = document.getElementById('newPasswordError');
        const confirmError = document.getElementById('confirmNewPasswordError');
        let isValid = true;
        
        // Validar contraseña
        if (!password) {
            this.showError(passwordError, 'La nueva contraseña es requerida');
            isValid = false;
        } else if (password.length < 8 || password.length > 16) {
            this.showError(passwordError, 'La contraseña debe tener entre 8 y 16 caracteres');
            isValid = false;
        } else if (/\s/.test(password)) {
            this.showError(passwordError, 'La contraseña no puede contener espacios');
            isValid = false;
        } else {
            this.hideError(passwordError);
        }
        
        // Validar confirmación
        if (!confirmPassword) {
            this.showError(confirmError, 'Confirma tu nueva contraseña');
            isValid = false;
        } else if (password !== confirmPassword) {
            this.showError(confirmError, 'Las contraseñas no coinciden');
            isValid = false;
        } else {
            this.hideError(confirmError);
        }
        
        return isValid;
    }

    // Navegación entre pasos
    showStep(step) {
        this.currentStep = step;
        
        // Ocultar todos los formularios
        document.getElementById('recoveryForm').style.display = 'none';
        document.getElementById('securityForm').style.display = 'none';
        document.getElementById('newPasswordForm').style.display = 'none';
        document.getElementById('successMessage').style.display = 'none';
        
        // Limpiar errores al cambiar de paso
        this.clearErrors();
        
        // Mostrar el paso correspondiente
        switch(step) {
            case 1:
                document.getElementById('recoveryForm').style.display = 'block';
                break;
            case 2:
                document.getElementById('securityForm').style.display = 'block';
                // Poner foco en el campo de respuesta
                setTimeout(() => {
                    document.getElementById('securityAnswer').focus();
                }, 100);
                break;
            case 3:
                document.getElementById('newPasswordForm').style.display = 'block';
                // Poner foco en el campo de nueva contraseña
                setTimeout(() => {
                    document.getElementById('newPassword').focus();
                }, 100);
                break;
            case 4:
                document.getElementById('successMessage').style.display = 'block';
                break;
        }
        
        // Actualizar indicador de pasos
        this.updateStepIndicator(step);
    }

    updateStepIndicator(currentStep) {
        // Reset all steps
        const steps = document.querySelectorAll('.step-number');
        steps.forEach(step => {
            step.classList.remove('active', 'completed');
        });
        
        for (let i = 1; i <= currentStep; i++) {
            const stepElement = document.querySelector(`.step-indicator .step-number:nth-child(${i * 2 - 1})`);
            if (stepElement) {
                if (i < currentStep) {
                    stepElement.classList.add('completed');
                } else {
                    stepElement.classList.add('active');
                }
            }
        }
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

    setupEnterKeySupport() {
        // Enter key en campo de email
        document.getElementById('recoveryEmail')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleEmailStep();
            }
        });
        
        // Enter key en campo de respuesta de seguridad
        document.getElementById('securityAnswer')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSecurityStep();
            }
        });
        
        // Enter key en campo de nueva contraseña
        document.getElementById('newPassword')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('resetPasswordBtn').click();
            }
        });
    }

    showLoading(button, text) {
        if (!button) return;
        
        button.disabled = true;
        const btnText = button.querySelector('.btn-text');
        if (btnText) {
            btnText.textContent = text;
        } else {
            button.textContent = text;
        }
    }

    hideLoading(button, originalText) {
        if (!button) return;
        
        button.disabled = false;
        const btnText = button.querySelector('.btn-text');
        if (btnText) {
            btnText.textContent = originalText;
        } else {
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

    clearErrors() {
        const errorElements = document.querySelectorAll('.form-error');
        errorElements.forEach(element => {
            this.hideError(element);
        });
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new RecoveryManager();
});