const { conectarMongoDB } = require('../data/conexionMongoDB');

/**
 * Guarda o actualitza la selecció d'un usuari a MongoDB.
 * Comprova que existeixin l'usuari i l'intercanvi.
 * Si la selecció ja existeix, n'actualitza la data sense duplicar-la.
 *
 * @param {import('express').Request} req Petició HTTP d'Express.
 * @param {string} req.params.idUsuario Identificador de l'usuari.
 * @param {string} req.params.idIntercambio Identificador de l'intercanvi.
 * @param {import('express').Response} res Resposta HTTP d'Express.
 * @returns {Promise<import('express').Response>} Resposta HTTP amb les dades de la selecció o l'error corresponent.
 * @remarks
 * Retorna HTTP 200 si la selecció s'ha guardat o actualitzat,
 * HTTP 400 si algun identificador no és vàlid i HTTP 404
 * si no existeix l'usuari o l'intercanvi indicat.
 */
async function guardarSeleccion(req, res) {
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

    const db = await conectarMongoDB();

    const usuario = await db.collection('usuarios').findOne({
        id: idUsuario
    });

    if (!usuario) {
        return res.status(404).json({
            error: 'No existe el usuario seleccionado.'
        });
    }

    const intercambio = await db.collection('intercambios').findOne({
        id: idIntercambio
    });

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

    await db.collection('selecciones').updateOne(
        {
            idUsuario,
            idIntercambio
        },
        {
            $set: {
                fechaSeleccion: seleccion.fechaSeleccion
            }
        },
        {
            upsert: true
        }
    );

    return res.status(200).json(seleccion);
}

/**
 * Consulta les seleccions d'un usuari amb les dades dels intercanvis.
 *
 * Utilitza una agregació amb $lookup per relacionar les col·leccions
 * de seleccions i intercanvis.
 *
 * @param {import('express').Request} req Petició HTTP d'Express.
 * @param {string} req.params.idUsuario Identificador de l'usuari.
 * @param {import('express').Response} res Resposta HTTP d'Express.
 * @returns {Promise<import('express').Response>} Resposta HTTP amb la llista d'intercanvis seleccionats.
 * @remarks
 * Retorna HTTP 200 amb una llista d'intercanvis que incorpora
 * la data de selecció (fechaSeleccion), o HTTP 400 si
 * l'identificador de l'usuari no és vàlid.
 */
async function obtenerSeleccionados(req, res) {
    const idUsuario = Number(req.params.idUsuario);

    if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
        return res.status(400).json({
            error: 'El identificador del usuario no es válido.'
        });
    }

    const db = await conectarMongoDB();

    const resultado = await db.collection('selecciones').aggregate([
        {
            $match: {
                idUsuario
            }
        },
        {
            $sort: {
                _id: 1
            }
        },
        {
            $lookup: {
                from: 'intercambios',
                localField: 'idIntercambio',
                foreignField: 'id',
                as: 'intercambio'
            }
        },
        {
            $unwind: '$intercambio'
        },
        {
            $replaceRoot: {
                newRoot: {
                    $mergeObjects: [
                        '$intercambio',
                        {
                            fechaSeleccion: '$fechaSeleccion'
                        }
                    ]
                }
            }
        },
        {
            $project: {
                _id: 0
            }
        }
    ]).toArray();

    return res.status(200).json(resultado);
}

/**
 * Elimina una selecció concreta d'un usuari a MongoDB.
 *
 * @param {import('express').Request} req Petició HTTP d'Express.
 * @param {string} req.params.idUsuario Identificador de l'usuari.
 * @param {string} req.params.idIntercambio Identificador de l'intercanvi.
 * @param {import('express').Response} res Resposta HTTP d'Express.
 * @returns {Promise<import('express').Response>} Resposta HTTP amb el resultat de l'eliminació o l'error corresponent.
 * @remarks
 * Retorna HTTP 200 amb el valor true si la selecció s'ha eliminat,
 * HTTP 400 si algun identificador no és vàlid i HTTP 404
 * si la selecció indicada no existeix.
 */
async function eliminarSeleccion(req, res) {
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

    const db = await conectarMongoDB();

    const resultado = await db.collection('selecciones').deleteOne({
        idUsuario,
        idIntercambio
    });

    if (resultado.deletedCount === 0) {
        return res.status(404).json({
            error: 'Este intercambio no está en la selección del usuario.'
        });
    }

    return res.status(200).json(true);
}

module.exports = {
    guardarSeleccion,
    obtenerSeleccionados,
    eliminarSeleccion
};