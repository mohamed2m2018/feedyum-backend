const mongoose = require("mongoose");

// Models
const Address = mongoose.model("address");

const removeAddress = async (req, res) => {
  try {
    const { addressId } = req.body;
    
    if (!addressId) {
      return res.status(400).json({
        success: false,
        error: "Address ID is required"
      });
    }

    console.log('Backend: Attempting to delete address with ID:', addressId);
    
    // Use findByIdAndDelete instead of deprecated remove()
    const deletedAddress = await Address.findByIdAndDelete(addressId.toString());
    
    if (!deletedAddress) {
      console.log('Backend: Address not found with ID:', addressId);
      return res.status(404).json({
        success: false,
        error: "Address not found"
      });
    }

    console.log('Backend: Successfully deleted address:', deletedAddress._id);
    
    res.json({
      success: true,
      message: "Address deleted successfully",
      deletedAddress: deletedAddress
    });
    
  } catch (err) {
    console.error('Backend: Error deleting address:', err);
    res.status(500).json({
      success: false,
      error: "Error deleting address from database",
      details: err.message
    });
  }
};

module.exports = removeAddress;