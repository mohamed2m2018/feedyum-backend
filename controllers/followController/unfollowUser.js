const mongoose = require("mongoose");

// Validations

// Models
const Follow = mongoose.model("follow");

async function unfollowUser(req, res) {
  try {
    const { userToUnfollow } = req.body; // userToUnfollow is passed in the request body

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
