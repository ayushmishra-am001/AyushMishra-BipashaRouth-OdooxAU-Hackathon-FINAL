const paymentService = require('../services/payment.service');

/**
 * POST /api/v1/orders/:id/pay
 * Process payment for order (stub, customer-only, owner-only)
 */
async function payOrderHandler(req, res, next) {
  try {
    const orderId = parseInt(req.params.id, 10);
    const userId = req.user.id;

    if (isNaN(orderId)) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Invalid order ID',
      });
    }

    // Process payment (stub)
    const order = await paymentService.payOrder(userId, orderId);

    res.status(200).json({
      success: true,
      data: order,
      message: 'Payment processed successfully',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { payOrderHandler };
