const mongoose = require("mongoose");
const Dish = require("../../models/dish");

// Helper function to calculate nearest location distance
function getNearestLocation(targetLat, targetLong, locations) {
  if (!Array.isArray(locations) || locations.length === 0) {
    return undefined;
  }

  if (isNaN(targetLat) || isNaN(targetLong)) {
    return undefined;
  }

  const earthRadius = 6371;
  let nearestLocation = null;
  let nearestDistance = Infinity;

  for (const location of locations) {
    const { lat, long } = location;
    
    if (isNaN(lat) || isNaN(long)) {
      continue;
    }

    const latDiff = deg2rad(lat - targetLat);
    const longDiff = deg2rad(long - targetLong);

    const a =
      Math.sin(latDiff / 2) ** 2 +
      Math.cos(deg2rad(targetLat)) *
        Math.cos(deg2rad(lat)) *
        Math.sin(longDiff / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = earthRadius * c;

    if (distance < nearestDistance) {
      nearestLocation = location;
      nearestDistance = distance;
    }
  }
  
  return {
    nearestLocation,
    distance: nearestDistance !== Infinity ? parseFloat(nearestDistance.toFixed(2)) : undefined,
  };
}

function deg2rad(degrees) {
  return degrees * (Math.PI / 180);
}

const getDishesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { lat, long } = req.query;
    console.log(`[DISCOVER] getDishesByCategory - Category: ${category}, Coordinates: lat=${lat}, long=${long}`);

    if (!category) {
      return res.status(400).json({ message: "Category is required" });
    }

    // Build query based on whether this is "All" or a specific category
    const isAll = category === 'All';
    const matchQuery = isAll
      ? { visible: { $ne: false } } // All: just visible dishes, no category filter
      : {
          $and: [
            { visible: { $ne: false } },
            {
              $or: [
                { category: { $regex: new RegExp(category, "i") } },
                { categories: { $elemMatch: { $regex: new RegExp(category, "i") } } }
              ]
            }
          ]
        };

    const dishes = await Dish.find(matchQuery)
      .select('name image price category user_id visible created_at')
      .populate("user_id", "fullName avatar bio locations chefSettings")
      .sort({ created_at: -1 })
      .limit(50)
      .lean();

    // Import ChefBranch model for location-based filtering
    const ChefBranch = mongoose.model("chefBranch");
    
    // Transform the data to include chef information and availability
    const hasValidCoordinates = lat !== 'undefined' && long !== 'undefined' && 
                               !isNaN(Number(lat)) && !isNaN(Number(long));
    
    let transformedDishes = await Promise.all(dishes.map(async (dish) => {
      let kmAway = undefined;
      let chefAvailability = 'unknown';
      let chefBranches = [];
      
      // Check chef availability based on branches (if coordinates provided)
      if (dish.user_id?._id) {
        try {
          chefBranches = await ChefBranch.find({
            chef: dish.user_id._id,
            isActive: true
          });
          
          // If client coordinates provided, check availability
          if (hasValidCoordinates && chefBranches.length > 0) {
            const userLat = Number(lat);
            const userLong = Number(long);
            
            // Find nearest branch and calculate distance
            let nearestDistance = Infinity;
            let nearestBranch = null;
            
            for (const branch of chefBranches) {
              const distance = branch.calculateDistance(userLat, userLong);
              if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestBranch = branch;
              }
            }
            
            kmAway = Math.round(nearestDistance * 10) / 10;
            
            // Determine availability based on delivery radius
            if (nearestBranch && nearestDistance <= nearestBranch.deliveryRadius) {
              chefAvailability = 'available';
            } else {
              chefAvailability = 'outside_delivery_area';
            }
          }
        } catch (error) {
          console.error('Error checking chef availability:', error);
        }
      }
      
      return {
        ...dish,
        chef: dish.user_id
          ? {
              _id: dish.user_id._id,
              fullName: dish.user_id.fullName,
              avatar: dish.user_id.avatar,
              bio: dish.user_id.bio,
              availability: chefAvailability,
              branchCount: chefBranches.length,
              currency: dish.user_id.chefSettings?.currency || 'USD',
              currencySymbol: dish.user_id.chefSettings?.currencySymbol || ''
            }
          : null,
        kmAway,
        availability: chefAvailability
      };
    }));

    // Sort by availability and distance: available chefs first, then by distance
    if (hasValidCoordinates) {
      transformedDishes.sort((a, b) => {
        // Available chefs come first
        if (a.availability === 'available' && b.availability !== 'available') return -1;
        if (b.availability === 'available' && a.availability !== 'available') return 1;
        
        // Within same availability, sort by distance
        if (a.kmAway !== undefined && b.kmAway !== undefined) {
          return a.kmAway - b.kmAway;
        }
        
        return 0;
      });
    } else {
      // Sort by other criteria if no coordinates
      transformedDishes.sort((a, b) => {
        if (a.kmAway !== undefined && b.kmAway !== undefined) {
          return a.kmAway - b.kmAway;
        }
        if (a.kmAway !== undefined) return -1;
        if (b.kmAway !== undefined) return 1;
        return 0;
      });
    }

    res.json(transformedDishes);
  } catch (error) {
    console.error("Error fetching dishes by category:", error);
    res.status(500).json({
      message: "Server error while fetching dishes by category",
      error: error.message,
    });
  }
};

module.exports = getDishesByCategory;
