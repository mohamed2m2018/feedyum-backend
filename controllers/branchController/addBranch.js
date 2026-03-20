const mongoose = require("mongoose");

// Models
const ChefBranch = mongoose.model("chefBranch");
const User = mongoose.model("user");
const { getTimezoneFromCountry } = require('../../utils/countryTimezone');

const addBranch = async (req, res) => {
  const errors = {};

  try {
    // Validation
    const requiredFields = [
      'branchName', 'streetName', 'buildingNumber', 'area',
      'city', 'state', 'country', 'postalCode', 'lat', 'long',
      'phoneNumber', 'countryCode'
    ];

    for (const field of requiredFields) {
      if (!req.body[field]) {
        errors[field] = `${field} is required`;
      }
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors, success: false });
    }

    // Get the chef user
    const chef = await User.findById(req.user._id);
    if (!chef || chef.type !== 'chef') {
      errors.authorization = "Only chefs can add branches";
      return res.status(403).json({ errors, success: false });
    }

    // Check if chef can add branch in this country
    if (!chef.canAddBranchInCountry(req.body.country)) {
      errors.country = "Cannot add branch in different country. All branches must be in the same country.";
      return res.status(400).json({ errors, success: false });
    }

    // Count existing branches
    const existingBranchesCount = await ChefBranch.countDocuments({
      chef: req.user._id,
      isActive: true
    });

    // Check if this is the first branch and set as primary
    const isPrimary = existingBranchesCount === 0;

    // Create formatted address
    const formattedAddress = `${req.body.buildingNumber} ${req.body.streetName}, ${req.body.area}, ${req.body.city}, ${req.body.state} ${req.body.postalCode}, ${req.body.country}`;

    // Create the branch
    const branch = new ChefBranch({
      chef: req.user._id,
      branchName: req.body.branchName,
      addressDetails: {
        streetName: req.body.streetName,
        buildingNumber: req.body.buildingNumber,
        area: req.body.area,
        city: req.body.city,
        state: req.body.state,
        country: req.body.country,
        postalCode: req.body.postalCode,
        formattedAddress: formattedAddress
      },
      location: {
        lat: parseFloat(req.body.lat),
        long: parseFloat(req.body.long)
      },
      contactInfo: {
        phoneNumber: req.body.phoneNumber,
        countryCode: req.body.countryCode
      },
      isPrimary: isPrimary,
      deliveryRadius: req.body.deliveryRadius || 10,
      deliveryFee: req.body.deliveryFee || 0,
      deliveryTiers: (req.body.deliveryTiers || []).map(t => ({
        ...t,
        fee: Math.max(1, Number(t.fee) || 1),
      })),
      areaDeliveryFees: (req.body.areaDeliveryFees || []).map(a => ({
        name: a.name,
        placeId: a.placeId,
        fee: Math.max(1, Number(a.fee) || 1),
      })),
      minimumOrderAmount: req.body.minimumOrderAmount || 0,
      excludedAreas: req.body.excludedAreas || [],
      operatingHours: req.body.operatingHours || [],
      timezone: req.body.timezone || getTimezoneFromCountry(req.body.country),
      manualOverride: req.body.manualOverride || 'auto',
      allowScheduledOrders: req.body.orderMode ? req.body.orderMode !== 'asap' : (req.body.allowScheduledOrders || false),
      orderMode: req.body.orderMode || (req.body.allowScheduledOrders ? 'both' : 'asap'),
      minLeadTime: req.body.minLeadTime || 60,
      slotDuration: req.body.slotDuration || 60,
    });

    // Save the branch
    const savedBranch = await branch.save();

    // Update chef settings if this is the first branch
    if (isPrimary) {
      chef.setChefCountry(req.body.country);
      chef.chefSettings = chef.chefSettings || {};
      chef.chefSettings.hasBranches = true;
      chef.chefSettings.totalBranches = 1;
      await chef.save();
    } else {
      // Update branch count
      chef.chefSettings.totalBranches = existingBranchesCount + 1;
      await chef.save();
    }

    // Populate chef data for response
    await savedBranch.populate('chef', 'fullName avatar type chefSettings');

    res.json({
      branch: savedBranch,
      success: true,
      message: isPrimary ? 'Primary branch added successfully' : 'Branch added successfully'
    });

  } catch (err) {
    console.error('Error adding branch:', err);

    // Handle duplicate key errors
    if (err.code === 11000) {
      if (err.keyPattern?.chef && err.keyPattern?.isPrimary) {
        errors.branch = "Primary branch already exists for this chef";
      } else {
        errors.branch = "Branch with this information already exists";
      }
      return res.status(400).json({ errors, success: false });
    }

    errors.database = "Error saving branch to database";
    return res.status(500).json({ errors, success: false, details: err.message });
  }
};

module.exports = addBranch; 