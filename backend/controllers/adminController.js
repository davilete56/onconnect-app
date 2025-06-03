const db = require('../config/database');

// Verificar que el usuario sea admin
const checkAdminAuth = (req, res, next) => {
  if (!req.user || req.user.user_type !== 'admin') {
    return res.status(403).json({
      error: 'Acceso denegado',
      message: 'Solo administradores pueden acceder a esta función'
    });
  }
  next();
};

// Dashboard del admin - Estadísticas generales
const getAdminDashboard = async (req, res) => {
  try {
    console.log('📊 [ADMIN] Obteniendo estadísticas del dashboard');

    // Obtener estadísticas generales
    const [totalUsers] = await db.execute(
      'SELECT COUNT(*) as total FROM users WHERE is_active = TRUE'
    );

    const [totalProfessionals] = await db.execute(`
      SELECT COUNT(*) as total FROM users u 
      INNER JOIN professionals p ON u.id = p.user_id 
      WHERE u.is_active = TRUE
    `);

    const [totalPatients] = await db.execute(`
      SELECT COUNT(*) as total FROM users u 
      INNER JOIN patients p ON u.id = p.user_id 
      WHERE u.is_active = TRUE
    `);

    const [verifiedProfessionals] = await db.execute(`
      SELECT COUNT(*) as total FROM professionals WHERE is_verified = TRUE
    `);

    const [pendingVerifications] = await db.execute(`
      SELECT COUNT(*) as total FROM professionals WHERE is_verified = FALSE
    `);

    const [totalAppointments] = await db.execute(
      'SELECT COUNT(*) as total FROM appointments'
    );

    const [monthlyAppointments] = await db.execute(`
      SELECT COUNT(*) as total FROM appointments 
      WHERE MONTH(created_at) = MONTH(CURRENT_DATE()) 
      AND YEAR(created_at) = YEAR(CURRENT_DATE())
    `);

    const [totalContent] = await db.execute(
      'SELECT COUNT(*) as total FROM content WHERE status = "published"'
    );

    // Actividad reciente
    const [recentActivity] = await db.execute(`
      SELECT 
        'user_registration' as type,
        CONCAT('Nuevo usuario: ', first_name, ' ', last_name) as title,
        CONCAT('Se registró como ', user_type) as description,
        created_at as date,
        'Activo' as status
      FROM users 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      ORDER BY created_at DESC
      LIMIT 10
    `);

    const stats = {
      totalUsers: totalUsers[0].total,
      totalProfessionals: totalProfessionals[0].total,
      totalPatients: totalPatients[0].total,
      verifiedProfessionals: verifiedProfessionals[0].total,
      pendingVerifications: pendingVerifications[0].total,
      totalAppointments: totalAppointments[0].total,
      monthlyAppointments: monthlyAppointments[0].total,
      totalContent: totalContent[0].total,
      recentActivity
    };

    console.log('✅ [ADMIN] Estadísticas obtenidas:', stats);

    res.json({
      message: 'Dashboard de administrador',
      stats,
      lastUpdate: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [ADMIN] Error obteniendo dashboard:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudieron obtener las estadísticas'
    });
  }
};

// Gestión de usuarios
const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, userType, status } = req.query;

    let query = `
      SELECT 
        u.*,
        CASE 
          WHEN u.user_type = 'professional' THEN pr.specialty
          WHEN u.user_type = 'patient' THEN p.cancer_type
          ELSE NULL
        END as additional_info
      FROM users u
      LEFT JOIN professionals pr ON u.id = pr.user_id
      LEFT JOIN patients p ON u.id = p.user_id
      WHERE 1=1
    `;

    const queryParams = [];

    if (userType) {
      query += ' AND u.user_type = ?';
      queryParams.push(userType);
    }

    if (status) {
      query += ' AND u.is_active = ?';
      queryParams.push(status === 'active' ? 1 : 0);
    }

    // Contar total
    const countQuery = query.replace('SELECT u.*, CASE WHEN u.user_type = \'professional\' THEN pr.specialty WHEN u.user_type = \'patient\' THEN p.cancer_type ELSE NULL END as additional_info', 'SELECT COUNT(*) as total');
    const [countResult] = await db.execute(countQuery, queryParams);
    const total = countResult[0].total;

    // Paginación
    query += ' ORDER BY u.created_at DESC LIMIT ? OFFSET ?';
    const offset = (page - 1) * limit;
    queryParams.push(parseInt(limit), parseInt(offset));

    const [users] = await db.execute(query, queryParams);

    // Remover contraseñas por seguridad
    users.forEach(user => delete user.password);

    res.json({
      users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('❌ [ADMIN] Error obteniendo usuarios:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
};

// Verificar profesional
const verifyProfessional = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'approve' o 'reject'

    console.log(`🔍 [ADMIN] ${action === 'approve' ? 'Aprobando' : 'Rechazando'} profesional ID: ${id}`);

    const [professional] = await db.execute(
      'SELECT * FROM professionals WHERE user_id = ?',
      [id]
    );

    if (professional.length === 0) {
      return res.status(404).json({
        error: 'Profesional no encontrado'
      });
    }

    if (action === 'approve') {
      await db.execute(
        'UPDATE professionals SET is_verified = TRUE WHERE user_id = ?',
        [id]
      );

      res.json({
        message: 'Profesional verificado exitosamente',
        professionalId: id
      });
    } else if (action === 'reject') {
      await db.execute(
        'UPDATE professionals SET is_verified = FALSE WHERE user_id = ?',
        [id]
      );

      res.json({
        message: 'Verificación rechazada',
        professionalId: id
      });
    } else {
      res.status(400).json({
        error: 'Acción inválida',
        message: 'La acción debe ser "approve" o "reject"'
      });
    }

  } catch (error) {
    console.error('❌ [ADMIN] Error verificando profesional:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
};

// Moderar contenido
const moderateContent = async (req, res) => {
  try {
    const { status = 'pending' } = req.query;

    const [content] = await db.execute(`
      SELECT 
        c.*,
        u.first_name,
        u.last_name,
        pr.specialty
      FROM content c
      INNER JOIN professionals pr ON c.author_id = pr.id
      INNER JOIN users u ON pr.user_id = u.id
      WHERE c.status = ?
      ORDER BY c.created_at DESC
    `, [status]);

    res.json({
      content,
      total: content.length
    });

  } catch (error) {
    console.error('❌ [ADMIN] Error obteniendo contenido para moderar:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
};

// Aprobar/rechazar contenido
const updateContentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'published', 'rejected', 'archived'

    console.log(`📝 [ADMIN] Actualizando contenido ${id} a estado: ${status}`);

    const publishedAt = status === 'published' ? new Date() : null;

    await db.execute(
      'UPDATE content SET status = ?, published_at = ? WHERE id = ?',
      [status, publishedAt, id]
    );

    res.json({
      message: `Contenido ${status === 'published' ? 'publicado' : status === 'rejected' ? 'rechazado' : 'archivado'} exitosamente`,
      contentId: id,
      status
    });

  } catch (error) {
    console.error('❌ [ADMIN] Error actualizando contenido:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
};

module.exports = {
  checkAdminAuth,
  getAdminDashboard,
  getUsers,
  verifyProfessional,
  moderateContent,
  updateContentStatus
};