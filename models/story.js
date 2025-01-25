const mongoose = require("mongoose");

const Schema = mongoose.Schema;

// Story schema
const StorySchema = new Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true, index: true },
  category: { type: [mongoose.Schema.Types.ObjectId], ref: "category", required: true, index: true },
  uri: {
    type: "String",
  },
  caption: {
    type: "String"
  },
  likes: {
    type: "Number"
  },
  bookmark: {
    type: "String"
  },
  share: {
    type: "String"
  },
  avatarUri: {
    type: "String"
  },
  poster: {
    type: "String"
  },
  views: {
    type: "Number"
  },
  title: {
    type: "String"
  },
  price: {
    type: "String",
  },
  phone: {
    type: "String",
  },
  linkToGo: {
    type: "String",
  },
  likesNo: {
    type: Number,
    default: 0,
  },
  commentsNo: {
    type: Number
  },
  governorate: {
    type: "String"
  },
  areas: {
    type: [String]
  },
  duration: String,
  created_at: {
    type: Date,
    default: Date.now,
    index: true,
  },
  reviewMode: Boolean,
  allowContact: Boolean,
  dishes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "dish", // Reference to the Dish model
    },
  ],
});

const Story = mongoose.model("story", StorySchema);
module.exports = Story;
