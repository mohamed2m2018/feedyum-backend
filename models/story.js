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
  musicName: {
    type: "Date"
  },
  likes: {
    type: "Number"
  },
  comments: {
    type: "String"
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
    type: "Number"
  },
  phone: {
  type: "String",
  },
  linkToGo: {
    type: "String",
  }
});


// StorySchema.index({ title: "text", description: "text" });

module.exports = Story = mongoose.model("story", StorySchema);
