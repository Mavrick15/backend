const express = require('express');
const router = express.Router();
const { createContactRequest } = require('../controllers/contactRequestController');
const { validateContactRequest } = require('../middleware/validation');

router.post('/', validateContactRequest, createContactRequest);

module.exports = router;
