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
    filters,
    ...rest
  } = req.query;

  // Parse filters if it's a string (e.g. from query params)
  let parsedFilters = {};
  if (typeof filters === 'string') {
    try {
      parsedFilters = JSON.parse(filters);
    } catch (e) {
      // If not JSON, clearly not what we expect
    }
  } else if (typeof filters === 'object') {
    parsedFilters = filters;
  }

  const string = new RegExp(searchString, "i");
  const errors = {};
  if (rest.category && !ObjectId.isValid(rest.category)) {
    errors.error = "Category id is invalid";
    return res.status(500).json(errors);
  }
  // Define query object
  const query = searchString
    ? {
      $or: [
        { fullName: string },
        { username: string }],
      _id: { $ne: currentUserId },
      type: { $ne: "guest" },
      ...rest,
      ...parsedFilters, // Merge explicit filters
    }
    : {
      _id: { $ne: currentUserId },
      type: { $ne: "guest" },
      ...rest,
      ...parsedFilters, // Merge explicit filters
    };

  User.find(query)
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ _id: -1 })
    .exec()
    .then(async (users) => {
      if (users.length === 0) {
        return res.json([]);
      }
      // get total documents in the stories collection
      const count = await User.countDocuments(query);

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
      return res.json({
        users: populatedUsers,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
      });
    })
    .catch((err) => {
      errors.error = "Error fetching users from database";
      return res.status(500).json({ ...errors, ...err });
    });
};

module.exports = searchUser;
