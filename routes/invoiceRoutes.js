const express = require('express');
const router = express.Router();
const {
  createInvoice,
  getUserInvoices,
  getInvoiceById,
  updateInvoiceStatus,
} = require('../controllers/invoiceController');
const { protect } = require('../middleware/authMiddleware');
const { body, validationResult } = require('express-validator');

const validateInvoiceCreation = [
  body('items').isArray({ min: 1 }).withMessage('La facture doit contenir au moins un article'),
  body('items.*.formationId').optional().notEmpty().withMessage('L\'ID de la formation est requis'),
  body('items.*._id').optional().notEmpty().withMessage('L\'ID de la formation est requis'),
  body('items.*.title').notEmpty().withMessage('Le titre de la formation est requis'),
  body('items.*.price').custom((value) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return !isNaN(num) && num >= 0;
  }).withMessage('Le prix doit être un nombre positif'),
  body('clientInfo.name').optional().trim(),
  body('clientInfo.email').optional().isEmail().withMessage('Email invalide'),
  body('clientInfo.phone').optional().trim(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  },
];

const validateInvoiceUpdate = [
  body('status').optional().isIn(['pending', 'paid', 'cancelled', 'refunded']).withMessage('Statut invalide'),
  body('paymentMethod').optional().isIn(['cash', 'bank_transfer', 'mobile_money', 'card', 'other']).withMessage('Méthode de paiement invalide'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  },
];

// Routes
router.post('/', protect, validateInvoiceCreation, createInvoice);
router.get('/', protect, getUserInvoices);
router.get('/:id', protect, getInvoiceById);
router.patch('/:id/status', protect, validateInvoiceUpdate, updateInvoiceStatus);

module.exports = router;
