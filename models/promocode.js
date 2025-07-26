const mongoose = require("mongoose");

const PromoCodeSchema = new mongoose.Schema({
  code: { 
    type: String, 
    required: true, 
    unique: true,
    uppercase: true,
    trim: true
  },
  discountType: { 
    type: String, 
    enum: ['percentage', 'fixed'], 
    required: true 
  },
  discountValue: { 
    type: Number, 
    required: true,
    min: 0
  },
  maxDiscount: { 
    type: Number, 
    default: null // Only for percentage discounts
  },
  minOrderAmount: { 
    type: Number, 
    default: 0 
  },
  usageLimit: { 
    type: Number, 
    default: null // null means unlimited
  },
  usedCount: { 
    type: Number, 
    default: 0 
  },
  validFrom: { 
    type: Date, 
    default: Date.now 
  },
  validUntil: { 
    type: Date, 
    required: true 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  applicableToChefs: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "user" 
  }], // Empty array means applicable to all chefs
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "user" 
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

const PromoCode = mongoose.model("promocode", PromoCodeSchema);

module.exports = PromoCode;