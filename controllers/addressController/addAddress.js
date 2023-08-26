const mongoose = require("mongoose");

// Models
const Address = mongoose.model("address");

module.exports = addAddress = (req, res) => {
  const errors = {};
  if (!req.body?.nameLine) {
    errors.error = "Name line is required ";
    return res.status(400).json({ ...errors });
  }
  if (!req.body?.lat) {
    errors.error = "Lat is required";
    return res.status(400).json({ ...errors });
  }

  if (!req.body?.lat) {
    errors.error = "Long is required";
    return res.status(400).json({ ...errors });
  }

  if (req.body?.isPrimary) {
    Address.findOneAndUpdate(
      {
        isPrimary: true,
      },
      {
        isPrimary: false,
      },
      {
        new: true,
      },
      (error, item) => {
        // Create new address
        const address = new Address({
          nameLine: req.body?.nameLine,
          location: {
            lat: req.body?.lat,
            long: req.body?.long,
          },
          isPrimary: req.body?.isPrimary || false,
          owner: req.user?._id,
        });

        address
          .save()
          .then((address) => res.json({ address, success: true }))
          .catch((err) => {
            return res.status(500).json({ ...err });
          });
      }
    );
  } else {
    // Create new address
    const address = new Address({
      nameLine: req.body?.nameLine,
      location: {
        lat: req.body?.lat,
        long: req.body?.long,
      },
      isPrimary: req.body?.isPrimary || false,
      owner: req.user?._id,
    });
    address
      .save()
      .then((address) => res.json({ address, success: true }))
      .catch((err) => {
       return res.status(500).json({ ...err });
      });
  }
};
