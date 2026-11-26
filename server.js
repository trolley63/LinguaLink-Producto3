const express = require('express');

const { createHandler } = require('graphql-http/lib/use/express');

const schema = require('./graphql/schema');
const resolvers = require('./graphql/resolvers');

const { conectarMongoDB } = require('./data/conexionMongoDB');
const { inicializarModelosMongoDB } = require('./data/models/modelosMongoDB');

const app = express();
const PORT = process.env.PORT || 3000;

const usuariosRoutes = require('./routes/usuarios');
const intercambiosRoutes = require('./routes/intercambios');
const seleccionesRoutes = require('./routes/selecciones');

// Endpoint de GraphQL
app.all('/graphql', createHandler({
    schema,
    rootValue: resolvers
}));

// Middleware per interpretar les peticions amb cos JSON
app.use(express.json());

// Rutes de l'aplicació
app.use('/usuarios', usuariosRoutes);
app.use('/intercambios', intercambiosRoutes);
app.use('/selecciones', seleccionesRoutes);

/**
 * Inicia el servidor després de connectar amb MongoDB
 * i inicialitzar les col·leccions i els seus models.
 *
 * @returns {Promise<void>}
 */
async function iniciarServidor() {
    try {
        const db = await conectarMongoDB();

        await inicializarModelosMongoDB(db);

        app.listen(PORT, () => {
            console.log(`Servidor LinguaLink iniciado en http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Error al iniciar LinguaLink:', error.message);
        process.exit(1);
    }
}

iniciarServidor();