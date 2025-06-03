const express = require('express');
const { 
  checkAdminAuth,
  getAdminDashboard,
  getUsers,
  verifyProfessional,
  moderateContent,
  updateContentStatus
} = require('../controllers/adminController');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Middleware para verificar que sea admin
router.use(auth);
router.use(checkAdminAuth);

// Dashboard principal
router.get('/dashboard', getAdminDashboard);

// Gestión de usuarios
router.get('/users', getUsers);

// Verificación de profesionales
router.put('/professionals/:id/verify', verifyProfessional);

// Moderación de contenido
router.get('/content', moderateContent);
router.put('/content/:id/status', updateContentStatus);

module.exports = router;