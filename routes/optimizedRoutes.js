const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Import optimized controllers
const getStoriesOptimized = require('../controllers/storyController/getStoriesOptimized');
const getDishesByCategoryOptimized = require('../controllers/dishController/getDishesByCategoryOptimized');

// Optimized story routes
router.get('/stories/optimized', auth, getStoriesOptimized);

// Optimized dish routes  
router.get('/dishes/category/:category/optimized', getDishesByCategoryOptimized);

// Health check for optimization services
router.get('/health/cache', async (req, res) => {
  try {
    const cacheManager = require('../utils/cacheManager');
    const health = await cacheManager.healthCheck();
    res.json({
      cache: health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      cache: { status: 'error', error: error.message },
      timestamp: new Date().toISOString()
    });
  }
});

// Cache management routes (for development/admin)
router.delete('/cache/stories', auth, async (req, res) => {
  try {
    const cacheManager = require('../utils/cacheManager');
    const { userId, categoryIds } = req.query;
    
    await cacheManager.invalidateStoriesCache(userId, categoryIds);
    
    res.json({
      message: 'Stories cache invalidated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to invalidate cache',
      message: error.message
    });
  }
});

// Database optimization setup route (run once during deployment)
router.post('/admin/optimize-database', async (req, res) => {
  try {
    // Check if user has admin privileges (implement your auth logic)
    const isAdmin = req.user?.type === 'admin' || process.env.NODE_ENV === 'development';
    
    if (!isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const DatabaseOptimizations = require('../utils/databaseOptimizations');
    await DatabaseOptimizations.createOptimizedIndexes();
    
    res.json({
      message: 'Database optimization completed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Database optimization failed',
      message: error.message
    });
  }
});

module.exports = router;