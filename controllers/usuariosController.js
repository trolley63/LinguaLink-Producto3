const crypto = require('node:crypto');

const {
    usuarios,
    intercambios,
    selecciones
} = require('../data/almacenamiento');

let siguienteIdUsuario = 1;

/**
 * Retorna les dades públiques d'un usuari.
 * No inclou el hash ni el salt de la contrasenya.
 * @param {Object} usuari
 * @returns {Object}
 */
function obtenerDatosPublicos(usuari) {
    return {
        id: usuari.id,
        nombre: usuari.nombre,
        email: usuari.email
    };
}

/**
 * Genera les credencials protegides d'un usuari.
 * @param {string} password
 * @returns {Object}
 */
function generarCredenciales(password) {
    const salt = crypto.randomBytes(16);

    const passwordHash = crypto.pbkdf2Sync(
        password,
        salt,
        100000,
        32,
        'sha256'
    );

    return {
        passwordHash: passwordHash.toString('base64'),
        passwordSalt: salt.toString('base64')
    };
}

/**
 * Consulta tots els usuaris.
 * @param {Object} req
 * @param {Object} res
 */
function obtenerUsuarios(req, res) {
    res.status(200).json(usuarios.map(obtenerDatosPublicos));
}

/**
 * Crea un usuari nou.
 * @param {Object} req
 * @param {Object} res
 */
function crearUsuario(req, res) {
    const nombre = String(req.body.nombre ?? '').trim();
    const email = String(req.body.email ?? '').trim().toLowerCase();
    const password = String(req.body.password ?? '');

    if (!nombre || !email || !password) {
        return res.status(400).json({
            error: 'Todos los campos son obligatorios.'
        });
    }

    const patronEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!patronEmail.test(email)) {
        return res.status(400).json({
            error: 'El correo electrónico no tiene un formato válido.'
        });
    }

    if (password.length < 4) {
        return res.status(400).json({
            error: 'La contraseña debe tener al menos 4 caracteres.'
        });
    }

    const emailExistente = usuarios.some(
        usuario => usuario.email === email
    );

    if (emailExistente) {
        return res.status(409).json({
            error: 'Ya existe un usuario con ese correo electrónico.'
        });
    }

    const usuario = {
        id: siguienteIdUsuario++,
        nombre,
        email,
        ...generarCredenciales(password)
    };

    usuarios.push(usuario);

    return res.status(201).json(obtenerDatosPublicos(usuario));
}

/**
 * Actualitza les dades d'un usuari.
 * La contrasenya només es modifica si se'n proporciona una de nova.
 * @param {Object} req
 * @param {Object} res
 */
function actualizarUsuario(req, res) {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            error: 'El identificador del usuario no es válido.'
        });
    }

    const usuario = usuarios.find(item => item.id === id);

    if (!usuario) {
        return res.status(404).json({
            error: 'No se ha encontrado el usuario que deseas modificar.'
        });
    }

    const nombre = String(req.body.nombre ?? '').trim();
    const email = String(req.body.email ?? '').trim().toLowerCase();
    const password = String(req.body.password ?? '');

    if (!nombre || !email) {
        return res.status(400).json({
            error: 'El nombre y el correo electrónico son obligatorios.'
        });
    }

    const patronEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!patronEmail.test(email)) {
        return res.status(400).json({
            error: 'El correo electrónico no tiene un formato válido.'
        });
    }

    if (password.length > 0 && password.length < 4) {
        return res.status(400).json({
            error: 'La contraseña debe tener al menos 4 caracteres.'
        });
    }

    const emailExistente = usuarios.some(
        item => item.email === email && item.id !== id
    );

    if (emailExistente) {
        return res.status(409).json({
            error: 'Ya existe otro usuario con ese correo electrónico.'
        });
    }

    usuario.nombre = nombre;
    usuario.email = email;

    if (password.length > 0) {
        Object.assign(usuario, generarCredenciales(password));
    }

    return res.status(200).json(obtenerDatosPublicos(usuario));
}

/**
 * Elimina un usuari, els seus intercanvis i les seleccions relacionades.
 * @param {Object} req
 * @param {Object} res
 */
function eliminarUsuario(req, res) {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            error: 'El identificador del usuario no es válido.'
        });
    }

    const indiceUsuario = usuarios.findIndex(
        usuario => usuario.id === id
    );

    if (indiceUsuario === -1) {
        return res.status(404).json({
            error: 'No se ha encontrado el usuario que deseas eliminar.'
        });
    }

    const idsIntercambiosEliminados = new Set(
        intercambios
            .filter(intercambio => intercambio.idUsuario === id)
            .map(intercambio => intercambio.id)
    );

    for (let i = intercambios.length - 1; i >= 0; i--) {
        if (intercambios[i].idUsuario === id) {
            intercambios.splice(i, 1);
        }
    }

    for (let i = selecciones.length - 1; i >= 0; i--) {
        const seleccion = selecciones[i];

        if (
            seleccion.idUsuario === id ||
            idsIntercambiosEliminados.has(seleccion.idIntercambio)
        ) {
            selecciones.splice(i, 1);
        }
    }

    usuarios.splice(indiceUsuario, 1);

    return res.status(200).json({
        mensaje: 'Usuario eliminado correctamente.'
    });
}

module.exports = {
    obtenerUsuarios,
    crearUsuario,
    actualizarUsuario,
    eliminarUsuario
};