const User = require('../../models/user');
const Menu = require('../../models/menu');
const mongoose = require('mongoose');

const getChefProfile = async (req, res) => {
  try {
    const { chefId } = req.params;
    
    // Find the chef user
    const chef = await User.findById(chefId)
      .select('fullName username avatar email phone type bio hasMenu locations tags')
      .populate('tags', 'name')
      .lean();
    
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

    // Use aggregation for better performance
    const menuData = await Menu.aggregate([
      { $match: { chef: new mongoose.Types.ObjectId(chefId) } },
      {
        $lookup: {
          from: 'sections',
          localField: 'sections',
          foreignField: '_id',
          as: 'sections',
          pipeline: [
            { $project: { name: 1, description: 1, dishes: 1 } }
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
            { $project: { name: 1, description: 1, price: 1, image: 1, isAvailable: 1, section: 1 } }
          ]
        }
      },
      {
        $project: {
          name: 1,
          description: 1,
          sections: 1,
          dishes: 1,
          created_at: 1
        }
      }
    ]);

    const menu = menuData[0];

    // Update hasMenu flag asynchronously based on actual menu existence
    if (menu && !chef.hasMenu) {
      User.findByIdAndUpdate(chefId, { hasMenu: true }).exec(); // Non-blocking
      chef.hasMenu = true;
    } else if (!menu && chef.hasMenu) {
      User.findByIdAndUpdate(chefId, { hasMenu: false }).exec(); // Non-blocking
      chef.hasMenu = false;
    }

    // Structure the response
    const chefProfile = {
      ...chef,
      menu: menu || null
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