const express = require('express');
const passport = require('passport');

const router = express.Router();

const likeController = require('../controllers/likeController');

// @route  POST api/like/:postId
// @desc   Like a story
// @access Private
router.post('/:postId',
  passport.authenticate('jwt', { session: false }),
  likeController.addLike
);

// @route  DELETE api/like/:postId
// @desc   Unlike a story
// @access Private
router.delete('/:postId',
  passport.authenticate('jwt', { session: false }),
  likeController.deleteLike
);


module.exports = router;