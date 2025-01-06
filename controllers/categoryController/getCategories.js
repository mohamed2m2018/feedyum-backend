const mongoose = require('mongoose');

// Models
const Category = mongoose.model('category');


const getCategory = (req, res) => {
  const errors = {};
  Category.find().lean()
    .then((categories) => {
      if (categories.length === 0) {
        errors.message = 'No categories found';
        return res.status(404).json(errors);
      }
      return res.json(categories);
    })
    .catch((err) => {
      errors.error = 'Error fetching categories from database';
      res.status(500).json({ ...errors, ...err });
    });
};
module.exports = getCategory;