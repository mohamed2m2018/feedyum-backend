const express = require('express');
const router = express.Router();
const { getDiscoverData } = require('../controllers/discoverController/getDiscoverData');

// Single optimized endpoint for ALL Discover screen data
// GET /api/discover/batch?lat=30.033&long=31.233&userId=123
router.get('/batch', getDiscoverData);

module.exports = router;