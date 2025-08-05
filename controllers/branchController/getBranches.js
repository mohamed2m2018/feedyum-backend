const mongoose = require("mongoose");

// Models
const ChefBranch = mongoose.model("chefBranch");

const getBranches = async (req, res) => {
  try {
    const { chefId, city, country, activeOnly } = req.query;
    
    // Build query
    let query = {};
    
    // If chefId provided, get branches for specific chef
    if (chefId) {
      query.chef = chefId;
    } else {
      // If no chefId, get branches for requesting user (must be chef)
      query.chef = req.user._id;
    }
    
    // Filter by city if provided
    if (city) {
      query['addressDetails.city'] = new RegExp(city, 'i');
    }
    
    // Filter by country if provided
    if (country) {
      query['addressDetails.country'] = new RegExp(country, 'i');
    }
    
    // Filter by active status if specified
    if (activeOnly === 'true') {
      query.isActive = true;
    }

    // Get branches with chef data
    const branches = await ChefBranch.find(query)
      .populate('chef', 'fullName avatar type chefSettings')
      .sort({ isPrimary: -1, created_at: -1 }); // Primary branches first, then by creation date

    // Calculate stats
    const totalBranches = branches.length;
    const activeBranches = branches.filter(branch => branch.isActive).length;
    const primaryBranch = branches.find(branch => branch.isPrimary);

    res.json({
      branches,
      stats: {
        total: totalBranches,
        active: activeBranches,
        inactive: totalBranches - activeBranches,
        hasPrimary: !!primaryBranch
      },
      success: true
    });

  } catch (err) {
    console.error('Error fetching branches:', err);
    return res.status(500).json({ 
      error: "Error retrieving branches", 
      success: false,
      details: err.message 
    });
  }
};

module.exports = getBranches; 