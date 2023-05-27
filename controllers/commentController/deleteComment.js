const mongoose = require('mongoose');
// Validations

// Models
const Comment = mongoose.model('comment');
const Post = mongoose.model('story');

async function deleteComment(req, res) {
  try {
    const {commentId, postId} = req.params; // Assuming commentId is passed as a route parameter
    const post = await Post.findById(postId);

    // Find the comment and remove it from the database
    await Comment.findByIdAndDelete(commentId);
    post.commentsNo -= 1;
    await post.save();
    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports =
  deleteComment
;