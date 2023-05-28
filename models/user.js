const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// Create User model
const UserSchema = new Schema({
  username: String,
  email: String,
  password: String,
  type: String,
  location: String,
  avatar: String,
  fullName:String,
  phone: String,
  gender: String,
  date: {
    type: Date,
    default: Date.now
  },
  pushNotificationToken: String,
  wallet: Number,
  profileCompleted: Boolean,
  currentUserFollowed: Boolean,
  postsNo: Number,
  likesNo: Number,
});

const User = mongoose.model('user', UserSchema);

module.exports = User;
