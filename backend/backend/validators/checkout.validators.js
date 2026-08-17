const AppError = require('../utils/appError');

/**
 * Validate checkout request body
 * - delivery_mode: required, must be 'ship' or 'store'
 * - address: required if delivery_mode='ship', optional if 'store'
 */
function validateCheckout(body) {
  const errors = [];

  // Validate delivery_mode
  if (!body.delivery_mode) {
    errors.push('delivery_mode is required');
  } else if (!['ship', 'store'].includes(body.delivery_mode)) {
    errors.push("delivery_mode must be 'ship' or 'store'");
  }

  // Validate address
  if (body.delivery_mode === 'ship') {
    if (!body.address || typeof body.address !== 'string' || body.address.trim().length === 0) {
      errors.push('address is required for delivery_mode="ship"');
    }
  }

  if (errors.length > 0) {
    throw new AppError(errors.join('; '), 400);
  }
}

module.exports = { validateCheckout };
