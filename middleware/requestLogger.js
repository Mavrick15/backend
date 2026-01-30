const { logger } = require('../log/logger');

/**
 * Middleware pour logger toutes les requêtes HTTP
 */
const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // Logger la requête entrante
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
    query: req.query,
    body: req.method !== 'GET' ? sanitizeBody(req.body) : undefined,
  });

  // Capturer la réponse
  const originalSend = res.send;
  res.send = function (data) {
    const duration = Date.now() - startTime;
    
    logger.info(`${req.method} ${req.path} - ${res.statusCode}`, {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    });

    return originalSend.call(this, data);
  };

  next();
};

/**
 * Sanitize le body pour éviter de logger des informations sensibles
 */
function sanitizeBody(body) {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const sanitized = { ...body };
  const sensitiveFields = ['password', 'token', 'refreshToken', 'secret', 'apiKey'];

  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '***REDACTED***';
    }
  });

  return sanitized;
}

module.exports = requestLogger;
