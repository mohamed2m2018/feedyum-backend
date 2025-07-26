const mongoose = require("mongoose");

// Models
const User = mongoose.model("user");

const setHasMenu = (req, res) => {
  const userId = req.user._id.toString();
  const errors = {};

  User.findById(userId)
    .then((user) => {
      if (!user) {
        errors.error = "User not found";
        return res.status(404).json(errors);
      }

      // Set hasMenu to true
      user.hasMenu = true;

      // Save the updated user
      user
        .save()
        .then((updatedUser) => {
          res.json({
            success: true,
            hasMenu: updatedUser.hasMenu
          });
        })
        .catch((err) => {
          errors.error = "Error saving user to the database";
          return res.status(500).json({ ...errors, ...err });
        });
    })
    .catch((err) => {
      errors.error = "Error finding user in the database";
      return res.status(500).json({ ...errors, ...err });
    });
};

module.exports = setHasMenu; 