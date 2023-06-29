// controllers/viewController.js

const mongoose = require('mongoose');

const View = mongoose.model('view');

const updateViews = async (req, res) => {
  try {
    const { storyId, userId } = req.body;

    // Find the view entry for the story
    let view = await View.findOne({ story: storyId });

    if (!view) {
      // Create a new view entry if it doesn't exist
      view = new View({ story: storyId});
    }

    // Increment the view count
    view.count += 1;

    view.user_id = userId;

    // Save the updated view entry
    await view.save();

    res.json({ count: view.count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error updating views' });
  }
};

module.exports = updateViews;
