const express = require('express');
const { getAllProfessionals, getProfessionalById, getProfessionalServices } = require('../controllers/professionalController');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Obtener todos los profesionales
router.get('/', getAllProfessionals);

// Obtener profesional por ID - CORREGIDO
router.get('/:id([0-9]+)', getProfessionalById);

// Obtener servicios de un profesional - CORREGIDO
router.get('/:id([0-9]+)/services', getProfessionalServices);

module.exports = router;