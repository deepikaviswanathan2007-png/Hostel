const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const cookieName = process.env.AUTH_COOKIE_NAME || 'auth_token';
    const cookieToken = req.cookies?.[cookieName];
    const bearerToken = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : null;
    const token = bearerToken || cookieToken;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.id) {
       return res.status(401).json({ success: false, message: 'Invalid token structure.' });
    }

    const [rows] = await pool.query(
      'SELECT id, name, email, role FROM users WHERE id = ? LIMIT 1',
      [decoded.id]
    );

    if (!rows.length) {
      return res.status(401).json({ success: false, message: 'User associated with token not found.' });
    }

    req.user = rows[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }
    console.error('Authentication error:', err.message);
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required.' });
  }
  next();
};

const roleCheck = (allowedRoles) => (req, res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Access denied. Insufficient permissions.' });
  }
  next();
};

const caretakerOrAdmin = (req, res, next) => {
  if (!req.user || !['admin', 'caretaker'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Caretaker or Admin access required.' });
  }
  next();
};

const wardenOrAdmin = (req, res, next) => {
  if (!req.user || !['admin', 'warden'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Warden or Admin access required.' });
  }
  next();
};

module.exports = { authenticate, adminOnly, roleCheck, caretakerOrAdmin, wardenOrAdmin };
