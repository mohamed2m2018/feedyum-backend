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

// @route  GET api/dishes/chef/:chefId
// @desc   Get dishes by chef ID
// @access Private
router.get('/chef/:chefId',
  passport.authenticate('jwt', { session: false }),
  dishController.getDishesByChef
);

// @route  GET api/dishes/category/:category
// @desc   Get dishes by category
// @access Public
router.get('/category/:category',
  dishController.getDishesByCategory
);
// @route  GET api/dishes/test
// @desc   Test dishes endpoint
// @access Public
router.get('/test', (req, res) => {
  res.json({ message: 'Dishes endpoint is working', timestamp: new Date() });
});

// @route  GET api/dishes/search
// @desc   Search dishes
// @access Public
router.get('/search',
  dishController.searchDishes
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
