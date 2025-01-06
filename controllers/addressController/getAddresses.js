const mongoose = require("mongoose");

// Models
const Address = mongoose.model("address");

const getAddresses = (req, res) => {
  const errors = {};
  //lean() make you able to get rid of _doc
  //populate() make you able to populate all fields for story given its id
  Address.find({ owner: req.user._id })
    .lean()
    .exec((err, addresses) => {
      if (err) {
        errors.error = "Error checking for addressers in the database";
        return res.status(500).json({ ...errors, ...err });
      }
      if (addresses.length === 0)
        return res.status(200).json({
          addresses: [],
        });
    
      res.json({
        addresses,
        success: true,
      });
    });
};

module.exports = getAddresses;