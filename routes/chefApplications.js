const express = require('express');
const { publicFormLimiter } = require('../middleware/rateLimit');
const createChefApplication = require('../controllers/chefApplicationController/createChefApplication');

const router = express.Router();

// Public: "Join as a chef" form on feedyum.com
router.post('/', publicFormLimiter, createChefApplication);

module.exports = router;
