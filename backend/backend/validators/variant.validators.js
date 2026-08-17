const AppError = require('../utils/appError');

function validateCreateVariant({ attribute_name: attributeName, attribute_value: attributeValue, price_delta: priceDelta, stock_qty: stockQty }) {
  if (!attributeName || !attributeName.trim()) throw new AppError('attribute_name is required', 400);
  if (!attributeValue || !attributeValue.trim()) throw new AppError('attribute_value is required', 400);
  if (priceDelta !== undefined && priceDelta !== null && !Number.isInteger(priceDelta)) {
    throw new AppError('price_delta must be an integer (paise/cents)', 400);
  }
  if (stockQty !== undefined && stockQty !== null && (!Number.isInteger(stockQty) || stockQty < 0)) {
    throw new AppError('stock_qty must be a non-negative integer', 400);
  }
}

function validateUpdateVariant({ price_delta: priceDelta, stock_qty: stockQty }) {
  if (priceDelta !== undefined && priceDelta !== null && !Number.isInteger(priceDelta)) {
    throw new AppError('price_delta must be an integer (paise/cents)', 400);
  }
  if (stockQty !== undefined && stockQty !== null && (!Number.isInteger(stockQty) || stockQty < 0)) {
    throw new AppError('stock_qty must be a non-negative integer', 400);
  }
}

module.exports = { validateCreateVariant, validateUpdateVariant };
