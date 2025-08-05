const Dish = require('../../models/dish');
const { cleanResponseData } = require('../../utils/embeddingUtils');

const getAllDishes = async (req, res) => {
  try {
    const dishes = await Dish.find().populate('menu').lean();
    
    // Transform ObjectIds to strings
    const transformedDishes = dishes.map(dish => ({
      ...dish,
      _id: dish._id.toString(),
      user_id: dish.user_id.toString(),
      menu: dish.menu ? {
        ...dish.menu,
        _id: dish.menu._id.toString()
      } : dish.menu,
      // Add chef information for easier access
      chef: {
        _id: dish.user_id.toString()
      }
    }));
    
    // Remove embeddings from response
    const cleanDishes = cleanResponseData(transformedDishes);
    res.status(200).json(cleanDishes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = getAllDishes;
