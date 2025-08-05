const mongoose = require("mongoose");

// Models
const Address = mongoose.model("address");

const editAddress = async (req, res) => {
  const errors = {};
  const {addressId, ...rest} = req.body;

  // Enhanced validation for edit operations
  if (rest?.addressType && !['apartment', 'house', 'office'].includes(rest.addressType)) {
    errors.error = "Invalid address type. Must be apartment, house, or office";
    return res.status(400).json({ ...errors });
  }

  try {
    if (rest?.isPrimary === true) {
      // First, unset any existing primary address
      await Address.findOneAndUpdate(
        { isPrimary: true },
        { isPrimary: false }
      );
      
      // Then update the current address to primary
      const address = await Address.findByIdAndUpdate(
        addressId,
        { ...rest },
        { new: true }
      ).lean();
      
      res.json({
        address,
        success: true,
      });
    } else {
      const address = await Address.findByIdAndUpdate(
        addressId,
        { ...rest },
        { new: true }
      ).lean();
      
      res.json({
        address,
        success: true,
      });
    }
  } catch (err) {
    errors.error = "Error checking for address in the database";
    return res.status(500).json({ ...errors, ...err });
  }
};

module.exports = editAddress;