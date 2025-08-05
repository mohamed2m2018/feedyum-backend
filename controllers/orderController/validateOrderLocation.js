const mongoose = require("mongoose");

// Models
const ChefBranch = mongoose.model("chefBranch");
const Address = mongoose.model("address");

/**
 * Validates if a chef can deliver to a specific delivery address
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
      // Address provided by ID
      clientAddress = await Address.findById(deliveryAddressId);
      if (!clientAddress) {
        return res.status(404).json({
          success: false,
          message: "Delivery address not found",
          canOrder: false
        });
      }
    } else if (deliveryAddress) {
      // Address provided directly in request
      clientAddress = deliveryAddress;
    } else {
      return res.status(400).json({
        success: false,
        message: "Delivery address is required",
        canOrder: false
      });
    }

    // Extract city and country from address
    let clientCity, clientCountry;
    
    if (clientAddress.streetDetails?.area) {
      // Enhanced address format
      clientCity = clientAddress.streetDetails.area;
      // Try to extract country from formatted address or use default
      clientCountry = extractCountryFromAddress(clientAddress.formattedAddress);
    } else if (clientAddress.nameLine) {
      // Basic address format - try to extract city
      const addressParts = clientAddress.nameLine.split(',');
      clientCity = addressParts.length > 1 ? addressParts[addressParts.length - 2].trim() : null;
      clientCountry = extractCountryFromAddress(clientAddress.nameLine);
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid address format",
        canOrder: false
      });
    }

    if (!clientCity) {
      return res.status(400).json({
        success: false,
        message: "Cannot determine city from delivery address",
        canOrder: false
      });
    }

    // Find chef's active branches in the same city
    const chefBranches = await ChefBranch.find({
      chef: chefId,
      isActive: true,
      'addressDetails.city': new RegExp(clientCity, 'i')
    }).populate('chef', 'fullName chefSettings');

    const hasMatchingBranch = chefBranches.length > 0;
    
    // If no matching branches in city, check if chef has branches in same country
    let branchesInCountry = [];
    if (!hasMatchingBranch && clientCountry) {
      branchesInCountry = await ChefBranch.find({
        chef: chefId,
        isActive: true,
        'addressDetails.country': new RegExp(clientCountry, 'i')
      }).populate('chef', 'fullName chefSettings');
    }

    // Calculate distances for available branches if coordinates are provided
    let nearestBranch = null;
    let nearestDistance = null;
    
    if (hasMatchingBranch && clientAddress.location?.lat && clientAddress.location?.long) {
      const clientLat = parseFloat(clientAddress.location.lat);
      const clientLong = parseFloat(clientAddress.location.long);
      
      let minDistance = Infinity;
      for (const branch of chefBranches) {
        const distance = branch.calculateDistance(clientLat, clientLong);
        if (distance < minDistance) {
          minDistance = distance;
          nearestBranch = branch;
          nearestDistance = distance;
        }
      }
    }

    const response = {
      success: true,
      canOrder: hasMatchingBranch,
      validation: {
        clientCity,
        clientCountry,
        chefId,
        hasMatchingBranch,
        branchesInCity: chefBranches.length,
        branchesInCountry: branchesInCountry.length
      }
    };

    if (hasMatchingBranch) {
      response.message = `Chef delivers to ${clientCity}`;
      response.availableBranches = chefBranches.map(branch => ({
        branchId: branch._id,
        branchName: branch.branchName,
        address: branch.addressDetails.formattedAddress,
        deliveryFee: branch.deliveryFee,
        minimumOrder: branch.minimumOrderAmount,
        distance: clientAddress.location?.lat ? 
          branch.calculateDistance(
            parseFloat(clientAddress.location.lat), 
            parseFloat(clientAddress.location.long)
          ) : null
      }));
      
      if (nearestBranch) {
        response.nearestBranch = {
          branchId: nearestBranch._id,
          branchName: nearestBranch.branchName,
          distance: nearestDistance,
          deliveryFee: nearestBranch.deliveryFee
        };
      }
    } else {
      if (branchesInCountry.length > 0) {
        response.message = `Chef does not deliver to ${clientCity} but operates in ${clientCountry}`;
        response.availabilityStatus = 'not_available_in_city';
      } else {
        response.message = `Chef does not operate in ${clientCountry || 'this area'}`;
        response.availabilityStatus = 'not_available_in_country';
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

/**
 * Helper function to extract country from address string
 * @param {string} address - Full address string
 * @returns {string|null} - Extracted country name
 */
function extractCountryFromAddress(address) {
  if (!address) return null;
  
  const commonCountries = [
    'United Kingdom', 'United States', 'Canada', 'Australia', 'Egypt',
    'France', 'Germany', 'Spain', 'Italy', 'India', 'Japan', 'China',
    'Brazil', 'Mexico', 'South Africa', 'UAE', 'Saudi Arabia'
  ];
  
  for (const country of commonCountries) {
    if (address.toLowerCase().includes(country.toLowerCase())) {
      return country;
    }
  }
  
  // Try to get last part as country (basic heuristic)
  const parts = address.split(',');
  if (parts.length > 2) {
    return parts[parts.length - 1].trim();
  }
  
  return null;
}

module.exports = validateOrderLocation; 