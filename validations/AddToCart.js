const isEmpty = require("./assets/is-empty");

module.exports = validateAddToCart = (data) => {
  let errors = {};


  if (!data?.quantity) {
    errors.message = "Quantity is required";
  } else if(!data?.storyId){
    errors.message = "Story id is required";

  }

  return {
    errors,
    isValid: isEmpty(errors),
  };
};
