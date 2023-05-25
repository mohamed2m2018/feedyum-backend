const mongoose = require('mongoose');

// Models
const User = mongoose.model('user');

// Validations
const validateUser = require('../../validations/EditUser');

module.exports = updateUser = (req, res) => {
  // Validate
  const { errors, isValid } = validateUser(req.body);
  if (!isValid) {
    return res.status(400).json(errors);
  }
  const newUserInfo = {
    ...req?.body,
    ...req.body?.username && {
      profileCompleted: true,
    }
  };

  User.findOne({username: req.body.userName}).then((user=>{
    if (user) {
      errors.userName = 'username already exists';
      return res.status(400).json(errors);
    } else {
      User.findByIdAndUpdate(
        { _id: req.user._id.toString() },
        { $set: newUserInfo },
        { new: true }
      )
        .then((user) =>{
          res.json({
            user,
            success: true
          })
        }
       
        )
        .catch((err) => {
          console.log('ee ',err)
          errors.error = 'Error checking for the user in the database';
          res.status(500).json({ ...errors, ...err });
        });
    }
  }))


};
