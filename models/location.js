const mongoose = require('mongoose');

// Create Location model
const LocationSchema = new mongoose.Schema({
    description: String,
    lat: Number,
    long: Number,
  });
  
const LocationData = mongoose.model('location', LocationSchema);
module.exports = LocationData;