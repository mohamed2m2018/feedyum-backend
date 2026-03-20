const Dish = require('../../models/dish');
const Menu = require('../../models/menu');
const Section = require('../../models/section');
const embeddingService = require('../../services/embeddingService');
const translationService = require('../../services/translationService');

const createDish = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      menuId,
      category,
      categories,
      sectionId,
      sectionName,
      sectionNameArabic,
      sectionNameEnglish,
      image,
      ingredients,
      preparationTime,
      tags,
      nutritionalInfo,
      dietaryInfo,
      optionGroups,
      // Bilingual fields
      nameArabic,
      nameEnglish,
      descriptionArabic,
      descriptionEnglish,
      pricingType,
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
        // Detect language and store bilingual names
        const sectionOriginalLang = translationService.detectLanguage(sectionName);
        section = new Section({
          name: sectionName.trim(),
          nameArabic: sectionNameArabic || (sectionOriginalLang === 'ar' ? sectionName.trim() : ''),
          nameEnglish: sectionNameEnglish || (sectionOriginalLang === 'en' ? sectionName.trim() : ''),
          originalLanguage: sectionOriginalLang,
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

    // Normalize categories: accept either single string `category` or array `categories`
    let normalizedCategories = [];
    if (Array.isArray(categories)) {
      normalizedCategories = categories
        .map(c => (typeof c === 'string' ? c.trim() : c))
        .filter(Boolean);
    } else if (typeof categories === 'string') {
      normalizedCategories = categories
        .split(/[,\n]/)
        .map(c => c.trim())
        .filter(Boolean);
    } else if (typeof category === 'string' && category.trim()) {
      normalizedCategories = [category.trim()];
    }

    // Process option groups — auto-detect language for bilingual names
    let processedOptionGroups = [];
    if (Array.isArray(optionGroups)) {
      processedOptionGroups = optionGroups.map(group => {
        const groupLang = translationService.detectLanguage(group.name || '');
        return {
          name: (group.name || '').trim(),
          nameArabic: group.nameArabic || (groupLang === 'ar' ? (group.name || '').trim() : ''),
          nameEnglish: group.nameEnglish || (groupLang === 'en' ? (group.name || '').trim() : ''),
          type: group.type || 'single',
          required: !!group.required,
          min: group.min || 0,
          max: group.max || 0,
          options: (group.options || []).map(opt => {
            const optLang = translationService.detectLanguage(opt.name || '');
            return {
              name: (opt.name || '').trim(),
              nameArabic: opt.nameArabic || (optLang === 'ar' ? (opt.name || '').trim() : ''),
              nameEnglish: opt.nameEnglish || (optLang === 'en' ? (opt.name || '').trim() : ''),
              priceAdjustment: opt.priceAdjustment || 0,
              isDefault: !!opt.isDefault,
            };
          }),
        };
      });
    }

    // Detect original language for bilingual support
    const nameOriginalLang = translationService.detectLanguage(name);
    const descOriginalLang = description ? translationService.detectLanguage(description) : nameOriginalLang;

    const dish = new Dish({
      id: dishId,
      name,
      // Bilingual name fields
      nameArabic: nameArabic || (nameOriginalLang === 'ar' ? name : ''),
      nameEnglish: nameEnglish || (nameOriginalLang === 'en' ? name : ''),
      originalNameLanguage: nameOriginalLang,

      description,
      // Bilingual description fields
      descriptionArabic: descriptionArabic || (descOriginalLang === 'ar' ? description : ''),
      descriptionEnglish: descriptionEnglish || (descOriginalLang === 'en' ? description : ''),
      originalDescriptionLanguage: descOriginalLang,

      price,
      category: (category && category.trim()) || normalizedCategories[0] || 'Main Course',
      categories: normalizedCategories,
      section: section?._id,
      menu: menuId,
      menu_id: numericMenuId,
      user_id: req.user._id,
      image: image || '',
      visible: true,
      pricingType: pricingType || 'fixed',
      average_rating: 0,
      // Enhanced fields
      ingredients: processedIngredients,
      preparationTime: preparationTime ? parseInt(preparationTime) : null,
      tags: processedTags,
      nutritionalInfo: nutritionalInfo || {},
      dietaryInfo: processedDietaryInfo,
      optionGroups: processedOptionGroups,
    });

    await dish.save();

    // Generate embedding in background (non-blocking to avoid memory timeout)
    setImmediate(async () => {
      try {
        const text = embeddingService.prepareTextForEmbedding(dish, [
          'name',
          'description',
          'category',
          'categories',
          'tags',
          'ingredients',
          'dietaryInfo'
        ]);

        if (text && text.trim().length > 0) {
          const embedding = await embeddingService.generateEmbedding(text);
          if (embedding) {
            await Dish.findByIdAndUpdate(dish._id, {
              embedding: embedding,
              embeddingGenerated: new Date()
            });
            console.log(`✅ Generated embedding for new dish: ${dish.name}`);
          } else {
            console.log(`⚠️ Failed to generate embedding for dish: ${dish.name}`);
          }
        }
      } catch (error) {
        console.error(`❌ Error generating embedding for dish ${dish.name}:`, error.message);
      }
    });

    menu.dishes.push(dish._id);
    await menu.save();

    // Populate section in response
    await dish.populate('section');

    // Emit socket event to notify chef dashboard about the new dish
    try {
      const socketModule = require('../../socket');
      const io = socketModule.getIO();
      if (io) {
        io.to(req.user._id.toString()).emit('chefDashboardUpdate', {
          type: 'dishCreated',
          dishId: dish._id.toString(),
          dish: dish
        });
        console.log(`[SOCKET] Emitted chefDashboardUpdate (dishCreated) to chef: ${req.user._id}`);
      }
    } catch (socketError) {
      console.error('[SOCKET] Failed to emit chefDashboardUpdate:', socketError.message);
    }

    res.status(201).json(dish);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = createDish;
