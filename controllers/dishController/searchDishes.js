const Dish = require('../../models/dish');
const User = require('../../models/user');
const mongoose = require('mongoose');

const searchDishes = async (req, res) => {
  try {
    const { searchString, page = 1, limit = 10, chefId } = req.query;
    console.log('Traditional dish search called with:', { searchString, page, limit });

    // If no search string, return all visible dishes
    if (!searchString || searchString.trim() === '') {
      console.log('No search string provided, returning all visible dishes');
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      const query = { visible: { $ne: false } };
      if (chefId) {
        query.user_id = mongoose.Types.ObjectId.isValid(chefId) ? new mongoose.Types.ObjectId(chefId) : chefId;
      }
      const totalDishes = await Dish.countDocuments(query);
      const totalPages = Math.ceil(totalDishes / limitNum);

      const dishes = await Dish.find(query)
        .populate('user_id', 'fullName avatar averageRating')
        .sort({ averageRating: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean();

      // Remove embeddings, normalize ratings, and add chef field
      const dishesWithoutEmbeddings = dishes.map(dish => {
        const { embedding, embeddingGenerated, ...dishWithoutEmbedding } = dish;
        return {
          ...dishWithoutEmbedding,
          averageRating: dish.average_rating || 0,
          chef: dish.user_id ? {
            _id: dish.user_id._id,
            fullName: dish.user_id.fullName,
            avatar: dish.user_id.avatar,
            averageRating: dish.user_id.averageRating || 0,
          } : null,
        };
      });

      console.log(`Traditional dishes search found ${dishesWithoutEmbeddings.length} dishes for query: "${searchString}"`);

      return res.status(200).json({
        success: true,
        dishes: dishesWithoutEmbeddings,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalItems: totalDishes,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1,
        },
      });
    }

    console.log(`Searching for dishes with term: "${searchString}"`);
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
    if (chefId) {
      searchQuery.user_id = mongoose.Types.ObjectId.isValid(chefId) ? new mongoose.Types.ObjectId(chefId) : chefId;
    }

    console.log('Dish search query:', JSON.stringify(searchQuery, null, 2));

    // Get total count for pagination
    const totalDishes = await Dish.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalDishes / limitNum);

    console.log(`Found ${totalDishes} dishes matching search criteria`);

    // Get dishes with pagination
    const dishes = await Dish.find(searchQuery)
      .populate('user_id', 'fullName avatar averageRating')
      .sort({ average_rating: -1, created_at: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Format dishes with chef information, normalize ratings, and convert ObjectIds to strings
    const formattedDishes = dishes.map(dish => ({
      ...dish,
      _id: dish._id.toString(),
      user_id: dish.user_id?._id?.toString() || dish.user_id,
      menu: dish.menu ? dish.menu.toString() : dish.menu,
      averageRating: dish.average_rating || 0,
      chef: dish.user_id ? {
        _id: dish.user_id._id?.toString() || dish.user_id._id,
        fullName: dish.user_id.fullName,
        avatar: dish.user_id.avatar,
        averageRating: dish.user_id.averageRating || 0,
      } : null
    }));

    console.log(`Returning ${formattedDishes.length} dishes for page ${pageNum}`);

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

  } catch (error) {
    console.error('Dish search error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to search dishes',
      data: {
        dishes: [],
        pagination: {
          currentPage: parseInt(req.query.page || 1),
          totalPages: 0,
          totalItems: 0,
          hasNextPage: false,
          hasPrevPage: false
        }
      }
    });
  }
};

module.exports = searchDishes;