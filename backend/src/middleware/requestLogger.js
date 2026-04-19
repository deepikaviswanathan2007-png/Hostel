const morgan = require('morgan');

const requestLogger = morgan(':remote-addr :method :url :status :res[content-length] - :response-time ms', {
  skip: (req) => req.path === '/health',
});

module.exports = requestLogger;
