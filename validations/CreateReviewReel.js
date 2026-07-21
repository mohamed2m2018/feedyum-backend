const isEmpty = require('./assets/is-empty');
const Validator = require('validator');

const validateCreateReviewReel = (data) => {
  let errors = {};

  // Convert to strings for validation
  data.caption = !isEmpty(data.caption) ? data.caption : '';
  data.rating = !isEmpty(data.rating) ? data.rating.toString() : '';
  data.reviewType = !isEmpty(data.reviewType) ? data.reviewType : '';

  // Caption validation
  if (Validator.isEmpty(data.caption)) {
    errors.caption = 'Review caption is required';
  }

  if (data.caption && data.caption.length < 10) {
    errors.caption = 'Review caption must be at least 10 characters long';
  }

  if (data.caption && data.caption.length > 500) {
    errors.caption = 'Review caption cannot exceed 500 characters';
  }

  // Rating validation
  if (Validator.isEmpty(data.rating)) {
    errors.rating = 'Rating is required';
  }

  if (data.rating && (!Validator.isInt(data.rating, { min: 1, max: 5 }))) {
    errors.rating = 'Rating must be between 1 and 5';
  }

  // Review type validation
  if (Validator.isEmpty(data.reviewType)) {
    errors.reviewType = 'Review type is required';
  }

  if (data.reviewType && !['dish', 'menu', 'restaurant'].includes(data.reviewType)) {
    errors.reviewType = 'Review type must be "dish", "menu", or "restaurant"';
  }

  // Dish/Menu ID validation based on review type
  if (data.reviewType === 'dish') {
    data.dishId = !isEmpty(data.dishId) ? data.dishId : '';
    if (Validator.isEmpty(data.dishId)) {
      errors.dishId = 'Dish ID is required for dish reviews';
    }
  }

  if (data.reviewType === 'menu') {
    data.menuId = !isEmpty(data.menuId) ? data.menuId : '';
    if (Validator.isEmpty(data.menuId)) {
      errors.menuId = 'Menu ID is required for menu reviews';
    }
  }

  // Restaurant type (scouting missions) does not require dishId or menuId

  return {
    errors,
    isValid: isEmpty(errors)
  };
};

module.exports = validateCreateReviewReel;
