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
    type: "String"
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
    type: "String"
  }
});

//commented becuase we don't use search now, instead we use regex

// StorySchema.index({ title: "text", description: "text" });

module.exports = Story = mongoose.model("story", StorySchema);
