const db = require('../config/database');

// Obtener todos los profesionales - CORREGIDO 100%
const getAllProfessionals = async (req, res) => {
  try {
    const { specialty, location, page = 1, limit = 20 } = req.query;
    
    console.log('🔍 [API] Buscando profesionales con filtros:', { specialty, location, page, limit });
    
    let query = `
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        u.location,
        u.avatar,
        u.created_at,
        pr.id as professional_id,
        pr.specialty,
        pr.license_number,
        pr.years_experience,
        pr.education,
        pr.bio,
        pr.institution,
        pr.is_verified,
        pr.rating,
        pr.total_reviews
      FROM users u
      INNER JOIN professionals pr ON u.id = pr.user_id
      WHERE u.is_active = TRUE AND pr.is_verified = TRUE
    `;
    
    const queryParams = [];
    
    if (specialty && specialty.trim() !== '') {
      query += ' AND pr.specialty LIKE ?';
      queryParams.push(`%${specialty}%`);
    }
    
    if (location && location.trim() !== '') {
      query += ' AND u.location LIKE ?';
      queryParams.push(`%${location}%`);
    }
    
    // Contar total - CORREGIDO
    let countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      INNER JOIN professionals pr ON u.id = pr.user_id
      WHERE u.is_active = TRUE AND pr.is_verified = TRUE
    `;
    
    const countParams = [];
    
    if (specialty && specialty.trim() !== '') {
      countQuery += ' AND pr.specialty LIKE ?';
      countParams.push(`%${specialty}%`);
    }
    
    if (location && location.trim() !== '') {
      countQuery += ' AND u.location LIKE ?';
      countParams.push(`%${location}%`);
    }
    
    console.log('📊 [API] Count Query:', countQuery);
    console.log('📊 [API] Count Params:', countParams);
    
    const [countResult] = await db.execute(countQuery, countParams);
    console.log('📊 [API] Count Result:', countResult);
    
    // Verificar que countResult existe y tiene datos
    const total = (countResult && countResult[0] && countResult[0].total) ? countResult[0].total : 0;
    
    console.log('📊 [API] Total profesionales:', total);
    
    // Si no hay profesionales, devolver respuesta vacía
    if (total === 0) {
      return res.json({ 
        professionals: [],
        pagination: {
          total: 0,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        },
        filters: { specialty, location }
      });
    }
    
    // Agregar ordenación y paginación
    query += ' ORDER BY pr.rating DESC, pr.total_reviews DESC, u.created_at DESC';
    
    const offset = (page - 1) * limit;
    query += ' LIMIT ? OFFSET ?';
    queryParams.push(parseInt(limit), parseInt(offset));
    
    console.log('📋 [API] Query ejecutada:', query);
    console.log('📝 [API] Parámetros:', queryParams);
    
    const [professionals] = await db.execute(query, queryParams);
    
    console.log(`✅ [API] ${professionals.length} profesionales encontrados de ${total} totales`);
    
    res.json({ 
      professionals,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      filters: { specialty, location }
    });
    
  } catch (error) {
    console.error('❌ [API] Error obteniendo profesionales:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: 'No se pudieron obtener los profesionales',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener profesional por ID - CORREGIDO
const getProfessionalById = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🔍 [API] Buscando profesional ID:', id);
    
    const [professionals] = await db.execute(`
      SELECT 
        u.*,
        pr.id as professional_id,
        pr.specialty,
        pr.license_number,
        pr.years_experience,
        pr.education,
        pr.bio,
        pr.institution,
        pr.is_verified,
        pr.rating,
        pr.total_reviews,
        pr.verification_documents
      FROM users u
      INNER JOIN professionals pr ON u.id = pr.user_id
      WHERE u.id = ? AND u.is_active = TRUE
    `, [id]);
    
    if (professionals.length === 0) {
      return res.status(404).json({ 
        error: 'Profesional no encontrado',
        message: `No se encontró un profesional con ID ${id}`
      });
    }
    
    const professional = professionals[0];
    delete professional.password; // Seguridad
    
    // Obtener servicios del profesional
    const [services] = await db.execute(`
      SELECT * FROM services 
      WHERE professional_id = ? AND is_active = TRUE
      ORDER BY created_at DESC
    `, [professional.professional_id]);
    
    // Obtener disponibilidad
    const [availability] = await db.execute(`
      SELECT * FROM availability 
      WHERE professional_id = ? AND is_active = TRUE
      ORDER BY day_of_week, start_time
    `, [professional.professional_id]);
    
    // Obtener reseñas recientes
    const [reviews] = await db.execute(`
      SELECT 
        r.*,
        u.first_name,
        u.last_name,
        CASE WHEN r.is_anonymous = 1 THEN 'Anónimo' ELSE CONCAT(u.first_name, ' ', SUBSTRING(u.last_name, 1, 1), '.') END as reviewer_name
      FROM reviews r
      INNER JOIN patients p ON r.patient_id = p.id
      INNER JOIN users u ON p.user_id = u.id
      WHERE r.professional_id = ?
      ORDER BY r.created_at DESC
      LIMIT 10
    `, [professional.professional_id]);
    
    console.log(`✅ [API] Profesional encontrado: ${professional.first_name} ${professional.last_name}`);
    console.log(`📋 [API] ${services.length} servicios, ${reviews.length} reseñas`);
    
    res.json({
      professional,
      services,
      availability,
      reviews,
      stats: {
        total_services: services.length,
        total_reviews: reviews.length,
        average_rating: professional.rating
      }
    });
    
  } catch (error) {
    console.error('❌ [API] Error obteniendo profesional:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: 'No se pudo obtener la información del profesional'
    });
  }
};

// Obtener servicios de un profesional
const getProfessionalServices = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🔍 [API] Obteniendo servicios del profesional ID:', id);
    
    const [services] = await db.execute(`
      SELECT 
        s.*,
        u.first_name,
        u.last_name,
        pr.specialty
      FROM services s
      INNER JOIN professionals pr ON s.professional_id = pr.id
      INNER JOIN users u ON pr.user_id = u.id
      WHERE pr.user_id = ? AND s.is_active = TRUE
      ORDER BY s.created_at DESC
    `, [id]);
    
    console.log(`✅ [API] ${services.length} servicios encontrados`);
    
    res.json({ 
      services,
      total: services.length
    });
    
  } catch (error) {
    console.error('❌ [API] Error obteniendo servicios:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: 'No se pudieron obtener los servicios'
    });
  }
};

module.exports = {
  getAllProfessionals,
  getProfessionalById,
  getProfessionalServices
};