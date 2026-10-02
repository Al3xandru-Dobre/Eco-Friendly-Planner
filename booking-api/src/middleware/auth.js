const jwt = require('jsonwebtoken');
const { unauthorized } = require('../utils/httpError');

/**
 * The booking API does not have its own user store. It trusts the planner's
 * JWT (same secret), which keeps a single login for the whole product while
 * letting the two services scale and deploy independently.
 */
function createAuthMiddleware({ jwtSecret }) {
  if (!jwtSecret) throw new Error('JWT_SECRET is required for the booking API to verify planner tokens');

  function parse(req) {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (!token || scheme !== 'Bearer') return null;
    try {
      const payload = jwt.verify(token, jwtSecret);
      if (!payload || !payload.id) return null;
      return { id: String(payload.id), email: payload.email, name: payload.name };
    } catch {
      return null;
    }
  }

  const optionalAuth = (req, _res, next) => {
    req.user = parse(req);
    next();
  };

  const requireAuth = (req, _res, next) => {
    req.user = parse(req);
    if (!req.user) return next(unauthorized('A valid Bearer token from the planner is required'));
    return next();
  };

  return { optionalAuth, requireAuth };
}

module.exports = { createAuthMiddleware };
