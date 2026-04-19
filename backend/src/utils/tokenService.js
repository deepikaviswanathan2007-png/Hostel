const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const ACCESS_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'auth_token';
const REFRESH_COOKIE_NAME = process.env.REFRESH_COOKIE_NAME || 'refresh_token';

const parseDurationToMs = (value, fallbackMs) => {
  if (value == null || value === '') return fallbackMs;
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value;

  const text = String(value).trim().toLowerCase();
  const match = text.match(/^(\d+)(ms|s|m|h|d)?$/);
  if (!match) return fallbackMs;

  const amount = Number(match[1]);
  const unit = match[2] || 'ms';
  const factor = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  }[unit] || 1;

  const result = amount * factor;
  return Number.isFinite(result) && result > 0 ? result : fallbackMs;
};

const getSameSite = () => {
  const configured = String(process.env.AUTH_COOKIE_SAMESITE || 'lax').toLowerCase();
  return ['lax', 'strict', 'none'].includes(configured) ? configured : 'lax';
};

const getIsSecureCookie = (sameSite) => process.env.NODE_ENV === 'production' || sameSite === 'none';

const accessTokenExpiresIn = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m';
const refreshTokenExpiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

const accessTokenMaxAgeMs = parseDurationToMs(accessTokenExpiresIn, 15 * 60 * 1000);
const refreshTokenMaxAgeMs = parseDurationToMs(refreshTokenExpiresIn, 7 * 24 * 60 * 60 * 1000);

const getAccessCookieOptions = () => {
  const sameSite = getSameSite();
  return {
    httpOnly: true,
    sameSite,
    secure: getIsSecureCookie(sameSite),
    path: '/',
    maxAge: accessTokenMaxAgeMs,
  };
};

const getRefreshCookieOptions = () => {
  const sameSite = getSameSite();
  return {
    httpOnly: true,
    sameSite,
    secure: getIsSecureCookie(sameSite),
    path: '/api/auth',
    maxAge: refreshTokenMaxAgeMs,
  };
};

const getAccessSecret = () => process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET;
const getRefreshSecret = () => process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET;

const assertTokenSecrets = () => {
  if (!getAccessSecret() || !getRefreshSecret()) {
    throw new Error('Access/Refresh token secrets are not configured.');
  }
};

const signAccessToken = (user) => jwt.sign(
  {
    id: user.id,
    email: user.email,
    role: user.role,
    type: 'access',
  },
  getAccessSecret(),
  { expiresIn: accessTokenExpiresIn }
);

const signRefreshToken = (user, jti) => jwt.sign(
  {
    id: user.id,
    role: user.role,
    type: 'refresh',
    jti,
  },
  getRefreshSecret(),
  { expiresIn: refreshTokenExpiresIn }
);

const hashToken = (token) => crypto.createHash('sha256').update(String(token)).digest('hex');

const ensureRefreshTokenTable = async () => {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS refresh_tokens (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      jti VARCHAR(100) NOT NULL,
      token_hash CHAR(64) NOT NULL,
      expires_at DATETIME NOT NULL,
      revoked_at DATETIME DEFAULT NULL,
      replaced_by_jti VARCHAR(100) DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      ip_address VARCHAR(64) DEFAULT NULL,
      user_agent VARCHAR(1000) DEFAULT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE KEY uniq_refresh_tokens_jti (jti),
      INDEX idx_refresh_user_active (user_id, revoked_at, expires_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  );
};

const insertRefreshToken = async ({ userId, jti, token, ipAddress = null, userAgent = null }) => {
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + refreshTokenMaxAgeMs);

  await pool.query(
    `INSERT INTO refresh_tokens (user_id, jti, token_hash, expires_at, ip_address, user_agent)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, jti, tokenHash, expiresAt, ipAddress, userAgent]
  );
};

const revokeRefreshToken = async ({ token = null, jti = null, replacedByJti = null }) => {
  if (!token && !jti) return;

  const where = [];
  const args = [];

  if (token) {
    where.push('token_hash = ?');
    args.push(hashToken(token));
  }
  if (jti) {
    where.push('jti = ?');
    args.push(jti);
  }

  if (!where.length) return;

  await pool.query(
    `UPDATE refresh_tokens
     SET revoked_at = IFNULL(revoked_at, NOW()),
         replaced_by_jti = COALESCE(?, replaced_by_jti),
         updated_at = NOW()
     WHERE (${where.join(' OR ')})`,
    [replacedByJti, ...args]
  );
};

const findValidRefreshToken = async ({ userId, jti, token }) => {
  const tokenHash = hashToken(token);
  const [rows] = await pool.query(
    `SELECT id, user_id, jti, token_hash, expires_at, revoked_at
     FROM refresh_tokens
     WHERE user_id = ?
       AND jti = ?
       AND token_hash = ?
       AND revoked_at IS NULL
       AND expires_at > NOW()
     LIMIT 1`,
    [userId, jti, tokenHash]
  );

  return rows[0] || null;
};

const clearAuthCookies = (res) => {
  const accessOpts = getAccessCookieOptions();
  const refreshOpts = getRefreshCookieOptions();

  res.clearCookie(ACCESS_COOKIE_NAME, {
    httpOnly: true,
    sameSite: accessOpts.sameSite,
    secure: accessOpts.secure,
    path: accessOpts.path,
  });

  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    sameSite: refreshOpts.sameSite,
    secure: refreshOpts.secure,
    path: refreshOpts.path,
  });
};

module.exports = {
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  accessTokenExpiresIn,
  refreshTokenExpiresIn,
  getAccessCookieOptions,
  getRefreshCookieOptions,
  getAccessSecret,
  getRefreshSecret,
  assertTokenSecrets,
  signAccessToken,
  signRefreshToken,
  ensureRefreshTokenTable,
  insertRefreshToken,
  revokeRefreshToken,
  findValidRefreshToken,
  clearAuthCookies,
};
