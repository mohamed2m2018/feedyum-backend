const mongoose = require('mongoose');

// Models
const Category = mongoose.model('category');


const getCategory = (req, res) => {
  const errors = {};
  Category.find().lean()
    .then(async (categories) => {
      if (categories.length === 0) {
        // As a safety net, ensure categories exist, then re-query
        try {
          const { ensureCategoriesSeeded } = require('../../utils/seeders/ensureCategories');
          await ensureCategoriesSeeded();
          const refreshed = await Category.find().lean();
          return res.json(refreshed);
        } catch (seedErr) {
          errors.message = 'No categories found';
          return res.status(404).json(errors);
        }
      }
      return res.json(categories);
    })
    .catch((err) => {
      errors.error = 'Error fetching categories from database';
      res.status(500).json({ ...errors, ...err });
    });
};
module.exports = getCategory;