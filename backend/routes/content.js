const express = require('express');
const { getAllContent, getContentById, createContent, getProfessionalContent } = require('../controllers/contentController');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Obtener contenido del profesional
router.get('/my-content', auth, getProfessionalContent);

// Obtener todo el contenido
router.get('/', getAllContent);

// Obtener contenido por ID
router.get('/:id([0-9]+)', getContentById);

// Crear nuevo contenido
router.post('/', auth, createContent);

module.exports = router;