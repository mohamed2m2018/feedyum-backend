const mongoose = require('mongoose');

const reportedPostSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },  
  uri: {
    type: "String",
    required: true
  },
  caption: {
    type: "String"
  },
  title: {
    type: "String"
  },
  price: {
    type: "Number",
    required: true,
  },
  phone: {
  type: "String",
  },
  linkToGo: {
    type: "String",
  },
  originalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'story',
    required: true
  },
  reportReason: {
    type: String,
    required: true
  },
  reportedAt: {
    type: Date,
    default: Date.now
  }
});

const ReportedPost = mongoose.model('ReportedPost', reportedPostSchema);

module.exports = ReportedPost;