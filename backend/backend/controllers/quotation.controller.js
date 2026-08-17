const quotationService = require('../services/quotation.service');
const {
  validateQuotation,
  validateQuotationStatusUpdate,
} = require('../validators/quotation-create.validators');

/**
 * POST /api/v1/quotations
 * Create a new quotation (admin-only)
 */
async function createQuotationHandler(req, res, next) {
  try {
    const { customer_id, template_id, items } = req.body;
    const admin_id = req.user.id;

    validateQuotation({
      admin_id,
      customer_id,
      template_id,
      items,
    });

    const quotation = await quotationService.createQuotation({
      admin_id,
      customer_id,
      template_id,
      items,
    });

    res.status(201).json({
      success: true,
      data: quotation,
      message: 'Quotation created successfully',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/quotations
 * List quotations with optional filters (admin-only)
 */
async function getQuotationsHandler(req, res, next) {
  try {
    const { customer_id, status } = req.query;
    const admin_id = req.user.id;

    const filters = {};
    if (customer_id) {
      filters.customer_id = parseInt(customer_id, 10);
    }
    if (status) {
      filters.status = status;
    }
    // Admins can see all quotations (not filtered by admin_id)

    const quotations = await quotationService.getAllQuotations(filters);

    res.json({
      success: true,
      data: quotations,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/quotations/:id
 * Fetch a single quotation (admin-only)
 */
async function getQuotationHandler(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);

    const quotation = await quotationService.getQuotationById(id);

    res.json({
      success: true,
      data: quotation,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/v1/quotations/:id/items
 * Update quotation items (admin-only)
 */
async function updateQuotationItemsHandler(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('Items must be a non-empty array');
    }

    // Validate items structure
    items.forEach((item, index) => {
      if (!item.product_id || typeof item.product_id !== 'number') {
        throw new Error(`Item ${index}: product_id is required and must be a number`);
      }
      if (!item.description || typeof item.description !== 'string') {
        throw new Error(`Item ${index}: description is required and must be a string`);
      }
      if (typeof item.quantity !== 'number' || item.quantity <= 0) {
        throw new Error(`Item ${index}: quantity must be a positive number`);
      }
      if (typeof item.unit_price !== 'number' || item.unit_price < 0) {
        throw new Error(`Item ${index}: unit_price must be a non-negative number`);
      }
    });

    const quotation = await quotationService.updateQuotationItems(id, items);

    res.json({
      success: true,
      data: quotation,
      message: 'Quotation items updated successfully',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/v1/quotations/:id/status
 * Update quotation status (admin-only)
 */
async function updateQuotationStatusHandler(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const { status } = req.body;

    validateQuotationStatusUpdate(status);

    const quotation = await quotationService.updateQuotationStatus(id, status);

    res.json({
      success: true,
      data: quotation,
      message: 'Quotation status updated successfully',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/v1/quotations/:id/confirm
 * Confirm a quotation and convert it into an offline order (admin-only)
 */
async function confirmQuotationHandler(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);

    const order = await quotationService.confirmQuotation(id);

    res.json({
      success: true,
      data: order,
      message: 'Quotation confirmed and order created successfully',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/v1/quotations/:id
 * Delete a quotation (admin-only)
 */
async function deleteQuotationHandler(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);

    await quotationService.deleteQuotation(id);

    res.json({
      success: true,
      message: 'Quotation deleted successfully',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createQuotationHandler,
  getQuotationsHandler,
  getQuotationHandler,
  updateQuotationItemsHandler,
  updateQuotationStatusHandler,
  confirmQuotationHandler,
  deleteQuotationHandler,
};
