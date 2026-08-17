const AppError = require('../utils/appError');

const UNITS = ['hour', 'day', 'week', 'month'];

function validateCreatePricelist({ name }) {
  if (!name || !name.trim()) throw new AppError('Name is required', 400);
}

function validateUpdatePricelist() {
  // all fields optional on update; nothing to require
}

function validateCreatePricelistItem({ product_id: productId, unit, price }) {
  if (!productId || !Number.isInteger(productId)) throw new AppError('product_id is required and must be an integer', 400);
  if (!unit || !UNITS.includes(unit)) throw new AppError(`unit is required and must be one of: ${UNITS.join(', ')}`, 400);
  if (price === undefined || price === null || !Number.isInteger(price) || price < 0) {
    throw new AppError('price is required and must be a non-negative integer (paise/cents)', 400);
  }
}

function validateUpdatePricelistItem({ unit, price }) {
  if (unit !== undefined && unit !== null && !UNITS.includes(unit)) {
    throw new AppError(`unit must be one of: ${UNITS.join(', ')}`, 400);
  }
  if (price !== undefined && price !== null && (!Number.isInteger(price) || price < 0)) {
    throw new AppError('price must be a non-negative integer (paise/cents)', 400);
  }
}

module.exports = {
  validateCreatePricelist,
  validateUpdatePricelist,
  validateCreatePricelistItem,
  validateUpdatePricelistItem,
};
