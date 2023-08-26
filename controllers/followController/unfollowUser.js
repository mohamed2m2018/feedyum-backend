const mongoose = require("mongoose");

// Models
const Follow = mongoose.model("follow");

async function unfollowUser(req, res) {
  try {
    const { userToUnfollow } = req.body;

    // Check if userToUnfollow is provided and has a valid _id
    if (!userToUnfollow || !userToUnfollow._id) {
      return res.status(400).json({ message: "Invalid userToUnfollow data" });
    }
    const existingFollow = await Follow.findOne({
      follower_id: req.user._id,
      following_id: userToUnfollow._id,
    });

    if (!existingFollow) {
      return res.status(404).json({ message: "User is not being followed" });
    }

    // Delete the follow document matching the follower and following IDs
    await Follow.deleteMany({
      follower_id: req.user._id,
      following_id: userToUnfollow._id,
    });

    res.status(200).json({ message: "User unfollowed successfully" });
  } catch (error) {
    console.error("Error unfollowing user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = unfollowUser;
