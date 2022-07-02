const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// Create User model
const UserSchema = new Schema({
  username: String,
  email: String,
  password: String,
  first_name: String,
  last_name: String,
  type: String,
  location: String,
  avatar: String,
  phone: String,
  date: {
    type: Date,
    default: Date.now
  },
  pushNotificationToken: String,
});

module.exports = User = mongoose.model('user', UserSchema);
