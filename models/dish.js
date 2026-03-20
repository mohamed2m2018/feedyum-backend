const mongoose = require("mongoose");

const DishSchema = new mongoose.Schema({
  id: { type: Number, required: true }, // Adding an explicit ID field
  name: { type: String, required: true },
  // Bilingual name fields for i18n
  nameArabic: { type: String },
  nameEnglish: { type: String },
  originalNameLanguage: { type: String, enum: ['ar', 'en'], default: 'en' },

  description: { type: String },
  // Bilingual description fields for i18n
  descriptionArabic: { type: String },
  descriptionEnglish: { type: String },
  originalDescriptionLanguage: { type: String, enum: ['ar', 'en'], default: 'en' },
  // Legacy single category field (kept for backward compatibility with existing queries/UI)
  category: { type: String, required: true }, // Category field for dish type
  // New multi-category support
  categories: [{ type: String }],
  section: { type: mongoose.Schema.Types.ObjectId, ref: "section" }, // Reference to section
  price: { type: Number, required: true },
  menu: { type: mongoose.Schema.Types.ObjectId, ref: "menu", required: true }, // Reference to menu
  menu_id: { type: Number, required: true }, // Numeric ID for the menu
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true }, // User identifier
  visible: { type: Boolean, default: true }, // Visibility field
  pricingType: { type: String, enum: ['fixed', 'upon_request'], default: 'fixed' }, // 'upon_request' for items like catering trays with no fixed price
  average_rating: { type: Number, default: 0, min: 0, max: 5 }, // Average rating for the dish (0 = no rating, 1-5 = rated)
  image: { type: String }, // URL for the dish image

  // Enhanced fields for dish detail screen
  ingredients: [{ type: String }], // List of ingredients
  tags: [{ type: String }], // Tags for the dish (e.g., "spicy", "vegetarian")
  preparationTime: { type: Number }, // Preparation time in minutes

  // Nutritional information
  nutritionalInfo: {
    calories: { type: Number },
    protein: { type: String }, // e.g., "25g"
    carbs: { type: String }, // e.g., "30g"
    fat: { type: String }, // e.g., "15g"
    fiber: { type: String }, // e.g., "5g"
    sodium: { type: String }, // e.g., "500mg"
    sugar: { type: String }, // e.g., "10g"
  },

  // Dietary information
  dietaryInfo: [{ type: String }], // e.g., ["Vegetarian", "Gluten-Free", "Dairy-Free"]

  // Additional nutritional fields (for backward compatibility)
  calories: { type: Number },
  protein: { type: String },
  carbs: { type: String },
  fat: { type: String },
  fiber: { type: String },

  // Semantic search embedding - excluded by default for performance
  embedding: { type: [Number], default: null, select: false },
  embeddingGenerated: { type: Date, default: null, select: false },

  // Option groups for variants and add-ons (Talabat-style)
  optionGroups: [{
    name: { type: String, required: true },           // "Size", "Extras", "Choose Sauce"
    nameArabic: { type: String },                      // Arabic translation
    nameEnglish: { type: String },                     // English translation
    type: { type: String, enum: ['single', 'multiple'], required: true },
    required: { type: Boolean, default: false },
    min: { type: Number, default: 0 },                 // min selections (for multiple)
    max: { type: Number, default: 0 },                 // max selections (0 = unlimited)
    options: [{
      name: { type: String, required: true },           // "Small", "Extra Cheese"
      nameArabic: { type: String },
      nameEnglish: { type: String },
      priceAdjustment: { type: Number, default: 0 },    // +10, +15, etc. (0 = no extra cost)
      isDefault: { type: Boolean, default: false },     // pre-selected option
    }]
  }],

  created_at: {
    type: Date,
    default: Date.now,
  },
});

// Add index for category search performance (add this near the schema definition)
// Performance optimization indexes:
DishSchema.index({ category: 1, visible: 1, created_at: -1 }); // Compound index for discover queries
DishSchema.index({ categories: 1, visible: 1, created_at: -1 }); // Support multi-categories queries
DishSchema.index({ user_id: 1, visible: 1 }); // Index for chef dishes queries
DishSchema.index({ embedding: 1 }); // Index for semantic search
DishSchema.index({ visible: 1, embedding: 1 }); // Compound index for semantic search with visibility

const Dish = mongoose.model("dish", DishSchema);
module.exports = Dish;
