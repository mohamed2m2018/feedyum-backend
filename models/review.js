const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "order",
    required: false, // Optional - not required for reel-based reviews
  },
  // Link to Story for reel-based reviews
  storyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "story",
    required: false,
  },
  chefId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  dishId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "dish",
    required: false, // Optional for chef-only reviews
  },
  type: {
    type: String,
    enum: ["dish", "chef", "order"],
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    maxlength: 500,
  },
  tags: [
    {
      type: String,
      enum: [
        "delicious",
        "fresh",
        "hot",
        "cold",
        "spicy",
        "sweet",
        "salty",
        "fast_delivery",
        "slow_delivery",
        "friendly",
        "professional",
        "clean",
        "presentation",
        "portion_size",
        "value_for_money",
        "authentic",
        "creative",
        "healthy",
        "unhealthy",
      ],
    },
  ],
  images: [
    {
      type: String, // URLs to review images
    },
  ],
  helpful: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  reported: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
      reason: String,
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  isVerified: {
    type: Boolean,
    default: true, // Reviews from actual orders are verified
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index to prevent duplicate reviews for the same order/dish/chef combination
reviewSchema.index(
  { userId: 1, orderId: 1, dishId: 1, type: 1 },
  { unique: true }
);

// Index for efficient queries
reviewSchema.index({ chefId: 1, rating: -1, createdAt: -1 });
reviewSchema.index({ dishId: 1, rating: -1, createdAt: -1 });
reviewSchema.index({ orderId: 1 });

const Review = mongoose.model("review", reviewSchema);

module.exports = Review;
