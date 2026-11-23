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
 * @param {Object} datos
 * @returns {Object}
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
 * @param {Object} req
 * @param {Object} res
 */
function obtenerIntercambios(req, res) {
    res.status(200).json(intercambios);
}

/**
 * Consulta els intercanvis d'un usuari.
 * @param {Object} req
 * @param {Object} res
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
 * @param {Object} req
 * @param {Object} res
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
 * @param {Object} req
 * @param {Object} res
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
 * @param {Object} req
 * @param {Object} res
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
 * @param {Object} req
 * @param {Object} res
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