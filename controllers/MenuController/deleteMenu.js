const Menu = require('../../models/menu');

const deleteMenu = async (req, res) => {
  try {
    const menu = await Menu.findByIdAndDelete(req.params.id);
    if (!menu) return res.status(404).json({ message: 'Menu not found' });
    res.status(200).json({ message: 'Menu deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = deleteMenu;
