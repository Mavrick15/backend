const express = require('express');
const router = express.Router();
const { enrollUserToFormation } = require('../controllers/enrollmentController');
const { validateEnrollment } = require('../middleware/validation');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, validateEnrollment, enrollUserToFormation);

module.exports = router;
