const db = require('../config/database');

// Obtener todo el contenido
const getAllContent = async (req, res) => {
  try {
    const { category, type, page = 1, limit = 10 } = req.query;

    let query = `
      SELECT c.*, u.first_name, u.last_name, pr.specialty
      FROM content c
      INNER JOIN professionals pr ON c.author_id = pr.id
      INNER JOIN users u ON pr.user_id = u.id
      WHERE c.status = 'published'
    `;

    const queryParams = [];

    if (category) {
      query += ' AND c.category = ?';
      queryParams.push(category);
    }

    if (type) {
      query += ' AND c.content_type = ?';
      queryParams.push(type);
    }

    query += ' ORDER BY c.is_featured DESC, c.published_at DESC';

    const offset = (page - 1) * limit;
    query += ' LIMIT ? OFFSET ?';
    queryParams.push(parseInt(limit), parseInt(offset));

    const [content] = await db.execute(query, queryParams);

    res.json({ content });

  } catch (error) {
    console.error('Error obteniendo contenido:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Obtener contenido por ID
const getContentById = async (req, res) => {
  try {
    const { id } = req.params;

    const [content] = await db.execute(`
      SELECT c.*, u.first_name, u.last_name, pr.specialty
      FROM content c
      INNER JOIN professionals pr ON c.author_id = pr.id
      INNER JOIN users u ON pr.user_id = u.id
      WHERE c.id = ? AND c.status = 'published'
    `, [id]);

    if (content.length === 0) {
      return res.status(404).json({ message: 'Contenido no encontrado' });
    }

    // Incrementar visualizaciones
    await db.execute(
      'UPDATE content SET views = views + 1 WHERE id = ?',
      [id]
    );

    res.json({ content: content[0] });

  } catch (error) {
    console.error('Error obteniendo contenido:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Crear nuevo contenido (solo profesionales)
const createContent = async (req, res) => {
  try {
    if (req.user.user_type !== 'professional') {
      return res.status(403).json({ message: 'Solo profesionales pueden crear contenido' });
    }

    const {
      title,
      content,
      excerpt,
      contentType,
      category,
      tags,
      status = 'draft'
    } = req.body;

    // Obtener el ID del profesional
    const [professional] = await db.execute(
      'SELECT id FROM professionals WHERE user_id = ?',
      [req.user.id]
    );

    if (professional.length === 0) {
      return res.status(404).json({ message: 'Perfil profesional no encontrado' });
    }

    const publishedAt = status === 'published' ? new Date() : null;

    const [result] = await db.execute(`
      INSERT INTO content (author_id, title, content, excerpt, content_type, category, tags, status, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [professional[0].id, title, content, excerpt, contentType, category, tags, status, publishedAt]);

    res.status(201).json({
      message: 'Contenido creado exitosamente',
      contentId: result.insertId
    });

  } catch (error) {
    console.error('Error creando contenido:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Obtener contenido del profesional
const getProfessionalContent = async (req, res) => {
  try {
    if (req.user.user_type !== 'professional') {
      return res.status(403).json({ message: 'Solo profesionales pueden acceder a este contenido' });
    }

    const [professional] = await db.execute(
      'SELECT id FROM professionals WHERE user_id = ?',
      [req.user.id]
    );

    if (professional.length === 0) {
      return res.status(404).json({ message: 'Perfil profesional no encontrado' });
    }

    const [content] = await db.execute(`
      SELECT * FROM content
      WHERE author_id = ?
      ORDER BY created_at DESC
    `, [professional[0].id]);

    res.json({ content });

  } catch (error) {
    console.error('Error obteniendo contenido del profesional:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = {
  getAllContent,
  getContentById,
  createContent,
  getProfessionalContent
};
