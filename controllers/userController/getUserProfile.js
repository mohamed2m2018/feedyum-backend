const User = require('../../models/user');
const Menu = require('../../models/menu');
const mongoose = require('mongoose');
const { cleanResponseData } = require('../../utils/embeddingUtils');

const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the user
    const user = await User.findById(id)
      .select('fullName username avatar email phone type bio hasMenu locations tags postsNo likesNo')
      .populate('tags', 'name')
      .lean();
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let userProfile = { ...user };

    // If user is a chef, check for menu information with optimized query
    if (user.type === 'chef') {
      // Use aggregation for better performance
      const menuData = await Menu.aggregate([
        { $match: { chef: new mongoose.Types.ObjectId(id) } },
        {
          $lookup: {
            from: 'sections',
            localField: 'sections',
            foreignField: '_id',
            as: 'sections',
            pipeline: [
              { $project: { name: 1, nameArabic: 1, nameEnglish: 1, description: 1, dishes: 1 } }
            ]
          }
        },
        {
          $lookup: {
            from: 'dishes',
            localField: 'dishes',
            foreignField: '_id',
            as: 'dishes',
            pipeline: [
              { $project: { name: 1, nameArabic: 1, nameEnglish: 1, description: 1, descriptionArabic: 1, descriptionEnglish: 1, price: 1, image: 1, isAvailable: 1, section: 1 } }
            ]
          }
        },
        {
          $project: {
            name: 1,
            description: 1,
            sections: 1,
            dishes: 1,
            dishCount: { $size: '$dishes' },
            sectionCount: { $size: '$sections' },
            created_at: 1
          }
        }
      ]);

      const menu = menuData[0];
      
      if (menu) {
        userProfile.menu = menu;
        
        // Update hasMenu flag asynchronously if needed
        if (!user.hasMenu) {
          User.findByIdAndUpdate(id, { hasMenu: true }).exec(); // Non-blocking
          userProfile.hasMenu = true;
        }
      } else {
        // No menu found, ensure hasMenu is false
        if (user.hasMenu) {
          User.findByIdAndUpdate(id, { hasMenu: false }).exec(); // Non-blocking
          userProfile.hasMenu = false;
        }
      }
    }

    // Remove embeddings from response
    const cleanUserProfile = cleanResponseData(userProfile);
    
    res.status(200).json({
      success: true,
      user: cleanUserProfile
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile',
      error: error.message
    });
  }
};

module.exports = getUserProfile;