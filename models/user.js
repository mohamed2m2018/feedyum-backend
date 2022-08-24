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
  wallet: Number,
  cart: [new Schema({
    story: { type: mongoose.Schema.Types.ObjectId, ref: 'story', required: true, unique: true,dropDups: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    quantity: String
})]
});

module.exports = User = mongoose.model('user', UserSchema);
