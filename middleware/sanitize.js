const { body, sanitizeBody } = require("express-validator");

/**
 * Middleware pour sanitizer les entrées utilisateur
 * Évite les attaques XSS et injection
 */
const sanitizeInput = (req, res, next) => {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeObject(req.body);
  }

  if (req.query && typeof req.query === "object") {
    req.query = sanitizeObject(req.query);
  }

  if (req.params && typeof req.params === "object") {
    req.params = sanitizeObject(req.params);
  }

  next();
};

/**
 * Sanitize récursivement un objet
 */
function sanitizeObject(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item));
  }

  if (typeof obj === "object") {
    const sanitized = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }

  if (typeof obj === "string") {
    return sanitizeString(obj);
  }

  return obj;
}

const REGEX_SCRIPT_TAGS = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const REGEX_IFRAME_TAGS = /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi;
const REGEX_JAVASCRIPT_URI = /javascript:/gi;
const REGEX_EVENT_HANDLERS = /on\w+\s*=/gi;

/**
 * Sanitize une chaîne de caractères
 */
function sanitizeString(str) {
  if (typeof str !== "string") {
    return str;
  }

  return str
    .replace(REGEX_SCRIPT_TAGS, "")
    .replace(REGEX_IFRAME_TAGS, "")
    .replace(REGEX_JAVASCRIPT_URI, "")
    .replace(REGEX_EVENT_HANDLERS, "")
    .trim();
}

/**
 * Middleware express-validator pour sanitizer
 */
const sanitizeBodyFields = [
  body("*").customSanitizer((value) => {
    if (typeof value === "string") {
      return sanitizeString(value);
    }
    return value;
  }),
];

module.exports = {
  sanitizeInput,
  sanitizeString,
  sanitizeBodyFields,
};
