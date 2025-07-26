const Section = require('../../models/section');

const createSection = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Section name is required' });
    }

    // Check if section already exists for this user
    const existingSection = await Section.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      owner: req.user._id 
    });
    
    if (existingSection) {
      return res.status(200).json(existingSection); // Return existing section
    }

    const section = new Section({ 
      name: name.trim(), 
      description: description?.trim() || '',
      owner: req.user._id
    });
    
    await section.save();
    res.status(201).json(section);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = createSection; 