const mongoose = require("mongoose");

// Models
const Address = mongoose.model("address");

const removeAddress = (req, res) => {
  const errors = {};
  Address.remove(
    { _id: req.body.addressId.toString() },
  )
    .then(() =>
      res.json({
        success: true,
      })
    )
    .catch((err) => {
      errors.error = "Error checking for the address in the database";
      res.status(500).json({ ...errors, ...err });
    });
};

module.exports = removeAddress;