const mongoose = require('mongoose');
// Validations

// Models
const Like = mongoose.model('like');
const Post = mongoose.model('story');

async function deleteLike(req, res) {
    try {
      const { postId } = req.params; // Assuming userId and postId are passed as route parameters
      const post = await Post.findById(postId);

      const userId = req.user?._id;
      // Find the likes by the user ID and post ID and remove them from the database
      await Like.deleteMany({ user_id: userId, post_id: postId });
      if (post.likesNo) {
        post.likesNo -= 1;
      } else {
        post.likesNo = 0;
      }
      await post.save();
  
      res.status(200).json({ message: 'Likes deleted successfully' });
    } catch (error) {
      console.error('Error deleting likes:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

module.exports = deleteLike;
