const AppError = require('../utils/appError');

// Postgres unique_violation — happens if two requests race past the
// "email already exists" check in the service layer.
function isUniqueViolation(err) {
  return err.code === '23505';
}

function isDbAuthError(err) {
  return err.code === '28P01';
}

function isDbNotFoundError(err) {
  return err.code === '3D000';
}

function isDbConnectionRefused(err) {
  return err.code === 'ECONNREFUSED';
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (isUniqueViolation(err)) {
    return res.status(409).json({ success: false, data: null, message: 'That value is already in use' });
  }

  if (isDbAuthError(err)) {
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Database authentication failed. Check DATABASE_URL credentials and Postgres user/password.',
    });
  }

  if (isDbNotFoundError(err)) {
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Database not found. Check that the database name in DATABASE_URL exists.',
    });
  }

  if (isDbConnectionRefused(err)) {
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Cannot connect to Postgres. Ensure the database server is running and DATABASE_URL is correct.',
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ success: false, data: null, message: err.message });
  }

  console.error(err);
  const message = process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message || 'Something went wrong';
  return res.status(500).json({ success: false, data: null, message });
}

function notFoundHandler(req, res) {
  res.status(404).json({ success: false, data: null, message: `No route for ${req.method} ${req.originalUrl}` });
}

module.exports = { errorHandler, notFoundHandler };
