const mongoose = require('mongoose');

const Comment = mongoose.model('comment');
const Reply = mongoose.model('reply');

const deleteReply = async (req, res) => {
  try {
    const { commentId, replyId } = req.body; // Assuming commentId and replyId are passed as URL parameters
    // Find the comment by its ID
    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    // Find the reply by its ID within the comment's replies array
    const reply = comment.replies.find((r) => r._id.toString() === replyId);

    if (!reply) {
      return res.status(404).json({ success: false, message: 'Reply not found' });
    }

    // Remove the reply from the comment's replies array
    comment.replies = comment.replies.filter((r) => r._id.toString() !== replyId);

    // Save the updated comment
    await comment.save();

    // Delete the reply from the database
    await Reply.findByIdAndDelete(replyId);

    return res.status(200).json({ success: true, message: 'Reply deleted' });
  } catch (error) {
    console.error('Failed to delete reply:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete reply' });
  }
};

module.exports = deleteReply;
