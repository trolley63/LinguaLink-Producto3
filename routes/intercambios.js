const express = require('express');

const router = express.Router();

const {
    obtenerIntercambios,
    obtenerIntercambiosPorUsuario,
    obtenerIntercambioPorId,
    crearIntercambio,
    actualizarIntercambio,
    eliminarIntercambio
} = require('../controllers/intercambiosController');

// Rutes per gestionar els intercanvis
router.get('/', obtenerIntercambios);
router.get('/usuario/:idUsuario', obtenerIntercambiosPorUsuario);
router.get('/:id', obtenerIntercambioPorId);
router.post('/', crearIntercambio);
router.put('/:id', actualizarIntercambio);
router.delete('/:id', eliminarIntercambio);

module.exports = router;