const checkoutService = require('../services/checkout.service');
const { validateCheckout } = require('../validators/checkout.validators');
const db = require('../db/pool');
const AppError = require('../utils/appError');

/**
 * POST /api/v1/orders
 * Convert active cart to order (customer-only)
 */
async function createOrder(req, res, next) {
  try {
    const { delivery_mode, address } = req.body;
    const userId = req.user.id;

    // Validate input
    validateCheckout({ delivery_mode, address });

    // Create order from cart
    const order = await checkoutService.checkout(userId, { delivery_mode, address });

    res.status(201).json({
      success: true,
      data: order,
      message: 'Order created successfully',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/orders/:id
 * Fetch order details with items (customer-only, owner-only)
 */
async function getOrder(req, res, next) {
  try {
    const orderId = parseInt(req.params.id, 10);
    const userId = req.user.id;

    // Fetch order
    const orderRes = await db.query(
      'SELECT * FROM orders WHERE id = $1',
      [orderId]
    );
    if (!orderRes.rows.length) {
      throw new AppError('Order not found', 404);
    }

    const order = orderRes.rows[0];
    
    // Check ownership
    if (order.user_id !== userId) {
      throw new AppError('Unauthorized', 403);
    }

    // Fetch order items with product details
    const itemsRes = await db.query(
      `SELECT oi.*, p.name as product_name, p.image as product_image
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1`,
      [orderId]
    );

    const orderItems = itemsRes.rows.map((row) => ({
      id: row.id,
      quantity: row.qty,
      start_date: row.start_date,
      end_date: row.end_date,
      unit_price: row.price,
      product: { name: row.product_name, image: row.product_image },
    }));

    // Format response
    const responseOrder = {
      id: order.id,
      status: order.status,
      delivery_mode: order.delivery_mode,
      delivery_address: order.address,
      subtotal: order.subtotal,
      deposit_amount: order.deposit_amount,
      total: order.total,
      order_items: orderItems,
      created_at: order.created_at,
    };

    res.json({
      success: true,
      data: responseOrder,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/orders
 * List all orders for the authenticated user (customer-only)
 */
async function listOrders(req, res, next) {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `SELECT id, order_type, status, delivery_mode, address, subtotal, deposit_amount, total, created_at
       FROM orders
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    const orders = result.rows.map((row) => ({
      id: row.id,
      order_type: row.order_type,
      status: row.status,
      delivery_mode: row.delivery_mode,
      delivery_address: row.address,
      subtotal: row.subtotal,
      deposit_amount: row.deposit_amount,
      total: row.total,
      created_at: row.created_at,
    }));

    res.json({
      success: true,
      data: orders,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { createOrder, getOrder, listOrders };
