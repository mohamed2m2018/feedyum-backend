const passport = require('passport');

/**
 * Optional JWT Authentication Middleware
 * Populates req.user if a valid JWT token is provided, but doesn't require it.
 * Useful for public endpoints that need to show personalized data (like follow status) when logged in.
 */
const optionalAuth = (req, res, next) => {
    // Check if Authorization header exists
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // No token provided, continue without user
        return next();
    }

    // Try to authenticate
    passport.authenticate('jwt', { session: false }, (err, user) => {
        if (err) {
            // Error during auth, continue without user
            return next();
        }

        if (user) {
            // Token valid, attach user to request
            req.user = user;
        }

        // Continue either way (with or without user)
        next();
    })(req, res, next);
};

module.exports = optionalAuth;
