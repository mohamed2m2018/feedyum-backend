const mongoose = require("mongoose");

// Models
const Story = mongoose.model("user");
var ObjectId = require("mongoose").Types.ObjectId;

module.exports = searchUser = (req, res) => {
  const { page = 1, limit = 10, searchString, ...rest } = req.query;
  const string = new RegExp(searchString, 'i')
  const errors = {};
  if (rest.category && !ObjectId.isValid(rest.category)) {
    errors.error = "Category id is invalid";
    return res.status(500).json(errors);
  }
  User.find(
    searchString
      ? {
          $or: [{fullName: string },{username: string}],
          ...rest,
        }
      : {
          ...rest,
        }
  )
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ _id: -1 })
    .exec()
    .then(async (users) => {
      if (users.length === 0) {
        errors.nousers = "No users found";
        return res.status(404).json(errors);
      }
      // get total documents in the stories collection
      const count = await User.countDocuments();

      // return response with stories, total pages, and current page
      res.json({
        users,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
      });
    })
    .catch((err) => {
      errors.error = "Error fetching users from database";
      res.status(500).json({ ...errors, ...err });
    });
};
