const PromoCode = require('../../models/promocode');

const deletePromocode = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Find the promocode and check if it belongs to the current user
    const promocode = await PromoCode.findOne({ 
      _id: id, 
      createdBy: userId 
    });

    if (!promocode) {
      return res.status(404).json({
        success: false,
        message: 'Promocode not found or you do not have permission to delete it'
      });
    }

    // Check if promocode has been used
    if (promocode.usedCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete promocode that has already been used'
      });
    }

    // Delete the promocode
    await PromoCode.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Promocode deleted successfully'
    });

  } catch (error) {
    console.error('Delete promocode error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete promocode',
      error: error.message
    });
  }
};

module.exports = deletePromocode;