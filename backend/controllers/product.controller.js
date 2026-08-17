const productService = require('../services/product.service');
const { validateCreateProduct, validateUpdateProduct } = require('../validators/product.validators');
const { success } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

const create = asyncHandler(async (req, res) => {
  validateCreateProduct(req.body);
  const product = await productService.create(req.body);
  success(res, 201, product, 'Product created');
});

const list = asyncHandler(async (req, res) => {
  const { category, active } = req.query;
  const filters = {};
  if (category) filters.category = category;
  if (active !== undefined) filters.active = active === 'true';

  const products = await productService.list(filters);
  success(res, 200, products);
});

const getById = asyncHandler(async (req, res) => {
  const product = await productService.getById(req.params.id);
  success(res, 200, product);
});

const update = asyncHandler(async (req, res) => {
  validateUpdateProduct(req.body);
  const product = await productService.update(req.params.id, req.body);
  success(res, 200, product, 'Product updated');
});

const remove = asyncHandler(async (req, res) => {
  await productService.remove(req.params.id);
  success(res, 200, null, 'Product deleted');
});

module.exports = { create, list, getById, update, remove };
