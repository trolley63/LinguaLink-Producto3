const jwt = require('jsonwebtoken');

const {
    verificarCredenciales
} = require('../utils/credenciales');

/**
 * Autentica l'administrador i genera un token JWT.
 *
 * Comprova el correu electrònic i la contrasenya
 * mitjançant les credencials privades de configuració.
 *
 * @param {import('express').Request} req Petició HTTP amb les credencials.
 * @param {string} req.body.email Correu electrònic de l'administrador.
 * @param {string} req.body.password Contrasenya de l'administrador.
 * @param {import('express').Response} res Resposta HTTP.
 * @returns {import('express').Response} Token JWT o error d'autenticació.
 */
function loginAdministrador(req, res) {
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    const password = typeof req.body?.password === 'string'
        ? req.body.password
        : '';

    const emailAdministrador = String(
        process.env.ADMIN_EMAIL ?? ''
    ).trim().toLowerCase();

    const passwordHash = process.env.ADMIN_PASSWORD_HASH;
    const passwordSalt = process.env.ADMIN_PASSWORD_SALT;
    const jwtSecret = process.env.JWT_SECRET;

    if (!email || !password) {
        return res.status(400).json({
            error: 'Debes introducir el correo y la contraseña.'
        });
    }

    if (
        !emailAdministrador ||
        !passwordHash ||
        !passwordSalt ||
        !jwtSecret
    ) {
        return res.status(500).json({
            error: 'La autenticación no está configurada correctamente.'
        });
    }

    const credencialesCorrectas =
        email === emailAdministrador &&
        verificarCredenciales(password, passwordHash, passwordSalt);

    if (!credencialesCorrectas) {
        return res.status(401).json({
            error: 'Las credenciales del administrador son incorrectas.'
        });
    }

    try {
        const token = jwt.sign(
            {
                email: emailAdministrador,
                rol: 'administrador'
            },
            jwtSecret,
            {
                algorithm: 'HS256',
                expiresIn: process.env.JWT_EXPIRES_IN || '1h',
                issuer: 'LinguaLink-Producto3',
                audience: 'LinguaLink-API'
            }
        );

        return res.status(200).json({
            token,
            tokenType: 'Bearer',
            expiresIn: process.env.JWT_EXPIRES_IN || '1h'
        });
    } catch (error) {
        return res.status(500).json({
            error: 'No se ha podido generar el token de autenticación.'
        });
    }
}

module.exports = {
    loginAdministrador
};