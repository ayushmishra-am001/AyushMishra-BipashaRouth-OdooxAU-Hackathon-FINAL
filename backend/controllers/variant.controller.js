const variantService = require('../services/variant.service');
const { validateCreateVariant, validateUpdateVariant } = require('../validators/variant.validators');
const { success } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

const create = asyncHandler(async (req, res) => {
  validateCreateVariant(req.body);
  const variant = await variantService.create(req.params.productId, req.body);
  success(res, 201, variant, 'Variant created');
});

const listByProduct = asyncHandler(async (req, res) => {
  const variants = await variantService.listByProduct(req.params.productId);
  success(res, 200, variants);
});

const getById = asyncHandler(async (req, res) => {
  const variant = await variantService.getById(req.params.productId, req.params.variantId);
  success(res, 200, variant);
});

const update = asyncHandler(async (req, res) => {
  validateUpdateVariant(req.body);
  const variant = await variantService.update(req.params.productId, req.params.variantId, req.body);
  success(res, 200, variant, 'Variant updated');
});

const remove = asyncHandler(async (req, res) => {
  await variantService.remove(req.params.productId, req.params.variantId);
  success(res, 200, null, 'Variant deleted');
});

module.exports = { create, listByProduct, getById, update, remove };
