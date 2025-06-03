const db = require('../config/database');

// Obtener todos los servicios - FUNCIONAL
const getAllServices = async (req, res) => {
  try {
    const { category, type, page = 1, limit = 20 } = req.query;
    
    console.log('🔍 [API] Buscando servicios con filtros:', { category, type, page, limit });
    
    let query = `
      SELECT 
        s.*,
        u.first_name,
        u.last_name,
        pr.specialty,
        pr.rating,
        pr.total_reviews,
        pr.institution,
        u.location
      FROM services s
      INNER JOIN professionals pr ON s.professional_id = pr.id
      INNER JOIN users u ON pr.user_id = u.id
      WHERE s.is_active = TRUE AND pr.is_verified = TRUE AND u.is_active = TRUE
    `;
    
    const queryParams = [];
    
    if (category && category.trim() !== '') {
      query += ' AND pr.specialty LIKE ?';
      queryParams.push(`%${category}%`);
    }
    
    if (type && type.trim() !== '') {
      query += ' AND s.service_type = ?';
      queryParams.push(type);
    }
    
    // Contar total
    const countQuery = query.replace('SELECT s.*, u.first_name, u.last_name, pr.specialty, pr.rating, pr.total_reviews, pr.institution, u.location', 'SELECT COUNT(*) as total');
    const [countResult] = await db.execute(countQuery, queryParams);
    const total = countResult[0].total;
    
    // Agregar ordenación y paginación
    query += ' ORDER BY s.created_at DESC, pr.rating DESC';
    
    const offset = (page - 1) * limit;
    query += ' LIMIT ? OFFSET ?';
    queryParams.push(parseInt(limit), parseInt(offset));
    
    console.log('📋 [API] Query servicios:', query);
    
    const [services] = await db.execute(query, queryParams);
    
    console.log(`✅ [API] ${services.length} servicios encontrados de ${total} totales`);
    
    res.json({ 
      services,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      },
      filters: { category, type }
    });
    
  } catch (error) {
    console.error('❌ [API] Error obteniendo servicios:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: 'No se pudieron obtener los servicios'
    });
  }
};

// Crear nuevo servicio (solo profesionales)
const createService = async (req, res) => {
  try {
    if (!req.user || req.user.user_type !== 'professional') {
      return res.status(403).json({ 
        error: 'Acceso denegado',
        message: 'Solo profesionales pueden crear servicios' 
      });
    }
    
    const {
      name,
      description,
      duration,
      price = 0,
      isFree = false,
      serviceType,
      modality
    } = req.body;
    
    console.log('📝 [API] Creando servicio:', { name, serviceType, modality });
    
    // Validaciones
    if (!name || !description || !duration || !serviceType || !modality) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'Faltan campos obligatorios: name, description, duration, serviceType, modality'
      });
    }
    
    // Obtener el ID del profesional
    const [professional] = await db.execute(
      'SELECT id FROM professionals WHERE user_id = ?',
      [req.user.id]
    );
    
    if (professional.length === 0) {
      return res.status(404).json({ 
        error: 'Perfil profesional no encontrado',
        message: 'Debe completar su perfil profesional primero'
      });
    }
    
    const [result] = await db.execute(`
      INSERT INTO services (
        professional_id, 
        name, 
        description, 
        duration, 
        price, 
        is_free, 
        service_type, 
        modality,
        is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)
    `, [
      professional[0].id, 
      name, 
      description, 
      parseInt(duration), 
      parseFloat(price), 
      Boolean(isFree), 
      serviceType, 
      modality
    ]);
    
    console.log(`✅ [API] Servicio creado con ID: ${result.insertId}`);
    
    res.status(201).json({
      message: 'Servicio creado exitosamente',
      serviceId: result.insertId,
      service: {
        id: result.insertId,
        name,
        description,
        duration,
        price: isFree ? 0 : price,
        is_free: isFree,
        service_type: serviceType,
        modality
      }
    });
    
  } catch (error) {
    console.error('❌ [API] Error creando servicio:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: 'No se pudo crear el servicio'
    });
  }
};

// Obtener servicios del profesional autenticado
const getMyServices = async (req, res) => {
  try {
    if (!req.user || req.user.user_type !== 'professional') {
      return res.status(403).json({ 
        error: 'Acceso denegado',
        message: 'Solo profesionales pueden ver sus servicios' 
      });
    }

    const [professional] = await db.execute(
      'SELECT id FROM professionals WHERE user_id = ?',
      [req.user.id]
    );

    if (professional.length === 0) {
      return res.status(404).json({ 
        error: 'Perfil profesional no encontrado'
      });
    }

    const [services] = await db.execute(`
      SELECT * FROM services 
      WHERE professional_id = ?
      ORDER BY created_at DESC
    `, [professional[0].id]);

    res.json({ 
      services,
      total: services.length
    });

  } catch (error) {
    console.error('❌ [API] Error obteniendo mis servicios:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor'
    });
  }
};

module.exports = {
  getAllServices,
  createService,
  getMyServices
};