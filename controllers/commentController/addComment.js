const mongoose = require('mongoose');
// Validations

// Models
const Post = mongoose.model('story');

const User = mongoose.model('user');

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

      post.commentsNo += 1;
      await post.save();
  
      // Save the comment to the database
      await comment.save();
  
      res.status(201).json({ message: 'Comment added successfully' });
    } catch (error) {
      console.error('Error adding comment:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
  