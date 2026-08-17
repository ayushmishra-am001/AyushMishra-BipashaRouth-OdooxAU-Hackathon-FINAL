const express = require('express');
const { createOrder, getOrder, listOrders } = require('../controllers/checkout.controller');
const { payOrderHandler } = require('../controllers/payment.controller');
const { getInvoiceHandler } = require('../controllers/invoice.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/v1/orders
 * List all orders for the authenticated user (customer-only)
 */
router.get('/', requireAuth, listOrders);

/**
 * POST /api/v1/orders
 * Create order from cart (customer-only)
 */
router.post('/', requireAuth, createOrder);

/**
 * GET /api/v1/orders/:id
 * Fetch order details with items (customer-only, owner-only)
 */
router.get('/:id', requireAuth, getOrder);

/**
 * POST /api/v1/orders/:id/pay
 * Process payment for order (customer-only, owner-only)
 */
router.post('/:id/pay', requireAuth, payOrderHandler);

/**
 * GET /api/v1/orders/:id/invoice
 * Generate invoice for order (customer-only, owner-only)
 */
router.get('/:id/invoice', requireAuth, getInvoiceHandler);

module.exports = router;
