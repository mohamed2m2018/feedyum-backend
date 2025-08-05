const mongoose = require("mongoose");

// Models
const Address = mongoose.model("address");

const setCurrentLocation = async (req, res) => {
  const errors = {};
  
  try {
    // Validation
    if (!req.body?.lat) {
      errors.error = "Latitude is required";
      return res.status(400).json({ ...errors });
    }

    if (!req.body?.long) {
      errors.error = "Longitude is required";
      return res.status(400).json({ ...errors });
    }

    // First, unset any existing current location addresses
    await Address.updateMany(
      { owner: req.user._id, isCurrentLocation: true },
      { isCurrentLocation: false }
    );

    // Create or update current location address
    const currentLocationData = {
      // Basic required fields
      label: req.body?.label || 'Current Location',
      location: {
        lat: req.body.lat,
        long: req.body.long,
      },
      owner: req.user._id,
      isCurrentLocation: true,
      
      // Enhanced fields
      addressType: req.body?.addressType || 'house',
      buildingDetails: {
        buildingName: req.body?.buildingDetails?.buildingName || '',
        apartmentNumber: req.body?.buildingDetails?.apartmentNumber || '',
        floorNumber: req.body?.buildingDetails?.floorNumber || ''
      },
      streetDetails: {
        streetName: req.body?.streetDetails?.streetName || '',
        area: req.body?.streetDetails?.area || '',
        neighborhood: req.body?.streetDetails?.neighborhood || ''
      },
      contactInfo: {
        phoneNumber: req.body?.contactInfo?.phoneNumber || '',
        countryCode: req.body?.contactInfo?.countryCode || '+20'
      },
      formattedAddress: req.body?.formattedAddress || 'Current Location',
      nameLine: req.body?.nameLine || req.body?.formattedAddress || 'Current Location',
      isPrimary: req.body?.isPrimary || false
    };

    // If setting as primary, unset other primary addresses
    if (currentLocationData.isPrimary) {
      await Address.updateMany(
        { owner: req.user._id, isPrimary: true },
        { isPrimary: false }
      );
    }

    const address = new Address(currentLocationData);
    const savedAddress = await address.save();

    res.json({
      address: savedAddress,
      success: true,
      message: "Current location set successfully"
    });

  } catch (err) {
    console.error('Error setting current location:', err);
    errors.error = "Error setting current location";
    return res.status(500).json({ ...errors, details: err.message });
  }
};

module.exports = setCurrentLocation;