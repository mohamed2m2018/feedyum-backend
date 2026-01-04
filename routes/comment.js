const express = require("express");
const passport = require("passport");

const router = express.Router();

const commentController = require("../controllers/commentController");

router.get("/", commentController.getCommentByPostId);

router.get("/count", commentController.getCommentsCountByPostId);


// @route  POST api/story/:postId/comment
// @desc   Add a comment to a story
// @access Private
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  commentController.addComment
);

router.post(
  "/reply",
  passport.authenticate("jwt", { session: false }),
  commentController.addReplyToComment
);


router.post(
  "/reply/delete",
  passport.authenticate("jwt", { session: false }),
  commentController.deleteReply
);


// @route  DELETE api/story/:postId/comment/:commentId
// @desc   Delete a comment
// @access Private
router.delete(
  "/:postId/:commentId",
  passport.authenticate("jwt", { session: false }),
  commentController.deleteComment
);

// @route  POST api/story/comment/like/:commentId
// @desc   Like/Unlike a comment
// @access Private
router.post(
  "/like/:commentId",
  passport.authenticate("jwt", { session: false }),
  commentController.toggleLikeComment
);

// @route  POST api/story/comment/reply/like/:replyId
// @desc   Like/Unlike a reply
// @access Private
router.post(
  "/reply/like/:replyId",
  passport.authenticate("jwt", { session: false }),
  commentController.toggleLikeReply
);

module.exports = router;
