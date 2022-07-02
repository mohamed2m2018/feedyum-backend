const isEmpty = require('./assets/is-empty');
const Validator = require('validator');

module.exports = validateEditUser = (data) => {
  let errors = {};

  if (data?.email && !Validator.isEmail(data.email)) {
    errors.email = 'Email is invalid' ;
  }

  if (data?.first_name && data?.first_name?.length< 2) {
    errors.firstName = 'first name is invalid' ;
  }

  if (data?.last_name && data?.last_name?.length< 2) {
    errors.lastName = 'last name is invalid' ;
  }

  if (data?.password) {
    errors.password = 'Update password has a separate endpoint' ;
  }
  

  return {
    errors,
    isValid: isEmpty(errors)
  };
};