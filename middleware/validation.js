const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');

// Constants for common validation messages
const VALIDATION_MESSAGES = {
  REQUIRED: (field) => `Le ${field} est requis`,
  INVALID_EMAIL: `L'email doit être valide`,
  MIN_LENGTH: (field, length) => `Le ${field} doit contenir au moins ${length} caractères`,
  POSITIVE_NUMBER: (field) => `Le ${field} doit être un nombre positif`,
  INVALID_DATE_FORMAT: `La date doit être un format valide (AAAA-MM-JJ)`,
  MIN_SEATS: `Le nombre de places doit être au moins 1`,
  INVALID_LEVEL: `Le niveau doit être Débutant, Intermédiaire ou Avancé`,
  INVALID_FORMATION_ID: `L'ID de la formation est invalide`,
};

// Common validation middleware to check for errors
const checkValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const validateCreateFormation = [
  body('title').notEmpty().withMessage(VALIDATION_MESSAGES.REQUIRED('titre')).trim(),
  body('description').notEmpty().withMessage(VALIDATION_MESSAGES.REQUIRED('description')).trim(),
  body('date')
    .notEmpty().withMessage(VALIDATION_MESSAGES.REQUIRED('date'))
    .isISO8601().toDate().withMessage(VALIDATION_MESSAGES.INVALID_DATE_FORMAT),
  body('location').notEmpty().withMessage(VALIDATION_MESSAGES.REQUIRED('lieu')).trim(),
  body('duration').notEmpty().withMessage(VALIDATION_MESSAGES.REQUIRED('durée')).trim(),
  body('instructor').notEmpty().withMessage(VALIDATION_MESSAGES.REQUIRED('nom du formateur')).trim(),
  body('price')
    .notEmpty().withMessage(VALIDATION_MESSAGES.REQUIRED('prix'))
    .isFloat({ min: 0 }).withMessage(VALIDATION_MESSAGES.POSITIVE_NUMBER('prix')),
  body('seats').isInt({ min: 1 }).withMessage(VALIDATION_MESSAGES.MIN_SEATS),
  body('level')
    .isIn(['Débutant', 'Intermédiaire', 'Avancé'])
    .withMessage(VALIDATION_MESSAGES.INVALID_LEVEL)
    .trim(),
  checkValidationErrors,
];

const validateTelecomOpinion = [
  body('name').notEmpty().withMessage(VALIDATION_MESSAGES.REQUIRED('nom')).trim(),
  body('email')
    .isEmail().withMessage(VALIDATION_MESSAGES.INVALID_EMAIL)
    .trim().normalizeEmail(),
  body('subject').notEmpty().withMessage(VALIDATION_MESSAGES.REQUIRED('sujet')).trim(),
  body('message').notEmpty().withMessage(VALIDATION_MESSAGES.REQUIRED('message')).trim(),
  checkValidationErrors,
];

const validateUserSignup = [
  body('name')
    .notEmpty().withMessage(VALIDATION_MESSAGES.REQUIRED('nom'))
    .isLength({ min: 2 }).withMessage(VALIDATION_MESSAGES.MIN_LENGTH('nom', 2))
    .trim(),
  body('email')
    .isEmail().withMessage(VALIDATION_MESSAGES.INVALID_EMAIL)
    .notEmpty().withMessage(VALIDATION_MESSAGES.REQUIRED('email'))
    .trim().normalizeEmail(),
  body('password')
    .notEmpty().withMessage(VALIDATION_MESSAGES.REQUIRED('mot de passe'))
    .isLength({ min: 6 }).withMessage(VALIDATION_MESSAGES.MIN_LENGTH('mot de passe', 6)),
  checkValidationErrors,
];

const validateUserLogin = [
  body('email')
    .isEmail().withMessage(VALIDATION_MESSAGES.INVALID_EMAIL)
    .notEmpty().withMessage(VALIDATION_MESSAGES.REQUIRED('email'))
    .trim().normalizeEmail(),
  body('password').notEmpty().withMessage(VALIDATION_MESSAGES.REQUIRED('mot de passe')),
  checkValidationErrors,
];

const validateEnrollment = [
  body('formationId')
    .notEmpty().withMessage(VALIDATION_MESSAGES.REQUIRED('ID de la formation'))
    .custom(value => mongoose.Types.ObjectId.isValid(value)).withMessage(VALIDATION_MESSAGES.INVALID_FORMATION_ID),
  checkValidationErrors,
];

module.exports = {
  validateCreateFormation,
  validateTelecomOpinion,
  validateUserSignup,
  validateUserLogin,
  validateEnrollment
};
