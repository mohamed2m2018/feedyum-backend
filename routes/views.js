const express = require('express');

const router = express.Router();

const viewController = require('../controllers/viewsController');

router.get('/user/:userId',
  viewController.getViewsByUser,
);

router.get('/user/:storyId',
  viewController.getViewsByPost,
);
// @route  POST api/views/:postId
// @desc   uodate view
// @access Private
router.post('/',
  viewController.updateViews
);

router.get('/',
  viewController.getViews
);




module.exports = router;