const mongoose = require("mongoose");
const sendNotification = require("../notificationController/sendNotification");

// Models
const Post = mongoose.model("story");
const Comment = mongoose.model("comment");
const Reply = mongoose.model("reply");
const User = mongoose.model("user");
const Like = mongoose.model("like");

const addLike = async function addLike(req, res) {
  try {
    const { postId, commentId, replyId } = req.params;
    const userId = req.user?._id;

    // Check if the user exists
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let entity;
    let entityType;

    if (postId) {
      // Add like to a post
      entity = await Post.findById(postId);
      entityType = "post";
    } else if (commentId) {
      // Add like to a comment
      entity = await Comment.findById(commentId);
      entityType = "comment";
    } else {
      // Add like to a reply
      entity = await Reply.findById(replyId);
      entityType = "reply";
    }

    if (!entity) {
      return res.status(404).json({ message: `${entityType} not found` });
    }

    // Check if the like already exists for the given entity and user
    const existingLike = await Like.findOne({
      [`${entityType}_id`]: entity._id,
      user_id: userId,
    });

    if (existingLike) {
      return res.status(400).json({ message: "Like already exists" });
    }

    // Create a new like
    const like = new Like({
      [`${entityType}_id`]: entity._id,
      user_id: userId,
    });

    // Save the like to the database
    await like.save();

    // Update the number of likes for the entity
    entity.likesNo = (Number(entity.likesNo) || 0) + 1;

    sendNotification(entity.author._id, entity.title + "got a like", entity).then(message=>console.log('message', message)).catch(err=> console.log('err', err))

    await entity.save();

    res.status(201).json({ message: "Like added successfully" });
  } catch (error) {
    console.error("Error adding like:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = addLike;
