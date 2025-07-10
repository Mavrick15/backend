const express = require('express');
const router = express.Router();
const { getFormations, getFormationById, createFormation } = require('../controllers/formationController');
const { validateCreateFormation } = require('../middleware/validation');
const { protect } = require('../middleware/authMiddleware');

router.get('/', getFormations);
router.get('/:id', getFormationById);
router.post('/', protect, validateCreateFormation, createFormation);

module.exports = router;
