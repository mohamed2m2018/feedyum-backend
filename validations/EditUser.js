const isEmpty = require('./assets/is-empty');
const Validator = require('validator');

module.exports = validateEditUser = (data) => {
  let errors = {};

  if (data?.email && !Validator.isEmail(data.email)) {
    errors.email = 'Email is invalid' ;
  }

  if (data?.fullName && data?.fullName?.length< 2) {
    errors.fullName = 'Full name is invalid' ;
  }

  if (data?.password) {
    errors.password = 'Update password has a separate endpoint' ;
  }
  

  return {
    errors,
    isValid: isEmpty(errors)
  };
};