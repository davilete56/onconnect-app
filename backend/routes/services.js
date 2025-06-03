const express = require('express');
const { getAllServices, createService, getMyServices } = require('../controllers/serviceController');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Obtener todos los servicios (público)
router.get('/', getAllServices);

// Obtener mis servicios (profesional)
router.get('/my-services', auth, getMyServices);

// Crear nuevo servicio (profesional)
router.post('/', auth, createService);

module.exports = router;