const Menu = require('../../models/menu');

const getMenuByChef = async (req, res) => {
  try {
    const menu = await Menu.findOne({ chef: req.params.chefId })
      .populate({
        path: 'dishes',
        populate: {
          path: 'section',
          select: 'name description'
        }
      })
      .populate('chef');
    
    if (!menu) return res.status(404).json({ message: 'Menu not found' });
    res.status(200).json(menu);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = getMenuByChef;
