const jwt = require('jsonwebtoken');

/**
 * Comprova el token JWT de l'administrador abans de permetre
 * l'accés a les operacions protegides.
 *
 * @param {import('express').Request} req Petició HTTP amb el token.
 * @param {import('express').Response} res Resposta HTTP.
 * @param {import('express').NextFunction} next Funció per continuar.
 * @returns {import('express').Response|void} Error HTTP o continuació.
 */
function autenticarToken(req, res, next) {
    const autorizacion = req.headers.authorization ?? '';
    const coincidencia = autorizacion.match(/^Bearer\s+(.+)$/i);

    if (!coincidencia) {
        return res.status(401).json({
            error: 'Debes iniciar sesión como administrador.'
        });
    }

    const token = coincidencia[1];
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
        return res.status(500).json({
            error: 'La autenticación no está configurada correctamente.'
        });
    }

    try {
        const datosToken = jwt.verify(token, jwtSecret, {
            algorithms: ['HS256'],
            issuer: 'LinguaLink-Producto3',
            audience: 'LinguaLink-API'
        });

        const emailAdministrador = String(
            process.env.ADMIN_EMAIL ?? ''
        ).trim().toLowerCase();

        if (
            datosToken.rol !== 'administrador' ||
            datosToken.email !== emailAdministrador
        ) {
            return res.status(403).json({
                error: 'No tienes permisos para acceder a este recurso.'
            });
        }

        req.administrador = {
            email: datosToken.email,
            rol: datosToken.rol
        };

        return next();
    } catch (error) {
        return res.status(401).json({
            error: 'El token de autenticación no es válido o ha caducado.'
        });
    }
}

module.exports = {
    autenticarToken
};