const pool = require('../db/pool');
const AppError = require('../utils/appError');
const cartService = require('./cart.service');

/**
 * Checkout: convert active cart into an order
 * - Creates order row (order_type='online', status='pending')
 * - Creates order_items from cart_items
 * - Calculates subtotal, deposit_amount (30% of subtotal), total
 * - Marks cart as 'converted'
 * - Creates security_deposits row (status='held')
 */
async function checkout(userId, { delivery_mode, address }) {
  // Get user's active cart
  const cart = await cartService.getCart(userId);

  if (!cart.items || cart.items.length === 0) {
    throw new AppError('Cart is empty', 400);
  }

  // Start transaction
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Calculate totals from cart items
    let subtotal = 0;
    for (const item of cart.items) {
      // price_snapshot * qty
      subtotal += item.price_snapshot * item.qty;
    }

    // Deposit is 30% of subtotal
    const deposit_amount = Math.ceil(subtotal * 0.3);

    // Total = subtotal + deposit_amount
    const total = subtotal + deposit_amount;

    // Create order
    const orderResult = await client.query(
      `INSERT INTO orders (user_id, order_type, status, delivery_mode, address, subtotal, deposit_amount, total, created_at)
       VALUES ($1, 'online', 'pending', $2, $3, $4, $5, $6, now())
       RETURNING id, user_id, order_type, status, delivery_mode, address, subtotal, deposit_amount, total, created_at`,
      [userId, delivery_mode, address || null, subtotal, deposit_amount, total]
    );

    const order = orderResult.rows[0];

    // Create order_items from cart_items
    for (const item of cart.items) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, variant_id, start_date, end_date, qty, price)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [order.id, item.product_id, item.variant_id || null, item.start_date, item.end_date, item.qty, item.price_snapshot]
      );
    }

    // Mark cart as 'converted'
    await client.query(
      `UPDATE carts SET status = 'converted' WHERE id = $1`,
      [cart.id]
    );

    // Create security_deposits row (status='held')
    await client.query(
      `INSERT INTO security_deposits (order_id, amount, status, refunded_amount)
       VALUES ($1, $2, 'held', 0)`,
      [order.id, deposit_amount]
    );

    await client.query('COMMIT');

    return order;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { checkout };
