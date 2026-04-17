const { pool } = require('../config/database');

const DEVICE_PATTERNS = {
  browser: [
    [/edg\//i, 'Edge'],
    [/chrome\//i, 'Chrome'],
    [/firefox\//i, 'Firefox'],
    [/safari\//i, 'Safari'],
  ],
  operatingSystem: [
    [/windows nt 10/i, 'Windows 10'],
    [/windows nt 11/i, 'Windows 11'],
    [/windows/i, 'Windows'],
    [/android/i, 'Android'],
    [/iphone|ipad|ios/i, 'iOS'],
    [/mac os x/i, 'macOS'],
    [/linux/i, 'Linux'],
  ],
};

function getSourceIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.trim()) {
    return fwd.split(',')[0].trim();
  }
  return (req.ip || req.socket?.remoteAddress || '').replace('::ffff:', '') || null;
}

function detectDeviceType(userAgent = '') {
  if (!userAgent) return 'Unknown';
  if (/mobile|iphone|android/i.test(userAgent)) return 'Mobile';
  if (/ipad|tablet/i.test(userAgent)) return 'Tablet';
  return 'Desktop';
}

function detectFromPattern(value, patterns, fallback = 'Unknown') {
  for (const [pattern, label] of patterns) {
    if (pattern.test(value)) return label;
  }
  return fallback;
}

function getFingerprint(req) {
  const ua = String(req.headers['user-agent'] || '');
  return {
    browser: detectFromPattern(ua, DEVICE_PATTERNS.browser),
    operatingSystem: detectFromPattern(ua, DEVICE_PATTERNS.operatingSystem),
    deviceType: detectDeviceType(ua),
    userAgent: ua,
  };
}

async function inferTargetUser(req) {
  try {
    const userId = req.query?.user_id || req.body?.user_id || null;
    const email = req.query?.email || req.body?.email || null;
    if (userId) {
      const [rows] = await pool.query('SELECT id, name, email, role FROM users WHERE id = ? LIMIT 1', [userId]);
      if (rows.length) return rows[0];
    }
    if (email) {
      const [rows] = await pool.query('SELECT id, name, email, role FROM users WHERE email = ? LIMIT 1', [email]);
      if (rows.length) return rows[0];
    }
  } catch {
    // ignore attribution failures
  }
  return null;
}

async function logSecurityIncident({
  req,
  eventType,
  severity = 'medium',
  status = 'open',
  message,
  actor = null,
  target = null,
  extraContext = null,
}) {
  try {
    const fingerprint = getFingerprint(req);
    const sourceIp = getSourceIp(req);
    const endpoint = req.originalUrl || req.url || null;
    const method = req.method || null;

    let resolvedTarget = target;
    if (!resolvedTarget) {
      resolvedTarget = await inferTargetUser(req);
    }

    await pool.query(
      `INSERT INTO security_incidents
      (event_type, severity, status, actor_user_id, actor_email, actor_role, target_user_id, target_user_name, target_user_meta,
       request_method, endpoint, source_ip, user_agent, browser, operating_system, device_type, message, raw_context)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        eventType,
        severity,
        status,
        actor?.id || null,
        actor?.email || null,
        actor?.role || null,
        resolvedTarget?.id || null,
        resolvedTarget?.name || null,
        resolvedTarget?.email || null,
        method,
        endpoint,
        sourceIp,
        fingerprint.userAgent || null,
        fingerprint.browser,
        fingerprint.operatingSystem,
        fingerprint.deviceType,
        message || null,
        extraContext ? JSON.stringify(extraContext) : null,
      ]
    );
  } catch (error) {
    // Never interrupt request flow if incident logging fails.
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[SECURITY] Incident log failed:', error.message);
    }
  }
}

async function isIpBlocked(ipAddress) {
  if (!ipAddress) return false;
  try {
    const [rows] = await pool.query(
      `SELECT id
       FROM blocked_ips
       WHERE ip_address = ?
         AND (expires_at IS NULL OR expires_at > NOW())
       LIMIT 1`,
      [ipAddress]
    );
    return rows.length > 0;
  } catch {
    return false;
  }
}

module.exports = {
  getSourceIp,
  getFingerprint,
  logSecurityIncident,
  isIpBlocked,
};
