const express = require('express');
const {
  createQuotationHandler,
  getQuotationsHandler,
  getQuotationHandler,
  updateQuotationItemsHandler,
  updateQuotationStatusHandler,
  confirmQuotationHandler,
  deleteQuotationHandler,
} = require('../controllers/quotation.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/v1/quotations
 * Create a new quotation (admin-only)
 */
router.post('/', requireAuth, requireRole('admin'), createQuotationHandler);

/**
 * GET /api/v1/quotations
 * List quotations with optional filters (admin-only)
 */
router.get('/', requireAuth, requireRole('admin'), getQuotationsHandler);

/**
 * GET /api/v1/quotations/:id
 * Fetch a single quotation (admin-only)
 */
router.get('/:id', requireAuth, requireRole('admin'), getQuotationHandler);

/**
 * PUT /api/v1/quotations/:id/items
 * Update quotation items (admin-only)
 */
router.put('/:id/items', requireAuth, requireRole('admin'), updateQuotationItemsHandler);

/**
 * PUT /api/v1/quotations/:id/status
 * Update quotation status (admin-only)
 */
router.put('/:id/status', requireAuth, requireRole('admin'), updateQuotationStatusHandler);

/**
 * PUT /api/v1/quotations/:id/confirm
 * Confirm a quotation, converting it into an offline order (admin-only)
 */
router.put('/:id/confirm', requireAuth, requireRole('admin'), confirmQuotationHandler);

/**
 * DELETE /api/v1/quotations/:id
 * Delete a quotation (admin-only)
 */
router.delete('/:id', requireAuth, requireRole('admin'), deleteQuotationHandler);

module.exports = router;
