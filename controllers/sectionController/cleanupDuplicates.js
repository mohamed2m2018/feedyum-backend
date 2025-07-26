const Section = require('../../models/section');
const Dish = require('../../models/dish');
const Menu = require('../../models/menu');

const cleanupDuplicateSections = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get all sections for this user
    const allSections = await Section.find({ owner: userId });
    
    // Group sections by name (case-insensitive)
    const sectionGroups = {};
    allSections.forEach(section => {
      const normalizedName = section.name.toLowerCase().trim();
      if (!sectionGroups[normalizedName]) {
        sectionGroups[normalizedName] = [];
      }
      sectionGroups[normalizedName].push(section);
    });
    
    let duplicatesRemoved = 0;
    let dishesUpdated = 0;
    
    // Process each group
    for (const [normalizedName, sections] of Object.entries(sectionGroups)) {
      if (sections.length > 1) {
        // Keep the oldest section (first created)
        const sectionToKeep = sections.reduce((oldest, current) => 
          oldest.created_at < current.created_at ? oldest : current
        );
        
        const sectionsToRemove = sections.filter(s => s._id.toString() !== sectionToKeep._id.toString());
        
        // Update all dishes that reference the duplicate sections
        for (const sectionToRemove of sectionsToRemove) {
          const dishesWithDuplicateSection = await Dish.find({ section: sectionToRemove._id });
          
          // Update dishes to use the section we're keeping
          await Dish.updateMany(
            { section: sectionToRemove._id },
            { section: sectionToKeep._id }
          );
          
          dishesUpdated += dishesWithDuplicateSection.length;
          
          // Remove the duplicate section from any menus
          await Menu.updateMany(
            { sections: sectionToRemove._id },
            { $pull: { sections: sectionToRemove._id } }
          );
          
          // Ensure the section we're keeping is in the menu
          const menusWithDishes = await Menu.find({ 
            chef: userId,
            sections: { $ne: sectionToKeep._id }
          });
          
          for (const menu of menusWithDishes) {
            if (!menu.sections.includes(sectionToKeep._id)) {
              menu.sections.push(sectionToKeep._id);
              await menu.save();
            }
          }
          
          // Delete the duplicate section
          await Section.findByIdAndDelete(sectionToRemove._id);
          duplicatesRemoved++;
        }
      }
    }
    
    res.status(200).json({ 
      success: true,
      message: `Cleanup completed. Removed ${duplicatesRemoved} duplicate sections and updated ${dishesUpdated} dishes.`,
      duplicatesRemoved,
      dishesUpdated
    });
    
  } catch (error) {
    console.error('Error during cleanup:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

module.exports = cleanupDuplicateSections; 