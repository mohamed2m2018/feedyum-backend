const express = require('express');
const router = express.Router();
const { getDiscoverData } = require('../controllers/discoverController/getDiscoverData');
const { getDiscoverCategoryPage } = require('../controllers/discoverController/getDiscoverCategoryPage');

// Single optimized endpoint for ALL Discover screen data (initial batch load)
// GET /api/discover/batch?lat=30.033&long=31.233&userId=123
router.get('/batch', getDiscoverData);

// Paginated endpoint for a single category (page 2+ infinite scroll)
// GET /api/discover/category/:category?page=2&limit=10&lat=30.033&long=31.233
router.get('/category/:category', getDiscoverCategoryPage);

module.exports = router;