const Dish = require('../../models/dish');
const Section = require('../../models/section');
const Menu = require('../../models/menu');

const updateDish = async (req, res) => {
  try {
    const { sectionId, sectionName, ingredients, tags, dietaryInfo, ...updateData } = req.body;
    
    // Process ingredients - convert string to array if needed
    if (ingredients !== undefined) {
      if (typeof ingredients === 'string') {
        updateData.ingredients = ingredients
          .split(/[,;\n]/)
          .map(item => item.trim())
          .filter(item => item.length > 0);
      } else if (Array.isArray(ingredients)) {
        updateData.ingredients = ingredients.filter(item => item && item.trim());
      } else {
        updateData.ingredients = [];
      }
    }

    // Process tags
    if (tags !== undefined) {
      if (typeof tags === 'string') {
        updateData.tags = tags
          .split(/[,;\n]/)
          .map(item => item.trim())
          .filter(item => item.length > 0);
      } else if (Array.isArray(tags)) {
        updateData.tags = tags.filter(item => item && item.trim());
      } else {
        updateData.tags = [];
      }
    }

    // Process dietary info
    if (dietaryInfo !== undefined) {
      if (typeof dietaryInfo === 'string') {
        updateData.dietaryInfo = dietaryInfo
          .split(/[,;\n]/)
          .map(item => item.trim())
          .filter(item => item.length > 0);
      } else if (Array.isArray(dietaryInfo)) {
        updateData.dietaryInfo = dietaryInfo.filter(item => item && item.trim());
      } else {
        updateData.dietaryInfo = [];
      }
    }
    
    // Handle section update
    if (sectionId) {
      const section = await Section.findById(sectionId);
      if (!section || section.owner.toString() !== req.user._id.toString()) {
        return res.status(400).json({ message: 'Invalid section ID or access denied' });
      }
      updateData.section = sectionId;
    } else if (sectionName && sectionName.trim()) {
      // Try to find existing section or create new one
      let section = await Section.findOne({ 
        name: { $regex: new RegExp(`^${sectionName.trim()}$`, 'i') },
        owner: req.user._id 
      });
      
      if (!section) {
        section = new Section({ 
          name: sectionName.trim(), 
          description: '',
          owner: req.user._id
        });
        await section.save();
        
        // Find the dish's menu and add the new section to it
        const dish = await Dish.findById(req.params.id);
        if (dish && dish.menu) {
          const menu = await Menu.findById(dish.menu);
          if (menu && !menu.sections.includes(section._id)) {
            menu.sections.push(section._id);
            await menu.save();
          }
        }
      }
      updateData.section = section._id;
    }

    const dish = await Dish.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate('section');
    
    if (!dish) return res.status(404).json({ message: 'Dish not found' });
    
    res.status(200).json(dish);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = updateDish;
