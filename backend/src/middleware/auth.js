const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { logSecurityIncident } = require('../services/securityIncidentService');

const logDeniedAccess = (req, message, actor = null, severity = 'medium') => {
  logSecurityIncident({
    req,
    eventType: 'UNAUTHENTICATED_ACCESS',
    severity,
    status: 'open',
    actor,
    message,
    extraContext: {
      route: req.originalUrl,
      method: req.method,
    },
  });
};

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
      logDeniedAccess(req, 'Guest/Anonymous attempted to access sensitive route without token.');
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.id) {
       logDeniedAccess(req, 'Malformed token structure was used for protected route access.');
       return res.status(401).json({ success: false, message: 'Invalid token structure.' });
    }

    const [rows] = await pool.query(
      'SELECT id, name, email, role FROM users WHERE id = ? LIMIT 1',
      [decoded.id]
    );

    if (!rows.length) {
      logDeniedAccess(req, 'Token resolved to a user that no longer exists.');
      return res.status(401).json({ success: false, message: 'User associated with token not found.' });
    }

    req.user = rows[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      logDeniedAccess(req, 'Expired token used while trying to access a protected route.');
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }
    console.error('Authentication error:', err.message);
    logDeniedAccess(req, 'Invalid token was used while trying to access a protected route.');
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    logDeniedAccess(
      req,
      `Non-admin role attempted to access admin-only route. Role: ${req.user?.role || 'unknown'}`,
      req.user || null,
      'high'
    );
    return res.status(403).json({ success: false, message: 'Admin access required.' });
  }
  next();
};

const roleCheck = (allowedRoles) => (req, res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    logDeniedAccess(
      req,
      `Role access denied. Allowed roles: ${allowedRoles.join(', ')}. Attempted role: ${req.user?.role || 'unknown'}`,
      req.user || null,
      'high'
    );
    return res.status(403).json({ success: false, message: 'Access denied. Insufficient permissions.' });
  }
  next();
};

const caretakerOrAdmin = (req, res, next) => {
  if (!req.user || !['admin', 'caretaker'].includes(req.user.role)) {
    logDeniedAccess(
      req,
      `Caretaker/Admin route was requested by disallowed role: ${req.user?.role || 'unknown'}`,
      req.user || null,
      'high'
    );
    return res.status(403).json({ success: false, message: 'Caretaker or Admin access required.' });
  }
  next();
};

const wardenOrAdmin = (req, res, next) => {
  if (!req.user || !['admin', 'warden'].includes(req.user.role)) {
    logDeniedAccess(
      req,
      `Warden/Admin route was requested by disallowed role: ${req.user?.role || 'unknown'}`,
      req.user || null,
      'high'
    );
    return res.status(403).json({ success: false, message: 'Warden or Admin access required.' });
  }
  next();
};

module.exports = { authenticate, adminOnly, roleCheck, caretakerOrAdmin, wardenOrAdmin };
