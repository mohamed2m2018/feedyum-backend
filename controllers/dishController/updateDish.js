const Dish = require('../../models/dish');

const updateDish = async (req, res) => {
  try {
    const dish = await Dish.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!dish) return res.status(404).json({ message: 'Dish not found' });
    res.status(200).json(dish);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = updateDish;
