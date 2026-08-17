const pricelistService = require('../services/pricelist.service');
const { validateCreatePricelist, validateUpdatePricelist } = require('../validators/pricelist.validators');
const { success } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

const create = asyncHandler(async (req, res) => {
  validateCreatePricelist(req.body);
  const pricelist = await pricelistService.create(req.body);
  success(res, 201, pricelist, 'Pricelist created');
});

const list = asyncHandler(async (req, res) => {
  const pricelists = await pricelistService.list();
  success(res, 200, pricelists);
});

const getById = asyncHandler(async (req, res) => {
  const pricelist = await pricelistService.getById(req.params.id);
  success(res, 200, pricelist);
});

const update = asyncHandler(async (req, res) => {
  validateUpdatePricelist(req.body);
  const pricelist = await pricelistService.update(req.params.id, req.body);
  success(res, 200, pricelist, 'Pricelist updated');
});

const remove = asyncHandler(async (req, res) => {
  await pricelistService.remove(req.params.id);
  success(res, 200, null, 'Pricelist deleted');
});

module.exports = { create, list, getById, update, remove };
