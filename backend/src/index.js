require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const { testConnection } = require('./config/database');
const routes = require('./routes');
const {
  securityHeaders,
  globalLimiter,
  authLimiter,
  writeLimiter,
  requestSizeGuard,
  suspiciousRequestBlocker,
} = require('./middleware/security');

const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

if (!process.env.JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined.');
  process.exit(1);
}

// ── Trust proxy (required for rate limiting behind reverse proxies) ──
app.set('trust proxy', 1);

// ── CORS ──
app.use(cors({ 
  origin: ['http://localhost:3000', 'https://naveen.hummingtone.com', 'http://naveen.hummingtone.com'], 
  credentials: true 
}));

// ── Security Headers (Helmet) ──
app.use(securityHeaders);

// ── Suspicious Request Blocker ──
app.use(suspiciousRequestBlocker);

// ── Serve uploaded complaint files ──
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

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

// ── Global Rate Limiter (200 req / 15 min per IP) ──
app.use(globalLimiter);

// Health check (not rate limited beyond global)
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// ── Auth Routes — Strict brute-force protection (10 req / 15 min) ──
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/google', authLimiter);

// ── Write-Operation Limiter (50 POST/PUT/DELETE per 15 min) ──
app.use('/api', writeLimiter);

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

testConnection().then(() => {
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
