const AppError = require('../utils/appError');

/**
 * Validate input for POST /api/v1/returns
 */
function validateReturn({ order_id, condition_notes, damage_reported }) {
  if (!order_id || typeof order_id !== 'number') {
    throw new AppError('order_id is required and must be a number', 400);
  }

  if (condition_notes !== undefined && condition_notes !== null && typeof condition_notes !== 'string') {
    throw new AppError('condition_notes must be a string', 400);
  }

  if (damage_reported !== undefined && damage_reported !== null && typeof damage_reported !== 'boolean') {
    throw new AppError('damage_reported must be a boolean', 400);
  }
}

module.exports = { validateReturn };
