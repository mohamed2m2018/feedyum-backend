const Dish = require('../../models/dish');
const Menu = require('../../models/menu');
const Section = require('../../models/section');
const embeddingService = require('../../services/embeddingService');

const createDish = async (req, res) => {
  try {
    const { 
      name, 
      description, 
      price, 
      menuId, 
      category, 
      sectionId, 
      sectionName, 
      image,
      ingredients,
      preparationTime,
      tags,
      nutritionalInfo,
      dietaryInfo
    } = req.body;
    const menu = await Menu.findById(menuId);

    if (!menu) {
      return res.status(400).json({ message: 'Invalid menu ID' });
    }

    let section = null;
    
    // Handle section - either use existing sectionId or create new section from sectionName
    if (sectionId) {
      section = await Section.findById(sectionId);
      if (!section || section.owner.toString() !== req.user._id.toString()) {
        return res.status(400).json({ message: 'Invalid section ID or access denied' });
      }
    } else if (sectionName && sectionName.trim()) {
      // Try to find existing section or create new one
      section = await Section.findOne({ 
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
        
        // Add the new section to the menu's sections array if it's not already there
        if (!menu.sections.includes(section._id)) {
          menu.sections.push(section._id);
          await menu.save();
        }
      }
    }

    // Generate unique numeric ID for the dish
    const dishId = Math.floor(Math.random() * 1000000) + Date.now();
    
    // Convert ObjectId to numeric menu_id
    const numericMenuId = parseInt(menuId.slice(-8), 16);

    // Process ingredients - convert string to array if needed
    let processedIngredients = [];
    if (ingredients) {
      if (typeof ingredients === 'string') {
        // Split by comma, semicolon, or newline and clean up
        processedIngredients = ingredients
          .split(/[,;\n]/)
          .map(item => item.trim())
          .filter(item => item.length > 0);
      } else if (Array.isArray(ingredients)) {
        processedIngredients = ingredients.filter(item => item && item.trim());
      }
    }

    // Process tags
    let processedTags = [];
    if (tags) {
      if (typeof tags === 'string') {
        processedTags = tags
          .split(/[,;\n]/)
          .map(item => item.trim())
          .filter(item => item.length > 0);
      } else if (Array.isArray(tags)) {
        processedTags = tags.filter(item => item && item.trim());
      }
    }

    // Process dietary info
    let processedDietaryInfo = [];
    if (dietaryInfo) {
      if (typeof dietaryInfo === 'string') {
        processedDietaryInfo = dietaryInfo
          .split(/[,;\n]/)
          .map(item => item.trim())
          .filter(item => item.length > 0);
      } else if (Array.isArray(dietaryInfo)) {
        processedDietaryInfo = dietaryInfo.filter(item => item && item.trim());
      }
    }

    const dish = new Dish({ 
      id: dishId,
      name, 
      description, 
      price, 
      category: category || 'Main Course',
      section: section?._id,
      menu: menuId,
      menu_id: numericMenuId,
      user_id: req.user._id,
      image: image || '',
      visible: true,
      average_rating: 0,
      // Enhanced fields
      ingredients: processedIngredients,
      preparationTime: preparationTime ? parseInt(preparationTime) : null,
      tags: processedTags,
      nutritionalInfo: nutritionalInfo || {},
      dietaryInfo: processedDietaryInfo,
    });
    
    await dish.save();

    // Generate embedding for the new dish
    try {
      const text = embeddingService.prepareTextForEmbedding(dish, [
        'name',
        'description', 
        'category',
        'tags',
        'ingredients',
        'dietaryInfo'
      ]);
      
      if (text && text.trim().length > 0) {
        const embedding = await embeddingService.generateEmbedding(text);
        if (embedding) {
          dish.embedding = embedding;
          dish.embeddingGenerated = new Date();
          await dish.save();
          console.log(`✅ Generated embedding for new dish: ${dish.name}`);
        } else {
          console.log(`⚠️ Failed to generate embedding for dish: ${dish.name}`);
        }
      }
    } catch (error) {
      console.error(`❌ Error generating embedding for dish ${dish.name}:`, error.message);
      // Don't fail the dish creation if embedding generation fails
    }

    menu.dishes.push(dish._id);
    await menu.save();

    // Populate section in response
    await dish.populate('section');

    res.status(201).json(dish);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = createDish;
