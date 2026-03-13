const express = require('express');
const router = express.Router();

/**
 * GET /api/config
 * Returns app configuration including minimum required version.
 * No authentication required — the app needs this before login.
 */
router.get('/', (req, res) => {
  const minVersionCode = process.env.MIN_VERSION_CODE
    ? parseInt(process.env.MIN_VERSION_CODE, 10)
    : null;

  res.json({
    // null = no update enforcement
    minVersionCode,
    // Store URLs for update redirection
    storeUrls: {
      android: 'https://play.google.com/store/apps/details?id=com.feedyum',
      ios: 'https://apps.apple.com/app/feedyum/id0000000000', // Update with real App Store ID
    },
  });
});

module.exports = router;
