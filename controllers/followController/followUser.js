const mongoose = require('mongoose');

// Models
const Follow = mongoose.model('follow');

async function followUser(req, res) {
  try {
    const { userToFollow } = req.body;
    
    // Check if userToFollow is provided and has a valid _id
    if (!userToFollow || !userToFollow._id) {
      return res.status(400).json({ message: 'Invalid userToFollow data' });
    }

    const existingFollow = await Follow.findOne({
      follower_id: req.user._id,
      following_id: userToFollow._id
    });

    if (existingFollow) {
      return res.status(400).json({ message: 'User is already followed' });
    }

    // Create a new follow document
    const follow = new Follow({
      follower_id: req.user._id,
      following_id: userToFollow._id
    });

    // Save the follow document to the database
    await follow.save();

   return res.status(201).json({ message: 'User followed successfully' });
  } catch (error) {
    console.error('Error following user:', error);
   return res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = followUser;
