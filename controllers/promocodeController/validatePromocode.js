const PromoCode = require('../../models/promocode');

const validatePromocode = async (req, res) => {
  try {
    const { code, orderAmount, chefId } = req.body;

    if (!code || !orderAmount) {
      return res.status(400).json({
        success: false,
        message: 'Promocode and order amount are required',
        messageAr: 'كود الخصم وقيمة الطلب مطلوبان'
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
        message: 'Invalid promocode',
        messageAr: 'كود الخصم غير صحيح'
      });
    }

    // Check if promocode is expired
    if (new Date() > promocode.validUntil) {
      return res.status(400).json({
        success: false,
        message: 'Promocode has expired',
        messageAr: 'كود الخصم منتهي الصلاحية'
      });
    }

    // Check if promocode is not yet valid
    if (new Date() < promocode.validFrom) {
      return res.status(400).json({
        success: false,
        message: 'Promocode is not yet valid',
        messageAr: 'كود الخصم غير صالح للاستخدام بعد'
      });
    }

    // Check usage limit
    if (promocode.usageLimit && promocode.usedCount >= promocode.usageLimit) {
      return res.status(400).json({
        success: false,
        message: 'Promocode usage limit exceeded',
        messageAr: 'تم تجاوز الحد الأقصى لاستخدام كود الخصم'
      });
    }

    // Check minimum order amount
    if (orderAmount < promocode.minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount of ${promocode.minOrderAmount} EGP required`,
        messageAr: `الحد الأدنى للطلب لاستخدام هذا الكود هو ${promocode.minOrderAmount} جنيه`
      });
    }

    // Check if promocode is applicable to the chef
    if (promocode.applicableToChefs.length > 0 && chefId) {
      if (!promocode.applicableToChefs.includes(chefId)) {
        return res.status(400).json({
          success: false,
          message: 'Promocode not applicable to this chef',
          messageAr: 'كود الخصم غير متاح لهذا المطعم'
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
      message: `Promocode applied! You saved ${discountAmount.toFixed(2)} EGP`,
      messageAr: `تم تطبيق كود الخصم بنجاح! لقد وفرت ${discountAmount.toFixed(2)} جنيه`
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