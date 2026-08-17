const AppError = require('../utils/appError');

function validateAddItem(body) {
  const { product_id, start_date, end_date, qty } = body;

  if (!product_id) throw new AppError('product_id is required', 400);
  if (typeof product_id !== 'number' || product_id <= 0) {
    throw new AppError('product_id must be a positive integer', 400);
  }

  if (!start_date) throw new AppError('start_date is required', 400);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start_date)) {
    throw new AppError('start_date must be YYYY-MM-DD format', 400);
  }

  if (!end_date) throw new AppError('end_date is required', 400);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(end_date)) {
    throw new AppError('end_date must be YYYY-MM-DD format', 400);
  }

  if (start_date >= end_date) {
    throw new AppError('start_date must be before end_date', 400);
  }

  if (!qty) throw new AppError('qty is required', 400);
  if (typeof qty !== 'number' || qty <= 0) {
    throw new AppError('qty must be a positive integer', 400);
  }

  // variant_id is optional
  if (body.variant_id && (typeof body.variant_id !== 'number' || body.variant_id <= 0)) {
    throw new AppError('variant_id must be a positive integer', 400);
  }
}

function validateUpdateItem(body) {
  // All fields optional for update
  if (body.product_id && (typeof body.product_id !== 'number' || body.product_id <= 0)) {
    throw new AppError('product_id must be a positive integer', 400);
  }

  if (body.variant_id && (typeof body.variant_id !== 'number' || body.variant_id <= 0)) {
    throw new AppError('variant_id must be a positive integer', 400);
  }

  if (body.start_date && !/^\d{4}-\d{2}-\d{2}$/.test(body.start_date)) {
    throw new AppError('start_date must be YYYY-MM-DD format', 400);
  }

  if (body.end_date && !/^\d{4}-\d{2}-\d{2}$/.test(body.end_date)) {
    throw new AppError('end_date must be YYYY-MM-DD format', 400);
  }

  if (body.qty && (typeof body.qty !== 'number' || body.qty <= 0)) {
    throw new AppError('qty must be a positive integer', 400);
  }

  // If both dates provided, validate order
  if (body.start_date && body.end_date && body.start_date >= body.end_date) {
    throw new AppError('start_date must be before end_date', 400);
  }
}

module.exports = { validateAddItem, validateUpdateItem };
