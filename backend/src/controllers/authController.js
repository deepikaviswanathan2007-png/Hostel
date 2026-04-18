const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { pool } = require('../config/database');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const cookieName = process.env.AUTH_COOKIE_NAME || 'auth_token';
const INVALID_CREDENTIALS_MSG = 'Invalid email or password';
const EMAIL_NOT_REGISTERED_MSG = 'Email not registered';
const TOO_MANY_ATTEMPTS_MSG = 'Too many attempts. Try again later.';
const MAX_FAILED_ATTEMPTS = 5;
const FAILED_WINDOW_MINUTES = 10;

let securityLogsTableReady = false;

const getRequestIp = (req) => {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim().replace('::ffff:', '');
  }
  return String(req.ip || req.socket?.remoteAddress || '').replace('::ffff:', '') || 'unknown';
};

const ensureSecurityLogsTable = async () => {
  if (securityLogsTableReady) return;
  await pool.query(
    `CREATE TABLE IF NOT EXISTS security_logs (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(160) DEFAULT NULL,
      ip_address VARCHAR(64) NOT NULL,
      status VARCHAR(64) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_security_logs_ip_created (ip_address, created_at),
      INDEX idx_security_logs_email (email),
      INDEX idx_security_logs_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  );
  securityLogsTableReady = true;
};

const logSecurityEvent = async ({ email, ipAddress, status }) => {
  try {
    await ensureSecurityLogsTable();
    await pool.query(
      'INSERT INTO security_logs (email, ip_address, status) VALUES (?, ?, ?)',
      [email || null, ipAddress || 'unknown', status]
    );
  } catch (error) {
    // Never block auth flow due to logging failures.
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[AUTH] Failed to write security log:', error.message);
    }
  }
};

const isIpLoginBlocked = async (ipAddress) => {
  await ensureSecurityLogsTable();
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS failed_count
     FROM security_logs
     WHERE ip_address = ?
       AND status LIKE 'FAILED%'
       AND created_at >= (NOW() - INTERVAL ? MINUTE)`,
    [ipAddress, FAILED_WINDOW_MINUTES]
  );
  return Number(rows[0]?.failed_count || 0) >= MAX_FAILED_ATTEMPTS;
};

const getPasswordHash = (user) => user?.password_hash || user?.password || null;

const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

const cookieOptions = () => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

const login = async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const ipAddress = getRequestIp(req);

  if (!email || !password) {
    return res.status(401).json({ success: false, message: INVALID_CREDENTIALS_MSG });
  }

  try {
    if (await isIpLoginBlocked(ipAddress)) {
      return res.status(429).json({ success: false, message: TOO_MANY_ATTEMPTS_MSG });
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
    if (!rows.length) {
      await logSecurityEvent({
        email,
        ipAddress,
        status: 'FAILED_EMAIL_NOT_FOUND',
      });
      return res.status(404).json({ success: false, message: EMAIL_NOT_REGISTERED_MSG });
    }

    const user = rows[0];
    const passwordHash = getPasswordHash(user);
    if (!passwordHash) {
      await logSecurityEvent({
        email,
        ipAddress,
        status: 'FAILED_WRONG_PASSWORD',
      });
      return res.status(401).json({ success: false, message: INVALID_CREDENTIALS_MSG });
    }

    const valid = await bcrypt.compare(password, passwordHash);
    if (!valid) {
      await logSecurityEvent({
        email,
        ipAddress,
        status: 'FAILED_WRONG_PASSWORD',
      });
      return res.status(401).json({ success: false, message: INVALID_CREDENTIALS_MSG });
    }

    const token = signToken(user);

    const userData = { id: user.id, name: user.name, email: user.email, role: user.role };

    // Attach student_id for student-role users
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

    await logSecurityEvent({
      email: user.email,
      ipAddress,
      status: 'SUCCESS',
    });

    res.cookie(cookieName, token, cookieOptions());
    res.json({
      success: true,
      message: 'Login successful.',
      user: userData,
      token, // Return token for Bearer auth
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const googleLogin = async (req, res) => {
  const { credential } = req.body;
  if (!credential)
    return res.status(400).json({ success: false, message: 'Google credential required.' });

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { sub: googleId, email, name } = ticket.getPayload();

    // 1. Look up by google_id
    let [rows] = await pool.query('SELECT * FROM users WHERE google_id = ?', [googleId]);

    if (!rows.length) {
      // 2. Look up by email (link existing account)
      [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);

      if (rows.length) {
        await pool.query('UPDATE users SET google_id = ? WHERE id = ?', [googleId, rows[0].id]);
      } else {
        return res.status(404).json({ success: false, message: EMAIL_NOT_REGISTERED_MSG });
      }
    }

    const user = rows[0];
    const token = signToken(user);

    const userData = { id: user.id, name: user.name, email: user.email, role: user.role };

    // Attach student_id for student-role users
    if (user.role === 'student') {
      let [studentRows] = await pool.query('SELECT id FROM students WHERE user_id = ?', [user.id]);
      if (!studentRows.length) {
        // Try matching by email and auto-link
        [studentRows] = await pool.query('SELECT id FROM students WHERE email = ?', [user.email]);
        if (studentRows.length) {
          await pool.query('UPDATE students SET user_id = ? WHERE id = ?', [user.id, studentRows[0].id]);
          userData.student_id = studentRows[0].id;
        }
      } else {
        userData.student_id = studentRows[0].id;
      }
    }

    res.cookie(cookieName, token, cookieOptions());
    res.json({
      success: true,
      message: 'Google login successful.',
      user: userData,
      token, // Return token for Bearer auth
    });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(401).json({ success: false, message: 'Google authentication failed: ' + err.message });
  }
};

const logout = async (req, res) => {
  res.clearCookie(cookieName, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  res.json({ success: true, message: 'Logged out.' });
};

const me = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id,name,email,role,created_at FROM users WHERE id=?', [req.user.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'User not found.' });

    const userData = rows[0];

    // For student-role users, also fetch the linked student record id
    if (userData.role === 'student') {
      let [studentRows] = await pool.query('SELECT id FROM students WHERE user_id = ?', [userData.id]);
      if (!studentRows.length) {
        [studentRows] = await pool.query('SELECT id FROM students WHERE email = ?', [userData.email]);
        if (studentRows.length) {
          await pool.query('UPDATE students SET user_id = ? WHERE id = ?', [userData.id, studentRows[0].id]);
          userData.student_id = studentRows[0].id;
        }
      } else {
        userData.student_id = studentRows[0].id;
      }
    }

    res.json({ success: true, user: userData });
  } catch (err) { console.error('Error in ' + __filename + ':', err); res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
  }
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE id=?', [req.user.id]);
    const passwordHash = getPasswordHash(rows[0]);
    if (!passwordHash)
      return res.status(400).json({ success: false, message: 'Cannot change password for Google-linked accounts. Use Google to sign in.' });
    const valid = await bcrypt.compare(currentPassword, passwordHash);
    if (!valid) return res.status(400).json({ success: false, message: 'Current password incorrect.' });
    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password=? WHERE id=?', [hashed, req.user.id]);
    res.json({ success: true, message: 'Password updated.' });
  } catch (err) { console.error('Error in ' + __filename + ':', err); res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { login, googleLogin, me, changePassword, logout };
