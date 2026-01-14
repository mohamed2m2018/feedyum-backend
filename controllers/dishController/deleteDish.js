const Dish = require('../../models/dish');
const Menu = require('../../models/menu');

const deleteDish = async (req, res) => {
  try {
    const dish = await Dish.findByIdAndDelete(req.params.id);
    if (!dish) return res.status(404).json({ message: 'Dish not found' });

    // Remove dish from its menu
    await Menu.updateMany({}, { $pull: { dishes: dish._id } });

    // Emit socket event to notify chef dashboard about the dish deletion
    try {
      const socketModule = require('../../socket');
      const io = socketModule.getIO();
      if (io) {
        io.to(req.user._id.toString()).emit('chefDashboardUpdate', {
          type: 'dishDeleted',
          dishId: dish._id.toString()
        });
        console.log(`[SOCKET] Emitted chefDashboardUpdate (dishDeleted) to chef: ${req.user._id}`);
      }
    } catch (socketError) {
      console.error('[SOCKET] Failed to emit chefDashboardUpdate:', socketError.message);
    }

    res.status(200).json({ message: 'Dish deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = deleteDish;
