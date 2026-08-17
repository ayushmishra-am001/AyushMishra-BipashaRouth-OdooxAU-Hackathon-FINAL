const lateFeeRuleService = require('../services/late-fee-rule.service');
const { validateCreateLateFeeRule, validateUpdateLateFeeRule } = require('../validators/late-fee-rule.validators');
const { success } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

const create = asyncHandler(async (req, res) => {
  validateCreateLateFeeRule(req.body);
  const lateFeeRule = await lateFeeRuleService.create(req.body);
  success(res, 201, lateFeeRule, 'Late fee rule created');
});

const list = asyncHandler(async (req, res) => {
  const { product_id: productId } = req.query;
  const filters = {};
  if (productId) filters.product_id = Number(productId);

  const lateFeeRules = await lateFeeRuleService.list(filters);
  success(res, 200, lateFeeRules);
});

const getById = asyncHandler(async (req, res) => {
  const lateFeeRule = await lateFeeRuleService.getById(req.params.id);
  success(res, 200, lateFeeRule);
});

const update = asyncHandler(async (req, res) => {
  validateUpdateLateFeeRule(req.body);
  const lateFeeRule = await lateFeeRuleService.update(req.params.id, req.body);
  success(res, 200, lateFeeRule, 'Late fee rule updated');
});

const remove = asyncHandler(async (req, res) => {
  await lateFeeRuleService.remove(req.params.id);
  success(res, 200, null, 'Late fee rule deleted');
});

module.exports = { create, list, getById, update, remove };
