const express = require('express');
const router = express.Router();
const { createTelecomOpinion } = require('../controllers/telecomOpinionController');
const { validateTelecomOpinion } = require('../middleware/validation');

router.post('/', validateTelecomOpinion, createTelecomOpinion);

module.exports = router;
