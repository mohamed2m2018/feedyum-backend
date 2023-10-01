const mongoose = require("mongoose");

// Models
const User = mongoose.model("user");

const getAllLocations = (req, res) => {
  const userId = req.query.id; // Retrieve the user ID from the query parameter

  User.findById(userId).populate('locations')
    .then((user) => {
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      // Return the locations array
      const locations = user.locations || [];
      res.json({ locations });
    })
    .catch((err) => {
      return res.status(500).json({ error: "Error retrieving locations", ...err });
    });
};

module.exports = getAllLocations;