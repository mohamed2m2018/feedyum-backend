const express = require('express');
const passport = require('passport');
const router = express.Router();

const sectionController = require('../controllers/sectionController');

// @route  POST api/sections
// @desc   Create a new section
// @access Private
router.post('/',
  passport.authenticate('jwt', { session: false }),
  sectionController.createSection
);

// @route  POST api/sections/cleanup-duplicates
// @desc   Clean up duplicate sections for the current user
// @access Private
router.post('/cleanup-duplicates',
  passport.authenticate('jwt', { session: false }),
  sectionController.cleanupDuplicateSections
);

// @route  GET api/sections/chef/:chefId
// @desc   Get sections by chef
// @access Public
router.get('/chef/:chefId',
  sectionController.getSectionsByChef
);

// @route  DELETE api/sections/:sectionId
// @desc   Delete a section (only if not used by any dishes)
// @access Private
router.delete('/:sectionId',
  passport.authenticate('jwt', { session: false }),
  sectionController.deleteSection
);

module.exports = router; 