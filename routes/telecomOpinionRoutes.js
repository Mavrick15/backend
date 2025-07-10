const express = require('express');
const router = express.Router();
const { createTelecomOpinion } = require('../controllers/telecomOpinionController');
const { body, validationResult } = require('express-validator');

const validateTelecomOpinion = [
  body('name').notEmpty().withMessage('Le nom est requis'),
  body('email').isEmail().withMessage('L\'email doit être valide'),
  body('subject').notEmpty().withMessage('Le sujet est requis'),
  body('message').notEmpty().withMessage('Le message est requis'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

router.post('/', validateTelecomOpinion, createTelecomOpinion);

module.exports = router;
