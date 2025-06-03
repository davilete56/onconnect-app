const jwt = require('jsonwebtoken');
const db = require('../config/database');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token, acceso denegado' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [users] = await db.execute(
      'SELECT * FROM users WHERE id = ? AND is_active = TRUE',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Token inválido' });
    }

    req.user = users[0];
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token inválido' });
  }
};

const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {});

    if (req.user.user_type !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado - Solo administradores' });
    }

    next();
  } catch (error) {
    res.status(403).json({ message: 'Acceso denegado' });
  }
};

module.exports = { auth, adminAuth };
