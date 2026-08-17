const depositService = require('../services/deposit.service');
const { success } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

const list = asyncHandler(async (req, res) => {
  const { order_id: orderId } = req.query;
  if (!orderId) {
    return success(res, 200, []); // no filter given — nothing scoped to return yet
  }
  const deposit = await depositService.getByOrderId(orderId);
  success(res, 200, [deposit]);
});

const getById = asyncHandler(async (req, res) => {
  const deposit = await depositService.getById(req.params.depositId);
  success(res, 200, deposit);
});

const settle = asyncHandler(async (req, res) => {
  const deposit = await depositService.settle(req.params.depositId);
  success(res, 200, deposit, 'Deposit settled');
});

module.exports = { list, getById, settle };
