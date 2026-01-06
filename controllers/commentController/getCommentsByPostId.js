const mongoose = require('mongoose');
const Comment = mongoose.model('comment');

const getCommentsByPostId = async (req, res) => {
  const { page = 1, limit = 10, post_id } = req.query;
  const errors = {};

  try {
    const comments = await Comment.find({ post_id: post_id })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('user_id')
      .populate({
        path: 'replies',
        populate: { path: 'user_id' },
      })
      .sort({ created_at: -1 })
      .exec();

    // Get total documents in the comments collection for the post
    const count = await Comment.countDocuments({ post_id: post_id });

    // DEBUG: Log first comment's replies to see if likes are included
    if (comments.length > 0 && comments[0].replies && comments[0].replies.length > 0) {
      console.log('[DEBUG getComments] First reply:', JSON.stringify(comments[0].replies[0], null, 2));
    }

    // Return response with comments, total pages, and current page
    res.json({
      comments,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Error fetching comments from database:', error);
    errors.error = 'Error fetching comments from database';
    res.status(500).json({ ...errors, ...error });
  }
};
module.exports = getCommentsByPostId;