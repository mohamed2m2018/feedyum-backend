const EnhancedNotificationService = require('../../services/enhancedNotificationService');
const User = require('../../models/user');
const Story = require('../../models/story');
const Dish = require('../../models/dish');
const Menu = require('../../models/menu');

const generateShareLink = async (req, res) => {
  try {
    const { type, contentId, customParams = {} } = req.body;
    const userId = req.user._id;

    if (!type || !contentId) {
      return res.status(400).json({
        message: 'Content type and ID are required'
      });
    }

    let shareLinks;
    let contentData = {};

    switch (type) {
      case 'reel':
      case 'story':
      case 'video':
        shareLinks = await generateReelShareLink(contentId, customParams);
        contentData = await getReelData(contentId);
        break;

      case 'profile':
      case 'userProfile':
        shareLinks = await generateProfileShareLink(contentId, customParams);
        contentData = await getProfileData(contentId);
        break;

      case 'chefProfile':
        shareLinks = await generateChefProfileShareLink(contentId, customParams);
        contentData = await getChefProfileData(contentId);
        break;

      case 'chefMenu':
        shareLinks = await generateChefMenuShareLink(contentId, customParams);
        contentData = await getChefMenuData(contentId);
        break;

      case 'menu':
        shareLinks = await generateMenuShareLink(contentId, customParams);
        contentData = await getMenuData(contentId);
        break;

      case 'dish':
        shareLinks = await generateDishShareLink(contentId, customParams);
        contentData = await getDishData(contentId);
        break;

      case 'live':
        shareLinks = await generateLiveShareLink(contentId, customParams);
        contentData = await getLiveData(contentId);
        break;

      default:
        return res.status(400).json({
          message: `Unsupported content type: ${type}`
        });
    }

    // Log sharing activity
    console.log(`User ${userId} generated share link for ${type}: ${contentId}`);

    res.json({
      success: true,
      shareLinks,
      contentData,
      message: 'Share links generated successfully'
    });

  } catch (error) {
    console.error('Generate share link error:', error);
    res.status(500).json({
      message: 'Failed to generate share link',
      error: error.message
    });
  }
};

// Helper functions for generating specific share links

async function generateReelShareLink(reelId, params = {}) {
  const shareableLinks = EnhancedNotificationService.generateShareableLink('reel', reelId, {
    ...params,
    utm_source: 'app_share',
    utm_medium: 'reel_share'
  });

  return {
    ...shareableLinks,
    shareText: params.shareText || 'Check out this amazing reel!',
    hashtags: ['#FoodTok', '#Food', '#Cooking'],
  };
}

async function generateProfileShareLink(profileId, params = {}) {
  const shareableLinks = EnhancedNotificationService.generateShareableLink('profile', profileId, {
    ...params,
    utm_source: 'app_share',
    utm_medium: 'profile_share'
  });

  return {
    ...shareableLinks,
    shareText: params.shareText || 'Check out this profile on FoodTok!',
    hashtags: ['#FoodTok', '#Profile'],
  };
}

async function generateChefProfileShareLink(chefId, params = {}) {
  const shareableLinks = EnhancedNotificationService.generateShareableLink('chefProfile', chefId, {
    ...params,
    utm_source: 'app_share',
    utm_medium: 'chef_profile_share'
  });

  return {
    ...shareableLinks,
    shareText: params.shareText || 'Check out this amazing chef on FoodTok!',
    hashtags: ['#FoodTok', '#Chef', '#Cooking'],
  };
}

async function generateChefMenuShareLink(chefId, params = {}) {
  const shareableLinks = EnhancedNotificationService.generateShareableLink('chefMenu', chefId, {
    ...params,
    utm_source: 'app_share',
    utm_medium: 'menu_share'
  });

  return {
    ...shareableLinks,
    shareText: params.shareText || 'Check out this delicious menu!',
    hashtags: ['#FoodTok', '#Menu', '#Delivery'],
  };
}

async function generateMenuShareLink(menuId, params = {}) {
  const shareableLinks = EnhancedNotificationService.generateShareableLink('menu', menuId, {
    ...params,
    utm_source: 'app_share',
    utm_medium: 'menu_share'
  });

  return {
    ...shareableLinks,
    shareText: params.shareText || 'Check out this amazing menu!',
    hashtags: ['#FoodTok', '#Menu'],
  };
}

async function generateDishShareLink(dishId, params = {}) {
  const shareableLinks = EnhancedNotificationService.generateShareableLink('dish', dishId, {
    ...params,
    utm_source: 'app_share',
    utm_medium: 'dish_share'
  });

  return {
    ...shareableLinks,
    shareText: params.shareText || 'Check out this delicious dish!',
    hashtags: ['#FoodTok', '#Food', '#Delicious'],
  };
}

async function generateLiveShareLink(liveId, params = {}) {
  const shareableLinks = EnhancedNotificationService.generateShareableLink('live', liveId, {
    ...params,
    utm_source: 'app_share',
    utm_medium: 'live_share'
  });

  return {
    ...shareableLinks,
    shareText: params.shareText || 'Join me live on FoodTok!',
    hashtags: ['#FoodTok', '#Live', '#Cooking'],
  };
}

// Helper functions for getting content data

async function getReelData(reelId) {
  try {
    const reel = await Story.findById(reelId)
      .populate('user', 'fullName username avatar')
      .select('title description video image likes comments shares created_at');

    if (!reel) {
      return { error: 'Reel not found' };
    }

    return {
      id: reel._id,
      title: reel.title || 'Untitled Reel',
      description: reel.description,
      creator: {
        name: reel.user.fullName,
        username: reel.user.username,
        avatar: reel.user.avatar
      },
      thumbnail: reel.image,
      stats: {
        likes: reel.likes?.length || 0,
        comments: reel.comments?.length || 0,
        shares: reel.shares || 0
      },
      createdAt: reel.created_at
    };
  } catch (error) {
    console.error('Error getting reel data:', error);
    return { error: 'Failed to get reel data' };
  }
}

async function getProfileData(profileId) {
  try {
    const user = await User.findById(profileId)
      .select('fullName username bio avatar followers following posts type');

    if (!user) {
      return { error: 'Profile not found' };
    }

    return {
      id: user._id,
      name: user.fullName,
      username: user.username,
      bio: user.bio,
      avatar: user.avatar,
      type: user.type,
      stats: {
        followers: user.followers?.length || 0,
        following: user.following?.length || 0,
        posts: user.posts?.length || 0
      }
    };
  } catch (error) {
    console.error('Error getting profile data:', error);
    return { error: 'Failed to get profile data' };
  }
}

async function getChefProfileData(chefId) {
  try {
    const chef = await User.findById(chefId)
      .select('fullName username bio avatar followers following posts type cuisineTypes experience rating')
      .populate('menu', 'name items');

    if (!chef || chef.type !== 'chef') {
      return { error: 'Chef not found' };
    }

    return {
      id: chef._id,
      name: chef.fullName,
      username: chef.username,
      bio: chef.bio,
      avatar: chef.avatar,
      cuisineTypes: chef.cuisineTypes || [],
      experience: chef.experience,
      rating: chef.rating || 0,
      stats: {
        followers: chef.followers?.length || 0,
        following: chef.following?.length || 0,
        posts: chef.posts?.length || 0,
        menuItems: chef.menu?.items?.length || 0
      }
    };
  } catch (error) {
    console.error('Error getting chef profile data:', error);
    return { error: 'Failed to get chef profile data' };
  }
}

async function getChefMenuData(chefId) {
  try {
    const chef = await User.findById(chefId)
      .select('fullName username avatar')
      .populate({
        path: 'menu',
        populate: {
          path: 'items',
          select: 'name price image description category'
        }
      });

    if (!chef || chef.type !== 'chef') {
      return { error: 'Chef not found' };
    }

    return {
      chefId: chef._id,
      chefName: chef.fullName,
      chefUsername: chef.username,
      chefAvatar: chef.avatar,
      menu: chef.menu ? {
        id: chef.menu._id,
        name: chef.menu.name,
        items: chef.menu.items || []
      } : null
    };
  } catch (error) {
    console.error('Error getting chef menu data:', error);
    return { error: 'Failed to get chef menu data' };
  }
}

async function getMenuData(menuId) {
  try {
    const menu = await Menu.findById(menuId)
      .populate('chef', 'fullName username avatar')
      .populate('items', 'name price image description category');

    if (!menu) {
      return { error: 'Menu not found' };
    }

    return {
      id: menu._id,
      name: menu.name,
      description: menu.description,
      chef: {
        id: menu.chef._id,
        name: menu.chef.fullName,
        username: menu.chef.username,
        avatar: menu.chef.avatar
      },
      items: menu.items || [],
      stats: {
        itemCount: menu.items?.length || 0
      }
    };
  } catch (error) {
    console.error('Error getting menu data:', error);
    return { error: 'Failed to get menu data' };
  }
}

async function getDishData(dishId) {
  try {
    const dish = await Dish.findById(dishId)
      .populate('chef', 'fullName username avatar');

    if (!dish) {
      return { error: 'Dish not found' };
    }

    return {
      id: dish._id,
      name: dish.name,
      description: dish.description,
      price: dish.price,
      image: dish.image,
      category: dish.category,
      chef: {
        id: dish.chef._id,
        name: dish.chef.fullName,
        username: dish.chef.username,
        avatar: dish.chef.avatar
      },
      stats: {
        rating: dish.rating || 0,
        reviews: dish.reviews?.length || 0
      }
    };
  } catch (error) {
    console.error('Error getting dish data:', error);
    return { error: 'Failed to get dish data' };
  }
}

async function getLiveData(liveId) {
  try {
    // Assuming you have a Live model or use Story for live streams
    const live = await Story.findById(liveId)
      .populate('user', 'fullName username avatar')
      .select('title description isLive viewers');

    if (!live || !live.isLive) {
      return { error: 'Live stream not found or not active' };
    }

    return {
      id: live._id,
      title: live.title || 'Live Stream',
      description: live.description,
      streamer: {
        name: live.user.fullName,
        username: live.user.username,
        avatar: live.user.avatar
      },
      stats: {
        viewers: live.viewers || 0
      },
      isLive: live.isLive
    };
  } catch (error) {
    console.error('Error getting live data:', error);
    return { error: 'Failed to get live data' };
  }
}

module.exports = generateShareLink; 