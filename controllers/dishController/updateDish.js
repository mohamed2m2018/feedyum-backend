const Dish = require('../../models/dish');
const Section = require('../../models/section');
const Menu = require('../../models/menu');
const embeddingService = require('../../services/embeddingService');
const translationService = require('../../services/translationService');


const updateDish = async (req, res) => {
  try {
    console.log('Update Dish Request:', {
      id: req.params.id,
      body: req.body
    });

    const {
      sectionId,
      sectionName,
      sectionNameArabic,
      sectionNameEnglish,
      ingredients,
      tags,
      dietaryInfo,
      categories,
      // Bilingual fields
      nameArabic,
      nameEnglish,
      descriptionArabic,
      descriptionEnglish,
      ...updateData
    } = req.body;

    // Normalize categories if provided
    if (categories !== undefined) {
      if (Array.isArray(categories)) {
        updateData.categories = categories
          .map(c => (typeof c === 'string' ? c.trim() : c))
          .filter(Boolean);
      } else if (typeof categories === 'string') {
        updateData.categories = categories
          .split(/[,\n]/)
          .map(c => c.trim())
          .filter(Boolean);
      } else {
        updateData.categories = [];
      }

      // Keep legacy single `category` in sync if not explicitly set
      if (!updateData.category) {
        updateData.category = updateData.categories[0] || 'Main Course';
      }
    }

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
        // Detect language and store bilingual names for new section
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

    // Handle bilingual field updates
    if (nameArabic !== undefined) updateData.nameArabic = nameArabic;
    if (nameEnglish !== undefined) updateData.nameEnglish = nameEnglish;
    if (descriptionArabic !== undefined) updateData.descriptionArabic = descriptionArabic;
    if (descriptionEnglish !== undefined) updateData.descriptionEnglish = descriptionEnglish;

    // Detect and update language if name is being changed
    if (updateData.name) {
      const nameOriginalLang = translationService.detectLanguage(updateData.name);
      updateData.originalNameLanguage = nameOriginalLang;
      // Auto-populate the matching language field if not explicitly set
      if (nameOriginalLang === 'ar' && !nameArabic) {
        updateData.nameArabic = updateData.name;
      } else if (nameOriginalLang === 'en' && !nameEnglish) {
        updateData.nameEnglish = updateData.name;
      }
    }

    // Same for description
    if (updateData.description) {
      const descOriginalLang = translationService.detectLanguage(updateData.description);
      updateData.originalDescriptionLanguage = descOriginalLang;
      if (descOriginalLang === 'ar' && !descriptionArabic) {
        updateData.descriptionArabic = updateData.description;
      } else if (descOriginalLang === 'en' && !descriptionEnglish) {
        updateData.descriptionEnglish = updateData.description;
      }
    }

    console.log('Final Update Data:', updateData);

    const dish = await Dish.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate('section');

    if (!dish) return res.status(404).json({ message: 'Dish not found' });

    console.log('Updated Dish Result:', {
      id: dish._id,
      name: dish.name,
      price: dish.price,
      visible: dish.visible
    });

    // Regenerate embedding for the updated dish
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
          console.log(`✅ Regenerated embedding for updated dish: ${dish.name}`);
        } else {
          console.log(`⚠️ Failed to regenerate embedding for dish: ${dish.name}`);
        }
      }
    } catch (error) {
      console.error(`❌ Error regenerating embedding for dish ${dish.name}:`, error.message);
      // Don't fail the dish update if embedding generation fails
    }

    // Cache invalidation removed

    // Emit socket event to notify chef dashboard about the dish update
    try {
      const socketModule = require('../../socket');
      const io = socketModule.getIO();
      if (io) {
        io.to(req.user._id.toString()).emit('chefDashboardUpdate', {
          type: 'dishUpdated',
          dishId: dish._id.toString(),
          dish: dish
        });
        console.log(`[SOCKET] Emitted chefDashboardUpdate (dishUpdated) to chef: ${req.user._id}`);
      }
    } catch (socketError) {
      console.error('[SOCKET] Failed to emit chefDashboardUpdate:', socketError.message);
    }

    res.status(200).json(dish);
  } catch (error) {
    console.error('Update Dish Error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = updateDish;
