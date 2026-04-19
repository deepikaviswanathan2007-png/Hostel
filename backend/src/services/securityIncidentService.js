const { pool } = require('../config/database');
const crypto = require('crypto');

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

const SENSITIVE_KEY_PATTERN = /(pass(word)?|token|secret|authorization|cookie|jwt|api[_-]?key|otp|pin)/i;
const LOG_DEDUPE_WINDOW_MS = 30 * 1000;
const LOG_DEDUPE_MAX_ENTRIES = 1000;
const dedupeCache = new Map();

function nowIso() {
  return new Date().toISOString();
}

function cleanDedupeCache(now = Date.now()) {
  for (const [key, value] of dedupeCache.entries()) {
    if (!value?.expiresAt || value.expiresAt <= now) {
      dedupeCache.delete(key);
    }
  }

  if (dedupeCache.size <= LOG_DEDUPE_MAX_ENTRIES) return;

  const entries = Array.from(dedupeCache.entries())
    .sort((a, b) => (a[1]?.createdAt || 0) - (b[1]?.createdAt || 0));
  const overflow = dedupeCache.size - LOG_DEDUPE_MAX_ENTRIES;
  for (let i = 0; i < overflow; i += 1) {
    dedupeCache.delete(entries[i][0]);
  }
}

function createRequestId(req) {
  const candidate = req.headers['x-request-id'] || req.headers['x-correlation-id'];
  if (candidate && String(candidate).trim()) {
    return String(candidate).trim().slice(0, 128);
  }
  return crypto.randomBytes(12).toString('hex');
}

function normalizeEndpoint(req) {
  const original = String(req.originalUrl || req.url || '').trim();
  if (!original) return null;
  const withoutQuery = original.split('?')[0] || original;
  return withoutQuery.slice(0, 500);
}

function redactSensitiveValue(value) {
  if (value == null) return value;
  if (typeof value === 'string') {
    return value.length > 256 ? `${value.slice(0, 256)}...[truncated]` : value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  return '[unsupported]';
}

function sanitizeObject(obj, depth = 0) {
  if (!obj || typeof obj !== 'object') return obj;
  if (depth > 3) return '[max_depth]';

  if (Array.isArray(obj)) {
    return obj.slice(0, 25).map((item) => sanitizeObject(item, depth + 1));
  }

  const output = {};
  const keys = Object.keys(obj).slice(0, 60);
  for (const key of keys) {
    const value = obj[key];
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      output[key] = '[redacted]';
      continue;
    }

    if (value && typeof value === 'object') {
      output[key] = sanitizeObject(value, depth + 1);
    } else {
      output[key] = redactSensitiveValue(value);
    }
  }
  return output;
}

function buildSafeContext(req, extraContext) {
  return sanitizeObject({
    ...(extraContext && typeof extraContext === 'object' ? extraContext : {}),
    requestId: createRequestId(req),
    origin: req.headers.origin || null,
    referer: req.headers.referer || null,
    forwardedFor: req.headers['x-forwarded-for'] || null,
    forwardedProto: req.headers['x-forwarded-proto'] || null,
    hostname: req.hostname || null,
    params: req.params || null,
    query: req.query || null,
    bodyPreview: req.body || null,
    loggedAt: nowIso(),
  });
}

function getDedupeKey({ eventType, sourceIp, method, endpoint, actorId }) {
  return [eventType || 'unknown', sourceIp || 'unknown', method || 'unknown', endpoint || 'unknown', actorId || 'anon'].join('|');
}

function shouldSkipDuplicateIncident(dedupeKey) {
  const now = Date.now();
  cleanDedupeCache(now);
  const existing = dedupeCache.get(dedupeKey);
  if (existing && existing.expiresAt > now) {
    existing.count += 1;
    existing.lastSeenAt = now;
    return true;
  }
  dedupeCache.set(dedupeKey, {
    count: 1,
    createdAt: now,
    lastSeenAt: now,
    expiresAt: now + LOG_DEDUPE_WINDOW_MS,
  });
  return false;
}

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
    const endpoint = normalizeEndpoint(req);
    const method = req.method || null;
    const dedupeKey = getDedupeKey({
      eventType,
      sourceIp,
      method,
      endpoint,
      actorId: actor?.id || null,
    });

    if (shouldSkipDuplicateIncident(dedupeKey)) {
      return;
    }

    let resolvedTarget = target;
    if (!resolvedTarget) {
      resolvedTarget = await inferTargetUser(req);
    }

    const safeContext = buildSafeContext(req, extraContext);

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
        JSON.stringify(safeContext),
      ]
    );
  } catch (error) {
    // Never interrupt request flow if incident logging fails.
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[SECURITY] Incident log failed:', error.message);
    }
  }
}

module.exports = {
  getSourceIp,
  getFingerprint,
  logSecurityIncident,
};
