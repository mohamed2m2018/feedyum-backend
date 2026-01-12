const mongoose = require('mongoose');
const sendNotification = require('../notificationController/sendNotification');

const Comment = mongoose.model('comment');
const Reply = mongoose.model('reply');
const User = mongoose.model('user');

const addReplyToComment = async (req, res) => {
  try {
    const { postId, content, commentId } = req.body; // Assuming the postId, userId, and content are passed in the request body
    const senderId = req.user._id;

    // Find the comment by its ID
    const comment = await Comment.findById(commentId).populate('user_id', 'fullName username');

    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    // Create a new reply using the reply data
    const reply = new Reply({
      user_id: senderId,
      post_id: postId,
      content,
    });

    // Save the reply to the database
    const savedReply = await reply.save();

    // Add the reply to the comment's replies array
    comment.replies.push(savedReply);

    // Save the updated comment
    await comment.save();

    // Send notification to the comment owner if they are not the one replying
    if (comment.user_id && comment.user_id._id.toString() !== senderId.toString()) {
      const sender = await User.findById(senderId).select('fullName username');
      const senderName = sender ? (sender.fullName || sender.username) : 'Someone';
      const notificationMessage = `${senderName} replied to your comment: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`;

      // Using the structure expected by the app for deep linking if possible, 
      // otherwise falling back to basic data
      // For basic sendNotification, we just pass the object
      await sendNotification(
        comment.user_id._id.toString(),
        notificationMessage,
        {
          type: 'reply',
          postId: postId,
          commentId: commentId,
          replyId: savedReply._id.toString(), // Ensure ID is string
          openComment: true
        }
      );
    }

    return res.status(200).json({ success: true, message: 'Reply added to the comment' });
  } catch (error) {
    console.error('Failed to add reply to the comment:', error);
    return res.status(500).json({ success: false, message: 'Failed to add reply to the comment' });
  }
};

module.exports = addReplyToComment;
