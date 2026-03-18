const Section = require('../../models/section');
const Dish = require('../../models/dish');
const Menu = require('../../models/menu');

const deleteSection = async (req, res) => {
  try {
    const { sectionId } = req.params;

    // Find section and verify ownership
    const section = await Section.findById(sectionId);
    if (!section) {
      return res.status(404).json({ message: 'Section not found' });
    }

    if (section.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this section' });
    }

    // Check if any dishes reference this section
    const dishCount = await Dish.countDocuments({ section: sectionId });
    if (dishCount > 0) {
      return res.status(400).json({
        code: 'SECTION_IN_USE',
        message: `Section is used by ${dishCount} dish(es)`,
        dishCount,
      });
    }

    // Remove section from any menus that reference it
    await Menu.updateMany(
      { sections: sectionId },
      { $pull: { sections: sectionId } }
    );

    // Delete the section
    await Section.findByIdAndDelete(sectionId);

    res.status(200).json({ message: 'Section deleted successfully' });
  } catch (error) {
    console.error('Delete section error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = deleteSection;
