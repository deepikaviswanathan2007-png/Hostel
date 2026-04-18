
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use((req, res, next) => {
    // Match backend Helmet: allow Google OAuth postMessage; avoid strict COOP same-origin.
    res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
    res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
    res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
    next();
  });

  // Proxy API requests only. Avoid proxying CRA HMR assets like *.hot-update.json.
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:5000',
      changeOrigin: true,
      secure: false,
    })
  );
};
