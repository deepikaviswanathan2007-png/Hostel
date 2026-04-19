const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const { pool } = require('../config/database');
const { logSecurityIncident, getSourceIp } = require('../services/securityIncidentService');
const {
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  getAccessCookieOptions,
  getRefreshCookieOptions,
  getRefreshSecret,
  assertTokenSecrets,
  signAccessToken,
  signRefreshToken,
  insertRefreshToken,
  revokeRefreshToken,
  findValidRefreshToken,
  clearAuthCookies,
} = require('../utils/tokenService');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const INVALID_CREDENTIALS_MSG = 'Invalid email or password';
const EMAIL_NOT_REGISTERED_MSG = 'Email not registered';
const EMAIL_ALREADY_REGISTERED_MSG = 'Email is already registered';
const CSRF_COOKIE_NAME = process.env.CSRF_COOKIE_NAME || 'csrf_token';

const getPasswordHash = (user) => user?.password_hash || user?.password || null;

const logAuthFailure = (req, message, actor = null) => {
  logSecurityIncident({
    req,
    eventType: 'AUTH_LOGIN_FAILED',
    severity: 'high',
    status: 'open',
    actor,
    message,
    extraContext: {
      route: req.originalUrl,
      method: req.method,
    },
  });
};

const issueCsrfToken = (res) => {
  const token = crypto.randomBytes(24).toString('hex');
  const accessCookieOptions = getAccessCookieOptions();
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    secure: accessCookieOptions.secure,
    sameSite: accessCookieOptions.sameSite,
    path: '/',
    maxAge: accessCookieOptions.maxAge,
  });
  return token;
};

const getUserResponsePayload = async (user) => {
  const userData = { id: user.id, name: user.name, email: user.email, role: user.role };

  if (user.role === 'student') {
    let [studentRows] = await pool.query('SELECT id FROM students WHERE user_id = ?', [user.id]);
    if (!studentRows.length) {
      [studentRows] = await pool.query('SELECT id FROM students WHERE email = ?', [user.email]);
      if (studentRows.length) {
        await pool.query('UPDATE students SET user_id = ? WHERE id = ?', [user.id, studentRows[0].id]);
      }
    }
    if (studentRows.length) userData.student_id = studentRows[0].id;
  }

  return userData;
};

const createSession = async (req, res, user) => {
  assertTokenSecrets();

  const accessToken = signAccessToken(user);
  const jti = typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : crypto.randomBytes(16).toString('hex');
  const refreshToken = signRefreshToken(user, jti);

  await insertRefreshToken({
    userId: user.id,
    jti,
    token: refreshToken,
    ipAddress: getSourceIp(req),
    userAgent: String(req.headers['user-agent'] || '').slice(0, 1000),
  });

  res.cookie(ACCESS_COOKIE_NAME, accessToken, getAccessCookieOptions());
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshCookieOptions());
  const csrfToken = issueCsrfToken(res);

  return {
    accessToken,
    refreshToken,
    csrfToken,
  };
};

const signup = async (req, res) => {
  const name = String(req.body?.name || '').trim();
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
    if (existing.length) {
      logAuthFailure(req, `Signup attempt with already-registered email: ${email}`);
      return res.status(409).json({ success: false, message: EMAIL_ALREADY_REGISTERED_MSG });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, 'student']
    );

    const user = { id: result.insertId, name, email, role: 'student' };
    const tokens = await createSession(req, res, user);
    const userData = await getUserResponsePayload(user);

    return res.status(201).json({
      success: true,
      message: 'Signup successful.',
      user: userData,
      accessToken: tokens.accessToken,
      csrfToken: tokens.csrfToken,
    });
  } catch (err) {
    console.error('signup error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const login = async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
    if (!rows.length) {
      logAuthFailure(req, `Login failed for unknown email: ${email}`);
      return res.status(404).json({ success: false, message: EMAIL_NOT_REGISTERED_MSG });
    }

    const user = rows[0];
    const passwordHash = getPasswordHash(user);
    if (!passwordHash) {
      logAuthFailure(req, `Login failed because password hash is missing for user ${user.id}`);
      return res.status(401).json({ success: false, message: INVALID_CREDENTIALS_MSG });
    }

    const valid = await bcrypt.compare(password, passwordHash);
    if (!valid) {
      logAuthFailure(req, `Login failed due to invalid password for user ${user.id}`, user);
      return res.status(401).json({ success: false, message: INVALID_CREDENTIALS_MSG });
    }

    const tokens = await createSession(req, res, user);
    const userData = await getUserResponsePayload(user);

    return res.json({
      success: true,
      message: 'Login successful.',
      user: userData,
      accessToken: tokens.accessToken,
      csrfToken: tokens.csrfToken,
    });
  } catch (err) {
    console.error('login error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const googleLogin = async (req, res) => {
  const credential = String(req.body?.credential || '');
  if (!credential) {
    return res.status(400).json({ success: false, message: 'Google credential required.' });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { sub: googleId, email } = ticket.getPayload();

    let [rows] = await pool.query('SELECT * FROM users WHERE google_id = ? LIMIT 1', [googleId]);

    if (!rows.length) {
      [rows] = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
      if (rows.length) {
        await pool.query('UPDATE users SET google_id = ? WHERE id = ?', [googleId, rows[0].id]);
      } else {
        logAuthFailure(req, `Google login failed for unregistered email: ${email}`);
        return res.status(404).json({ success: false, message: EMAIL_NOT_REGISTERED_MSG });
      }
    }

    const user = rows[0];
    const tokens = await createSession(req, res, user);
    const userData = await getUserResponsePayload(user);

    return res.json({
      success: true,
      message: 'Google login successful.',
      user: userData,
      accessToken: tokens.accessToken,
      csrfToken: tokens.csrfToken,
    });
  } catch (err) {
    logAuthFailure(req, `Google login verification failed: ${err.message}`);
    return res.status(401).json({ success: false, message: 'Google authentication failed.' });
  }
};

const refresh = async (req, res) => {
  const refreshToken = String(req.body?.refreshToken || req.cookies?.[REFRESH_COOKIE_NAME] || '');
  if (!refreshToken) {
    logAuthFailure(req, 'Refresh failed due to missing refresh token.');
    return res.status(401).json({ success: false, message: 'Refresh token is required.' });
  }

  try {
    const decoded = jwt.verify(refreshToken, getRefreshSecret());
    if (!decoded || decoded.type !== 'refresh' || !decoded.id || !decoded.jti) {
      logAuthFailure(req, 'Refresh failed due to malformed refresh token payload.');
      return res.status(401).json({ success: false, message: 'Invalid refresh token.' });
    }

    const activeToken = await findValidRefreshToken({
      userId: decoded.id,
      jti: decoded.jti,
      token: refreshToken,
    });
    if (!activeToken) {
      logAuthFailure(req, `Refresh token not found/active for user ${decoded.id}.`);
      return res.status(401).json({ success: false, message: 'Refresh token revoked or expired.' });
    }

    const [rows] = await pool.query('SELECT id, name, email, role FROM users WHERE id = ? LIMIT 1', [decoded.id]);
    if (!rows.length) {
      await revokeRefreshToken({ token: refreshToken });
      return res.status(401).json({ success: false, message: 'User not found.' });
    }

    const nextJti = typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : crypto.randomBytes(16).toString('hex');
    const newRefreshToken = signRefreshToken(rows[0], nextJti);

    await revokeRefreshToken({ token: refreshToken, replacedByJti: nextJti });
    await insertRefreshToken({
      userId: rows[0].id,
      jti: nextJti,
      token: newRefreshToken,
      ipAddress: getSourceIp(req),
      userAgent: String(req.headers['user-agent'] || '').slice(0, 1000),
    });

    const newAccessToken = signAccessToken(rows[0]);
    res.cookie(ACCESS_COOKIE_NAME, newAccessToken, getAccessCookieOptions());
    res.cookie(REFRESH_COOKIE_NAME, newRefreshToken, getRefreshCookieOptions());
    const csrfToken = issueCsrfToken(res);

    return res.json({
      success: true,
      message: 'Token refreshed successfully.',
      accessToken: newAccessToken,
      csrfToken,
    });
  } catch (err) {
    logAuthFailure(req, `Refresh failed due to token verification error: ${err.message}`);
    return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
  }
};

const logout = async (req, res) => {
  try {
    const refreshToken = String(req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken || '');
    if (refreshToken) {
      await revokeRefreshToken({ token: refreshToken });
    }
  } catch (err) {
    console.warn('logout token revoke warning:', err.message);
  }

  clearAuthCookies(res);
  const accessOpts = getAccessCookieOptions();
  res.clearCookie(CSRF_COOKIE_NAME, {
    httpOnly: false,
    sameSite: accessOpts.sameSite,
    secure: accessOpts.secure,
    path: '/',
  });
  return res.json({ success: true, message: 'Logged out.' });
};

const csrfToken = async (_req, res) => {
  const token = issueCsrfToken(res);
  return res.json({ success: true, csrfToken: token });
};

const me = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id,name,email,role,created_at FROM users WHERE id=?', [req.user.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'User not found.' });

    const userData = await getUserResponsePayload(rows[0]);
    return res.json({ success: true, user: userData });
  } catch (err) {
    console.error('me error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE id=?', [req.user.id]);
    const passwordHash = getPasswordHash(rows[0]);
    if (!passwordHash) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change password for Google-linked accounts. Use Google to sign in.',
      });
    }

    const valid = await bcrypt.compare(currentPassword, passwordHash);
    if (!valid) {
      logAuthFailure(req, `Change-password failed due to invalid current password for user ${req.user.id}`, req.user);
      return res.status(400).json({ success: false, message: 'Current password incorrect.' });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE users SET password=? WHERE id=?', [hashed, req.user.id]);

    return res.json({ success: true, message: 'Password updated.' });
  } catch (err) {
    console.error('changePassword error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  signup,
  login,
  googleLogin,
  refresh,
  logout,
  csrfToken,
  me,
  changePassword,
};
