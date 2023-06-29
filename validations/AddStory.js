const isEmpty = require('./assets/is-empty');
const Validator = require('validator');

module.exports = validateAddStory = (data) => {
  let errors = {};

    // For required fields

    data.caption = !isEmpty(data.caption) ? data.caption : '';
    data.category = !isEmpty(data.category) ? data.category : '';
    data.uri = !isEmpty(data.uri) ? data.uri : '';


  if (Validator.isEmpty(data.caption)) {
    errors.title = 'Title field is required';
  }

  if (Validator.isEmpty(data.category)) {
    errors.title = 'Category field is required';
  }

   if (Validator.isEmpty(data.uri)) {
    errors.uri = 'Uri field is required';
  }

  if (data?.caption && data?.caption?.length< 5) {
    errors.caption = 'Meal description is too short' ;
  }
  

  return {
    errors,
    isValid: isEmpty(errors)
  };
};