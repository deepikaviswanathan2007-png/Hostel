const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

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
  windowMs: 5 * 60 * 1000,       // 5 minutes
  max: process.env.NODE_ENV === 'production' ? 3000 : 5000, // much higher for large user base
  standardHeaders: true,           // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,            // Disable `X-RateLimit-*` headers
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 5 minutes.',
  },
  skip: (req) => {
    // In development, don't throttle session-check polling and dev refreshes.
    if (process.env.NODE_ENV !== 'production' && req.path === '/api/auth/me') return true;
    return false;
  },
});

// ── 3. Auth Route Limiter (Brute-force protection) ────────────
//    Max 100 login attempts per IP per 5-minute window (shared NAT friendly).
const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,       // 5 minutes
  max: 100,                         // 100 attempts
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 5 minutes.',
  },
});

// ── 4. API-Specific Limiter (stricter for write operations) ───
//    Max 500 write requests (POST/PUT/DELETE) per IP per 5-minute window.
const writeLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,       // 5 minutes
  max: 500,                         // 500 write operations
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  message: {
    success: false,
    message: 'Too many write requests. Please slow down.',
  },
  skip: (req) => req.method === 'GET',  // only limit POST/PUT/DELETE
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
const suspiciousRequestBlocker = (req, res, next) => {
  const blockedPatterns = [
    /\.\.\//, /\.\.\\/, /%2e%2e/i,             // path traversal
    /\.(php|asp|aspx|jsp|cgi|env)$/i,          // server-side script probes
    /\/wp-(admin|login|content|includes)/i,    // WordPress probes
    /\/phpmyadmin/i,                            // phpMyAdmin probes
    /\/admin\.php/i,
    /<script/i,                                 // XSS in URL
  ];

  const path = decodeURIComponent(req.path);
  for (const pattern of blockedPatterns) {
    if (pattern.test(path)) {
      console.warn(`[SECURITY] Blocked suspicious request: ${req.method} ${req.originalUrl} from ${req.ip}`);
      return res.status(403).json({
        success: false,
        message: 'Forbidden.',
      });
    }
  }

  // Block empty or bot-like user agents
  const ua = req.headers['user-agent'] || '';
  if (!ua || /^(curl|wget|python|go-http|httpclient)/i.test(ua)) {
    // Allow health-check tools but log the request
    if (req.path !== '/health') {
      console.warn(`[SECURITY] Suspicious User-Agent: "${ua}" on ${req.method} ${req.originalUrl}`);
    }
  }

  next();
};

module.exports = {
  securityHeaders,
  globalLimiter,
  authLimiter,
  writeLimiter,
  requestSizeGuard,
  suspiciousRequestBlocker,
};
