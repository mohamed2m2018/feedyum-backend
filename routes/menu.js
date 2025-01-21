const express = require('express');
const passport = require('passport');
const router = express.Router();

const menuController = require('../controllers/MenuController');

// @route  POST api/menus
// @desc   Create a new menu (only for chefs, and only one menu per chef)
// @access Private
router.post('/',
  passport.authenticate('jwt', { session: false }),
  menuController.createMenu
);


// @route  GET api/menus/chef/:chefId
// @desc   Get the menu by chef (user ID)
// @access Public
router.get('/chef/:chefId',
  menuController.getMenuByChef
);

// @route  GET api/menus
// @desc   Get all menus
// @access Public
router.get('/',
  menuController.getAllMenus
);

// @route  GET api/menus/:id
// @desc   Get a single menu by ID
// @access Public
router.get('/:id',
  menuController.getMenuById
);

// @route  PUT api/menus/:id
// @desc   Update a menu
// @access Private
router.put('/:id',
  passport.authenticate('jwt', { session: false }),
  menuController.updateMenu
);

// @route  DELETE api/menus/:id
// @desc   Delete a menu
// @access Private
router.delete('/:id',
  passport.authenticate('jwt', { session: false }),
  menuController.deleteMenu
);

module.exports = router;
