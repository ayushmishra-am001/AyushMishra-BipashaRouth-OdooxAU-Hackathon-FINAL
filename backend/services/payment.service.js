const pool = require('../db/pool');
const AppError = require('../utils/appError');

/**
 * Process payment for an order (stub)
 * - Verify order exists and belongs to user (owner-only)
 * - Update order status to 'paid'
 * - Return updated order
 */
async function payOrder(userId, orderId) {
  // Get order and verify ownership
  const { rows: orderRows } = await pool.query(
    `SELECT id, user_id, order_type, status, delivery_mode, address, subtotal, deposit_amount, total, created_at
     FROM orders
     WHERE id = $1 AND user_id = $2`,
    [orderId, userId]
  );

  if (!orderRows[0]) {
    throw new AppError('Order not found', 404);
  }

  const order = orderRows[0];

  // Check if already paid
  if (order.status === 'paid') {
    throw new AppError('Order is already paid', 400);
  }

  // Update order status to 'paid' (stub — no real payment gateway)
  const { rows: updatedRows } = await pool.query(
    `UPDATE orders SET status = 'paid' WHERE id = $1
     RETURNING id, user_id, order_type, status, delivery_mode, address, subtotal, deposit_amount, total, created_at`,
    [orderId]
  );

  return updatedRows[0];
}

module.exports = { payOrder };
