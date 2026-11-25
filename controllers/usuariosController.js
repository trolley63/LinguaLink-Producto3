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
 *
 * @param {{id: number, nombre: string, email: string}} usuari
 * Usuari del qual es volen obtenir les dades públiques.
 * @returns {{id: number, nombre: string, email: string}}
 * Objecte amb l'identificador, el nom i el correu electrònic.
 */
function obtenerDatosPublicos(usuari) {
    return {
        id: usuari.id,
        nombre: usuari.nombre,
        email: usuari.email
    };
}

/**
 * Genera les credencials protegides d'un usuari mitjançant PBKDF2.
 *
 * @param {string} password Contrasenya original de l'usuari.
 * @returns {{passwordHash: string, passwordSalt: string}}
 * Hash i salt de la contrasenya, codificats en Base64.
 * @throws {Error} Si es produeix un error durant la generació de les credencials.
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
 * Consulta tots els usuaris registrats.
 *
 * @param {import('express').Request} req Petició HTTP d'Express.
 * @param {import('express').Response} res Resposta HTTP d'Express.
 * @returns {void} Envia una resposta HTTP 200 amb les dades públiques dels usuaris.
 */
function obtenerUsuarios(req, res) {
    res.status(200).json(usuarios.map(obtenerDatosPublicos));
}

/**
 * Consulta un usuari pel correu electrònic.
 *
 * @param {string} email Correu electrònic que es vol consultar.
 * @returns {{id: number, nombre: string, email: string}|null}
 * Dades públiques de l'usuari o null si no existeix.
 * @throws {Error} Si no s'indica un correu electrònic.
 */
function obtenerUsuarioPorEmail(email) {
    const correo = String(email ?? '').trim().toLowerCase();

    if (!correo) {
        throw new Error('Debes indicar un correo electrónico.');
    }

    const usuario = usuarios.find(
        item => item.email === correo
    );

    return usuario ? obtenerDatosPublicos(usuario) : null;
}

/**
 * Crea un usuari nou.
 *
 * @param {import('express').Request} req Petició HTTP d'Express.
 * @param {string} req.body.nombre Nom de l'usuari.
 * @param {string} req.body.email Correu electrònic de l'usuari.
 * @param {string} req.body.password Contrasenya de l'usuari.
 * @param {import('express').Response} res Resposta HTTP d'Express.
 * @returns {import('express').Response} Resposta HTTP amb les dades públiques de l'usuari creat o l'error corresponent.
 * @remarks
 * Retorna HTTP 201 si l'usuari s'ha creat correctament,
 * HTTP 400 si les dades no són vàlides i HTTP 409 si el correu ja existeix.
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
 *
 * @param {import('express').Request} req Petició HTTP d'Express.
 * @param {string} req.params.id Identificador de l'usuari que es vol actualitzar.
 * @param {string} req.body.nombre Nou nom de l'usuari.
 * @param {string} req.body.email Nou correu electrònic de l'usuari.
 * @param {string} [req.body.password] Nova contrasenya opcional.
 * @param {import('express').Response} res Resposta HTTP d'Express.
 * @returns {import('express').Response} Resposta HTTP amb les dades públiques actualitzades o l'error corresponent.
 * @remarks
 * Retorna HTTP 200 si l'actualització és correcta,
 * HTTP 400 si les dades no són vàlides,
 * HTTP 404 si l'usuari no existeix i HTTP 409 si el correu ja està utilitzat.
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
 *
 * @param {import('express').Request} req Petició HTTP d'Express.
 * @param {string} req.params.id Identificador de l'usuari que es vol eliminar.
 * @param {import('express').Response} res Resposta HTTP d'Express.
 * @returns {import('express').Response} Resposta HTTP amb el resultat de l'eliminació o l'error corresponent.
 * @remarks
 * Retorna HTTP 200 si l'eliminació és correcta,
 * HTTP 400 si l'identificador no és vàlid i HTTP 404 si l'usuari no existeix.
 * També elimina els intercanvis de l'usuari i les seleccions relacionades
 * amb l'usuari o amb els seus intercanvis.
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
    obtenerUsuarioPorEmail,
    crearUsuario,
    actualizarUsuario,
    eliminarUsuario
};