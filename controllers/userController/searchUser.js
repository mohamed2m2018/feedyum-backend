const mongoose = require("mongoose");

// Models
const User = mongoose.model("user");
const Follow = mongoose.model("follow");

var ObjectId = require("mongoose").Types.ObjectId;

const searchUser = (req, res) => {
  const {
    page = 1,
    limit = 10,
    searchString,
    currentUserId,
    ...rest
  } = req.query;
  const errors = {};
  if (rest.category && !ObjectId.isValid(rest.category)) {
    errors.error = "Category id is invalid";
    return res.status(500).json(errors);
  }
  User.find(
    searchString
    ? {
        $or: [
          { fullName: { $regex: searchString, $options: 'i' } }, // Case-insensitive regex match
         ],
        _id: { $ne: currentUserId },
        type: { $ne: "guest" },
        ...rest,
      }
    : {
        _id: { $ne: currentUserId },
        type
        : { $ne: "guest" },
        ...rest,
      }
  )
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ _id: -1 })
    .exec()
    .then(async (users) => {
      if (users.length === 0) {
        return res.json([]);
      }
      // get total documents in the stories collection
      const count = await User.countDocuments();

      const populatedUsers = await Promise.all(
        users.map(async (user) => {
          // Check if the current user has liked the story
          const currentUserFollowed = await Follow.exists({
            follower_id: currentUserId,
            following_id: user?._doc._id,
          });
          return {
            ...user?._doc,
            currentUserFollowed: Boolean(currentUserFollowed),
          };
        })
      );

      // return response with users, total pages, and current page
      res.json({
        users: populatedUsers,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
      });
    })
    .catch((err) => {
      errors.error = "Error fetching users from database";
      res.status(500).json({ ...errors, ...err });
    });
};

module.exports = searchUser;
