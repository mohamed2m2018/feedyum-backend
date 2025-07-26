const User = require('../../models/user');
const Menu = require('../../models/menu');

const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the user
    const user = await User.findById(id)
      .select('fullName username avatar email phone type bio hasMenu locations tags postsNo likesNo')
      .populate('tags', 'name');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let userProfile = user.toObject();

    // If user is a chef, check for menu information (regardless of hasMenu flag)
    if (user.type === 'chef') {
      const menu = await Menu.findOne({ chef: id })
        .populate({
          path: 'sections',
          select: 'name description dishes',
          populate: {
            path: 'dishes',
            select: 'name description price image isAvailable'
          }
        })
        .populate({
          path: 'dishes',
          select: 'name description price image isAvailable section',
          populate: {
            path: 'section',
            select: 'name'
          }
        });

      if (menu) {
        userProfile.menu = {
          _id: menu._id,
          name: menu.name,
          description: menu.description,
          sections: menu.sections,
          dishes: menu.dishes,
          dishCount: menu.dishes ? menu.dishes.length : 0,
          sectionCount: menu.sections ? menu.sections.length : 0,
          created_at: menu.created_at
        };
        
        // Update hasMenu flag if menu exists but flag is false
        if (!user.hasMenu) {
          await User.findByIdAndUpdate(id, { hasMenu: true });
          userProfile.hasMenu = true;
        }
      } else {
        // No menu found, ensure hasMenu is false
        if (user.hasMenu) {
          await User.findByIdAndUpdate(id, { hasMenu: false });
          userProfile.hasMenu = false;
        }
      }
    }

    res.status(200).json({
      success: true,
      user: userProfile
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