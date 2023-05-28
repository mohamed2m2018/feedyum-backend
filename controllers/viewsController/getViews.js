// controllers/viewController.js

const mongoose = require('mongoose');

const View = mongoose.model('view');

const getViews = async (req, res) => {
  try {
    const { storyId } = req.params;

    // Find the view entry for the story
    const view = await View.findOne({ story: storyId });

    if (!view) {
      res.json({ count: 0 });
    } else {
      res.json({ count: view.count });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error getting views' });
  }
};

module.exports = getViews;
