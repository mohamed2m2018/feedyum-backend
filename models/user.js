const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// Create User model
const UserSchema = new Schema({
  first_name: {
    type: String,
    required: false
  },
  last_name: String,
  email: String,
  password: String,
  location: String,
  avatar: String,
  date: {
    type: Date,
    default: Date.now
  },
  pushNotificationToken: String,
});

module.exports = User = mongoose.model('user', UserSchema);
