const AppError = require('../utils/appError');

const UNITS = ['hour', 'day', 'week', 'month'];

function validateCreateRentalPeriod({ product_id: productId, min_duration: minDuration, max_duration: maxDuration, unit }) {
  if (!productId || !Number.isInteger(productId)) throw new AppError('product_id is required and must be an integer', 400);
  if (!Number.isInteger(minDuration) || minDuration < 1) throw new AppError('min_duration is required and must be a positive integer', 400);
  if (maxDuration !== undefined && maxDuration !== null && (!Number.isInteger(maxDuration) || maxDuration < minDuration)) {
    throw new AppError('max_duration must be an integer >= min_duration', 400);
  }
  if (!unit || !UNITS.includes(unit)) throw new AppError(`unit is required and must be one of: ${UNITS.join(', ')}`, 400);
}

function validateUpdateRentalPeriod({ min_duration: minDuration, max_duration: maxDuration, unit }) {
  if (minDuration !== undefined && minDuration !== null && (!Number.isInteger(minDuration) || minDuration < 1)) {
    throw new AppError('min_duration must be a positive integer', 400);
  }
  if (maxDuration !== undefined && maxDuration !== null && !Number.isInteger(maxDuration)) {
    throw new AppError('max_duration must be an integer', 400);
  }
  if (unit !== undefined && unit !== null && !UNITS.includes(unit)) {
    throw new AppError(`unit must be one of: ${UNITS.join(', ')}`, 400);
  }
}

module.exports = { validateCreateRentalPeriod, validateUpdateRentalPeriod };
