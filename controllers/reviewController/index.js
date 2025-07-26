const addReview = require('./addReview');
const getReviews = require('./getReviews');
const getDishReviews = require('./getDishReviews');
const updateReview = require('./updateReview');
const deleteReview = require('./deleteReview');
const getOrderReviewStatus = require('./getOrderReviewStatus');
const markHelpful = require('./markHelpful');
const reportReview = require('./reportReview');
const getReviewStats = require('./getReviewStats');

module.exports = {
  addReview,
  getReviews,
  getDishReviews,
  updateReview,
  deleteReview,
  getOrderReviewStatus,
  markHelpful,
  reportReview,
  getReviewStats,
};
