const Menu = require('../../models/menu');

const getAllMenus = async (req, res) => {
  try {
    const menus = await Menu.find().populate('dishes chef');
    res.status(200).json(menus);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = getAllMenus;
