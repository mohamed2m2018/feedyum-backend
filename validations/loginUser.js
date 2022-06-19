const isEmpty = require('./assets/is-empty');
const Validator = require('validator');

module.exports = function validateLoginInput(data) {
  let errors = {};

  data.username = !isEmpty(data.username) ? data.username : '';
  data.password = !isEmpty(data.password) ? data.password : '';


  if (Validator.isEmpty(data.username)) {
    errors.username = 'username is required';
  }


  if (Validator.isEmpty(data.password)) {
    errors.password = 'Password is required';
  }

  return {
    errors,
    isValid: isEmpty(errors)
  };
};
