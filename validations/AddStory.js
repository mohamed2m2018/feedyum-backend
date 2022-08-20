const isEmpty = require('./assets/is-empty');
const Validator = require('validator');

module.exports = validateAddStory = (data) => {
  let errors = {};

    // For required fields

    data.title = !isEmpty(data.title) ? data.title : '';
    data.description = !isEmpty(data.description) ? data.description : '';
    data.category = !isEmpty(data.category) ? data.category : '';
    data.image = !isEmpty(data.image) ? data.image : '';


  if (Validator.isEmpty(data.title)) {
    errors.title = 'Title field is required';
  }

  if (Validator.isEmpty(data.category)) {
    errors.title = 'Category field is required';
  }

   if (Validator.isEmpty(data.description)) {
    errors.description = 'Description field is required';
  }

   if (Validator.isEmpty(data.image)) {
    errors.image = 'Image field is required';
  }

  if (data?.title && data?.title?.length< 5) {
    errors.title = 'Title is too short' ;
  }

  if (data?.description && data?.description?.length< 2) {
    errors.description = 'Description is too short' ;
  }

  if (data?.stories?.length === 0 ) {
    errors.stories = 'Empty stories are not acceptable' ;
  }

  if(data?.stories){
      data?.stories?.forEach(element => {
          if(!element?.media || !(element?.mediaType === 'image' ||element?.mediaType === 'video' )){
              errors.stories = 'Please send stories in the right format'
          }
      });
  }
  

  return {
    errors,
    isValid: isEmpty(errors)
  };
};