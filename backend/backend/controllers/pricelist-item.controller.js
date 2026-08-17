const pricelistItemService = require('../services/pricelist-item.service');
const { validateCreatePricelistItem, validateUpdatePricelistItem } = require('../validators/pricelist.validators');
const { success } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

const create = asyncHandler(async (req, res) => {
  validateCreatePricelistItem(req.body);
  const item = await pricelistItemService.create(req.params.pricelistId, req.body);
  success(res, 201, item, 'Pricelist item created');
});

const listByPricelist = asyncHandler(async (req, res) => {
  const items = await pricelistItemService.listByPricelist(req.params.pricelistId);
  success(res, 200, items);
});

const getById = asyncHandler(async (req, res) => {
  const item = await pricelistItemService.getById(req.params.pricelistId, req.params.itemId);
  success(res, 200, item);
});

const update = asyncHandler(async (req, res) => {
  validateUpdatePricelistItem(req.body);
  const item = await pricelistItemService.update(req.params.pricelistId, req.params.itemId, req.body);
  success(res, 200, item, 'Pricelist item updated');
});

const remove = asyncHandler(async (req, res) => {
  await pricelistItemService.remove(req.params.pricelistId, req.params.itemId);
  success(res, 200, null, 'Pricelist item deleted');
});

module.exports = { create, listByPricelist, getById, update, remove };
