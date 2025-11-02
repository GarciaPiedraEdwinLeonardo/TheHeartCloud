// Validaciones para registro
function validateRegister(req, res, next) {
    const { nombre_usuario, correo, password, confirmPassword, pregunta_seguridad, respuesta_seguridad, acepto_terminos } = req.body;
    
    const errors = [];

    // Validar nombre de usuario (5-15 caracteres, alfanumérico)
    if (!nombre_usuario || nombre_usuario.length < 5 || nombre_usuario.length > 15) {
        errors.push('El nombre de usuario debe tener entre 5 y 15 caracteres');
    }
    
    if (nombre_usuario && !/^[a-zA-Z0-9]+$/.test(nombre_usuario)) {
        errors.push('El nombre de usuario solo puede contener letras y números');
    }

    // Validar correo (5-100 caracteres, formato email)
    if (!correo || correo.length < 5 || correo.length > 100) {
        errors.push('El correo debe tener entre 5 y 100 caracteres');
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (correo && !emailRegex.test(correo)) {
        errors.push('El formato del correo electrónico no es válido');
    }

    // Validar contraseña (8-16 caracteres, sin espacios)
    if (!password || password.length < 8 || password.length > 16) {
        errors.push('La contraseña debe tener entre 8 y 16 caracteres');
    }
    
    if (password && /\s/.test(password)) {
        errors.push('La contraseña no puede contener espacios');
    }

    // Validar confirmación de contraseña
    if (password !== confirmPassword) {
        errors.push('Las contraseñas no coinciden');
    }

    // Validar pregunta de seguridad (10-100 caracteres)
    if (!pregunta_seguridad || pregunta_seguridad.length < 10 || pregunta_seguridad.length > 100) {
        errors.push('La pregunta de seguridad debe tener entre 10 y 100 caracteres');
    }

    // Validar respuesta de seguridad (2-60 caracteres)
    if (!respuesta_seguridad || respuesta_seguridad.length < 2 || respuesta_seguridad.length > 60) {
        errors.push('La respuesta de seguridad debe tener entre 2 y 60 caracteres');
    }

    // Validar términos y condiciones
    if (!acepto_terminos) {
        errors.push('Debes aceptar los términos y condiciones');
    }

    // Validar contraseña sin emojis
    if (password && /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}]/gu.test(password)) {
        errors.push('La contraseña no puede contener emojis');
    }

    // Validar pregunta de seguridad
    if (pregunta_seguridad && /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}]/gu.test(pregunta_seguridad)) {
        errors.push('La pregunta de seguridad no puede contener emojis');
    }

    // Validar respuesta de seguridad
    if (respuesta_seguridad && /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}]/gu.test(respuesta_seguridad)) {
        errors.push('La respuesta de seguridad no puede contener emojis');
    }

    // Validar caracteres específicos en respuesta de seguridad
    if (respuesta_seguridad && !/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(respuesta_seguridad)) {
        errors.push('La respuesta de seguridad solo puede contener letras, números y espacios');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Errores de validación',
            errors: errors
        });
    }
    next();
}

// Validaciones para login
function validateLogin(req, res, next) {
    const { correo, password } = req.body;
    
    const errors = [];

    if (!correo) {
        errors.push('El correo electrónico es requerido');
    }

    if (!password) {
        errors.push('La contraseña es requerida');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Errores de validación',
            errors: errors
        });
    }

    next();
}

// Validaciones para recuperación de cuenta
function validateRecovery(req, res, next) {
    const { correo } = req.body;
    
    if (!correo) {
        return res.status(400).json({
            success: false,
            message: 'El correo electrónico es requerido'
        });
    }

    next();
}

// Validaciones para cambio de contraseña
function validatePasswordChange(req, res, next) {
    const { nuevaPassword, confirmarPassword } = req.body;
    
    const errors = [];

    if (!nuevaPassword || nuevaPassword.length < 8 || nuevaPassword.length > 16) {
        errors.push('La nueva contraseña debe tener entre 8 y 16 caracteres');
    }
    
    if (nuevaPassword && /\s/.test(nuevaPassword)) {
        errors.push('La contraseña no puede contener espacios');
    }

    if (nuevaPassword !== confirmarPassword) {
        errors.push('Las contraseñas no coinciden');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Errores de validación',
            errors: errors
        });
    }

    next();
}

// Validaciones para creación de foros
function validateForumCreation(req, res, next) {
    const { nombre, descripcion } = req.body;
    
    const errors = [];

    // Validar nombre del foro (5-30 caracteres)
    if (!nombre || nombre.length < 5 || nombre.length > 30) {
        errors.push('El nombre del foro debe tener entre 5 y 30 caracteres');
    }

    // Validar que el nombre solo contenga caracteres permitidos
    if (nombre && !/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]+$/.test(nombre)) {
        errors.push('El nombre del foro no puede contener símbolos especiales');
    }

    // Validar descripción (10-200 caracteres)
    if (!descripcion || descripcion.length < 10 || descripcion.length > 200) {
        errors.push('La descripción del foro debe tener entre 10 y 200 caracteres');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Errores de validación',
            errors: errors
        });
    }

    next();
}

module.exports = {
    validateRegister,
    validateLogin,
    validateRecovery,
    validatePasswordChange,
    validateForumCreation,
};