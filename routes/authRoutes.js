const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { logger } = require('../log/logger');
const { validationResult } = require('express-validator');
const { validateUserSignup, validateUserLogin } = require('../middleware/validation');
const { protect } = require('../middleware/authMiddleware');

const API_MESSAGES = {
  SIGNUP_VALIDATION_ERROR: 'Erreurs de validation lors de l\'inscription',
  EMAIL_EXISTS: 'Un utilisateur avec cet email existe déjà',
  USER_CREATED_SUCCESS: 'Utilisateur créé avec succès',
  LOGIN_VALIDATION_ERROR: 'Erreurs de validation lors de la connexion',
  INVALID_CREDENTIALS: 'Email ou mot de passe incorrect',
  LOGIN_SUCCESS: 'Connexion réussie',
  PROFILE_USER_MISSING: 'Non autorisé: Informations utilisateur manquantes.',
};

const LOG_MESSAGES = {
  SIGNUP_VALIDATION_WARN: 'Erreurs de validation lors de l\'inscription:',
  SIGNUP_EMAIL_EXISTS_WARN: 'Tentative d\'inscription avec un email existant.',
  SIGNUP_SUCCESS_INFO: (userName) => `Nouvel utilisateur inscrit: ${userName}.`, // Modifié ici
  SIGNUP_ERROR: 'Erreur lors de l\'inscription:',
  LOGIN_VALIDATION_WARN: 'Erreurs de validation lors de la connexion:',
  LOGIN_USER_NOT_FOUND_WARN: 'Tentative de connexion échouée (utilisateur non trouvé).',
  LOGIN_PASSWORD_INCORRECT_WARN: 'Tentative de connexion échouée (mot de passe incorrect).',
  LOGIN_SUCCESS_INFO: 'Utilisateur connecté.',
  LOGIN_ERROR: 'Erreur lors de la connexion:',
  PROFILE_USER_UNDEFINED_ERROR: 'Erreur: req.user non défini dans la route de profil après protection.',
  PROFILE_ACCESS_INFO: 'Accès au profil utilisateur.',
  PROFILE_ERROR: 'Erreur lors de la récupération du profil:',
};

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

router.post('/signup', validateUserSignup, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn(LOG_MESSAGES.SIGNUP_VALIDATION_WARN, { errors: errors.array() });
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      logger.warn(LOG_MESSAGES.SIGNUP_EMAIL_EXISTS_WARN, { email });
      return res.status(400).json({
        success: false,
        message: API_MESSAGES.EMAIL_EXISTS
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword
    });

    logger.info(LOG_MESSAGES.SIGNUP_SUCCESS_INFO(user.name), { email: user.email, userId: user._id, userName: user.name }); // Modifié ici

    res.status(201).json({
      success: true,
      message: API_MESSAGES.USER_CREATED_SUCCESS,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
      token: generateToken(user._id)
    });
  } catch (error) {
    logger.error(LOG_MESSAGES.SIGNUP_ERROR, { message: error.message, stack: error.stack });
    next(error);
  }
});

router.post('/login', validateUserLogin, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn(LOG_MESSAGES.LOGIN_VALIDATION_WARN, { errors: errors.array() });
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      logger.warn(LOG_MESSAGES.LOGIN_USER_NOT_FOUND_WARN, { email });
      return res.status(401).json({
        success: false,
        message: API_MESSAGES.INVALID_CREDENTIALS
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.warn(LOG_MESSAGES.LOGIN_PASSWORD_INCORRECT_WARN, { email });
      return res.status(401).json({
        success: false,
        message: API_MESSAGES.INVALID_CREDENTIALS
      });
    }

    logger.info(LOG_MESSAGES.LOGIN_SUCCESS_INFO, { email: user.email, userId: user._id });

    res.status(200).json({
      success: true,
      message: API_MESSAGES.LOGIN_SUCCESS,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
      token: generateToken(user._id)
    });
  } catch (error) {
    logger.error(LOG_MESSAGES.LOGIN_ERROR, { message: error.message, stack: error.stack });
    next(error);
  }
});

router.get('/profile', protect, async (req, res, next) => {
  try {
    if (!req.user) {
      logger.error(LOG_MESSAGES.PROFILE_USER_UNDEFINED_ERROR);
      return res.status(401).json({ message: API_MESSAGES.PROFILE_USER_MISSING });
    }

    logger.info(LOG_MESSAGES.PROFILE_ACCESS_INFO, { email: req.user.email, userId: req.user._id });

    res.status(200).json({
      success: true,
      user: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      }
    });
  } catch (error) {
    logger.error(LOG_MESSAGES.PROFILE_ERROR, { message: error.message, stack: error.stack });
    next(error);
  }
});

module.exports = router;
