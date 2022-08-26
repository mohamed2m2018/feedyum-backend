const mongoose = require("mongoose");

// Models
const Address = mongoose.model("address");

module.exports = editAddress = (req, res) => {
  const errors = {};
  const {addressId, ...rest} = req.body;

  Address.findByIdAndUpdate(addressId,{
     ...rest,
  }, {
      new: true,
  })
    .lean()
    .exec((err, address) => {
      if (err) {
        errors.error = "Error checking for address in the database";
        return res.status(500).json({ ...errors, ...err });
      }
      res.json({
        address,
        success: true,
      });
    });
};
