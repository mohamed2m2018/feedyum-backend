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
  date: {
    type: Date,
    default: Date.now
  },
  pushNotificationToken: String,
  wallet: Number,

});

module.exports = User = mongoose.model('user', UserSchema);
