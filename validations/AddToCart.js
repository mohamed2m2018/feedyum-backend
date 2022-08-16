const isEmpty = require('./assets/is-empty');

module.exports = validateAddToCart = (data) => {
  let errors = {};

    // For required fields
    data.quantity = !isEmpty(data.quantity) ? data.quantity : '';
    data.storyId = !isEmpty(data.description) ? data.description : '';
    data.owner = !isEmpty(data.image) ? data.image : '';
  

  return {
    errors,
    isValid: isEmpty(errors)
  };
};