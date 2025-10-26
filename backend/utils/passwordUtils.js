const bcrypt = require('bcrypt');

// Hash de contraseña
async function hashPassword(password) {
    try {
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        return hashedPassword;
    } catch (error) {
        throw new Error('Error al hashear la contraseña');
    }
}

// Verificar contraseña
async function verifyPassword(password, hashedPassword) {
    try {
        const isMatch = await bcrypt.compare(password, hashedPassword);
        return isMatch;
    } catch (error) {
        throw new Error('Error al verificar la contraseña');
    }
}

// Hash de respuesta de seguridad (case-insensitive)
async function hashSecurityAnswer(answer) {
    try {
        // Normalizar a minúsculas para case-insensitive
        const normalizedAnswer = answer.toLowerCase().trim();
        const saltRounds = 10;
        const hashedAnswer = await bcrypt.hash(normalizedAnswer, saltRounds);
        return hashedAnswer;
    } catch (error) {
        throw new Error('Error al hashear la respuesta de seguridad');
    }
}

// Verificar respuesta de seguridad
async function verifySecurityAnswer(answer, hashedAnswer) {
    try {
        const normalizedAnswer = answer.toLowerCase().trim();
        const isMatch = await bcrypt.compare(normalizedAnswer, hashedAnswer);
        return isMatch;
    } catch (error) {
        throw new Error('Error al verificar la respuesta de seguridad');
    }
}

module.exports = {
    hashPassword,
    verifyPassword,
    hashSecurityAnswer,
    verifySecurityAnswer
};