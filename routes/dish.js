const express = require('express');
const passport = require('passport');
const router = express.Router();

const dishController = require('../controllers/dishController');

// @route  POST api/dishes
// @desc   Create a new dish and add it to a menu
// @access Private
router.post('/',
  passport.authenticate('jwt', { session: false }),
  dishController.createDish
);


router.get('/menu/:menuId',
  passport.authenticate('jwt', { session: false }),
  dishController.getDishesByMenuId
);
// @route  GET api/dishes
// @desc   Get all dishes
// @access Public
router.get('/',
  dishController.getAllDishes
);

// @route  GET api/dishes/:id
// @desc   Get a single dish by ID
// @access Public
router.get('/:id',
  dishController.getDishById
);

// @route  PUT api/dishes/:id
// @desc   Update a dish
// @access Private
router.put('/:id',
  passport.authenticate('jwt', { session: false }),
  dishController.updateDish
);

// @route  DELETE api/dishes/:id
// @desc   Delete a dish
// @access Private
router.delete('/:id',
  passport.authenticate('jwt', { session: false }),
  dishController.deleteDish
);

module.exports = router;
