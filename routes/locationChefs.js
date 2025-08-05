const express = require('express');
const passport = require('passport');
const router = express.Router();

// Import controllers
const getAvailableChefsByLocation = require('../controllers/dishController/getAvailableChefsByLocation');
const validateOrderLocation = require('../controllers/orderController/validateOrderLocation');

// @route   GET /api/location-chefs/
// @desc    Get available chefs based on client location
// @access  Public
router.get('/', getAvailableChefsByLocation);

// @route   POST /api/location-chefs/validate-order
// @desc    Validate if chef can deliver to client address
// @access  Private
router.post('/validate-order', passport.authenticate("jwt", { session: false }), validateOrderLocation);

module.exports = router; 