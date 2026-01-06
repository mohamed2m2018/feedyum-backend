const mongoose = require('mongoose');
const Reply = mongoose.model('reply');
const Comment = mongoose.model('comment'); // Assuming 'comment' is the model name for comments

const toggleLikeReply = async (req, res) => {
  try {
    const { replyId } = req.params;
    const userId = req.user._id;

    // Find the Comment that contains this Reply
    const comment = await Comment.findOne({ 'replies._id': replyId });

    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment or Reply not found' });
    }

    // Find the subdocument
    const reply = comment.replies.id(replyId);

    if (!reply) {
      return res.status(404).json({ success: false, message: 'Reply subdocument not found' });
    }

    // Check if user already liked
    const isLiked = reply.likes.includes(userId);
    console.log(`[DEBUG] Current userId: ${userId}, Reply Likes: ${reply.likes}, IsLiked: ${isLiked}`);

    if (isLiked) {
      // Unlike
      reply.likes = reply.likes.filter(id => id.toString() !== userId.toString());
      reply.likesNo = Math.max(0, (reply.likesNo || 1) - 1);
      console.log('[DEBUG] Action: Unliked');
    } else {
      // Like
      reply.likes.push(userId);
      reply.likesNo = (reply.likesNo || 0) + 1;
      console.log('[DEBUG] Action: Liked');
    }

    // Save the PARENT document (Comment)
    comment.markModified('replies');
    await comment.save();
    console.log('[DEBUG] Saved parent comment (marked modified).');

    return res.status(200).json({
      success: true,
      isLiked: !isLiked,
      likesCount: reply.likesNo,
      message: isLiked ? 'Unliked' : 'Liked'
    });
  } catch (error) {
    console.error('Toggle like reply error:', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = toggleLikeReply;
