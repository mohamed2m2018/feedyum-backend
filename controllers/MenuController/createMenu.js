const Menu = require('../../models/menu');
const User = require('../../models/user');

const createMenu = async (req, res) => {
  try {
    const {  name, description } = req.body;
    const chef = await User.findById(req.user._id);

    if (!chef || chef.type !== 'chef') {
      return res.status(400).json({ message: 'Invalid chef ID or user is not a chef' });
    }

    const existingMenu = await Menu.findOne({ chef: req.user._id });
    if (existingMenu) {
      return res.status(400).json({ message: 'Chef already has a menu. Only one menu is allowed per chef.' });
    }

    const menu = new Menu({ name, description, chef: req.user._id });
    await menu.save();
    res.status(201).json(menu);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = createMenu;
