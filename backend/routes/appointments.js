const express = require('express');
const { createAppointment, getUserAppointments, updateAppointmentStatus } = require('../controllers/appointmentController');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Crear nueva cita
router.post('/', auth, createAppointment);

// Obtener citas del usuario
router.get('/', auth, getUserAppointments);

// Actualizar estado de cita
router.put('/:id([0-9]+)/status', auth, updateAppointmentStatus);

module.exports = router;