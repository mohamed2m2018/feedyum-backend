const express = require('express');
const router = express.Router();
const passport = require('passport');
const { addToFavorites, removeFromFavorites } = require('../controllers/favoritesController');

// Middleware to authenticate user
const authenticateUser = passport.authenticate('jwt', { session: false });

// Add to favorites
router.post('/add', authenticateUser, addToFavorites);

// Remove from favorites
router.delete('/remove/:dishId', authenticateUser, removeFromFavorites);

module.exports = router;