const mongoose = require('mongoose');
const Comment = mongoose.model('comment');

module.exports = getCommentsByPostId = async (req, res) => {
  const { page = 1, limit = 10, post_id } = req.query;
  const errors = {};

  try {
    const comments = await Comment.find({ post_id: post_id })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('user_id')
      .sort({ created_at: -1 })
      .exec();

    if (comments.length === 0) {
      errors.nocomments = 'No comments found for the post';
      return res.status(404).json(errors);
    }

    // Get total documents in the comments collection for the post
    const count = await Comment.countDocuments({ post: post_id });

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