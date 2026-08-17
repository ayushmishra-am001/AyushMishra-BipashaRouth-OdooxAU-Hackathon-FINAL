const returnService = require('../services/return.service');
const { validateReturn } = require('../validators/return.validators');

/**
 * POST /api/v1/returns
 * Record a return for an order (admin-only)
 */
async function createReturnHandler(req, res, next) {
  try {
    const { order_id, condition_notes, damage_reported } = req.body;

    validateReturn({ order_id, condition_notes, damage_reported });

    const returnRecord = await returnService.createReturn({
      order_id,
      condition_notes,
      damage_reported,
    });

    res.status(201).json({
      success: true,
      data: returnRecord,
      message: 'Return recorded successfully',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/returns
 * List return records, filterable by ?order_id= (admin-only)
 */
async function getReturnsHandler(req, res, next) {
  try {
    const { order_id } = req.query;

    const filters = {};
    if (order_id) filters.order_id = parseInt(order_id, 10);

    const returns = await returnService.getAllReturns(filters);

    res.json({
      success: true,
      data: returns,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/returns/:id
 * Fetch a single return record (admin-only)
 */
async function getReturnHandler(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);

    const returnRecord = await returnService.getReturnById(id);

    res.json({
      success: true,
      data: returnRecord,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createReturnHandler,
  getReturnsHandler,
  getReturnHandler,
};
