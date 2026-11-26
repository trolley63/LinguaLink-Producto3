/**
 * Esquemes de validació i configuració dels models de MongoDB.
 *
 * Defineix les col·leccions d'usuaris, intercanvis i seleccions
 * respectant els camps utilitzats al Producte 2.
 */

/**
 * Tipus numèrics admesos per als identificadors de MongoDB.
 *
 * @type {string[]}
 */
const tipusNumerics = ['int', 'long', 'double'];

/**
 * Esquemes de validació de les col·leccions.
 *
 * @type {Object}
 */
const esquemes = {
    usuarios: {
        bsonType: 'object',
        required: [
            'id',
            'nombre',
            'email',
            'passwordHash',
            'passwordSalt'
        ],
        properties: {
            id: {
                bsonType: tipusNumerics
            },
            nombre: {
                bsonType: 'string',
                minLength: 1
            },
            email: {
                bsonType: 'string',
                pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$'
            },
            passwordHash: {
                bsonType: 'string',
                minLength: 1
            },
            passwordSalt: {
                bsonType: 'string',
                minLength: 1
            }
        }
    },

    intercambios: {
        bsonType: 'object',
        required: [
            'id',
            'titulo',
            'descripcion',
            'fecha',
            'tipo',
            'idUsuario',
            'email'
        ],
        properties: {
            id: {
                bsonType: tipusNumerics
            },
            titulo: {
                bsonType: 'string',
                minLength: 1
            },
            descripcion: {
                bsonType: 'string',
                minLength: 1
            },
            fecha: {
                bsonType: 'string',
                minLength: 1
            },
            tipo: {
                bsonType: 'string',
                enum: [
                    'Ofrezco idioma',
                    'Busco idioma'
                ]
            },
            idUsuario: {
                bsonType: tipusNumerics
            },
            email: {
                bsonType: 'string'
            }
        }
    },

    selecciones: {
        bsonType: 'object',
        required: [
            'idUsuario',
            'idIntercambio',
            'fechaSeleccion'
        ],
        properties: {
            idUsuario: {
                bsonType: tipusNumerics
            },
            idIntercambio: {
                bsonType: tipusNumerics
            },
            fechaSeleccion: {
                bsonType: 'string',
                minLength: 1
            }
        }
    }
};

/**
 * Configura les col·leccions, les validacions i els índexs de MongoDB.
 *
 * Si una col·lecció ja existeix, actualitza el seu esquema de validació.
 *
 * També inicialitza els comptadors dels identificadors numèrics
 * a partir dels registres existents.
 *
 * @param {import('mongodb').Db} db Base de dades MongoDB.
 * @returns {Promise<void>} Finalitza quan els models estan preparats.
 * @throws {Error} Si falla la creació de col·leccions, validacions o índexs.
 */
async function inicializarModelosMongoDB(db) {
    for (const [nombre, esquema] of Object.entries(esquemes)) {
        const cursor = db.listCollections(
            { name: nombre },
            { nameOnly: true }
        );

        const existe = await cursor.hasNext();

        const opciones = {
            validator: {
                $jsonSchema: esquema
            },
            validationLevel: 'strict',
            validationAction: 'error'
        };

        if (existe) {
            await db.command({
                collMod: nombre,
                ...opciones
            });
        } else {
            await db.createCollection(nombre, opciones);
        }
    }

    // Índexs dels usuaris.
    await db.collection('usuarios').createIndex(
        { id: 1 },
        { unique: true }
    );

    await db.collection('usuarios').createIndex(
        { email: 1 },
        { unique: true }
    );

    // Índexs dels intercanvis.
    await db.collection('intercambios').createIndex(
        { id: 1 },
        { unique: true }
    );

    await db.collection('intercambios').createIndex(
        { idUsuario: 1 }
    );

    // Índexs de les seleccions.
    await db.collection('selecciones').createIndex(
        { idUsuario: 1, idIntercambio: 1 },
        { unique: true }
    );

    await db.collection('selecciones').createIndex(
        { idIntercambio: 1 }
    );

    // Inicialització dels comptadors d'identificadors numèrics.
    const contadores = db.collection('contadores');

    for (const nombre of ['usuarios', 'intercambios']) {
        const ultimoRegistro = await db.collection(nombre)
            .find({}, { projection: { id: 1 } })
            .sort({ id: -1 })
            .limit(1)
            .next();

        await contadores.updateOne(
            { _id: nombre },
            {
                $max: {
                    secuencia: ultimoRegistro?.id ?? 0
                }
            },
            { upsert: true }
        );
    }
}

/**
 * Genera el següent identificador numèric d'una col·lecció.
 *
 * La seqüència s'actualitza de manera atòmica a MongoDB.
 *
 * @param {import('mongodb').Db} db Base de dades MongoDB.
 * @param {'usuarios'|'intercambios'} nombreColeccion Nom de la col·lecció.
 * @returns {Promise<number>} Següent identificador disponible.
 * @throws {Error} Si la col·lecció no admet identificadors seqüencials.
 */
async function obtenerSiguienteId(db, nombreColeccion) {
    if (!['usuarios', 'intercambios'].includes(nombreColeccion)) {
        throw new Error('La colección indicada no utiliza identificadores secuenciales.');
    }

    const contador = await db.collection('contadores').findOneAndUpdate(
        { _id: nombreColeccion },
        {
            $inc: {
                secuencia: 1
            }
        },
        {
            upsert: true,
            returnDocument: 'after'
        }
    );

    if (!contador) {
        throw new Error('No se ha podido generar el identificador.');
    }

    return contador.secuencia;
}

module.exports = {
    inicializarModelosMongoDB,
    obtenerSiguienteId
};