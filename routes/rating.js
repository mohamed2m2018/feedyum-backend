const express = require('express');
const passport = require('passport');

const router = express.Router();

const ratingController = require('../controllers/ratingController');

// @route  POST api/rating/:postId
// @desc   Like a story
// @access Private
router.post('/:postId',
  passport.authenticate('jwt', { session: false }),
  ratingController.addRating,
);

// @route  DELETE api/rating/:postId
// @desc   Unlike a story
// @access Private
router.get('/:postId',
  ratingController.getRating,
);


module.exports = router;