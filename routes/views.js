const express = require('express');
const passport = require('passport');

const router = express.Router();

const viewController = require('../controllers/viewsController');

// @route  POST api/like/:postId
// @desc   Like a story
// @access Private
router.post('/views/:storyId',
  passport.authenticate('jwt', { session: false }),
  viewController.updateViews
);

// @route  DELETE api/like/:postId
// @desc   Unlike a story
// @access Private
router.delete('/views/:storyId',
  passport.authenticate('jwt', { session: false }),
  viewController.getViews
);


module.exports = router;