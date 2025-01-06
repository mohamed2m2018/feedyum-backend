const Dish = require('../../models/dish');
const Menu = require('../../models/menu');

const deleteDish = async (req, res) => {
  try {
    const dish = await Dish.findByIdAndDelete(req.params.id);
    if (!dish) return res.status(404).json({ message: 'Dish not found' });

    // Remove dish from its menu
    await Menu.updateMany({}, { $pull: { dishes: dish._id } });

    res.status(200).json({ message: 'Dish deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = deleteDish;
