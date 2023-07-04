const mongoose = require('mongoose');
const Comment = mongoose.model('comment');

const getCommentsCountByPostId = async (req, res) => {
  const {post_id } = req.query;
  const errors = {};

  try {

    const count = await Comment.countDocuments({ post_id: post_id });

    // Return response with comments, total pages, and current page
    res.json({
     count
    });
  } catch (error) {
    console.error('Error fetching counts from database:', error);
    errors.error = 'Error fetching counts from database';
    res.status(500).json({ ...errors, ...error });
  }
};

module.exports = getCommentsCountByPostId;