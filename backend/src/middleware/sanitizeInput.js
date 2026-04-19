const xss = require('xss');

const sanitizeString = (value) => {
  const trimmed = String(value).trim();
  return xss(trimmed, {
    whiteList: {},
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script'],
  });
};

const sanitizeRecursive = (value, depth = 0) => {
  if (depth > 6) return value;
  if (typeof value === 'string') return sanitizeString(value);
  if (Array.isArray(value)) return value.map((item) => sanitizeRecursive(item, depth + 1));
  if (value && typeof value === 'object') {
    const out = {};
    for (const [key, inner] of Object.entries(value)) {
      out[key] = sanitizeRecursive(inner, depth + 1);
    }
    return out;
  }
  return value;
};

const sanitizeInput = (req, _res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeRecursive(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeRecursive(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeRecursive(req.params);
  }
  next();
};

module.exports = sanitizeInput;
