const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const crypto = require('crypto');
const {
  logSecurityIncident,
  getSourceIp,
} = require('../services/securityIncidentService');

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const parseOriginList = (raw) => {
  if (!raw) return [];
  return String(raw)
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      try {
        return new URL(entry).origin;
      } catch {
        return null;
      }
    })
    .filter(Boolean);
};

const rateLimitKeyGenerator = (req) => {
  const sourceIp = String(getSourceIp(req) || req.ip || req.socket?.remoteAddress || 'unknown')
    .replace('::ffff:', '')
    .trim();

  // express-rate-limit v8 prefers ipKeyGenerator for IPv6 normalization.
  if (typeof rateLimit.ipKeyGenerator === 'function') {
    return rateLimit.ipKeyGenerator(sourceIp);
  }
  return sourceIp;
};

const authRateLimitKeyGenerator = (req) => {
  const sourceIp = String(getSourceIp(req) || req.ip || req.socket?.remoteAddress || 'unknown')
    .replace('::ffff:', '')
    .trim();

  const email = String(req.body?.email || '')
    .trim()
    .toLowerCase()
    .slice(0, 120);

  const key = email ? `${email}|${sourceIp}` : sourceIp;

  if (typeof rateLimit.ipKeyGenerator === 'function') {
    return rateLimit.ipKeyGenerator(key);
  }
  return key;
};

const retryAfterSeconds = (req) => {
  const resetTime = req.rateLimit?.resetTime;
  if (!resetTime) return undefined;
  const seconds = Math.ceil((new Date(resetTime).getTime() - Date.now()) / 1000);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : undefined;
};

// ── 1. Security Headers (Helmet) ─────────────────────────────
//    Adds X-Content-Type-Options, X-Frame-Options, CSP, HSTS, etc.
const securityHeaders = helmet({
  contentSecurityPolicy: false,   // disabled so the React frontend can load
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false, // Disabled to prevent postMessage blocks in local development/Google Auth
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin', // Required for Google Sign-In to verify origin
  },
});

// ── 2. Global Rate Limiter ────────────────────────────────────
//    Adjusted for 10,000+ concurrent users potentially routing through shared campus IPs.
//    Max 3000 requests per IP per 5-minute window.
const globalLimiter = rateLimit({
  windowMs: toInt(process.env.RATE_LIMIT_GLOBAL_WINDOW_MS, 5 * 60 * 1000),
  max: toInt(process.env.RATE_LIMIT_GLOBAL_MAX, process.env.NODE_ENV === 'production' ? 600 : 1200),
  keyGenerator: rateLimitKeyGenerator,
  standardHeaders: true,           // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,            // Disable `X-RateLimit-*` headers
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 5 minutes.',
  },
  handler: (req, res) => {
    const retryAfter = retryAfterSeconds(req);
    if (retryAfter) {
      res.set('Retry-After', String(retryAfter));
    }
    return res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again after 5 minutes.',
      retryAfter,
    });
  },
  skip: (req) => {
    if (req.method === 'OPTIONS') return true;
    // In development, don't throttle session-check polling and dev refreshes.
    if (process.env.NODE_ENV !== 'production' && req.path === '/api/auth/me') return true;
    return false;
  },
});

// ── 3. Auth Route Limiter (Brute-force protection) ────────────
//    Max 100 login attempts per IP per 5-minute window (shared NAT friendly).
const authLimiter = rateLimit({
  windowMs: toInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS, 5 * 60 * 1000),
  max: toInt(process.env.RATE_LIMIT_AUTH_MAX, 20),
  keyGenerator: authRateLimitKeyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts for this account. Please try again after 5 minutes.',
  },
  handler: (req, res) => {
    const retryAfter = retryAfterSeconds(req);
    if (retryAfter) {
      res.set('Retry-After', String(retryAfter));
    }
    return res.status(429).json({
      success: false,
      message: 'Too many login attempts for this account. Please try again after 5 minutes.',
      retryAfter,
    });
  },
  skip: (req) => req.method !== 'POST',
});

// ── 4. API-Specific Limiter (stricter for write operations) ───
//    Max 500 write requests (POST/PUT/DELETE) per IP per 5-minute window.
const writeLimiter = rateLimit({
  windowMs: toInt(process.env.RATE_LIMIT_WRITE_WINDOW_MS, 5 * 60 * 1000),
  max: toInt(process.env.RATE_LIMIT_WRITE_MAX, 120),
  keyGenerator: rateLimitKeyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  message: {
    success: false,
    message: 'Too many write requests. Please slow down.',
  },
  handler: (req, res) => {
    const retryAfter = retryAfterSeconds(req);
    if (retryAfter) {
      res.set('Retry-After', String(retryAfter));
    }
    return res.status(429).json({
      success: false,
      message: 'Too many write requests. Please slow down.',
      retryAfter,
    });
  },
  // Only throttle mutating methods; never count GET/HEAD/OPTIONS preflight requests.
  skip: (req) => !['POST', 'PUT', 'PATCH', 'DELETE'].includes(String(req.method || '').toUpperCase()),
});

// ── 5. Request Size Guard ─────────────────────────────────────
//    Rejects abnormally large payloads early (before JSON parsing).
const requestSizeGuard = (maxBytes = 1024 * 1024) => {
  return (req, res, next) => {
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    if (contentLength > maxBytes) {
      return res.status(413).json({
        success: false,
        message: `Payload too large. Max allowed: ${Math.round(maxBytes / 1024)}KB.`,
      });
    }
    next();
  };
};

// ── 6. Suspicious Request Blocker ─────────────────────────────
//    Blocks common malicious path patterns and bad user agents.
const suspiciousRequestBlocker = async (req, res, next) => {
  const sourceIp = getSourceIp(req);

  const blockedPatterns = [
    /\.\.\//, /\.\.\\/, /%2e%2e/i,             // path traversal
    /\.(php|asp|aspx|jsp|cgi|env)$/i,          // server-side script probes
    /\/wp-(admin|login|content|includes)/i,    // WordPress probes
    /\/phpmyadmin/i,                            // phpMyAdmin probes
    /\/admin\.php/i,
    /<script/i,                                 // XSS in URL
  ];

  let path = req.path;
  try {
    path = decodeURIComponent(req.path);
  } catch {
    // If URI decoding fails, continue using raw path.
  }

  for (const pattern of blockedPatterns) {
    if (pattern.test(path)) {
      console.warn(`[SECURITY] Blocked suspicious request: ${req.method} ${req.originalUrl} from ${req.ip}`);
      logSecurityIncident({
        req,
        eventType: 'SUSPICIOUS_REQUEST_BLOCKED',
        severity: 'high',
        status: 'open',
        message: `Suspicious path pattern blocked for ${req.method} ${req.originalUrl}`,
        extraContext: {
          pattern: String(pattern),
          sourceIp,
        },
      });
      return res.status(403).json({
        success: false,
        message: 'Forbidden.',
      });
    }
  }

  // Block empty or bot-like user agents
  const rawUa = String(req.headers['user-agent'] || '');
  const ua = rawUa.trim();
  const isSuspiciousUa =
    !ua ||
    /(^|[\s(])(curl|wget|python|python-requests|go-http-client|httpclient|libwww-perl)\b/i.test(ua);

  if (isSuspiciousUa) {
    // Allow health-check tools but log the request
    if (req.path !== '/health') {
      console.warn(`[SECURITY] Suspicious User-Agent: "${ua}" on ${req.method} ${req.originalUrl}`);
      logSecurityIncident({
        req,
        eventType: 'SUSPICIOUS_USER_AGENT',
        severity: 'medium',
        status: 'open',
        message: `Suspicious user-agent detected on ${req.method} ${req.originalUrl}`,
        extraContext: {
          sourceIp,
          userAgent: ua,
          rawUserAgent: rawUa,
        },
      });
    }
  }

  next();
};

// ── 7. Cookie-Auth CSRF Guard ────────────────────────────────
//    For browser cookie auth on mutating requests, require trusted Origin/Referer.
const cookieCsrfGuard = (req, res, next) => {
  const method = String(req.method || '').toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return next();
  }

  // Auth bootstrap endpoints must remain reachable even if a stale auth cookie exists.
  const csrfExemptRoutes = new Set([
    '/api/auth/login',
    '/api/auth/google',
    '/api/auth/signup',
    '/api/auth/logout',
  ]);
  if (csrfExemptRoutes.has(req.path)) {
    return next();
  }

  const cookieName = process.env.AUTH_COOKIE_NAME || 'auth_token';
  const csrfCookieName = process.env.CSRF_COOKIE_NAME || 'csrf_token';
  const hasAuthCookie = Boolean(req.cookies?.[cookieName]);
  const hasBearer = String(req.headers.authorization || '').startsWith('Bearer ');

  // CSRF applies when browser cookies are used as auth credentials.
  if (!hasAuthCookie || hasBearer) {
    return next();
  }

  const allowedOrigins = new Set([
    'http://localhost:3000',
    'https://naveen.hummingtone.com',
    'http://naveen.hummingtone.com',
    ...parseOriginList(process.env.CORS_ORIGINS),
  ]);

  const originHeader = req.headers.origin;
  const refererHeader = req.headers.referer;

  let requestOrigin = '';
  if (originHeader) {
    requestOrigin = originHeader;
  } else if (refererHeader) {
    try {
      requestOrigin = new URL(refererHeader).origin;
    } catch {
      requestOrigin = '';
    }
  }

  if (!requestOrigin || !allowedOrigins.has(requestOrigin)) {
    logSecurityIncident({
      req,
      eventType: 'CSRF_GUARD_BLOCKED',
      severity: 'high',
      status: 'open',
      message: `Blocked potentially forged cookie-auth request for ${method} ${req.originalUrl}`,
      extraContext: {
        originHeader: originHeader || null,
        refererHeader: refererHeader || null,
      },
    });
    return res.status(403).json({
      success: false,
      message: 'Forbidden. Invalid request origin.',
    });
  }

  const csrfFromCookie = String(req.cookies?.[csrfCookieName] || '');
  const csrfFromHeader = String(req.headers['x-csrf-token'] || '');
  const csrfLooksValid = csrfFromCookie && csrfFromHeader;

  if (!csrfLooksValid) {
    logSecurityIncident({
      req,
      eventType: 'CSRF_GUARD_BLOCKED',
      severity: 'high',
      status: 'open',
      message: `Blocked cookie-auth request without CSRF token for ${method} ${req.originalUrl}`,
      extraContext: {
        hasCsrfCookie: Boolean(csrfFromCookie),
        hasCsrfHeader: Boolean(csrfFromHeader),
      },
    });
    return res.status(403).json({
      success: false,
      message: 'Forbidden. CSRF token missing.',
    });
  }

  const cookieBuffer = Buffer.from(csrfFromCookie);
  const headerBuffer = Buffer.from(csrfFromHeader);
  const csrfMatches =
    cookieBuffer.length === headerBuffer.length
    && crypto.timingSafeEqual(cookieBuffer, headerBuffer);

  if (!csrfMatches) {
    logSecurityIncident({
      req,
      eventType: 'CSRF_GUARD_BLOCKED',
      severity: 'high',
      status: 'open',
      message: `Blocked cookie-auth request with invalid CSRF token for ${method} ${req.originalUrl}`,
      extraContext: {
        csrfMismatch: true,
      },
    });
    return res.status(403).json({
      success: false,
      message: 'Forbidden. Invalid CSRF token.',
    });
  }

  return next();
};

module.exports = {
  securityHeaders,
  globalLimiter,
  authLimiter,
  writeLimiter,
  requestSizeGuard,
  suspiciousRequestBlocker,
  cookieCsrfGuard,
};
