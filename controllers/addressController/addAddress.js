const mongoose = require("mongoose");

// Models
const Address = mongoose.model("address");

const addAddress = async (req, res) => {
  console.log('Backend addAddress: Request body:', req.body);
  console.log('Backend addAddress: User:', req.user?._id);
  
  const errors = {};
  
  // Enhanced validation for new required fields
  if (!req.body?.label) {
    console.log('Backend addAddress: Missing label');
    errors.error = "Address label is required";
    return res.status(400).json({ ...errors });
  }
  
  if (!req.body?.lat) {
    errors.error = "Latitude is required";
    return res.status(400).json({ ...errors });
  }

  if (!req.body?.long) {
    errors.error = "Longitude is required";
    return res.status(400).json({ ...errors });
  }
  
  // Validate address type if provided
  if (req.body?.addressType && !['apartment', 'house', 'office'].includes(req.body.addressType)) {
    errors.error = "Invalid address type. Must be apartment, house, or office";
    return res.status(400).json({ ...errors });
  }

  try {
    if (req.body?.isPrimary) {
      // Update existing primary address to false
      await Address.findOneAndUpdate(
        {
          isPrimary: true,
        },
        {
          isPrimary: false,
        },
        {
          new: true,
        }
      );
    }

    // Create new address with enhanced fields
    const address = new Address({
      // Existing fields
      nameLine: req.body?.nameLine || req.body?.formattedAddress || '',
      location: {
        lat: req.body?.lat,
        long: req.body?.long,
      },
      isPrimary: req.body?.isPrimary || false,
      owner: req.user?._id,
      
      // New enhanced fields
      label: req.body?.label,
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
      formattedAddress: req.body?.formattedAddress || '',
      isCurrentLocation: req.body?.isCurrentLocation || false,
      additionalInstructions: req.body?.additionalInstructions || ''
    });

    const savedAddress = await address.save();
    console.log('Backend addAddress: Address saved successfully:', savedAddress._id);
    res.json({ address: savedAddress, success: true });
    
  } catch (err) {
    console.error('Backend addAddress: Error:', err);
    return res.status(500).json({ error: err.message || 'Failed to save address' });
  }
};

module.exports = addAddress;