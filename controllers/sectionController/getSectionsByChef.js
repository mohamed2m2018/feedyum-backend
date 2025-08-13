const Section = require('../../models/section');
const Dish = require('../../models/dish');
const mongoose = require('mongoose');

const getSectionsByChef = async (req, res) => {
  try {
    const { chefId } = req.params;
    
    // Get all sections that have dishes associated with them for this chef
    // Match on either string or ObjectId user_id to be robust
    const matchChef = mongoose.Types.ObjectId.isValid(chefId)
      ? {
          $or: [
            { user_id: chefId },
            { user_id: new mongoose.Types.ObjectId(chefId) }
          ],
        }
      : { user_id: chefId };

    const sectionsWithDishes = await Dish.aggregate([
      {
        $match: {
          ...matchChef,
          section: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$section'
        }
      },
      {
        $lookup: {
          from: 'sections',
          localField: '_id',
          foreignField: '_id',
          as: 'sectionDetails'
        }
      },
      {
        $unwind: '$sectionDetails'
      },
      {
        $replaceRoot: { newRoot: '$sectionDetails' }
      },
      {
        $sort: { created_at: -1 }
      }
    ]);
    
    res.status(200).json(sectionsWithDishes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = getSectionsByChef; 