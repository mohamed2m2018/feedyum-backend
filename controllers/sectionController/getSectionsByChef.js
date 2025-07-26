const Section = require('../../models/section');

const getSectionsByChef = async (req, res) => {
  try {
    const { chefId } = req.params;
    
    const sections = await Section.find({ owner: chefId })
      .sort({ created_at: -1 })
      .lean();
    
    res.status(200).json(sections);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = getSectionsByChef; 