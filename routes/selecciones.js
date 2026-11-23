const express = require('express');

const router = express.Router();

const {
    guardarSeleccion,
    obtenerSeleccionados,
    eliminarSeleccion
} = require('../controllers/seleccionesController');

// Rutes per gestionar les seleccions
router.put('/:idUsuario/:idIntercambio', guardarSeleccion);
router.get('/usuario/:idUsuario', obtenerSeleccionados);
router.delete('/:idUsuario/:idIntercambio', eliminarSeleccion);

module.exports = router;