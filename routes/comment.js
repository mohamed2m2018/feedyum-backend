const express = require('express');
const passport = require('passport');

const router = express.Router();

const commentController = require('../controllers/commentController');

// @route  POST api/story/:postId/comment
// @desc   Add a comment to a story
// @access Private
router.post('/:postId',
  passport.authenticate('jwt', { session: false }),
  commentController.addComment
);

// @route  DELETE api/story/:postId/comment/:commentId
// @desc   Delete a comment
// @access Private
router.delete('/:postId/:commentId',
  passport.authenticate('jwt', { session: false }),
  commentController.deleteComment
);

module.exports = router;