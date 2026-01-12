const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController/geocode');
const placesController = require('../controllers/locationController/places');

// @route   GET api/location/geocode
// @desc    Reverse geocode coordinates to address
// @access  Public
router.get('/geocode', locationController.reverseGeocode);

// @route   GET api/location/places
// @desc    Search places using Google Places Autocomplete
// @access  Public
router.get('/places', placesController.searchPlaces);

// @route   GET api/location/places/details
// @desc    Get place details by ID
// @access  Public
router.get('/places/details', placesController.getPlaceDetails);

module.exports = router;
