// controllers/viewsController.js
const mongoose = require('mongoose');
const View = mongoose.model('view');
const Story = mongoose.model('story');

// Update views for a story
const updateViews = async (req, res) => {
  const { storyId, userId } = req.body;

  try {
    // Validate required fields
    if (!storyId || !userId) {
      return res.status(400).json({ error: 'storyId and userId are required' });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(storyId)) {
      return res.status(400).json({ error: 'Invalid storyId format' });
    }
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid userId format' });
    }

    // Check if the user has already viewed the story
    const existingView = await View.findOne({ story: storyId, user_id: userId });
    if (existingView) {
      return res.json({ message: 'You viewed it before' });
    }

    // Create a new view for the story
    const newView = new View({ story: storyId, user_id: userId });
    await newView.save();

    // Increase the view count of the story
    await Story.findByIdAndUpdate(storyId, { $inc: { views: 1 } });

    res.json({ message: 'Views updated successfully' });
  } catch (error) {
    console.log('Error:', error);
    res.status(500).json({ error: 'Failed to update views' });
  }
};

module.exports = updateViews;