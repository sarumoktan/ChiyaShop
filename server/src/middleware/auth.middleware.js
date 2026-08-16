const { User } = require('../models');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { verifyToken, extractBearer } = require('../utils/token');

/** Requires a valid JWT; attaches the live user record to req.user. */
const protect = asyncHandler(async (req, _res, next) => {
  const token = extractBearer(req);
  if (!token) throw ApiError.unauthorized();

  let payload;
  try {
    payload = verifyToken(token);
  } catch (err) {
    throw ApiError.unauthorized(
      err.name === 'TokenExpiredError'
        ? 'Your session expired. Please sign in again.'
        : 'Invalid session token.'
    );
  }

  const user = await User.findByPk(payload.sub);
  if (!user) throw ApiError.unauthorized('This account no longer exists.');

  req.user = user;
  next();
});

/** Attaches req.user when a token is present, but never rejects. */
const optionalAuth = asyncHandler(async (req, _res, next) => {
  const token = extractBearer(req);
  if (!token) return next();
  try {
    const payload = verifyToken(token);
    req.user = await User.findByPk(payload.sub);
  } catch {
    req.user = null;
  }
  next();
});

/** Must run after `protect`. */
const adminOnly = (req, _res, next) => {
  if (req.user?.role !== 'admin') {
    return next(ApiError.forbidden('Admin access only.'));
  }
  next();
};

module.exports = { protect, optionalAuth, adminOnly };
