
const {
    usuarios,
    intercambios,
    selecciones
} = require('../data/almacenamiento');

/**
 * Guarda o actualitza la selecció d'un usuari.
 * Comprova que existeixin l'usuari i l'intercanvi.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {void}
 */
function guardarSeleccion(req, res) {
    const idUsuario = Number(req.params.idUsuario);
    const idIntercambio = Number(req.params.idIntercambio);

    if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
        return res.status(400).json({
            error: 'El identificador del usuario no es válido.'
        });
    }

    if (!Number.isInteger(idIntercambio) || idIntercambio <= 0) {
        return res.status(400).json({
            error: 'El identificador del intercambio no es válido.'
        });
    }

    const usuario = usuarios.find(item => item.id === idUsuario);

    if (!usuario) {
        return res.status(404).json({
            error: 'No existe el usuario seleccionado.'
        });
    }

    const intercambio = intercambios.find(
        item => item.id === idIntercambio
    );

    if (!intercambio) {
        return res.status(404).json({
            error: 'No existe el intercambio que deseas seleccionar.'
        });
    }

    const seleccion = {
        idUsuario,
        idIntercambio,
        fechaSeleccion: new Date().toISOString()
    };

    const indice = selecciones.findIndex(
        item =>
            item.idUsuario === idUsuario &&
            item.idIntercambio === idIntercambio
    );

    if (indice === -1) {
        selecciones.push(seleccion);
    } else {
        selecciones[indice] = seleccion;
    }

    return res.status(200).json(seleccion);
}

/**
 * Consulta les seleccions d'un usuari amb les dades dels intercanvis.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {void}
 */
function obtenerSeleccionados(req, res) {
    const idUsuario = Number(req.params.idUsuario);

    if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
        return res.status(400).json({
            error: 'El identificador del usuario no es válido.'
        });
    }

    const seleccionesUsuario = selecciones.filter(
        item => item.idUsuario === idUsuario
    );

    const resultado = seleccionesUsuario
        .map(seleccion => {
            const intercambio = intercambios.find(
                item => item.id === seleccion.idIntercambio
            );

            if (!intercambio) {
                return null;
            }

            return {
                ...intercambio,
                fechaSeleccion: seleccion.fechaSeleccion
            };
        })
        .filter(Boolean);

    return res.status(200).json(resultado);
}

/**
 * Elimina una selecció concreta d'un usuari.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {void}
 */
function eliminarSeleccion(req, res) {
    const idUsuario = Number(req.params.idUsuario);
    const idIntercambio = Number(req.params.idIntercambio);

    if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
        return res.status(400).json({
            error: 'El identificador del usuario no es válido.'
        });
    }

    if (!Number.isInteger(idIntercambio) || idIntercambio <= 0) {
        return res.status(400).json({
            error: 'El identificador del intercambio no es válido.'
        });
    }

    const indice = selecciones.findIndex(
        item =>
            item.idUsuario === idUsuario &&
            item.idIntercambio === idIntercambio
    );

    if (indice === -1) {
        return res.status(404).json({
            error: 'Este intercambio no está en la selección del usuario.'
        });
    }

    selecciones.splice(indice, 1);

    return res.status(200).json(true);
}

module.exports = {
    guardarSeleccion,
    obtenerSeleccionados,
    eliminarSeleccion
};
