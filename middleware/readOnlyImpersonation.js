const jwt = require('jsonwebtoken');
const keys = require('../config/keys');

module.exports = (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (req.path === '/api/admin-impersonation/exchange') return next();

  const authorization = req.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) return next();

  try {
    const payload = jwt.verify(authorization.slice(7), keys.secretOrKey);
    if (payload.impersonation === true) {
      return res.status(403).json({
        message: 'This admin impersonation session is read-only',
        code: 'IMPERSONATION_READ_ONLY',
      });
    }
  } catch (_) {
    // Normal authentication middleware remains responsible for invalid tokens.
  }

  return next();
};
