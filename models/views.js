// models/View.js

const mongoose = require('mongoose');

const viewSchema = new mongoose.Schema({
  story: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'story',
    required: true,
  },
  count: {
    type: Number,
    default: 0,
  },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },

});

const View = mongoose.model('view', viewSchema);

module.exports = View;
