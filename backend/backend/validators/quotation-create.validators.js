/**
 * Validate quotation input
 */
function validateQuotation(data) {
  const { admin_id, customer_id, template_id, items } = data;

  if (!admin_id || typeof admin_id !== 'number') {
    throw new Error('Admin ID is required and must be a number');
  }

  if (!customer_id || typeof customer_id !== 'number') {
    throw new Error('Customer ID is required and must be a number');
  }

  if (template_id !== undefined && typeof template_id !== 'number') {
    throw new Error('Template ID must be a number');
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new Error('Items must be a non-empty array');
  }

  // Validate each item
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
}

/**
 * Validate quotation status update
 */
function validateQuotationStatusUpdate(status) {
  const validStatuses = ['draft', 'confirmed'];

  if (!status || !validStatuses.includes(status)) {
    throw new Error(`Status must be one of: ${validStatuses.join(', ')}`);
  }
}

module.exports = {
  validateQuotation,
  validateQuotationStatusUpdate,
};
