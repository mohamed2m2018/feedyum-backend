const mongoose = require("mongoose");
const sendNotification = require("../notificationController/sendNotification");
// Validations

// Models
const Post = mongoose.model("story");

const User = mongoose.model("user");

const Like = mongoose.model("like");

const addLike = async function addLike(req, res) {
  try {
    const { postId } = req.params; // Assuming the postId and userId are passed in the request body
    const userId = req.user?._id;
    // Check if the post and user exist
    const post = await Post.findById(postId);
    const user = await User.findById(userId);

    if (!post || !user) {
      return res.status(404).json({ message: "Post or user not found" });
    }

    // Check if the like already exists for the given post and user
    const existingLike = await Like.findOne({
      post_id: postId,
      user_id: userId,
    });

    if (existingLike) {
      return res.status(400).json({ message: "Like already exists" });
    }

    // Create a new like
    const like = new Like({
      post_id: postId,
      user_id: userId,
    });

    // Save the like to the database
    await like.save();
    // Update the number of likes in the story
    if (post.likesNo) {
      post.likesNo += 1;
      sendNotification(post.author._id, "Your Post got a like");
    } else {
      sendNotification(post.author._id, "Your Post got a like");
      post.likesNo = 1;
    }
    await post.save();

    res.status(201).json({ message: "Like added successfully" });
  } catch (error) {
    console.error("Error adding like:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = addLike;
