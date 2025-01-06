const Dish = require('../../models/dish');

const getDishById = async (req, res) => {
  try {
    const dish = await Dish.findById(req.params.id).populate('menu');
    if (!dish) return res.status(404).json({ message: 'Dish not found' });
    res.status(200).json(dish);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = getDishById;
