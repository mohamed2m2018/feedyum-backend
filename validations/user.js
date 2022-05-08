const isEmpty = require('./assets/is-empty');
const Validator = require('validator');

module.exports = validateSignupUser = (data) => {
  let errors = [];

  // For required fields

  data.email = !isEmpty(data.email) ? data.email : '';
  data.password = !isEmpty(data.password) ? data.password : '';
 



  // email
  if (Validator.isEmpty(data.email)) {
    errors.push('Email field is required') ;
  }
  if (!Validator.isEmail(data.email)) {
    errors.push('Email is invalid') ;

  }

  // password
  if (Validator.isEmpty(data.password)) {
    errors.push('Password field is required') ;

  }

  if (!Validator.isLength(data.password, { min: 6, max: 30 })) {
    errors.push('Password must be at least 6 characters') ;

  }

  return {
    errors,
    isValid: isEmpty(errors)
  };
};