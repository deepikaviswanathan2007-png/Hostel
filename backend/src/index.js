require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const { testConnection } = require('./config/database');
const routes = require('./routes');
const requestLogger = require('./middleware/requestLogger');
const sanitizeInput = require('./middleware/sanitizeInput');
const {
  securityHeaders,
  globalLimiter,
  authLimiter,
  writeLimiter,
  requestSizeGuard,
  suspiciousRequestBlocker,
  cookieCsrfGuard,
} = require('./middleware/security');
const { ensureRefreshTokenTable } = require('./utils/tokenService');

const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

const buildAllowedOrigins = () => {
  const defaults = ['http://localhost:3000', 'https://naveen.hummingtone.com', 'http://naveen.hummingtone.com'];
  const fromEnv = String(process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  return [...new Set([...defaults, ...fromEnv])];
};

const allowedOrigins = buildAllowedOrigins();

if (!process.env.JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined.');
  process.exit(1);
}

if (!process.env.ACCESS_TOKEN_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL ERROR: ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET must be defined in production.');
    process.exit(1);
  }
  // Development fallback for easier local bootstrapping.
  process.env.ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET;
  process.env.REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET;
  console.warn('[SECURITY] ACCESS_TOKEN_SECRET/REFRESH_TOKEN_SECRET missing. Falling back to JWT_SECRET for non-production runtime.');
}

if (process.env.NODE_ENV === 'production' && String(process.env.JWT_SECRET).length < 32) {
  console.error('FATAL ERROR: JWT_SECRET must be at least 32 characters in production.');
  process.exit(1);
}

// ── Trust proxy (required for rate limiting behind reverse proxies) ──
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(requestLogger);

// ── CORS ──
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  exposedHeaders: ['RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'],
  credentials: true,
  maxAge: 86400,
}));

// ── Security Headers (Helmet) ──
app.use(securityHeaders);

// ── Suspicious Request Blocker ──
app.use(suspiciousRequestBlocker);

// ── Serve uploaded complaint files ──
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads'), {
  dotfiles: 'deny',
  index: false,
  redirect: false,
}));

// ── Request Size Guard (reject payloads > 1MB before parsing) ──
app.use((req, res, next) => {
  if (req.path.startsWith('/api/bulk') || req.path.startsWith('/api/student/complaints')) {
    return next();
  }
  return requestSizeGuard(1 * 1024 * 1024)(req, res, next);
});

app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(sanitizeInput);

// ── Cookie Auth CSRF Guard ──
app.use(cookieCsrfGuard);

// ── Global Rate Limiter (200 req / 15 min per IP) ──
app.use(globalLimiter);

// Health check (not rate limited beyond global)
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// ── Auth Routes — Strict brute-force protection (10 req / 15 min) ──
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);
app.use('/api/auth/google', authLimiter);
app.use('/api/auth/refresh', authLimiter);

// ── Write-Operation Limiter (50 POST/PUT/DELETE per 15 min) ──
app.use('/api', writeLimiter);

// ── OpenAPI schema ──
app.get('/api/openapi.json', (req, res) => {
  res.json(require('./openapi.json'));
});

// API routes
app.use('/api', routes);

// 404
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found.' }));

// Global error handler
app.use((err, req, res, _next) => {
  // Handle multer file upload errors gracefully
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ success: false, message: 'File size exceeds the 5MB limit.' });
  }
  if (err.message && err.message.includes('Invalid file type')) {
    return res.status(400).json({ success: false, message: err.message });
  }
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

testConnection().then(async () => {
  await ensureRefreshTokenTable();
  const server = http.createServer(app);
  server.on('error', (error) => {
    if (error?.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Stop the other backend instance or change PORT in backend/.env.`);
      return;
    }
    console.error('Server error:', error);
  });
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Hostel Management Server running on http://0.0.0.0:${PORT}`);
  });
});
