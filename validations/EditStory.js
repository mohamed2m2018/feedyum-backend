const isEmpty = require('./assets/is-empty');

module.exports = validateEditStory = (data) => {
  let errors = {};


  if (data?.description && data?.description?.length< 2) {
    errors.description = 'Description is too short' ;
  }

  if (data?.stories && data?.stories?.length ===0 ) {
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