const express = require('express');
const router = express.Router();
const {
  createTestimonial,
  getTestimonials,
  getTestimonialById,
  updateTestimonial,
  deleteTestimonial,
} = require('../controllers/testimonialController');
const { protect } = require('../middleware/authMiddleware');
const { body, validationResult } = require('express-validator');

const validateTestimonial = [
  body('clientName').notEmpty().trim().withMessage('Le nom du client est requis'),
  body('content').notEmpty().trim().isLength({ min: 10 }).withMessage('Le contenu doit contenir au moins 10 caractères'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('La note doit être entre 1 et 5'),
  body('service').optional().isIn(['formation', 'service', 'support', 'projet', 'autre']),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  },
];

// Routes publiques
router.get('/', getTestimonials);
router.get('/:id', getTestimonialById);

// Routes protégées (admin seulement pour créer/modifier/supprimer)
router.post('/', validateTestimonial, createTestimonial);
router.patch('/:id', protect, updateTestimonial);
router.delete('/:id', protect, deleteTestimonial);

module.exports = router;
