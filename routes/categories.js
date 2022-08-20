const express = require('express');
const passport = require('passport');

const router = express.Router();

const categoryController = require('../controllers/categoryController');

// @route  GET api/categories/
// @desc   Get categories
// @access Public

router.get('/', categoryController.getCategories );



module.exports = router;