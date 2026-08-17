const AppError = require('../utils/appError');

function validateCreateProduct({ name, base_price: basePrice }) {
  if (!name || !name.trim()) throw new AppError('Name is required', 400);
  if (basePrice === undefined || basePrice === null || !Number.isInteger(basePrice) || basePrice < 0) {
    throw new AppError('base_price is required and must be a non-negative integer (paise/cents)', 400);
  }
}

function validateUpdateProduct({ base_price: basePrice }) {
  if (basePrice !== undefined && basePrice !== null) {
    if (!Number.isInteger(basePrice) || basePrice < 0) {
      throw new AppError('base_price must be a non-negative integer (paise/cents)', 400);
    }
  }
}

module.exports = { validateCreateProduct, validateUpdateProduct };
