const mongoose = require("mongoose");

// Models
const ChefBranch = mongoose.model("chefBranch");
const User = mongoose.model("user");
const Dish = mongoose.model("dish");
const { getBlockedChefIds } = require('../../utils/getBlockedChefIds');

/**
 * Get available chefs based on client location
 * Shows chefs with branches in the same city as priority, 
 * and chefs in same country with unavailable status
 */
const getAvailableChefsByLocation = async (req, res) => {
  try {
    const { lat, long, city, country, page = 1, limit = 20 } = req.query;
    
    if (!city) {
      return res.status(400).json({
        success: false,
        message: "Client city is required"
      });
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Exclude blocked chefs
    const blockedChefIds = await getBlockedChefIds();
    const blockedFilter = blockedChefIds.length > 0 ? { chef: { $nin: blockedChefIds } } : {};

    // Find all active branches in the same city (available chefs)
    const availableBranches = await ChefBranch.find({
      'addressDetails.city': new RegExp(city, 'i'),
      isActive: true,
      ...blockedFilter
    }).populate('chef', 'fullName avatar bio type chefSettings')
      .sort({ isPrimary: -1 });

    // Find all active branches in the same country but different cities (unavailable chefs)
    let unavailableBranches = [];
    if (country) {
      unavailableBranches = await ChefBranch.find({
        'addressDetails.country': new RegExp(country, 'i'),
        'addressDetails.city': { $not: new RegExp(city, 'i') },
        isActive: true,
        ...blockedFilter
      }).populate('chef', 'fullName avatar bio type chefSettings');
    }

    // Group branches by chef
    const chefMap = new Map();
    
    // Process available chefs (have branches in client's city)
    for (const branch of availableBranches) {
      if (!branch.chef || branch.chef.type !== 'chef') continue;
      
      const chefId = branch.chef._id.toString();
      if (!chefMap.has(chefId)) {
        // Calculate distance if coordinates provided
        let distance = null;
        if (lat && long) {
          distance = branch.calculateDistance(parseFloat(lat), parseFloat(long));
        }
        
        // Get dish count for this chef
        const dishCount = await Dish.countDocuments({ 
          user_id: branch.chef._id, 
          visible: { $ne: false } 
        });
        
        chefMap.set(chefId, {
          chef: branch.chef,
          availability: 'available',
          branches: [branch],
          nearestDistance: distance,
          nearestBranch: branch,
          dishCount: dishCount,
          currency: branch.chef.chefSettings?.currency || 'USD',
          currencySymbol: branch.chef.chefSettings?.currencySymbol || ''
        });
      } else {
        // Add branch to existing chef and update nearest if closer
        const existing = chefMap.get(chefId);
        existing.branches.push(branch);
        
        if (lat && long) {
          const distance = branch.calculateDistance(parseFloat(lat), parseFloat(long));
          if (distance < existing.nearestDistance) {
            existing.nearestDistance = distance;
            existing.nearestBranch = branch;
          }
        }
      }
    }

    // Process unavailable chefs (have branches in country but not in client's city)
    for (const branch of unavailableBranches) {
      if (!branch.chef || branch.chef.type !== 'chef') continue;
      
      const chefId = branch.chef._id.toString();
      if (!chefMap.has(chefId)) {
        // Only add if not already available
        const dishCount = await Dish.countDocuments({ 
          user_id: branch.chef._id, 
          visible: { $ne: false } 
        });
        
        chefMap.set(chefId, {
          chef: branch.chef,
          availability: 'not_available_in_city',
          branches: [branch],
          nearestDistance: null,
          nearestBranch: branch,
          dishCount: dishCount,
          currency: branch.chef.chefSettings?.currency || 'USD',
          currencySymbol: branch.chef.chefSettings?.currencySymbol || '',
          operatingCities: [...new Set([branch.addressDetails.city])]
        });
      } else if (chefMap.get(chefId).availability === 'not_available_in_city') {
        // Add city to operating cities list
        const existing = chefMap.get(chefId);
        if (!existing.operatingCities.includes(branch.addressDetails.city)) {
          existing.operatingCities.push(branch.addressDetails.city);
        }
      }
    }

    // Convert map to array and sort
    let chefs = Array.from(chefMap.values());
    
    // Sort: available chefs first (by distance if provided), then unavailable ones
    chefs.sort((a, b) => {
      // Available chefs come first
      if (a.availability === 'available' && b.availability !== 'available') return -1;
      if (b.availability === 'available' && a.availability !== 'available') return 1;
      
      // Within available chefs, sort by distance
      if (a.availability === 'available' && b.availability === 'available') {
        if (a.nearestDistance !== null && b.nearestDistance !== null) {
          return a.nearestDistance - b.nearestDistance;
        }
      }
      
      // Default sort by name
      return a.chef.fullName?.localeCompare(b.chef.fullName) || 0;
    });

    // Apply pagination
    const totalChefs = chefs.length;
    const availableCount = chefs.filter(c => c.availability === 'available').length;
    const unavailableCount = totalChefs - availableCount;
    
    chefs = chefs.slice(skip, skip + limitNum);

    // Format response
    const formattedChefs = chefs.map(item => ({
      _id: item.chef._id,
      fullName: item.chef.fullName,
      avatar: item.chef.avatar,
      bio: item.chef.bio,
      availability: item.availability,
      availabilityMessage: getAvailabilityMessage(item.availability, city, item.operatingCities),
      dishCount: item.dishCount,
      currency: item.currency,
      currencySymbol: item.currencySymbol,
      branchCount: item.branches.length,
      nearestDistance: item.nearestDistance ? Math.round(item.nearestDistance * 10) / 10 : null,
      nearestBranch: item.nearestBranch ? {
        branchName: item.nearestBranch.branchName,
        address: item.nearestBranch.addressDetails.formattedAddress,
        deliveryFee: item.nearestBranch.deliveryFee,
        minimumOrder: item.nearestBranch.minimumOrderAmount
      } : null,
      operatingCities: item.operatingCities || null
    }));

    res.json({
      success: true,
      chefs: formattedChefs,
      pagination: {
        currentPage: pageNum,
        totalItems: totalChefs,
        itemsPerPage: limitNum,
        totalPages: Math.ceil(totalChefs / limitNum)
      },
      stats: {
        available: availableCount,
        unavailable: unavailableCount,
        clientLocation: { city, country }
      }
    });

  } catch (err) {
    console.error('Error getting chefs by location:', err);
    res.status(500).json({
      success: false,
      message: "Error retrieving chefs",
      error: err.message
    });
  }
};

/**
 * Helper function to generate availability message
 */
function getAvailabilityMessage(availability, clientCity, operatingCities) {
  switch (availability) {
    case 'available':
      return `Delivers to ${clientCity}`;
    case 'not_available_in_city':
      const cities = operatingCities?.join(', ') || 'other areas';
      return `Operates in ${cities} • Not available in ${clientCity}`;
    default:
      return 'Availability unknown';
  }
}

module.exports = getAvailableChefsByLocation; 