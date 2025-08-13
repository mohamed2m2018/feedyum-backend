const mongoose = require("mongoose");
const cacheManager = require("../../utils/cacheManager");
const DatabaseOptimizations = require("../../utils/databaseOptimizations");

const Dish = mongoose.model("dish");
const ChefBranch = mongoose.model("chefBranch");

const getDishesByCategoryOptimized = async (req, res) => {
  const startTime = Date.now();
  console.log(`[PERFORMANCE] Optimized getDishesByCategory START: ${new Date().toISOString()}`);
  
  try {
    const { category } = req.params;
    const { lat, long, limit = 50 } = req.query;
    
    console.log(`[DEBUG] Category: ${category}, Coordinates: lat=${lat}, long=${long}`);

    if (!category) {
      return res.status(400).json({ message: "Category is required" });
    }

    // Prepare cache parameters
    const location = {
      lat: lat !== 'undefined' ? parseFloat(lat) : undefined,
      long: long !== 'undefined' ? parseFloat(long) : undefined
    };

    // Check cache first
    const cachedDishes = await cacheManager.getCachedDishes(category, location);
    if (cachedDishes) {
      console.log(`[PERFORMANCE] Cache HIT for dishes - ${Date.now() - startTime}ms`);
      return res.json(cachedDishes);
    }

    console.log(`[PERFORMANCE] Cache MISS - executing database query`);

    // Use optimized aggregation pipeline
    const aggregationPipeline = DatabaseOptimizations.getDishesByCategoryPipeline(
      category, 
      location.lat, 
      location.long, 
      parseInt(limit)
    );
    
    console.log(`[DEBUG] Executing dishes aggregation pipeline...`);
    const dishes = await Dish.aggregate(aggregationPipeline);
    
    console.log(`[DEBUG] Found ${dishes.length} dishes`);

    // Batch process chef availability using branches (if coordinates provided)
    const hasValidCoordinates = location.lat !== undefined && 
                               location.long !== undefined && 
                               !isNaN(location.lat) && 
                               !isNaN(location.long);
    
    let transformedDishes = dishes;
    
    if (hasValidCoordinates) {
      // Get all chef IDs for batch branch lookup
      const chefIds = [...new Set(dishes.map(dish => dish.chef._id).filter(Boolean))];
      
      if (chefIds.length > 0) {
        // Batch fetch all active branches for these chefs
        const chefBranches = await ChefBranch.find({
          chef: { $in: chefIds },
          isActive: true
        }).select('chef lat long deliveryRadius').lean();
        
        // Group branches by chef for O(1) lookup
        const branchesByChef = new Map();
        chefBranches.forEach(branch => {
          const chefId = branch.chef.toString();
          if (!branchesByChef.has(chefId)) {
            branchesByChef.set(chefId, []);
          }
          branchesByChef.get(chefId).push(branch);
        });
        
        // Process all dishes with availability calculation
        transformedDishes = dishes.map(dish => {
          let chefAvailability = 'unknown';
          let nearestDistance = null;
          
          const chefId = dish.chef._id.toString();
          const branches = branchesByChef.get(chefId) || [];
          
          if (branches.length > 0) {
            // Calculate distance to nearest branch
            let minDistance = Infinity;
            let nearestBranch = null;
            
            for (const branch of branches) {
              const distance = calculateDistance(
                location.lat, location.long,
                branch.lat, branch.long
              );
              
              if (distance < minDistance) {
                minDistance = distance;
                nearestBranch = branch;
              }
            }
            
            nearestDistance = Math.round(minDistance * 10) / 10;
            
            // Determine availability based on delivery radius
            if (nearestBranch && minDistance <= nearestBranch.deliveryRadius) {
              chefAvailability = 'available';
            } else {
              chefAvailability = 'outside_delivery_area';
            }
          }
          
          return {
            ...dish,
            chef: {
              ...dish.chef,
              availability: chefAvailability,
              branchCount: branches.length,
              currency: dish.chef.chefSettings?.currency || 'USD',
               currencySymbol: dish.chef.chefSettings?.currencySymbol || ''
            },
            kmAway: nearestDistance || dish.kmAway,
            availability: chefAvailability
          };
        });
        
        // Sort by availability and distance
        transformedDishes.sort((a, b) => {
          // Available chefs come first
          if (a.availability === 'available' && b.availability !== 'available') return -1;
          if (b.availability === 'available' && a.availability !== 'available') return 1;
          
          // Within same availability, sort by distance
          if (a.kmAway !== null && b.kmAway !== null) {
            return a.kmAway - b.kmAway;
          }
          
          return 0;
        });
      }
    }

    // Cache the result
    await cacheManager.cacheDishes(category, location, transformedDishes);

    const executionTime = Date.now() - startTime;
    console.log(`[PERFORMANCE] Optimized getDishesByCategory COMPLETED: ${executionTime}ms`);
    
    // Add performance metrics in development
    if (process.env.NODE_ENV === 'development') {
      res.json({
        dishes: transformedDishes,
        performance: {
          executionTime: `${executionTime}ms`,
          cacheHit: false,
          dishesCount: transformedDishes.length
        }
      });
    } else {
      res.json(transformedDishes);
    }
    
  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error("Error in optimized getDishesByCategory:", error);
    
    res.status(500).json({
      message: "Server error while fetching dishes by category",
      error: error.message,
      performance: {
        executionTime: `${executionTime}ms`,
        error: true
      }
    });
  }
};

// Helper function for distance calculation (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

module.exports = getDishesByCategoryOptimized;