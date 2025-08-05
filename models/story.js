const mongoose = require("mongoose");

const Schema = mongoose.Schema;

// Story schema
const StorySchema = new Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
    index: true,
  },
  category: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "category",
    required: true,
    index: true,
  },
  uri: {
    type: "String",
  },
  avatarUri: {
    type: "String",
  },
  caption: {
    type: "String",
  },
  likes: {
    type: "Number",
  },
  bookmark: {
    type: "String",
  },
  share: {
    type: "String",
  },
  poster: {
    type: "String",
    // Food/dish image URL for the story poster
  },
  views: {
    type: "Number",
  },
  title: {
    type: "String",
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
    type: Number,
  },
  governorate: {
    type: "String",
  },
  areas: {
    type: [String],
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
  // Review-specific fields
  reviewType: {
    type: String,
    enum: ['dish', 'menu'],
    required: function() { return this.reviewMode; }
  },
  reviewedDish: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "dish",
    required: function() { return this.reviewMode && this.reviewType === 'dish'; }
  },
  reviewedMenu: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "menu",
    required: function() { return this.reviewMode && this.reviewType === 'menu'; }
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: function() { return this.reviewMode; }
  },
  
  // Semantic search embedding - excluded by default for performance
  embedding: { type: [Number], default: null, select: false },
  embeddingGenerated: { type: Date, default: null, select: false },
});

// Performance optimization indexes for semantic search
StorySchema.index({ embedding: 1 }); // Index for semantic search
StorySchema.index({ reviewMode: 1, embedding: 1 }); // Compound index for review filtering with semantic search

const Story = mongoose.model("story", StorySchema);
module.exports = Story;
