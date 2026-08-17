const express = require('express');
const {
  createTemplateHandler,
  getTemplatesHandler,
  getTemplateHandler,
  updateTemplateHandler,
  deleteTemplateHandler,
} = require('../controllers/quotation-template.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/v1/quotation-templates
 * Create a new quotation template (admin-only)
 */
router.post('/', requireAuth, requireRole('admin'), createTemplateHandler);

/**
 * GET /api/v1/quotation-templates
 * Get all quotation templates (admin-only)
 */
router.get('/', requireAuth, requireRole('admin'), getTemplatesHandler);

/**
 * GET /api/v1/quotation-templates/:id
 * Get a single quotation template (admin-only)
 */
router.get('/:id', requireAuth, requireRole('admin'), getTemplateHandler);

/**
 * PUT /api/v1/quotation-templates/:id
 * Update a quotation template (admin-only)
 */
router.put('/:id', requireAuth, requireRole('admin'), updateTemplateHandler);

/**
 * DELETE /api/v1/quotation-templates/:id
 * Delete a quotation template (admin-only)
 */
router.delete('/:id', requireAuth, requireRole('admin'), deleteTemplateHandler);

module.exports = router;
