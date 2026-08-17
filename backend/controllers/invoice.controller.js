const invoiceService = require('../services/invoice.service');

/**
 * GET /api/v1/orders/:id/invoice
 * Generate and return invoice (customer-only, owner-only)
 */
async function getInvoiceHandler(req, res, next) {
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

    // Generate invoice
    const invoice = await invoiceService.generateInvoice(userId, orderId);

    // Return HTML with appropriate headers for download/view
    // Browser will show print dialog or open in new tab
    res.status(200);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoiceId}.html"`);
    res.send(invoice.html);
  } catch (err) {
    next(err);
  }
}

module.exports = { getInvoiceHandler };
