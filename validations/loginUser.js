const isEmpty = require('./assets/is-empty');
const Validator = require('validator');

module.exports = function validateLoginInput(data) {
  let errors = {};

  data.email = !isEmpty(data.email) ? data.email : '';


  if (Validator.isEmpty(data.email)) {
    errors.email = 'Email is required';
  }


  if(!data.isGoogleSignIn){
    data.password = !isEmpty(data.password) ? data.password : '';

    if (Validator.isEmpty(data.password)) {
      errors.password = 'Password is required';
    }  
  }

  return {
    errors,
    isValid: isEmpty(errors)
  };
};
