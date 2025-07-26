const express = require('express');
const router = express.Router();
const passport = require('passport');
const {
  addReview,
  getReviews,
  getDishReviews,
  updateReview,
  deleteReview,
  getOrderReviewStatus,
  markHelpful,
  reportReview,
  getReviewStats,
} = require('../controllers/reviewController');

// Middleware to authenticate user
const authenticateUser = passport.authenticate('jwt', { session: false });

// Add a new review
router.post('/', authenticateUser, addReview);

// Get reviews with filtering and pagination
router.get('/', getReviews);

// Get dish reviews
router.get('/dish/:dishId', getDishReviews);

// Get review statistics
router.get('/stats', getReviewStats);

// Get order review status
router.get('/order/:orderId/status', authenticateUser, getOrderReviewStatus);

// Update a review
router.put('/:reviewId', authenticateUser, updateReview);

// Delete a review
router.delete('/:reviewId', authenticateUser, deleteReview);

// Mark review as helpful
router.post('/:reviewId/helpful', authenticateUser, markHelpful);

// Report a review
router.post('/:reviewId/report', authenticateUser, reportReview);

module.exports = router;
