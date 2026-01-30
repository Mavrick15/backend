const express = require('express');
const router = express.Router();
const {
  createStatistic,
  getStatistics,
  getStatisticById,
  updateStatistic,
  deleteStatistic,
} = require('../controllers/statisticController');
const { protect } = require('../middleware/authMiddleware');
const { body, validationResult } = require('express-validator');

const validateStatistic = [
  body('label').notEmpty().trim().withMessage('Le libellé est requis'),
  body('value').isFloat({ min: 0 }).withMessage('La valeur doit être un nombre positif'),
  body('category').optional().isIn(['clients', 'projets', 'formations', 'certifications', 'experience', 'autre']),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  },
];

// Routes publiques
router.get('/', getStatistics);
router.get('/:id', getStatisticById);

// Routes protégées (admin seulement)
router.post('/', protect, validateStatistic, createStatistic);
router.patch('/:id', protect, updateStatistic);
router.delete('/:id', protect, deleteStatistic);

module.exports = router;
