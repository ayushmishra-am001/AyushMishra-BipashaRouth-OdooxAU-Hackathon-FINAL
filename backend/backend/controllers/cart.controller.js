const cartService = require('../services/cart.service');
const { validateAddItem, validateUpdateItem } = require('../validators/cart.validators');
const { success } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

const getCart = asyncHandler(async (req, res) => {
  const cart = await cartService.getCart(req.user.id);
  success(res, 200, cart);
});

const addItem = asyncHandler(async (req, res) => {
  validateAddItem(req.body);
  const item = await cartService.addItem(req.user.id, req.body);
  success(res, 201, item, 'Item added to cart');
});

const updateItem = asyncHandler(async (req, res) => {
  validateUpdateItem(req.body);
  const item = await cartService.updateItem(req.user.id, req.params.id, req.body);
  success(res, 200, item, 'Item updated');
});

const deleteItem = asyncHandler(async (req, res) => {
  await cartService.deleteItem(req.user.id, req.params.id);
  success(res, 200, null, 'Item removed from cart');
});

module.exports = { getCart, addItem, updateItem, deleteItem };
