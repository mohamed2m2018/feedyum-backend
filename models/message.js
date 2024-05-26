const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
  content: String,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('message', messageSchema);
