const Dish = require('../../models/dish');
const Menu = require('../../models/menu');

const createDish = async (req, res) => {
  try {
    const { name, description, price, menuId, category } = req.body;
    const menu = await Menu.findById(menuId);

    if (!menu) {
      return res.status(400).json({ message: 'Invalid menu ID' });
    }

    const dish = new Dish({ name, description, price, menu: menuId, category });
    await dish.save();

    menu.dishes.push(dish._id);
    const isCategoryExists = menu.categories.find(item=> item.name === category.name );
    if(!isCategoryExists){
      menu.categories.push(category);
    }
    await menu.save();

    res.status(201).json(dish);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = createDish;
