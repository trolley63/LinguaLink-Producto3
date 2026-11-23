const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

const usuariosRoutes = require('./routes/usuarios');
const intercambiosRoutes = require('./routes/intercambios');
const seleccionesRoutes = require('./routes/selecciones');

// Middleware per interpretar les peticions amb cos JSON
app.use(express.json());

// Rutes de l'aplicació
app.use('/usuarios', usuariosRoutes);
app.use('/intercambios', intercambiosRoutes);
app.use('/selecciones', seleccionesRoutes);

// Inicia el servidor
app.listen(PORT, () => {
    console.log(`Servidor LinguaLink iniciado en http://localhost:${PORT}`);
});