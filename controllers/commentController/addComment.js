const mongoose = require('mongoose');
const sendNotification = require('../notificationController/sendNotification');
// Validations

// Models
const Post = mongoose.model('story');

const User = mongoose.model('user');

const Comment = mongoose.model('comment');


module.exports = async function addComment(req, res) {
  try {
    const { postId, content } = req.body; // Assuming the postId, userId, and content are passed in the request body
    const userId = req?.user?._id;
    // Check if the post and user exist
    const post = await Post.findById(postId);
    const user = await User.findById(userId);

    if (!post || !user) {
      return res.status(404).json({ message: 'Post or user not found' });
    }

    // Create a new comment
    const comment = new Comment({
      post_id: postId,
      user_id: userId,
      content
    });

    if (post.commentsNo) {
      post.commentsNo += 1;
      sendNotification(post.author._id, post.title + " got a comment", post);
    } else {
      sendNotification(post.author._id, post.title + " got a comment", post);
      post.commentsNo = 1;
    }

    await post.save();

    // Save the comment to the database
    await comment.save();

    // Invalidate cache
    const cacheManager = require('../../utils/cacheManager');
    // Invalidate comments count
    await cacheManager.del(`api:/comment/count?post_id=${postId}`);
    // Invalidate comments list (matching api:/comment? post_id=...)
    // The key pattern is typically api:{originalUrl}. URL contains /comment? and post_id inside query.
    // So we match api:/comment*post_id=${postId}*
    await cacheManager.delPattern(`api:/comment*post_id=${postId}*`);

    res.status(201).json({ message: 'Comment added successfully' });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
