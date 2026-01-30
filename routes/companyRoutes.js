const express = require('express');
const router = express.Router();
const {
  getCompany,
  updateCompany,
} = require('../controllers/companyController');
const { protect } = require('../middleware/authMiddleware');

// Route publique
router.get('/', getCompany);

// Route protégée (admin seulement)
router.patch('/', protect, updateCompany);

module.exports = router;
