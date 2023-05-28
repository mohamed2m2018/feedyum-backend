const mongoose = require("mongoose");

// Models
const User = mongoose.model("user");

// Validations
const validateUser = require("../../validations/EditUser");

const updateUser = (req, res) => {
  // Validate
  const { errors, isValid } = validateUser(req.body);
  if (!isValid) {
    return res.status(400).json(errors);
  }

  const updatedFields = {
    fullName: req.body.fullName,
    phone: req.body.phone,
    userName: req.body.userName,
    gender: req.body.gender,
    email: req.body.email,
    password: req.body.password,
    type: req.body.type,
    avatar: req.body.avatar,
  };


  User.findByIdAndUpdate(
    req.user._id.toString(),
    { $set: updatedFields },
    { new: true }
  )
    .then((user) => {
      if (!user) {
        errors.error = "User not found";
        return res.status(404).json(errors);
      }

      res.json({
        user,
        success: true,
      });
    })
    .catch((err) => {
      errors.error = "Error checking for the user in the database";
      res.status(500).json({ ...errors, ...err });
    });
};

module.exports = updateUser;