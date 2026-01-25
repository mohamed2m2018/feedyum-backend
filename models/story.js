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
    required: function () { return this.reviewMode; }
  },
  reviewedDish: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "dish",
    required: function () { return this.reviewMode && this.reviewType === 'dish'; }
  },
  reviewedMenu: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "menu",
    required: function () { return this.reviewMode && this.reviewType === 'menu'; }
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: function () { return this.reviewMode; }
  },

  // New User Review Flow Fields
  isReview: { type: Boolean, default: false },
  reviewedChef: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
  googlePlaceId: String,
  restaurantName: String,
  restaurantAddress: String,
  dishName: String, // For manual dish entry (when not linked to a system dish)


  embedding: { type: [Number], default: null, select: false },
  embeddingGenerated: { type: Date, default: null, select: false },

  // Pre-computed engagement stats (updated by trackEngagement)
  avgCompletionRate: { type: Number, default: 0 },
  rewatchCount: { type: Number, default: 0 },
  shareCount: { type: Number, default: 0 },
});

// Performance optimization indexes

// Single field indexes (already have author, category, created_at)
StorySchema.index({ views: -1 }); // For popular content queries
StorySchema.index({ likesNo: -1 }); // For liked content

// Compound indexes for feed generation
StorySchema.index({ created_at: -1, category: 1 }); // Category-filtered feeds
StorySchema.index({ created_at: -1, author: 1 }); // Author content
StorySchema.index({ author: 1, created_at: -1 }); // Author's recent content

// Semantic search indexes
StorySchema.index({ embedding: 1 });
StorySchema.index({ reviewMode: 1, embedding: 1 });

const Story = mongoose.model("story", StorySchema);
module.exports = Story;

