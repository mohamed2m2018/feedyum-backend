const mongoose = require('mongoose');

const Comment = mongoose.model('comment');
const Reply = mongoose.model('reply');

const addReplyToComment = async (req, res) => {
  try {
    const { postId, content, commentId } = req.body; // Assuming the postId, userId, and content are passed in the request body

    // Find the comment by its ID
    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    // Create a new reply using the reply data
    const reply = new Reply({
      user_id: req.user._id,
      post_id: postId,
      content,
    });

    // Save the reply to the database
    const savedReply = await reply.save();

    // Add the reply to the comment's replies array
    comment.replies.push(savedReply);

    // Save the updated comment
    await comment.save();

    return res.status(200).json({ success: true, message: 'Reply added to the comment' });
  } catch (error) {
    console.error('Failed to add reply to the comment:', error);
    return res.status(500).json({ success: false, message: 'Failed to add reply to the comment' });
  }
};

module.exports = addReplyToComment;
