const express = require('express');
const {
  createReturnHandler,
  getReturnsHandler,
  getReturnHandler,
} = require('../controllers/return.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/v1/returns
 * Record a return for an order (admin-only)
 */
router.post('/', requireAuth, requireRole('admin'), createReturnHandler);

/**
 * GET /api/v1/returns
 * List return records, filterable by ?order_id= (admin-only)
 */
router.get('/', requireAuth, requireRole('admin'), getReturnsHandler);

/**
 * GET /api/v1/returns/:id
 * Fetch a single return record (admin-only)
 */
router.get('/:id', requireAuth, requireRole('admin'), getReturnHandler);

module.exports = router;
