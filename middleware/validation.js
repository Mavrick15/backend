const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');

// Constants for common validation messages
const VALIDATION_MESSAGES = {
  REQUIRED: (field) => `Le champ "${field}" est obligatoire. Veuillez le renseigner pour continuer.`,
  INVALID_EMAIL: `Veuillez saisir une adresse email valide (ex: votre.nom@domaine.com).`,
  MIN_LENGTH: (field, length) => `Le ${field} doit contenir au moins ${length} caractères pour être valide.`,
  POSITIVE_NUMBER: (field) => `Le ${field} doit être un nombre positif (supérieur ou égal à 0).`,
  INVALID_DATE_FORMAT: `Format de date invalide. Veuillez utiliser le format AAAA-MM-JJ (ex: 2025-03-15).`,
  MIN_SEATS: `Le nombre de places doit être d'au moins 1 participant.`,
  INVALID_LEVEL: `Veuillez choisir un niveau parmi : Débutant, Intermédiaire ou Avancé.`,
  INVALID_FORMATION_ID: `La formation sélectionnée est invalide. Veuillez réessayer depuis la page des formations.`,
};

// Common validation middleware to check for errors
const checkValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const createFormationValidationRules = [
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

const telecomOpinionValidationRules = [
  body('name').notEmpty().withMessage(VALIDATION_MESSAGES.REQUIRED('nom')).trim(),
  body('email')
    .isEmail().withMessage(VALIDATION_MESSAGES.INVALID_EMAIL)
    .trim().normalizeEmail(),
  body('subject').notEmpty().withMessage(VALIDATION_MESSAGES.REQUIRED('sujet')).trim(),
  body('message').notEmpty().withMessage(VALIDATION_MESSAGES.REQUIRED('message')).trim(),
  checkValidationErrors,
];

const contactRequestValidationRules = [
  body('name').notEmpty().withMessage(VALIDATION_MESSAGES.REQUIRED('nom')).trim(),
  body('email')
    .isEmail().withMessage(VALIDATION_MESSAGES.INVALID_EMAIL)
    .trim().normalizeEmail(),
  body('subject').notEmpty().withMessage(VALIDATION_MESSAGES.REQUIRED('sujet')).trim(),
  body('message').notEmpty().withMessage(VALIDATION_MESSAGES.REQUIRED('message')).trim(),
  checkValidationErrors,
];

const userSignupValidationRules = [
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

const userLoginValidationRules = [
  body('email')
    .isEmail().withMessage(VALIDATION_MESSAGES.INVALID_EMAIL)
    .notEmpty().withMessage(VALIDATION_MESSAGES.REQUIRED('email'))
    .trim().normalizeEmail(),
  body('password').notEmpty().withMessage(VALIDATION_MESSAGES.REQUIRED('mot de passe')),
  checkValidationErrors,
];

const enrollmentValidationRules = [
  body('formationId')
    .notEmpty().withMessage(VALIDATION_MESSAGES.REQUIRED('ID de la formation'))
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage(VALIDATION_MESSAGES.INVALID_FORMATION_ID),
  checkValidationErrors,
];

module.exports = {
  validateCreateFormation: createFormationValidationRules,
  validateTelecomOpinion: telecomOpinionValidationRules,
  validateContactRequest: contactRequestValidationRules,
  validateUserSignup: userSignupValidationRules,
  validateUserLogin: userLoginValidationRules,
  validateEnrollment: enrollmentValidationRules,
};
