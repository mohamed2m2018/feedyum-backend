const mongoose = require("mongoose");

// Models
const Address = mongoose.model("address");

const getAddresses = async (req, res) => {
  const errors = {};
  
  try {
    //lean() make you able to get rid of _doc
    //populate() make you able to populate all fields for story given its id
    // Sort by isPrimary (primary first), then by updatedAt (most recent first)
    const addresses = await Address.find({ owner: req.user._id })
      .sort({ isPrimary: -1, updatedAt: -1 })
      .lean();
    
    if (addresses.length === 0) {
      return res.status(200).json({
        addresses: [],
      });
    }
  
    res.json({
      addresses,
      success: true,
    });
  } catch (err) {
    errors.error = "Error checking for addressers in the database";
    return res.status(500).json({ ...errors, ...err });
  }
};

module.exports = getAddresses;