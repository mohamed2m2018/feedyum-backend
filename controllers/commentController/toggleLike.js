const mongoose = require('mongoose');
const Comment = mongoose.model('comment');

const toggleLikeComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.user._id;

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ success: false, message: 'Comment not found' });
        }

        // Check if user already liked
        const isLiked = comment.likes.includes(userId);

        if (isLiked) {
            // Unlike
            comment.likes = comment.likes.filter(id => id.toString() !== userId.toString());
            comment.likesNo = Math.max(0, (comment.likesNo || 1) - 1);
        } else {
            // Like
            comment.likes.push(userId);
            comment.likesNo = (comment.likesNo || 0) + 1;
        }

        await comment.save();

        return res.status(200).json({
            success: true,
            isLiked: !isLiked,
            likesCount: comment.likesNo,
            message: isLiked ? 'Unliked' : 'Liked'
        });
    } catch (error) {
        console.error('Toggle like comment error:', error);
        return res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = toggleLikeComment;
