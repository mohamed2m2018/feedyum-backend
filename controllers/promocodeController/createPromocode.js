const PromoCode = require('../../models/promocode');

const createPromocode = async (req, res) => {
  try {
    const {
      code,
      discountType,
      discountValue,
      maxDiscount,
      minOrderAmount,
      usageLimit,
      validFrom,
      validUntil,
      applicableToChefs
    } = req.body;

    // Validate required fields
    if (!code || !discountType || !discountValue || !validUntil) {
      return res.status(400).json({
        success: false,
        message: 'Code, discount type, discount value, and valid until date are required'
      });
    }

    // Validate discount type
    if (!['percentage', 'fixed'].includes(discountType)) {
      return res.status(400).json({
        success: false,
        message: 'Discount type must be either "percentage" or "fixed"'
      });
    }

    // Validate discount value
    if (discountValue <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Discount value must be greater than 0'
      });
    }

    if (discountType === 'percentage' && discountValue > 100) {
      return res.status(400).json({
        success: false,
        message: 'Percentage discount cannot exceed 100%'
      });
    }

    // Check if promocode already exists
    const existingPromocode = await PromoCode.findOne({ 
      code: code.toUpperCase() 
    });

    if (existingPromocode) {
      return res.status(400).json({
        success: false,
        message: 'Promocode already exists'
      });
    }

    // Create new promocode
    const promocode = new PromoCode({
      code: code.toUpperCase(),
      discountType,
      discountValue,
      maxDiscount: discountType === 'percentage' ? maxDiscount : null,
      minOrderAmount: minOrderAmount || 0,
      usageLimit: usageLimit || null,
      validFrom: validFrom ? new Date(validFrom) : new Date(),
      validUntil: new Date(validUntil),
      applicableToChefs: applicableToChefs || [],
      createdBy: req.user._id
    });

    await promocode.save();

    res.status(201).json({
      success: true,
      promocode,
      message: 'Promocode created successfully'
    });

  } catch (error) {
    console.error('Create promocode error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create promocode',
      error: error.message
    });
  }
};

module.exports = createPromocode;