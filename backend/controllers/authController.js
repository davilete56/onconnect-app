const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const db = require('../config/database');

// Registro de usuario
const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      birthDate,
      location,
      userType,
      // Campos específicos para pacientes
      cancerType,
      treatmentStage,
      diagnosisDate,
      // Campos específicos para profesionales
      specialty,
      licenseNumber,
      yearsExperience,
      education,
      bio,
      institution
    } = req.body;

    // Verificar si el usuario ya existe
    const [existingUsers] = await db.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'El usuario ya existe' });
    }

    // Hashear contraseña CORRECTAMENTE
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Crear usuario
    const [userResult] = await db.execute(
      `INSERT INTO users (email, password, first_name, last_name, phone, birth_date, location, user_type) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [email, hashedPassword, firstName, lastName, phone, birthDate, location, userType]
    );

    const userId = userResult.insertId;

    // Crear registro específico según tipo de usuario
    if (userType === 'patient') {
      await db.execute(
        `INSERT INTO patients (user_id, cancer_type, treatment_stage, diagnosis_date) 
         VALUES (?, ?, ?, ?)`,
        [userId, cancerType, treatmentStage, diagnosisDate]
      );
    } else if (userType === 'professional') {
      await db.execute(
        `INSERT INTO professionals (user_id, specialty, license_number, years_experience, education, bio, institution) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, specialty, licenseNumber, yearsExperience, education, bio, institution]
      );
    }

    // Generar JWT
    const token = jwt.sign(
      { userId, userType },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      token,
      user: {
        id: userId,
        email,
        firstName,
        lastName,
        userType
      }
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Login CORREGIDO
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    console.log('🔍 Intentando login para:', email);

    // Buscar usuario
    const [users] = await db.execute(
      'SELECT * FROM users WHERE email = ? AND is_active = TRUE',
      [email]
    );

    if (users.length === 0) {
      console.log('❌ Usuario no encontrado:', email);
      return res.status(400).json({ message: 'Credenciales inválidas' });
    }

    const user = users[0];
    console.log('✅ Usuario encontrado:', user.email);
    console.log('🔐 Password en BD:', user.password.substring(0, 20) + '...');

    // Verificar contraseña
    let isMatch = false;
    
    // Si la contraseña en BD está hasheada (empieza con $2b$)
    if (user.password.startsWith('$2b$') || user.password.startsWith('$2a$')) {
      console.log('🔒 Comparando con hash bcrypt...');
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      // Si la contraseña está en texto plano (para compatibilidad temporal)
      console.log('📝 Comparando texto plano...');
      isMatch = password === user.password;
    }

    console.log('🔑 ¿Contraseña correcta?', isMatch);

    if (!isMatch) {
      return res.status(400).json({ message: 'Credenciales inválidas' });
    }

    // Generar JWT
    const token = jwt.sign(
      { userId: user.id, userType: user.user_type },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('🎟️ Token generado para:', user.email);

    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        userType: user.user_type,
        isVerified: user.is_verified
      }
    });

  } catch (error) {
    console.error('❌ Error en login:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Obtener perfil del usuario
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.user_type;

    let query = `
      SELECT u.*, 
      ${userType === 'patient' ? 'p.cancer_type, p.treatment_stage, p.diagnosis_date, p.description' : ''}
      ${userType === 'professional' ? 'pr.specialty, pr.license_number, pr.years_experience, pr.education, pr.bio, pr.institution, pr.is_verified as professional_verified, pr.rating, pr.total_reviews' : ''}
      FROM users u
    `;

    if (userType === 'patient') {
      query += ' LEFT JOIN patients p ON u.id = p.user_id';
    } else if (userType === 'professional') {
      query += ' LEFT JOIN professionals pr ON u.id = pr.user_id';
    }

    query += ' WHERE u.id = ?';

    const [users] = await db.execute(query, [userId]);

    if (users.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const user = users[0];
    delete user.password;

    res.json({ user });

  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = {
  register,
  login,
  getProfile
};