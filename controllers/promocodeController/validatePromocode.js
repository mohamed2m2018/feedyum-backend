const PromoCode = require('../../models/promocode');

const validatePromocode = async (req, res) => {
  try {
    const { code, orderAmount, chefId } = req.body;

    if (!code || !orderAmount) {
      return res.status(400).json({
        success: false,
        message: 'Promocode and order amount are required'
      });
    }

    // Find the promocode
    const promocode = await PromoCode.findOne({ 
      code: code.toUpperCase(),
      isActive: true
    });

    if (!promocode) {
      return res.status(404).json({
        success: false,
        message: 'Invalid promocode'
      });
    }

    // Check if promocode is expired
    if (new Date() > promocode.validUntil) {
      return res.status(400).json({
        success: false,
        message: 'Promocode has expired'
      });
    }

    // Check if promocode is not yet valid
    if (new Date() < promocode.validFrom) {
      return res.status(400).json({
        success: false,
        message: 'Promocode is not yet valid'
      });
    }

    // Check usage limit
    if (promocode.usageLimit && promocode.usedCount >= promocode.usageLimit) {
      return res.status(400).json({
        success: false,
        message: 'Promocode usage limit exceeded'
      });
    }

    // Check minimum order amount
    if (orderAmount < promocode.minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount of £${promocode.minOrderAmount} required`
      });
    }

    // Check if promocode is applicable to the chef
    if (promocode.applicableToChefs.length > 0 && chefId) {
      if (!promocode.applicableToChefs.includes(chefId)) {
        return res.status(400).json({
          success: false,
          message: 'Promocode not applicable to this chef'
        });
      }
    }

    // Calculate discount
    let discountAmount = 0;
    if (promocode.discountType === 'percentage') {
      discountAmount = (orderAmount * promocode.discountValue) / 100;
      if (promocode.maxDiscount && discountAmount > promocode.maxDiscount) {
        discountAmount = promocode.maxDiscount;
      }
    } else {
      discountAmount = promocode.discountValue;
    }

    // Ensure discount doesn't exceed order amount
    if (discountAmount > orderAmount) {
      discountAmount = orderAmount;
    }

    res.json({
      success: true,
      valid: true,
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      discountType: promocode.discountType,
      message: `Promocode applied! You saved £${discountAmount.toFixed(2)}`
    });

  } catch (error) {
    console.error('Validate promocode error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate promocode',
      error: error.message
    });
  }
};

module.exports = validatePromocode;