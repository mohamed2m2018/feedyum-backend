const User = require('../../models/user');

const removeFromFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const dishId = req.params.dishId;

    if (!dishId) {
      return res.status(400).json({ 
        message: 'Dish ID is required' 
      });
    }

    // Get user and update favorites
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Initialize favorites array if it doesn't exist
    if (!user.favorites) {
      user.favorites = [];
    }

    // Check if in favorites
    if (!user.favorites.includes(dishId)) {
      return res.status(400).json({ 
        message: 'Dish not in favorites' 
      });
    }

    // Remove from favorites
    user.favorites = user.favorites.filter(id => id.toString() !== dishId);
    await user.save();

    res.status(200).json({ 
      message: 'Removed from favorites successfully',
      favorites: user.favorites 
    });
  } catch (error) {
    console.error('Error removing from favorites:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = removeFromFavorites;