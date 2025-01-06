const Dish = require('../../models/dish');

const getAllDishes = async (req, res) => {
  try {
    const dishes = await Dish.find().populate('menu');
    res.status(200).json(dishes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = getAllDishes;
