const crypto = require('node:crypto');

const { conectarMongoDB } = require('../data/conexionMongoDB');
const { obtenerSiguienteId } = require('../data/models/modelosMongoDB');

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
 * Consulta tots els usuaris registrats a MongoDB.
 *
 * @param {import('express').Request} req Petició HTTP d'Express.
 * @param {import('express').Response} res Resposta HTTP d'Express.
 * @returns {Promise<void>} Envia una resposta HTTP 200 amb les dades públiques dels usuaris.
 */
async function obtenerUsuarios(req, res) {
    const db = await conectarMongoDB();

    const usuarios = await db.collection('usuarios')
        .find({})
        .toArray();

    return res.status(200).json(usuarios.map(obtenerDatosPublicos));
}

/**
 * Consulta un usuari pel correu electrònic.
 *
 * @param {string} email Correu electrònic que es vol consultar.
 * @returns {Promise<{id: number, nombre: string, email: string}|null>}
 * Dades públiques de l'usuari o null si no existeix.
 * @throws {Error} Si no s'indica un correu electrònic o falla la consulta.
 */
async function obtenerUsuarioPorEmail(email) {
    const correo = String(email ?? '').trim().toLowerCase();

    if (!correo) {
        throw new Error('Debes indicar un correo electrónico.');
    }

    const db = await conectarMongoDB();

    const usuario = await db.collection('usuarios').findOne({
        email: correo
    });

    return usuario ? obtenerDatosPublicos(usuario) : null;
}

/**
 * Crea un usuari nou a MongoDB.
 *
 * @param {import('express').Request} req Petició HTTP d'Express.
 * @param {string} req.body.nombre Nom de l'usuari.
 * @param {string} req.body.email Correu electrònic de l'usuari.
 * @param {string} req.body.password Contrasenya de l'usuari.
 * @param {import('express').Response} res Resposta HTTP d'Express.
 * @returns {Promise<import('express').Response>} Resposta HTTP amb les dades públiques de l'usuari creat o l'error corresponent.
 * @remarks
 * Retorna HTTP 201 si l'usuari s'ha creat correctament,
 * HTTP 400 si les dades no són vàlides i HTTP 409 si el correu ja existeix.
 */
async function crearUsuario(req, res) {
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

    const db = await conectarMongoDB();
    const coleccionUsuarios = db.collection('usuarios');

    const emailExistente = await coleccionUsuarios.findOne({ email });

    if (emailExistente) {
        return res.status(409).json({
            error: 'Ya existe un usuario con ese correo electrónico.'
        });
    }

    const usuario = {
        id: await obtenerSiguienteId(db, 'usuarios'),
        nombre,
        email,
        ...generarCredenciales(password)
    };

    try {
        await coleccionUsuarios.insertOne(usuario);
    } catch (error) {
        if (error.code === 11000 && error.keyPattern?.email) {
            return res.status(409).json({
                error: 'Ya existe un usuario con ese correo electrónico.'
            });
        }

        throw error;
    }

    return res.status(201).json(obtenerDatosPublicos(usuario));
}

/**
 * Actualitza les dades d'un usuari a MongoDB.
 * La contrasenya només es modifica si se'n proporciona una de nova.
 *
 * @param {import('express').Request} req Petició HTTP d'Express.
 * @param {string} req.params.id Identificador de l'usuari que es vol actualitzar.
 * @param {string} req.body.nombre Nou nom de l'usuari.
 * @param {string} req.body.email Nou correu electrònic de l'usuari.
 * @param {string} [req.body.password] Nova contrasenya opcional.
 * @param {import('express').Response} res Resposta HTTP d'Express.
 * @returns {Promise<import('express').Response>} Resposta HTTP amb les dades públiques actualitzades o l'error corresponent.
 * @remarks
 * Retorna HTTP 200 si l'actualització és correcta,
 * HTTP 400 si les dades no són vàlides,
 * HTTP 404 si l'usuari no existeix i HTTP 409 si el correu ja està utilitzat.
 */
async function actualizarUsuario(req, res) {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            error: 'El identificador del usuario no es válido.'
        });
    }

    const db = await conectarMongoDB();
    const coleccionUsuarios = db.collection('usuarios');

    const usuario = await coleccionUsuarios.findOne({ id });

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

    const emailExistente = await coleccionUsuarios.findOne({
        email,
        id: { $ne: id }
    });

    if (emailExistente) {
        return res.status(409).json({
            error: 'Ya existe otro usuario con ese correo electrónico.'
        });
    }

    const datosActualizados = {
        nombre,
        email
    };

    if (password.length > 0) {
        Object.assign(datosActualizados, generarCredenciales(password));
    }

    try {
        const resultado = await coleccionUsuarios.updateOne(
            { id },
            { $set: datosActualizados }
        );

        if (resultado.matchedCount === 0) {
            return res.status(404).json({
                error: 'No se ha encontrado el usuario que deseas modificar.'
            });
        }
    } catch (error) {
        if (error.code === 11000 && error.keyPattern?.email) {
            return res.status(409).json({
                error: 'Ya existe otro usuario con ese correo electrónico.'
            });
        }

        throw error;
    }

    return res.status(200).json({
        ...obtenerDatosPublicos(usuario),
        nombre,
        email
    });
}

/**
 * Elimina un usuari, els seus intercanvis i les seleccions relacionades
 * de les col·leccions de MongoDB.
 *
 * @param {import('express').Request} req Petició HTTP d'Express.
 * @param {string} req.params.id Identificador de l'usuari que es vol eliminar.
 * @param {import('express').Response} res Resposta HTTP d'Express.
 * @returns {Promise<import('express').Response>} Resposta HTTP amb el resultat de l'eliminació o l'error corresponent.
 * @remarks
 * Retorna HTTP 200 si l'eliminació és correcta,
 * HTTP 400 si l'identificador no és vàlid i HTTP 404 si l'usuari no existeix.
 * També elimina els intercanvis de l'usuari i les seleccions relacionades
 * amb l'usuari o amb els seus intercanvis.
 */
async function eliminarUsuario(req, res) {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            error: 'El identificador del usuario no es válido.'
        });
    }

    const db = await conectarMongoDB();

    const coleccionUsuarios = db.collection('usuarios');
    const coleccionIntercambios = db.collection('intercambios');
    const coleccionSelecciones = db.collection('selecciones');

    const usuario = await coleccionUsuarios.findOne({ id });

    if (!usuario) {
        return res.status(404).json({
            error: 'No se ha encontrado el usuario que deseas eliminar.'
        });
    }

    const intercambiosUsuario = await coleccionIntercambios
        .find(
            { idUsuario: id },
            { projection: { id: 1 } }
        )
        .toArray();

    const idsIntercambiosEliminados = intercambiosUsuario.map(
        intercambio => intercambio.id
    );

    await coleccionIntercambios.deleteMany({
        idUsuario: id
    });

    await coleccionSelecciones.deleteMany({
        $or: [
            { idUsuario: id },
            { idIntercambio: { $in: idsIntercambiosEliminados } }
        ]
    });

    await coleccionUsuarios.deleteOne({ id });

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