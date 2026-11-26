const { MongoClient } = require('mongodb');

let clienteMongoDB;
let baseDatos;

/**
 * Estableix la connexió amb la base de dades MongoDB.
 *
 * Reutilitza la connexió existent si ja s'ha establert.
 *
 * @returns {Promise<import('mongodb').Db>} Base de dades lingualink.
 * @throws {Error} Si no s'ha configurat la URI o falla la connexió.
 */
async function conectarMongoDB() {
    if (baseDatos) {
        return baseDatos;
    }

    const uri = process.env.MONGODB_URI;

    if (!uri) {
        throw new Error('No se ha configurado la conexión con MongoDB.');
    }

    clienteMongoDB = new MongoClient(uri);

    await clienteMongoDB.connect();

    baseDatos = clienteMongoDB.db('lingualink');

    return baseDatos;
}

module.exports = {
    conectarMongoDB
};