/**
 * Track Activity Middleware
 * Updates user.lastActiveAt on authenticated API requests.
 * Throttled to update at most once per hour to avoid excessive DB writes.
 */

const THROTTLE_MS = 60 * 60 * 1000; // 1 hour

// In-memory cache of last update times to avoid DB reads on every request
const lastUpdateCache = new Map();

const trackActivity = async (req, res, next) => {
  try {
    if (!req.user?._id) return next();

    const userId = req.user._id.toString();
    const now = Date.now();
    const lastUpdate = lastUpdateCache.get(userId) || 0;

    // Skip if updated within the last hour
    if (now - lastUpdate < THROTTLE_MS) return next();

    // Update in background — don't block the request
    lastUpdateCache.set(userId, now);
    req.user.constructor
      .updateOne({ _id: req.user._id }, { $set: { lastActiveAt: new Date(now) } })
      .catch(err => console.error('[trackActivity] Failed to update lastActiveAt:', err.message));
  } catch (err) {
    // Never block the request for activity tracking failures
    console.error('[trackActivity] Error:', err.message);
  }

  next();
};

module.exports = trackActivity;
