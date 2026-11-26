const express = require('express');

const {
    loginAdministrador
} = require('../controllers/autenticacionController');

const router = express.Router();

/**
 * Gestiona l'inici de sessió de l'administrador.
 */
router.post('/login', loginAdministrador);

module.exports = router;