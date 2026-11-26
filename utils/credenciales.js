const crypto = require('node:crypto');

const ITERACIONES = 100000;
const LONGITUD_HASH = 32;
const ALGORITMO = 'sha256';

/**
 * Genera un hash i un salt aleatori per protegir una contrasenya.
 *
 * @param {string} password Contrasenya original.
 * @returns {{passwordHash: string, passwordSalt: string}}
 * Credencials protegides codificades en Base64.
 */
function generarCredenciales(password) {
    const salt = crypto.randomBytes(16);

    const passwordHash = crypto.pbkdf2Sync(
        password,
        salt,
        ITERACIONES,
        LONGITUD_HASH,
        ALGORITMO
    );

    return {
        passwordHash: passwordHash.toString('base64'),
        passwordSalt: salt.toString('base64')
    };
}

/**
 * Verifica una contrasenya comparant-ne el hash calculat
 * amb el hash emmagatzemat.
 *
 * @param {string} password Contrasenya introduïda.
 * @param {string} passwordHash Hash emmagatzemat en Base64.
 * @param {string} passwordSalt Salt emmagatzemat en Base64.
 * @returns {boolean} Indica si les credencials són correctes.
 */
function verificarCredenciales(password, passwordHash, passwordSalt) {
    if (
        typeof password !== 'string' ||
        typeof passwordHash !== 'string' ||
        typeof passwordSalt !== 'string' ||
        !password ||
        !passwordHash ||
        !passwordSalt
    ) {
        return false;
    }

    const salt = Buffer.from(passwordSalt, 'base64');
    const hashAlmacenado = Buffer.from(passwordHash, 'base64');

    if (salt.length !== 16 || hashAlmacenado.length !== LONGITUD_HASH) {
        return false;
    }

    const hashCalculado = crypto.pbkdf2Sync(
        password,
        salt,
        ITERACIONES,
        LONGITUD_HASH,
        ALGORITMO
    );

    return crypto.timingSafeEqual(hashAlmacenado, hashCalculado);
}

module.exports = {
    generarCredenciales,
    verificarCredenciales
};