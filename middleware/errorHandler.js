const { logger } = require('../log/logger');

const ERROR_MESSAGES = {
  RESOURCE_NOT_FOUND: (value) => `Ressource non trouvée. ID invalide: ${value}`,
  VALIDATION_ERRORS: (errors) => `Erreurs de validation: ${errors.join(', ')}`,
  DUPLICATE_FIELD: (key) => `Duplicata de champ. La valeur ${key} doit être unique.`,
  DEFAULT_ERROR_STATUS: 500,
  CLIENT_ERROR_STATUS: 400,
  NOT_FOUND_STATUS: 404,
};

const LOG_MESSAGES = {
  WARN_CAST_ERROR: (errorMessage) => `CastError: ${errorMessage}`,
  WARN_VALIDATION_ERROR: (errorMessage) => `ValidationError: ${errorMessage}`,
  WARN_DUPLICATE_KEY_ERROR: (errorMessage) => `Duplicate Key Error: ${errorMessage}`,
  ERROR_GENERAL: (errorMessage) => errorMessage,
};

const errorHandler = (err, req, res, next) => {
  let message = err.message;
  let statusCode = res.statusCode === 200 ? ERROR_MESSAGES.DEFAULT_ERROR_STATUS : res.statusCode;

  const logMeta = { stack: err.stack, path: req.path, method: req.method, ip: req.ip };

  if (err.name === 'CastError') {
    message = ERROR_MESSAGES.RESOURCE_NOT_FOUND(err.value);
    statusCode = ERROR_MESSAGES.NOT_FOUND_STATUS;
    logger.warn(LOG_MESSAGES.WARN_CAST_ERROR(err.message), logMeta);
  } else if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(val => val.message);
    message = ERROR_MESSAGES.VALIDATION_ERRORS(errors);
    statusCode = ERROR_MESSAGES.CLIENT_ERROR_STATUS;
    logger.warn(LOG_MESSAGES.WARN_VALIDATION_ERROR(err.message), logMeta);
  } else if (err.code === 11000) {
    const duplicateKey = Object.keys(err.keyValue)[0];
    message = ERROR_MESSAGES.DUPLICATE_FIELD(duplicateKey);
    statusCode = ERROR_MESSAGES.CLIENT_ERROR_STATUS;
    logger.warn(LOG_MESSAGES.WARN_DUPLICATE_KEY_ERROR(err.message), logMeta);
  } else {
    logger.error(LOG_MESSAGES.ERROR_GENERAL(err.message), logMeta);
  }

  res.status(statusCode).json({
    message: message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = errorHandler;
