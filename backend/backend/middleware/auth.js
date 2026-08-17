const { verifyToken } = require('../utils/token');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');

const requireAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw new AppError('Missing or invalid Authorization header', 401);
  }

  try {
    req.user = verifyToken(header.split(' ')[1]);
  } catch (err) {
    throw new AppError('Invalid or expired token', 401);
  }

  next();
});

const requireRole = (role) => (req, res, next) => {
  if (!req.user || req.user.role !== role) {
    throw new AppError(`Requires ${role} role`, 403);
  }
  next();
};

// Optional auth — doesn't throw if missing, but sets req.user if valid token is present
const optionalAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      req.user = verifyToken(header.split(' ')[1]);
    } catch (err) {
      // Token invalid/expired, but that's ok for optional auth - just continue without user
    }
  }
  next();
});

module.exports = { requireAuth, requireRole, optionalAuth };
