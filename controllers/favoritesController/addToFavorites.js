const User = require('../../models/user');
const Dish = require('../../models/dish');

const addToFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const { dishId, type } = req.body;

    if (!dishId || !type) {
      return res.status(400).json({ 
        message: 'Dish ID and type are required' 
      });
    }

    // Verify dish exists
    const dish = await Dish.findById(dishId);
    if (!dish) {
      return res.status(404).json({ message: 'Dish not found' });
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

    // Check if already in favorites
    if (user.favorites.includes(dishId)) {
      return res.status(400).json({ 
        message: 'Dish already in favorites' 
      });
    }

    // Add to favorites
    user.favorites.push(dishId);
    await user.save();

    res.status(200).json({ 
      message: 'Added to favorites successfully',
      favorites: user.favorites 
    });
  } catch (error) {
    console.error('Error adding to favorites:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = addToFavorites;