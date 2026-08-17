const rentalPeriodService = require('../services/rental-period.service');
const { validateCreateRentalPeriod, validateUpdateRentalPeriod } = require('../validators/rental-period.validators');
const { success } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

const create = asyncHandler(async (req, res) => {
  validateCreateRentalPeriod(req.body);
  const rentalPeriod = await rentalPeriodService.create(req.body);
  success(res, 201, rentalPeriod, 'Rental period created');
});

const list = asyncHandler(async (req, res) => {
  const { product_id: productId } = req.query;
  const filters = {};
  if (productId) filters.product_id = Number(productId);

  const rentalPeriods = await rentalPeriodService.list(filters);
  success(res, 200, rentalPeriods);
});

const getById = asyncHandler(async (req, res) => {
  const rentalPeriod = await rentalPeriodService.getById(req.params.id);
  success(res, 200, rentalPeriod);
});

const update = asyncHandler(async (req, res) => {
  validateUpdateRentalPeriod(req.body);
  const rentalPeriod = await rentalPeriodService.update(req.params.id, req.body);
  success(res, 200, rentalPeriod, 'Rental period updated');
});

const remove = asyncHandler(async (req, res) => {
  await rentalPeriodService.remove(req.params.id);
  success(res, 200, null, 'Rental period deleted');
});

module.exports = { create, list, getById, update, remove };
