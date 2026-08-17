const browseService = require('../services/browse.service');
const { success } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

const listPublic = asyncHandler(async (req, res) => {
  const { category } = req.query;
  const isAdmin = req.user && req.user.role === 'admin';
  const products = await browseService.listPublic({ category, adminMode: isAdmin });
  success(res, 200, products);
});

const getByIdPublic = asyncHandler(async (req, res) => {
  const isAdmin = req.user && req.user.role === 'admin';
  const product = await browseService.getByIdPublic(req.params.id, isAdmin);
  success(res, 200, product);
});

module.exports = { listPublic, getByIdPublic };
