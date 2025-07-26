const User = require('../../models/user');
const Menu = require('../../models/menu');

const getChefProfile = async (req, res) => {
  try {
    const { chefId } = req.params;
    
    // Find the chef user
    const chef = await User.findById(chefId)
      .select('fullName username avatar email phone type bio hasMenu locations tags')
      .populate('tags', 'name');
    
    if (!chef) {
      return res.status(404).json({
        success: false,
        message: 'Chef not found'
      });
    }

    if (chef.type !== 'chef') {
      return res.status(400).json({
        success: false,
        message: 'User is not a chef'
      });
    }

    // Find the chef's menu with populated dishes and sections (check regardless of hasMenu flag)
    let menu = await Menu.findOne({ chef: chefId })
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

    // Update hasMenu flag based on actual menu existence
    if (menu && !chef.hasMenu) {
      await User.findByIdAndUpdate(chefId, { hasMenu: true });
      chef.hasMenu = true;
    } else if (!menu && chef.hasMenu) {
      await User.findByIdAndUpdate(chefId, { hasMenu: false });
      chef.hasMenu = false;
    }

    // Structure the response
    const chefProfile = {
      ...chef.toObject(),
      menu: menu ? {
        _id: menu._id,
        name: menu.name,
        description: menu.description,
        sections: menu.sections,
        dishes: menu.dishes,
        created_at: menu.created_at
      } : null
    };

    res.status(200).json({
      success: true,
      chef: chefProfile
    });

  } catch (error) {
    console.error('Get chef profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chef profile',
      error: error.message
    });
  }
};

module.exports = getChefProfile;