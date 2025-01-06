const Menu = require('../../models/menu');

const getMenuById = async (req, res) => {
  try {
    const menu = await Menu.findById(req.params.id).populate('dishes chef');
    if (!menu) return res.status(404).json({ message: 'Menu not found' });
    res.status(200).json(menu);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = getMenuById;
