const isEmpty = require('./assets/is-empty');
const Validator = require('validator');

const validateAddStory = (data) => {
  let errors = {};

    // For required fields

    data.caption = !isEmpty(data.caption) ? data.caption : '';
    data.uri = !isEmpty(data.uri) ? data.uri : '';


  if (Validator.isEmpty(data.caption)) {
    errors.title = 'Title field is required';
  }

  if (data?.caption && data?.caption?.length< 5) {
    errors.caption = 'Meal description is too short' ;
  }
  

  return {
    errors,
    isValid: isEmpty(errors)
  };
};

module.exports = validateAddStory;