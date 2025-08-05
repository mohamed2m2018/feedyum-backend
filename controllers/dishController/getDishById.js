const Dish = require('../../models/dish');
const User = require('../../models/user');
const Review = require('../../models/review');
const { cleanResponseData } = require('../../utils/embeddingUtils');
const Rating = require('../../models/rating');

const getDishById = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const dishId = req.params.id;

    // Get dish with populated menu and chef info
    const dish = await Dish.findById(dishId)
      .populate('menu');
    
    // Manually populate chef info since user_id might be stored as string
    let chefInfo = null;
    if (dish && dish.user_id) {
      const User = require('../../models/user');
      chefInfo = await User.findById(dish.user_id).select('fullName avatar email');
    }

    if (!dish) {
      return res.status(404).json({ message: 'Dish not found' });
    }

    // Calculate average rating
    const ratings = await Rating.find({ dish: dishId });
    const averageRating = ratings.length > 0 
      ? ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length 
      : 0;

    // Get total reviews count
    const reviewsCount = await Review.countDocuments({ dish: dishId });

    // Check if dish is in user's favorites (if user is authenticated)
    let isFavorite = false;
    if (userId) {
      const user = await User.findById(userId);
      isFavorite = user && user.favorites && user.favorites.includes(dishId);
    }

    // Prepare enhanced dish data with ObjectId conversion
    const dishObject = dish.toObject();
    const enhancedDish = {
      ...dishObject,
      _id: dishObject._id.toString(),
      user_id: dishObject.user_id.toString(),
      menu: dishObject.menu ? {
        ...dishObject.menu,
        _id: dishObject.menu._id.toString()
      } : dishObject.menu,
      average_rating: Number(averageRating.toFixed(1)),
      reviews_count: reviewsCount,
      ratings_count: ratings.length,
      isFavorite: isFavorite,
      chef: chefInfo ? {
        ...chefInfo.toObject(),
        _id: chefInfo._id.toString()
      } : null,
      // Add nutritional info if available
      nutritionalInfo: dish.nutritionalInfo || {
        calories: dish.calories || null,
        protein: dish.protein || null,
        carbs: dish.carbs || null,
        fat: dish.fat || null,
        fiber: dish.fiber || null,
      },
      // Add dietary information
      dietaryInfo: dish.dietaryInfo || [],
      // Add ingredients list
      ingredients: dish.ingredients || [],
      // Add preparation time
      preparationTime: dish.preparationTime || null,
      // Add tags
      tags: dish.tags || [],
    };

    // Remove embeddings from response
    const cleanEnhancedDish = cleanResponseData(enhancedDish);
    res.status(200).json(cleanEnhancedDish);
  } catch (error) {
    console.error('Error fetching dish details:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = getDishById;
