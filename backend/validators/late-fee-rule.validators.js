const AppError = require('../utils/appError');

const RATE_TYPES = ['hourly', 'daily', 'weekly', 'monthly'];

function validateCreateLateFeeRule({
  product_id: productId,
  rate_type: rateType,
  rate_amount: rateAmount,
  grace_period_hours: gracePeriodHours,
  max_fee: maxFee,
}) {
  if (productId !== undefined && productId !== null && !Number.isInteger(productId)) {
    throw new AppError('product_id must be an integer', 400);
  }
  if (!rateType || !RATE_TYPES.includes(rateType)) {
    throw new AppError(`rate_type is required and must be one of: ${RATE_TYPES.join(', ')}`, 400);
  }
  if (!Number.isInteger(rateAmount) || rateAmount < 0) {
    throw new AppError('rate_amount is required and must be a non-negative integer', 400);
  }
  if (gracePeriodHours !== undefined && gracePeriodHours !== null &&
      (!Number.isInteger(gracePeriodHours) || gracePeriodHours < 0)) {
    throw new AppError('grace_period_hours must be a non-negative integer', 400);
  }
  if (maxFee !== undefined && maxFee !== null && (!Number.isInteger(maxFee) || maxFee < 0)) {
    throw new AppError('max_fee must be a non-negative integer', 400);
  }
}

function validateUpdateLateFeeRule({
  product_id: productId,
  rate_type: rateType,
  rate_amount: rateAmount,
  grace_period_hours: gracePeriodHours,
  max_fee: maxFee,
}) {
  if (productId !== undefined && productId !== null && !Number.isInteger(productId)) {
    throw new AppError('product_id must be an integer', 400);
  }
  if (rateType !== undefined && rateType !== null && !RATE_TYPES.includes(rateType)) {
    throw new AppError(`rate_type must be one of: ${RATE_TYPES.join(', ')}`, 400);
  }
  if (rateAmount !== undefined && rateAmount !== null && (!Number.isInteger(rateAmount) || rateAmount < 0)) {
    throw new AppError('rate_amount must be a non-negative integer', 400);
  }
  if (gracePeriodHours !== undefined && gracePeriodHours !== null &&
      (!Number.isInteger(gracePeriodHours) || gracePeriodHours < 0)) {
    throw new AppError('grace_period_hours must be a non-negative integer', 400);
  }
  if (maxFee !== undefined && maxFee !== null && (!Number.isInteger(maxFee) || maxFee < 0)) {
    throw new AppError('max_fee must be a non-negative integer', 400);
  }
}

module.exports = { validateCreateLateFeeRule, validateUpdateLateFeeRule };
