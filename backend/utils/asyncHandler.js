// Wraps an async (req, res, next) handler and forwards any rejection to next(),
// so a single error-handling middleware can deal with it instead of repeating
// try/catch in every controller.
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
