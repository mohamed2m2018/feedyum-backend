const mongoose = require("mongoose");
const Address = mongoose.model("address");
const {
  validateDeliveryDistance,
  extractCoordinates,
  MAX_DELIVERY_DISTANCE_KM
} = require('../../utils/deliveryValidation');

/**
 * Validates if a chef can deliver to a specific delivery address using distance-based validation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const validateOrderLocation = async (req, res) => {
  try {
    const { chefId, deliveryAddressId, deliveryAddress } = req.body;

    if (!chefId) {
      return res.status(400).json({
        success: false,
        message: "Chef ID is required",
        canOrder: false
      });
    }

    let clientAddress;

    // Get delivery address details
    if (deliveryAddressId) {
      clientAddress = await Address.findById(deliveryAddressId);
      if (!clientAddress) {
        return res.status(404).json({
          success: false,
          message: "Delivery address not found",
          canOrder: false
        });
      }
    } else if (deliveryAddress) {
      clientAddress = deliveryAddress;
    } else {
      return res.status(400).json({
        success: false,
        message: "Delivery address is required",
        canOrder: false
      });
    }

    // Extract coordinates from address
    const { lat: clientLat, long: clientLong } = extractCoordinates(clientAddress);

    // Validate coordinates
    if (!clientLat || !clientLong) {
      return res.status(400).json({
        success: false,
        message: "Delivery address must include location coordinates",
        canOrder: false,
        error: 'missing_coordinates'
      });
    }

    // Use shared validation utility
    const validationResult = await validateDeliveryDistance(chefId, clientAddress);

    // Build response based on validation result
    const response = {
      success: true,
      canOrder: validationResult.canDeliver,
      validation: {
        chefId,
        hasMatchingBranch: validationResult.canDeliver,
        branchesAvailable: validationResult.allBranches.length,
        nearestDistance: validationResult.nearestDistance,
        maxDistance: MAX_DELIVERY_DISTANCE_KM
      }
    };

    if (validationResult.canDeliver) {
      response.message = `Kitchen can deliver to your location (${validationResult.nearestDistance}km away)`;
      response.availableBranches = validationResult.allBranches;
      response.nearestBranch = validationResult.nearestBranch;
    } else {
      response.message = validationResult.errorMessage ||
        `This kitchen is too far from your location (${validationResult.nearestDistance}km, max ${MAX_DELIVERY_DISTANCE_KM}km)`;
      response.availabilityStatus = validationResult.error;
      if (validationResult.nearestBranch) {
        response.nearestBranch = validationResult.nearestBranch;
      }
    }

    res.json(response);

  } catch (err) {
    console.error('Error validating order location:', err);
    res.status(500).json({
      success: false,
      message: "Error validating delivery location",
      canOrder: false,
      error: err.message
    });
  }
};

module.exports = validateOrderLocation;
