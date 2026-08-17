/**
 * Validate quotation template input
 */
function validateQuotationTemplate(data) {
  const { name, header_text, footer_text } = data;

  if (!name || typeof name !== 'string' || !name.trim()) {
    throw new Error('Template name is required and must be a non-empty string');
  }

  if (name.length > 255) {
    throw new Error('Template name must not exceed 255 characters');
  }

  if (header_text !== undefined && typeof header_text !== 'string') {
    throw new Error('Header text must be a string');
  }

  if (footer_text !== undefined && typeof footer_text !== 'string') {
    throw new Error('Footer text must be a string');
  }
}

module.exports = { validateQuotationTemplate };
