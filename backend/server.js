const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware de seguridad
app.use(helmet());
app.use(morgan('combined'));

// Configuración CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? 'https://tudominio.com' : 'http://localhost:8080',
  credentials: true
}));

// Middleware para parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// RUTA PRINCIPAL - ARREGLADA
app.get('/', (req, res) => {
  res.json({
    message: '🚀 OnConnect API funcionando correctamente',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      professionals: '/api/professionals',
      services: '/api/services',
      appointments: '/api/appointments',
      content: '/api/content',
      admin: '/api/admin'
    },
    documentation: 'https://docs.onconnect.com'
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/professionals', require('./routes/professionals'));
app.use('/api/services', require('./routes/services'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/content', require('./routes/content'));
app.use('/api/admin', require('./routes/admin'));

// Ruta de prueba
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString(),
    database: 'Conectado'
  });
});

// Manejo de errores 404
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Ruta no encontrada',
    message: `La ruta ${req.originalUrl} no existe`,
    availableRoutes: [
      '/api/auth',
      '/api/professionals', 
      '/api/services',
      '/api/appointments',
      '/api/content',
      '/api/admin'
    ]
  });
});

// Manejo global de errores
app.use((error, req, res, next) => {
  console.error('❌ Error global:', error);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Algo salió mal'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor OnConnect corriendo en puerto ${PORT}`);
  console.log(`📍 API disponible en: http://localhost:${PORT}/api`);
  console.log(`🏠 Inicio: http://localhost:${PORT}`);
  console.log(`🧪 Test: http://localhost:${PORT}/api/test`);
});

module.exports = app;