const mongoose = require("mongoose");

// Models
const User = mongoose.model("user");

// Validations
const validateEditUser = require("../../validations/EditUser");

const updateUser = (req, res) => {
  // Validate
  const { errors, isValid } = validateEditUser(req.body);
  if (!isValid) {
    return res.status(400).json(errors);
  }

  // Extract the location data from the request body
  const locationData = req.body.locations;

  User.findById(req.user._id.toString())
    .then((user) => {
      if (!user) {
        errors.error = "User not found";
        return res.status(404).json(errors);
      }
      

      user.locations = locationData;


      

      // Update other user fields as needed
      if(req.body.fullName){
        user.fullName = req.body.fullName;
      }
      if(req.body.phone){
        user.phone = req.body.phone;
      }
      if(req.body.userName){
        user.userName = req.body.userName;
      }
      if(req.body.email){
        user.email = req.body.email;
      }
      if(req.body.gender){
        user.gender = req.body.gender;
      }
      if(req.body.avatar){
        user.avatar = req.body.avatar;
      }
      if(req.body.type){
        user.type = req.body.type;
      }
      if(req.body.bio){
        user.bio = req.body.bio;
      }


      // Save the updated user document
      user
        .save()
        .then((updatedUser) => {
          res.json({
            user: updatedUser,
            success: true,
          });
        })
        .catch((err) => {
          errors.error = "Error saving user to the database";
          return res.status(500).json({ ...errors, ...err });
        });
    })
    .catch((err) => {
      console.log('err ', err)
      errors.error = "Error checking for the user in the database";
      return res.status(500).json({ ...errors, ...err });
    });
};

module.exports = updateUser;
