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

const googleClient = new OAuth2Client();
const INVALID_CREDENTIALS_MSG = 'Invalid email or password';
const EMAIL_NOT_REGISTERED_MSG = 'Email not registered';
const EMAIL_ALREADY_REGISTERED_MSG = 'Email is already registered';
const CSRF_COOKIE_NAME = process.env.CSRF_COOKIE_NAME || 'csrf_token';
const ACCOUNT_BLOCKED_MSG = 'Account is blocked';
const TEMPORARY_LOCK_MSG = 'Account is temporarily locked. Try again later.';
const MAX_FAILED_LOGIN_ATTEMPTS = Number.parseInt(process.env.AUTH_MAX_FAILED_ATTEMPTS || '5', 10);
const LOCK_DURATION_MINUTES = Number.parseInt(process.env.AUTH_LOCK_DURATION_MINUTES || '15', 10);
const FAILED_RESPONSE_DELAY_MS = {
  first: Number.parseInt(process.env.AUTH_FAIL_DELAY_FIRST_MS || '1000', 10),
  second: Number.parseInt(process.env.AUTH_FAIL_DELAY_SECOND_MS || '2000', 10),
  thirdPlus: Number.parseInt(process.env.AUTH_FAIL_DELAY_THIRD_PLUS_MS || '5000', 10),
};

const getPasswordHash = (user) => user?.password_hash || user?.password || null;

const isAccountBlocked = (user) => {
  if (!user) return false;
  if (String(user.status || '').toLowerCase() === 'blocked') return true;
  return false;
};

const waitMs = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getFailDelayMs = (attemptCount = 1) => {
  if (attemptCount <= 1) return FAILED_RESPONSE_DELAY_MS.first;
  if (attemptCount === 2) return FAILED_RESPONSE_DELAY_MS.second;
  return FAILED_RESPONSE_DELAY_MS.thirdPlus;
};

const getRemainingLockSeconds = (lockUntil) => {
  if (!lockUntil) return 0;
  const ms = new Date(lockUntil).getTime() - Date.now();
  if (!Number.isFinite(ms) || ms <= 0) return 0;
  return Math.ceil(ms / 1000);
};

const getGoogleAudiences = () => {
  const single = String(process.env.GOOGLE_CLIENT_ID || '').trim();
  const multiple = String(process.env.GOOGLE_CLIENT_IDS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  return [...new Set([single, ...multiple].filter(Boolean))];
};

const recordLoginAttempt = async ({ req, email, userId = null, success, reason = null }) => {
  try {
    await pool.query(
      `INSERT INTO login_attempts (email, user_id, ip_address, user_agent, success, failure_reason)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        String(email || '').slice(0, 120),
        userId,
        getSourceIp(req),
        String(req.headers['user-agent'] || '').slice(0, 1000),
        success ? 1 : 0,
        reason ? String(reason).slice(0, 160) : null,
      ]
    );
  } catch {
    // Do not block auth if login attempt audit write fails.
  }
};

const recordAuditLog = async ({ req, userId = null, action }) => {
  if (!action) return;
  try {
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, ip, user_agent)
       VALUES (?, ?, ?, ?)`,
      [
        userId,
        String(action).slice(0, 120),
        getSourceIp(req),
        String(req.headers['user-agent'] || '').slice(0, 1000),
      ]
    );
  } catch {
    // Do not block auth flow if audit log write fails.
  }
};

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
      token: tokens.accessToken,
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
    const [rows] = await pool.query(
      `SELECT id, name, email, role, password, password_hash, status,
              failed_attempts, last_failed_attempt, lock_until
       FROM users
       WHERE email = ?
       LIMIT 1`,
      [email]
    );
    if (!rows.length) {
      logAuthFailure(req, `Login failed for unknown email: ${email}`);
      await recordLoginAttempt({ req, email, success: false, reason: 'UNKNOWN_EMAIL' });
      await recordAuditLog({ req, action: 'login_failure' });
      await waitMs(getFailDelayMs(1));
      return res.status(404).json({ success: false, message: EMAIL_NOT_REGISTERED_MSG });
    }

    const user = rows[0];
    if (isAccountBlocked(user)) {
      await recordLoginAttempt({ req, email, userId: user.id, success: false, reason: 'ACCOUNT_BLOCKED' });
      await recordAuditLog({ req, userId: user.id, action: 'login_failure' });
      await waitMs(getFailDelayMs(Math.max(Number(user.failed_attempts || 0), 1)));
      return res.status(403).json({ success: false, message: ACCOUNT_BLOCKED_MSG });
    }

    const lockUntil = user.lock_until ? new Date(user.lock_until) : null;
    if (lockUntil && lockUntil.getTime() > Date.now()) {
      await recordLoginAttempt({ req, email, userId: user.id, success: false, reason: 'TEMP_LOCK_ACTIVE' });
      await recordAuditLog({ req, userId: user.id, action: 'login_failure' });
      await waitMs(getFailDelayMs(Math.max(Number(user.failed_attempts || 0), 1)));
      return res.status(423).json({
        success: false,
        message: TEMPORARY_LOCK_MSG,
        lockUntil,
        remainingSeconds: getRemainingLockSeconds(lockUntil),
      });
    }

    // Auto unlock when temporary lock has expired.
    if (lockUntil && lockUntil.getTime() <= Date.now()) {
      await pool.query(
        `UPDATE users
         SET failed_attempts = 0,
             last_failed_attempt = NULL,
             lock_until = NULL,
             updated_at = NOW()
         WHERE id = ?`,
        [user.id]
      );
      user.failed_attempts = 0;
      user.lock_until = null;
    }

    const passwordHash = getPasswordHash(user);
    if (!passwordHash) {
      logAuthFailure(req, `Login failed because password hash is missing for user ${user.id}`);
      await recordLoginAttempt({ req, email, userId: user.id, success: false, reason: 'PASSWORD_MISSING' });
      return res.status(401).json({ success: false, message: INVALID_CREDENTIALS_MSG });
    }

    const valid = await bcrypt.compare(password, passwordHash);
    if (!valid) {
      const nextAttempts = Number(user.failed_attempts || 0) + 1;
      const lockUntilValue = nextAttempts >= MAX_FAILED_LOGIN_ATTEMPTS
        ? new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000)
        : null;

      await pool.query(
        `UPDATE users
         SET failed_attempts = ?,
             last_failed_attempt = NOW(),
             lock_until = ?,
             updated_at = NOW()
         WHERE id = ?`,
        [nextAttempts, lockUntilValue, user.id]
      );

      logAuthFailure(req, `Login failed due to invalid password for user ${user.id}`, user);
      await recordLoginAttempt({ req, email, userId: user.id, success: false, reason: 'INVALID_PASSWORD' });
      await recordAuditLog({ req, userId: user.id, action: 'login_failure' });

      if (lockUntilValue) {
        await recordAuditLog({ req, userId: user.id, action: 'account_lock' });
      }

      await waitMs(getFailDelayMs(nextAttempts));

      if (lockUntilValue) {
        return res.status(423).json({
          success: false,
          message: TEMPORARY_LOCK_MSG,
          lockUntil: lockUntilValue,
          remainingSeconds: getRemainingLockSeconds(lockUntilValue),
        });
      }

      return res.status(401).json({ success: false, message: INVALID_CREDENTIALS_MSG });
    }

    await pool.query(
      `UPDATE users
       SET failed_attempts = 0,
           last_failed_attempt = NULL,
           lock_until = NULL,
           updated_at = NOW()
       WHERE id = ?`,
      [user.id]
    );
    await recordLoginAttempt({ req, email, userId: user.id, success: true });
    await recordAuditLog({ req, userId: user.id, action: 'login_success' });

    const tokens = await createSession(req, res, user);
    const userData = await getUserResponsePayload(user);

    return res.json({
      success: true,
      message: 'Login successful.',
      user: userData,
      accessToken: tokens.accessToken,
      token: tokens.accessToken,
      csrfToken: tokens.csrfToken,
    });
  } catch (err) {
    console.error('login error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const googleLogin = async (req, res) => {
  const credential = String(req.body?.credential || '').trim();
  if (!credential) {
    return res.status(400).json({ success: false, message: 'Google credential required.' });
  }

  try {
    const audiences = getGoogleAudiences();
    if (!audiences.length) {
      logAuthFailure(req, 'Google login attempted without GOOGLE_CLIENT_ID/GOOGLE_CLIENT_IDS configured.');
      return res.status(500).json({
        success: false,
        message: 'Google sign-in is not configured on the server.',
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: audiences.length === 1 ? audiences[0] : audiences,
    });
    const payload = ticket.getPayload() || {};
    const { sub: googleId, email } = payload;

    if (!googleId || !email) {
      logAuthFailure(req, 'Google login failed because id_token payload was missing required claims.');
      return res.status(401).json({ success: false, message: 'Google authentication failed.' });
    }

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
    if (isAccountBlocked(user)) {
      await recordLoginAttempt({ req, email: user.email, userId: user.id, success: false, reason: 'ACCOUNT_BLOCKED' });
      return res.status(403).json({ success: false, message: ACCOUNT_BLOCKED_MSG });
    }

    const lockUntil = user.lock_until ? new Date(user.lock_until) : null;
    if (lockUntil && lockUntil.getTime() > Date.now()) {
      await recordLoginAttempt({ req, email: user.email, userId: user.id, success: false, reason: 'TEMP_LOCK_ACTIVE' });
      await recordAuditLog({ req, userId: user.id, action: 'login_failure' });
      return res.status(423).json({
        success: false,
        message: TEMPORARY_LOCK_MSG,
        lockUntil,
        remainingSeconds: getRemainingLockSeconds(lockUntil),
      });
    }

    if (lockUntil && lockUntil.getTime() <= Date.now()) {
      await pool.query(
        `UPDATE users
         SET failed_attempts = 0,
             last_failed_attempt = NULL,
             lock_until = NULL,
             updated_at = NOW()
         WHERE id = ?`,
        [user.id]
      );
    }

    await pool.query(
      `UPDATE users
       SET failed_attempts = 0,
           last_failed_attempt = NULL,
           lock_until = NULL,
           updated_at = NOW()
       WHERE id = ?`,
      [user.id]
    );
    await recordLoginAttempt({ req, email: user.email, userId: user.id, success: true });
    await recordAuditLog({ req, userId: user.id, action: 'login_success' });

    const tokens = await createSession(req, res, user);
    const userData = await getUserResponsePayload(user);

    return res.json({
      success: true,
      message: 'Google login successful.',
      user: userData,
      accessToken: tokens.accessToken,
      token: tokens.accessToken,
      csrfToken: tokens.csrfToken,
    });
  } catch (err) {
    logAuthFailure(req, `Google login verification failed: ${err.message}`);
    return res.status(401).json({
      success: false,
      message: 'Google authentication failed.',
      ...(process.env.NODE_ENV === 'production' ? {} : { details: err.message }),
    });
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
      token: newAccessToken,
      csrfToken,
    });
  } catch (err) {
    logAuthFailure(req, `Refresh failed due to token verification error: ${err.message}`);
    return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
  }
};

const logout = async (req, res) => {
  let userId = null;
  try {
    const refreshToken = String(req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken || '');
    if (refreshToken) {
      try {
        const decoded = jwt.verify(refreshToken, getRefreshSecret());
        userId = decoded?.id || null;
      } catch {
        userId = null;
      }
      await revokeRefreshToken({ token: refreshToken });
    }
    await recordAuditLog({ req, userId, action: 'logout' });
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
