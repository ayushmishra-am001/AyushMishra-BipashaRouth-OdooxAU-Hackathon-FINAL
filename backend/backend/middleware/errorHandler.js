const AppError = require('../utils/appError');

// Postgres unique_violation — happens if two requests race past the
// "email already exists" check in the service layer.
function isUniqueViolation(err) {
  return err.code === '23505';
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (isUniqueViolation(err)) {
    return res.status(409).json({ success: false, data: null, message: 'That value is already in use' });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ success: false, data: null, message: err.message });
  }

  console.error(err);
  return res.status(500).json({ success: false, data: null, message: 'Something went wrong' });
}

function notFoundHandler(req, res) {
  res.status(404).json({ success: false, data: null, message: `No route for ${req.method} ${req.originalUrl}` });
}

module.exports = { errorHandler, notFoundHandler };
