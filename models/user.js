const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// Create User model
const UserSchema = new Schema({
  username: String,
  email: String,
  password: String,
  type: String,
  locations: [new mongoose.Schema({
    description: String,
    lat: Number,
    long: Number,
  })],
  avatar: String,
  fullName: String,
  phone: String,
  discount: {
     maxAmount: Number,
     percentageAmount: Number
  },
  gender: String,
  date: {
    type: Date,
    default: Date.now,
  },
  pushNotificationToken: String,
  wallet: Number,
  profileCompleted: Boolean,
  currentUserFollowed: Boolean,
  postsNo: Number,
  likesNo: Number,
  isGoogleUser: Boolean,
  bio: String,
});

const User = mongoose.model('user', UserSchema);

module.exports = User;