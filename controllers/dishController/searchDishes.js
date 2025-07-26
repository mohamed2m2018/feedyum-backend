const Dish = require('../../models/dish');
const User = require('../../models/user');

const searchDishes = async (req, res) => {
  try {
    const { searchString, page = 1, limit = 10 } = req.query;
    console.log('Search dishes called with:', { searchString, page, limit });
    
    // If no search string, return all visible dishes
    if (!searchString || searchString.trim() === '') {
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      const query = { visible: { $ne: false } };
      const totalDishes = await Dish.countDocuments(query);
      const totalPages = Math.ceil(totalDishes / limitNum);

      const dishes = await Dish.find(query)
        .populate('user_id', 'fullName avatar')
        .sort({ average_rating: -1, created_at: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean();

      const formattedDishes = dishes.map(dish => ({
        ...dish,
        chef: dish.user_id
      }));

      return res.status(200).json({
        success: true,
        data: {
          dishes: formattedDishes,
          pagination: {
            currentPage: pageNum,
            totalPages,
            totalItems: totalDishes,
            hasNextPage: pageNum < totalPages,
            hasPrevPage: pageNum > 1
          }
        }
      });
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Create search query
    const searchQuery = {
      visible: { $ne: false }, // Only visible dishes
      $or: [
        { name: { $regex: searchString, $options: 'i' } },
        { description: { $regex: searchString, $options: 'i' } },
        { category: { $regex: searchString, $options: 'i' } },
        { tags: { $in: [new RegExp(searchString, 'i')] } },
        { 'dietaryInfo': { $in: [new RegExp(searchString, 'i')] } }
      ]
    };

    // Get total count for pagination
    const totalDishes = await Dish.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalDishes / limitNum);

    // Find dishes with pagination
    const dishes = await Dish.find(searchQuery)
      .populate('user_id', 'fullName avatar')
      .sort({ average_rating: -1, created_at: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Format response
    const formattedDishes = dishes.map(dish => ({
      ...dish,
      chef: dish.user_id
    }));

    res.status(200).json({
      success: true,
      data: {
        dishes: formattedDishes,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalItems: totalDishes,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        }
      }
    });

  } catch (error) {
    console.error('Error searching dishes:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

module.exports = searchDishes;