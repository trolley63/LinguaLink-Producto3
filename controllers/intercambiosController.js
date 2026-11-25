const {
    usuarios,
    intercambios,
    selecciones
} = require('../data/almacenamiento');

let siguienteIdIntercambio = 1;

const tiposPermitidos = [
    'Ofrezco idioma',
    'Busco idioma'
];

/**
 * Comprova les dades d'un intercanvi.
 *
 * @param {Object} [datos] Dades de l'intercanvi que es vol validar.
 * @param {string} [datos.titulo] Títol de l'intercanvi.
 * @param {string} [datos.descripcion] Descripció de l'intercanvi.
 * @param {string} [datos.fecha] Data de l'intercanvi.
 * @param {string} [datos.tipo] Tipus d'intercanvi.
 * @param {number|string} [datos.idUsuario] Identificador de l'usuari propietari.
 * @returns {{error: string, estado: number}|{datos: {titulo: string, descripcion: string, fecha: string, tipo: string, idUsuario: number}}}
 * Retorna l'error i el codi HTTP si les dades no són vàlides,
 * o les dades normalitzades si la validació és correcta.
 */
function validarDatosIntercambio(datos) {
    datos = datos ?? {};

    const titulo = String(datos.titulo ?? '').trim();
    const descripcion = String(datos.descripcion ?? '').trim();
    const fecha = String(datos.fecha ?? '').trim();
    const tipo = String(datos.tipo ?? '').trim();
    const idUsuario = Number(datos.idUsuario);

    if (!titulo || !descripcion || !fecha || !tipo) {
        return {
            error: 'Todos los campos del intercambio son obligatorios.',
            estado: 400
        };
    }

    if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
        return {
            error: 'El identificador del usuario no es válido.',
            estado: 400
        };
    }

    if (Number.isNaN(Date.parse(fecha))) {
        return {
            error: 'La fecha del intercambio no es válida.',
            estado: 400
        };
    }

    if (!tiposPermitidos.includes(tipo)) {
        return {
            error: 'El tipo de intercambio no es válido.',
            estado: 400
        };
    }

    return {
        datos: {
            titulo,
            descripcion,
            fecha,
            tipo,
            idUsuario
        }
    };
}

/**
 * Consulta tots els intercanvis.
 *
 * @param {import('express').Request} req Petició HTTP d'Express.
 * @param {import('express').Response} res Resposta HTTP d'Express.
 * @returns {void} Envia una resposta HTTP 200 amb la llista d'intercanvis.
 */
function obtenerIntercambios(req, res) {
    res.status(200).json(intercambios);
}

/**
 * Consulta els intercanvis d'un usuari.
 *
 * @param {import('express').Request} req Petició HTTP d'Express.
 * @param {string} req.params.idUsuario Identificador de l'usuari.
 * @param {import('express').Response} res Resposta HTTP d'Express.
 * @returns {import('express').Response} Resposta HTTP amb els intercanvis de l'usuari o l'error corresponent.
 * @remarks
 * Retorna HTTP 200 si la consulta és correcta
 * i HTTP 400 si l'identificador de l'usuari no és vàlid.
 */
function obtenerIntercambiosPorUsuario(req, res) {
    const idUsuario = Number(req.params.idUsuario);

    if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
        return res.status(400).json({
            error: 'El identificador del usuario no es válido.'
        });
    }

    const resultado = intercambios.filter(
        intercambio => intercambio.idUsuario === idUsuario
    );

    return res.status(200).json(resultado);
}

/**
 * Consulta un intercanvi pel seu identificador.
 *
 * @param {import('express').Request} req Petició HTTP d'Express.
 * @param {string} req.params.id Identificador de l'intercanvi.
 * @param {import('express').Response} res Resposta HTTP d'Express.
 * @returns {import('express').Response} Resposta HTTP amb l'intercanvi trobat o l'error corresponent.
 * @remarks
 * Retorna HTTP 200 si l'intercanvi existeix,
 * HTTP 400 si l'identificador no és vàlid i HTTP 404 si no es troba.
 */
function obtenerIntercambioPorId(req, res) {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            error: 'El identificador del intercambio no es válido.'
        });
    }

    const intercambio = intercambios.find(
        item => item.id === id
    );

    if (!intercambio) {
        return res.status(404).json({
            error: 'No se ha encontrado el intercambio.'
        });
    }

    return res.status(200).json(intercambio);
}

/**
 * Crea un intercanvi nou.
 *
 * @param {import('express').Request} req Petició HTTP d'Express.
 * @param {string} req.body.titulo Títol de l'intercanvi.
 * @param {string} req.body.descripcion Descripció de l'intercanvi.
 * @param {string} req.body.fecha Data de l'intercanvi.
 * @param {string} req.body.tipo Tipus d'intercanvi.
 * @param {number|string} req.body.idUsuario Identificador de l'usuari propietari.
 * @param {import('express').Response} res Resposta HTTP d'Express.
 * @returns {import('express').Response} Resposta HTTP amb l'intercanvi creat o l'error corresponent.
 * @remarks
 * Retorna HTTP 201 si l'intercanvi s'ha creat correctament,
 * HTTP 400 si les dades no són vàlides i HTTP 404 si l'usuari associat no existeix.
 * El correu electrònic s'obté a partir de l'usuari associat.
 */
function crearIntercambio(req, res) {
    const validacion = validarDatosIntercambio(req.body);

    if (validacion.error) {
        return res.status(validacion.estado).json({
            error: validacion.error
        });
    }

    const usuario = usuarios.find(
        item => item.id === validacion.datos.idUsuario
    );

    if (!usuario) {
        return res.status(404).json({
            error: 'No existe el usuario asociado al intercambio.'
        });
    }

    const intercambio = {
        id: siguienteIdIntercambio++,
        ...validacion.datos,
        email: usuario.email
    };

    intercambios.push(intercambio);

    return res.status(201).json(intercambio);
}

/**
 * Actualitza les dades d'un intercanvi.
 *
 * @param {import('express').Request} req Petició HTTP d'Express.
 * @param {string} req.params.id Identificador de l'intercanvi que es vol actualitzar.
 * @param {string} req.body.titulo Nou títol de l'intercanvi.
 * @param {string} req.body.descripcion Nova descripció de l'intercanvi.
 * @param {string} req.body.fecha Nova data de l'intercanvi.
 * @param {string} req.body.tipo Nou tipus d'intercanvi.
 * @param {number|string} req.body.idUsuario Identificador de l'usuari propietari.
 * @param {import('express').Response} res Resposta HTTP d'Express.
 * @returns {import('express').Response} Resposta HTTP amb l'intercanvi actualitzat o l'error corresponent.
 * @remarks
 * Retorna HTTP 200 si l'actualització és correcta,
 * HTTP 400 si l'identificador o les dades no són vàlids,
 * i HTTP 404 si no existeix l'intercanvi o l'usuari associat.
 * El correu electrònic s'obté a partir de l'usuari associat.
 */
function actualizarIntercambio(req, res) {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            error: 'El identificador del intercambio no es válido.'
        });
    }

    const intercambio = intercambios.find(
        item => item.id === id
    );

    if (!intercambio) {
        return res.status(404).json({
            error: 'No se ha encontrado el intercambio.'
        });
    }

    const validacion = validarDatosIntercambio(req.body);

    if (validacion.error) {
        return res.status(validacion.estado).json({
            error: validacion.error
        });
    }

    const usuario = usuarios.find(
        item => item.id === validacion.datos.idUsuario
    );

    if (!usuario) {
        return res.status(404).json({
            error: 'No existe el usuario asociado al intercambio.'
        });
    }

    Object.assign(intercambio, {
        ...validacion.datos,
        email: usuario.email
    });

    return res.status(200).json(intercambio);
}

/**
 * Elimina un intercanvi i les seleccions relacionades.
 *
 * @param {import('express').Request} req Petició HTTP d'Express.
 * @param {string} req.params.id Identificador de l'intercanvi que es vol eliminar.
 * @param {import('express').Response} res Resposta HTTP d'Express.
 * @returns {import('express').Response} Resposta HTTP amb el resultat de l'eliminació o l'error corresponent.
 * @remarks
 * Retorna HTTP 200 si l'eliminació és correcta,
 * HTTP 400 si l'identificador no és vàlid i HTTP 404 si l'intercanvi no existeix.
 * També elimina les seleccions associades a l'intercanvi.
 */
function eliminarIntercambio(req, res) {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            error: 'El identificador del intercambio no es válido.'
        });
    }

    const indice = intercambios.findIndex(
        item => item.id === id
    );

    if (indice === -1) {
        return res.status(404).json({
            error: 'No se ha encontrado el intercambio.'
        });
    }

    intercambios.splice(indice, 1);

    for (let i = selecciones.length - 1; i >= 0; i--) {
        if (selecciones[i].idIntercambio === id) {
            selecciones.splice(i, 1);
        }
    }

    return res.status(200).json({
        mensaje: 'Intercambio eliminado correctamente.'
    });
}

module.exports = {
    obtenerIntercambios,
    obtenerIntercambiosPorUsuario,
    obtenerIntercambioPorId,
    crearIntercambio,
    actualizarIntercambio,
    eliminarIntercambio
};