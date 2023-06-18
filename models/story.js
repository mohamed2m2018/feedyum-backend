const mongoose = require("mongoose");

const Schema = mongoose.Schema;

// story schema


const StorySchema = new Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: "category", required: true },
  uri: {
    type: "String",
    required: true
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
  category: {
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
    type: "Number",
    required: true,
  },
  phone: {
  type: "String",
  },
  linkToGo: {
    type: "String",
  },
  likesNo: {
    type: Number, // Ensure likesNo is of number type
    default: 0, // Set a default value if needed
  },
  commentsNo: {
    type: Number
  }
});


// StorySchema.index({ title: "text", description: "text" });

module.exports = Story = mongoose.model("story", StorySchema);
